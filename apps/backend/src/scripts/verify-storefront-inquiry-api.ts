import { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { INQUIRY_MODULE } from "../modules/inquiry"
import InquiryModuleService from "../modules/inquiry/service"
import { randomBytes } from "crypto"
import jwt from "jsonwebtoken"
import Scrypt from "scrypt-kdf"

const testPayload = {
  page_url: "https://storefront.test/dk/products/fs-test-classic-jogger-pants",
  total_styles: 1,
  total_pieces: 2,
  items: [
    {
      title: "Classic Jogger Pants",
      styleNumber: "FS-TEST-JOGGER-PANTS",
      color: "Black",
      size: "S",
      quantity: 2,
      packSize: 10,
    },
  ],
}

export default async function verifyStorefrontInquiryApi({
  container,
}: {
  container: MedusaContainer
}) {
  const publishableApiKey = process.env.TEST_PUBLISHABLE_KEY
  const backendUrl = process.env.TEST_BACKEND_URL || "http://127.0.0.1:9001"

  if (!publishableApiKey) {
    throw new Error("TEST_PUBLISHABLE_KEY is required for inquiry API verification")
  }

  const inquiryService = container.resolve<InquiryModuleService>(INQUIRY_MODULE)
  const userModule = container.resolve(Modules.USER)
  const authModule = container.resolve(Modules.AUTH)
  const email = `inquiry-api-verification-${Date.now()}@example.test`
  let inquiryId: string | undefined
  let userId: string | undefined
  let authIdentityId: string | undefined

  try {
    const user = await userModule.createUsers({
      first_name: "Inquiry",
      last_name: "Verification",
      email,
    })
    userId = user.id

    const password = await Scrypt.kdf(randomBytes(32), {
      logN: 15,
      r: 8,
      p: 1,
    })
    const authIdentity = await authModule.createAuthIdentities({
      provider_identities: [
        {
          provider: "emailpass",
          entity_id: email,
          provider_metadata: { password: password.toString("base64") },
        },
      ],
      app_metadata: { user_id: user.id },
    })
    authIdentityId = authIdentity.id

    const adminToken = jwt.sign(
      {
        actor_id: user.id,
        actor_type: "user",
        auth_identity_id: authIdentity.id,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "5m" }
    )

    const postResponse = await fetch(`${backendUrl}/store/inquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableApiKey,
      },
      body: JSON.stringify(testPayload),
    })
    const postBody = await postResponse.json()

    if (!postResponse.ok || !postBody?.inquiry?.id) {
      throw new Error(`POST /store/inquiries failed with ${postResponse.status}`)
    }
    inquiryId = postBody.inquiry.id

    const listResponse = await fetch(`${backendUrl}/admin/inquiries`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const listBody = await listResponse.json()

    if (
      !listResponse.ok ||
      !Array.isArray(listBody?.inquiries) ||
      !listBody.inquiries.some((inquiry: { id: string }) => inquiry.id === inquiryId)
    ) {
      throw new Error(`GET /admin/inquiries failed with ${listResponse.status}`)
    }

    console.log("STOREFRONT_INQUIRY_API_VERIFICATION: PASS")
  } finally {
    if (inquiryId) {
      await inquiryService.deleteInquiries([inquiryId])
    }
    if (authIdentityId) {
      await authModule.deleteAuthIdentities([authIdentityId])
    }
    if (userId) {
      await userModule.deleteUsers([userId])
    }
  }
}

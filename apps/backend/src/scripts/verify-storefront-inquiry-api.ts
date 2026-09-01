import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { INQUIRY_MODULE } from "../modules/inquiry"
import InquiryModuleService from "../modules/inquiry/service"
import { randomBytes } from "crypto"
import jwt from "jsonwebtoken"
import Scrypt from "scrypt-kdf"

const createTestPayload = async (container: MedusaContainer) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "metadata", "variants.id", "variants.sku", "variants.options.value"],
    filters: { handle: "fs-test-straight-leg-casual-pants" },
  })
  const product = products[0]
  const variantFor = (size: string) => product?.variants?.find((variant: any) => {
    const values = variant.options?.map((option: { value?: string }) => option.value) || []
    return values.includes("Blue") && values.includes(size)
  })
  const blueS = variantFor("S")
  const blueM = variantFor("M")

  if (!product || !blueS?.id || !blueS?.sku || !blueM?.id || !blueM?.sku) {
    throw new Error("FS-TEST Blue S and Blue M variants are required for inquiry verification")
  }

  const packSize = Number(product.metadata?.pack_size) === 5 ? 5 : 10
  const styleNumber = String(product.metadata?.style_number || product.handle)

  return {
    contact_name: "Preview Verification Customer",
    whatsapp: "+234 801 555 0101",
    country: "Nigeria",
    message: "Please quote Blue S and Blue M together.",
    page_url: `https://storefront.test/dk/products/${product.handle}`,
    total_styles: 1,
    total_pieces: 1555,
    items: [
      {
        title: product.title,
        styleNumber,
        variantId: blueS.id,
        sku: blueS.sku,
        color: "Blue",
        size: "S",
        quantity: 444,
        packSize,
      },
      {
        title: product.title,
        styleNumber,
        variantId: blueM.id,
        sku: blueM.sku,
        color: "Blue",
        size: "M",
        quantity: 1111,
        packSize,
      },
    ],
  }
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
  const testPayload = await createTestPayload(container)

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
      !listBody.inquiries.some(
        (inquiry: { id: string; contact_name?: string; whatsapp?: string; country?: string }) =>
          inquiry.id === inquiryId &&
          inquiry.contact_name === testPayload.contact_name &&
          inquiry.whatsapp === testPayload.whatsapp &&
          inquiry.country === testPayload.country
      )
    ) {
      throw new Error(`GET /admin/inquiries failed with ${listResponse.status}`)
    }

    const detailResponse = await fetch(`${backendUrl}/admin/inquiries/${inquiryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const detailBody = await detailResponse.json()
    const selectedItems = detailBody?.inquiry?.items?.selection

    if (
      !detailResponse.ok ||
      detailBody?.inquiry?.contact_name !== testPayload.contact_name ||
      detailBody?.inquiry?.whatsapp !== testPayload.whatsapp ||
      detailBody?.inquiry?.country !== testPayload.country ||
      detailBody?.inquiry?.message !== testPayload.message ||
      !Array.isArray(selectedItems) ||
      selectedItems.length !== 2 ||
      selectedItems[0]?.sku !== testPayload.items[0].sku ||
      selectedItems[0]?.variantId !== testPayload.items[0].variantId ||
      selectedItems[0]?.color !== "Blue" ||
      selectedItems[0]?.size !== "S" ||
      selectedItems[0]?.quantity !== 444 ||
      selectedItems[0]?.packSize !== testPayload.items[0].packSize ||
      selectedItems[1]?.sku !== testPayload.items[1].sku ||
      selectedItems[1]?.variantId !== testPayload.items[1].variantId ||
      selectedItems[1]?.color !== "Blue" ||
      selectedItems[1]?.size !== "M" ||
      selectedItems[1]?.quantity !== 1111 ||
      selectedItems[1]?.packSize !== testPayload.items[1].packSize ||
      detailBody?.inquiry?.total_pieces !== 1555
    ) {
      throw new Error(`GET /admin/inquiries/:id failed with ${detailResponse.status}`)
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

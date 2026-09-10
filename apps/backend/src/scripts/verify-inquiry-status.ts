import { MedusaContainer } from "@medusajs/framework"
import { INQUIRY_MODULE } from "../modules/inquiry"
import InquiryModuleService from "../modules/inquiry/service"

export default async function verifyInquiryStatus({ container }: { container: MedusaContainer }) {
  const service = container.resolve<InquiryModuleService>(INQUIRY_MODULE)
  let inquiryId: string | undefined

  try {
    const inquiry = await service.createInquiries({
      contact_name: "Automated verification",
      whatsapp: "+0000000000",
      country: "TEST",
      message: "Temporary record; safe to delete.",
      page_url: "http://localhost/test",
      total_styles: 1,
      total_pieces: 10,
      items: { selection: [{ title: "Test product", styleNumber: "TEST-001", color: "Black", size: "L", quantity: 10, packSize: 10 }] },
    })
    inquiryId = inquiry.id
    if (inquiry.status !== "new") throw new Error(`Expected new, got ${inquiry.status}`)

    for (const status of ["contacted", "quoted", "closed"] as const) {
      await service.updateInquiries({ id: inquiryId, status })
      const reloaded = await service.retrieveInquiry(inquiryId)
      if (reloaded.status !== status) throw new Error(`Expected ${status}, got ${reloaded.status}`)
    }

    await service.deleteInquiries(inquiryId)
    try {
      await service.retrieveInquiry(inquiryId)
      throw new Error("Deleted inquiry remained readable")
    } catch (error: any) {
      if (!String(error?.message || error).includes("not found")) throw error
    }
    console.log("INQUIRY_STATUS_VERIFICATION: PASS")
  } catch (error) {
    console.error("INQUIRY_STATUS_VERIFICATION: FAIL", error)
    throw error
  } finally {
    if (inquiryId) {
      try { await service.deleteInquiries(inquiryId) } catch { /* already deleted */ }
    }
  }
}

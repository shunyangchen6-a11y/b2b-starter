import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { INQUIRY_MODULE } from "../../../modules/inquiry"
import InquiryModuleService from "../../../modules/inquiry/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const inquiryService = req.scope.resolve<InquiryModuleService>(INQUIRY_MODULE)
  const { limit = 50, offset = 0 } = req.query as { limit?: number; offset?: number }
  const [inquiries, count] = await inquiryService.listAndCountInquiries({}, { take: Number(limit), skip: Number(offset), order: { created_at: "DESC" } })
  res.json({ inquiries, count, limit: Number(limit), offset: Number(offset) })
}

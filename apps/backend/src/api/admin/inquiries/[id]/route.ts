import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { INQUIRY_MODULE } from "../../../../modules/inquiry"
import InquiryModuleService from "../../../../modules/inquiry/service"
import { UpdateInquiryType } from "../validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<InquiryModuleService>(INQUIRY_MODULE)
  const inquiry = await service.retrieveInquiry(req.params.id)
  res.json({ inquiry })
}

export const POST = async (req: MedusaRequest<UpdateInquiryType>, res: MedusaResponse) => {
  const service = req.scope.resolve<InquiryModuleService>(INQUIRY_MODULE)
  const inquiry = await service.updateInquiries({ id: req.params.id, ...req.validatedBody })
  res.json({ inquiry })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<InquiryModuleService>(INQUIRY_MODULE)
  await service.deleteInquiries(req.params.id)
  res.status(204).send()
}

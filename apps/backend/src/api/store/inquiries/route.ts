import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { CreateInquiryType } from "./validators"
import { createInquiryWorkflow } from "../../../workflows/inquiry/create-inquiry"

export const POST = async (req: MedusaRequest<CreateInquiryType>, res: MedusaResponse) => {
  const { result: { inquiry } } = await createInquiryWorkflow(req.scope).run({ input: req.validatedBody })
  res.status(201).json({ inquiry })
}

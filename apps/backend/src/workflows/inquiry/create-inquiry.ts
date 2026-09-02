import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { INQUIRY_MODULE } from "../../modules/inquiry"
import InquiryModuleService from "../../modules/inquiry/service"
import { CreateInquiryType } from "../../api/store/inquiries/validators"
import { validateInquiryInventoryStep } from "./validate-inquiry-inventory"

const createInquiryStep = createStep("create-inquiry", async (input: CreateInquiryType, { container }) => {
  const service = container.resolve<InquiryModuleService>(INQUIRY_MODULE)
  const inquiry = await service.createInquiries({ ...input, items: { selection: input.items } })
  return new StepResponse(inquiry, inquiry.id)
}, async (id, { container }) => {
  const service = container.resolve<InquiryModuleService>(INQUIRY_MODULE)
  await service.deleteInquiries(id!)
})

export const createInquiryWorkflow = createWorkflow("create-inquiry", (input: CreateInquiryType) => {
  const validatedInput = validateInquiryInventoryStep(input)
  const inquiry = createInquiryStep(validatedInput)
  return new WorkflowResponse({ inquiry })
})

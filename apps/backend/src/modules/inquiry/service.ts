import { MedusaService } from "@medusajs/framework/utils"
import { Inquiry } from "./models"

class InquiryModuleService extends MedusaService({ Inquiry }) {}

export default InquiryModuleService

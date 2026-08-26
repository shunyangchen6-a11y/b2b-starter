import { validateAndTransformBody } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"
import { CreateInquiry } from "./validators"

export const storeInquiriesMiddlewares: MiddlewareRoute[] = [{
  method: ["POST"], matcher: "/store/inquiries", middlewares: [validateAndTransformBody(CreateInquiry)],
}]

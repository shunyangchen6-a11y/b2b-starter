import { validateAndTransformBody } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"
import { UpdateInquiry } from "./validators"

export const adminInquiriesMiddlewares: MiddlewareRoute[] = [
  { method: ["GET"], matcher: "/admin/inquiries", middlewares: [] },
  { method: ["GET", "DELETE"], matcher: "/admin/inquiries/:id", middlewares: [] },
  { method: ["POST"], matcher: "/admin/inquiries/:id", middlewares: [validateAndTransformBody(UpdateInquiry)] },
]

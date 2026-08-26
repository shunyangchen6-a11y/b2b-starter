import { MiddlewareRoute } from "@medusajs/medusa"

export const adminInquiriesMiddlewares: MiddlewareRoute[] = [{ method: ["GET"], matcher: "/admin/inquiries", middlewares: [] }]

import { z } from "@medusajs/framework/zod"

export const UpdateInquiry = z.object({
  status: z.enum(["new", "contacted", "quoted", "closed"]),
}).strict()

export type UpdateInquiryType = z.infer<typeof UpdateInquiry>

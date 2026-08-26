import { z } from "@medusajs/framework/zod"

export const CreateInquiry = z.object({
  contact_name: z.string().max(120).optional(),
  whatsapp: z.string().max(40).optional(),
  country: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  page_url: z.string().url().max(2048),
  total_styles: z.number().int().positive(),
  total_pieces: z.number().int().positive(),
  items: z.array(z.object({
    title: z.string().max(255), styleNumber: z.string().max(120), color: z.string().max(120), size: z.string().max(120), quantity: z.number().int().positive(), packSize: z.union([z.literal(5), z.literal(10)]),
  })).min(1).max(100),
}).strict()

export type CreateInquiryType = z.infer<typeof CreateInquiry>

import { z } from "@medusajs/framework/zod"

export const CreateInquiry = z.object({
  contact_name: z.string().trim().min(1).max(120),
  whatsapp: z.string().trim().min(6).max(40),
  country: z.string().trim().min(1).max(120),
  message: z.string().max(2000).optional(),
  page_url: z.string().url().max(2048),
  total_styles: z.number().int().positive(),
  total_pieces: z.number().int().positive(),
  items: z.array(z.object({
    title: z.string().min(1).max(255),
    styleNumber: z.string().min(1).max(120),
    variantId: z.string().min(1).max(120),
    sku: z.string().min(1).max(120),
    color: z.string().min(1).max(120),
    size: z.string().min(1).max(120),
    quantity: z.number().int().positive(),
    packSize: z.union([z.literal(5), z.literal(10)]),
  }).strict()).min(1).max(100),
}).strict()

export type CreateInquiryType = z.infer<typeof CreateInquiry>

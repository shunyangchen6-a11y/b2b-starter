import { model } from "@medusajs/framework/utils"

export const Inquiry = model.define("wholesale_inquiry", {
  id: model.id({ prefix: "inq" }).primaryKey(),
  contact_name: model.text().nullable(),
  whatsapp: model.text().nullable(),
  page_url: model.text(),
  total_styles: model.number(),
  total_pieces: model.number(),
  items: model.json(),
})

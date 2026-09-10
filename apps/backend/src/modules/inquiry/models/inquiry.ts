import { model } from "@medusajs/framework/utils"

export const Inquiry = model.define("wholesale_inquiry", {
  id: model.id({ prefix: "inq" }).primaryKey(),
  contact_name: model.text().nullable(),
  whatsapp: model.text().nullable(),
  country: model.text().nullable(),
  message: model.text().nullable(),
  status: model.enum(["new", "contacted", "quoted", "closed"]).default("new"),
  page_url: model.text(),
  total_styles: model.number(),
  total_pieces: model.number(),
  items: model.json(),
})

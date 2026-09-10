import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { exportWholesaleCsv } from "../../../../lib/wholesale-csv-service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined
  const csv = await exportWholesaleCsv(req.scope, category)
  const today = new Date().toISOString().slice(0, 10)
  res.setHeader("Content-Type", "text/csv; charset=utf-8")
  res.setHeader("Content-Disposition", `attachment; filename="wholesale-products-${today}.csv"`)
  res.send(csv)
}

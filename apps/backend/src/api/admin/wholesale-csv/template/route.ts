import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { wholesaleCsvTemplate } from "../../../../lib/wholesale-csv"

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8")
  res.setHeader("Content-Disposition", 'attachment; filename="wholesale-products-template.csv"')
  res.send(wholesaleCsvTemplate())
}

export const WHOLESALE_CSV_COLUMNS = [
  "product_handle",
  "product_title",
  "description",
  "category",
  "fabric",
  "pack_size",
  "moq",
  "stock_status",
  "video_url",
  "product_test_marker",
  "color",
  "size",
  "sku",
  "inventory_quantity",
  "image_urls",
] as const

export type WholesaleCsvColumn = (typeof WHOLESALE_CSV_COLUMNS)[number]
export type WholesaleCsvRow = Record<WholesaleCsvColumn, string> & { line: number }
export type WholesaleCsvIssue = { line: number; sku?: string; reason: string }

export const WHOLESALE_CATEGORIES = new Set([
  "jogger-pants",
  "cargo-pants",
  "casual-pants",
  "jeans",
  "t-shirts",
])
export const WHOLESALE_STOCK_STATUSES = new Set(["in_stock", "low_stock", "sold_out"])

const MAX_CSV_BYTES = 2 * 1024 * 1024
const requiredValueColumns: WholesaleCsvColumn[] = [
  "product_handle", "product_title", "description", "category", "fabric", "pack_size",
  "moq", "stock_status", "color", "size", "sku", "inventory_quantity",
]
const textColumns = new Set<WholesaleCsvColumn>([
  "product_handle", "product_title", "description", "category", "fabric", "stock_status",
  "video_url", "product_test_marker", "color", "size", "sku", "image_urls",
])

const cleanBom = (value: string) => value.replace(/^\uFEFF/, "")

export const parseCsv = (input: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let value = ""
  let quoted = false

  for (let index = 0; index < input.length; index++) {
    const character = input[index]
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') { value += '"'; index++; continue }
      if (character === '"') { quoted = false; continue }
      value += character
      continue
    }
    if (character === '"') { quoted = true; continue }
    if (character === ",") { row.push(value); value = ""; continue }
    if (character === "\n") { row.push(value.replace(/\r$/, "")); rows.push(row); row = []; value = ""; continue }
    value += character
  }
  if (quoted) throw new MedusaError(MedusaError.Types.INVALID_DATA, "CSV has an unclosed quoted value.")
  if (value.length || row.length) { row.push(value.replace(/\r$/, "")); rows.push(row) }
  return rows
}

const isFormula = (value: string) => /^[=+\-@]/.test(value.trim())
const isNonNegativeInteger = (value: string) => /^\d+$/.test(value)

export const parseAndValidateWholesaleCsv = (input: string): { rows: WholesaleCsvRow[]; issues: WholesaleCsvIssue[] } => {
  const issues: WholesaleCsvIssue[] = []
  if (!input.trim()) return { rows: [], issues: [{ line: 1, reason: "CSV file is empty." }] }
  if (Buffer.byteLength(input, "utf8") > MAX_CSV_BYTES) return { rows: [], issues: [{ line: 1, reason: "CSV exceeds the 2 MB limit." }] }

  let records: string[][]
  try { records = parseCsv(input) } catch (error) { return { rows: [], issues: [{ line: 1, reason: error instanceof Error ? error.message : "Unable to parse CSV." }] } }
  const [header = [], ...data] = records
  const normalizedHeader = header.map((value) => cleanBom(value).trim())
  const missingColumns = WHOLESALE_CSV_COLUMNS.filter((column) => !normalizedHeader.includes(column))
  if (missingColumns.length) return { rows: [], issues: [{ line: 1, reason: `Missing required columns: ${missingColumns.join(", ")}.` }] }

  const rows: WholesaleCsvRow[] = []
  const seenSkus = new Set<string>()
  data.forEach((record, dataIndex) => {
    const line = dataIndex + 2
    if (record.every((value) => !value.trim())) return
    const row = Object.fromEntries(WHOLESALE_CSV_COLUMNS.map((column) => [column, (record[normalizedHeader.indexOf(column)] || "").trim()])) as Omit<WholesaleCsvRow, "line">
    const rowIssues: string[] = []
    requiredValueColumns.forEach((column) => { if (!row[column]) rowIssues.push(`Missing required field: ${column}.`) })
    textColumns.forEach((column) => { if (row[column] && isFormula(row[column])) rowIssues.push(`Unsafe formula-like value in ${column}.`) })
    if (row.category && !WHOLESALE_CATEGORIES.has(row.category)) rowIssues.push("category must be one of the supported wholesale categories.")
    if (row.stock_status && !WHOLESALE_STOCK_STATUSES.has(row.stock_status)) rowIssues.push("stock_status must be in_stock, low_stock, or sold_out.")
    if (row.pack_size && !["5", "10"].includes(row.pack_size)) rowIssues.push("pack_size must be 5 or 10.")
    if (row.moq && !isNonNegativeInteger(row.moq)) rowIssues.push("moq must be a non-negative integer.")
    if (row.inventory_quantity && !isNonNegativeInteger(row.inventory_quantity)) rowIssues.push("inventory_quantity must be a non-negative integer.")
    if (row.image_urls && row.image_urls.split("|").some((url) => !/^https?:\/\//.test(url) && !url.startsWith("/"))) rowIssues.push("image_urls must contain http(s) URLs or local paths separated by |.")
    if (row.sku && seenSkus.has(row.sku)) rowIssues.push("Duplicate SKU in CSV.")
    if (row.sku) seenSkus.add(row.sku)
    if (rowIssues.length) { issues.push({ line, sku: row.sku || undefined, reason: rowIssues.join(" ") }); return }
    rows.push({ ...row, line })
  })
  return { rows, issues }
}

export const escapeCsvCell = (value: string | number | boolean | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value)
  const protectedText = isFormula(text) ? `'${text}` : text
  return /[",\n\r]/.test(protectedText) ? `"${protectedText.replace(/"/g, '""')}"` : protectedText
}

export const serializeWholesaleCsv = (rows: Array<Record<WholesaleCsvColumn, string | number | boolean | null | undefined>>) =>
  `\uFEFF${WHOLESALE_CSV_COLUMNS.join(",")}\r\n${rows.map((row) => WHOLESALE_CSV_COLUMNS.map((column) => escapeCsvCell(row[column])).join(",")).join("\r\n")}\r\n`

export const wholesaleCsvTemplate = () => serializeWholesaleCsv([
  {
    product_handle: "example-classic-jogger-pants", product_title: "Example Classic Jogger Pants", description: "Example wholesale product. Replace before importing.", category: "jogger-pants", fabric: "Cotton blend fleece", pack_size: "10", moq: "50", stock_status: "in_stock", video_url: "", product_test_marker: "EXAMPLE_ONLY", color: "Black", size: "M", sku: "EXAMPLE-JOGGER-BLK-M", inventory_quantity: "100", image_urls: "",
  },
  {
    product_handle: "example-classic-jogger-pants", product_title: "Example Classic Jogger Pants", description: "Example wholesale product. Replace before importing.", category: "jogger-pants", fabric: "Cotton blend fleece", pack_size: "10", moq: "50", stock_status: "in_stock", video_url: "", product_test_marker: "EXAMPLE_ONLY", color: "Black", size: "L", sku: "EXAMPLE-JOGGER-BLK-L", inventory_quantity: "100", image_urls: "",
  },
  {
    product_handle: "example-basic-cotton-t-shirt", product_title: "Example Basic Cotton T-Shirt", description: "Example wholesale product. Replace before importing.", category: "t-shirts", fabric: "100% cotton jersey", pack_size: "5", moq: "30", stock_status: "low_stock", video_url: "", product_test_marker: "EXAMPLE_ONLY", color: "White", size: "M", sku: "EXAMPLE-TSHIRT-WHT-M", inventory_quantity: "40", image_urls: "",
  },
  {
    product_handle: "example-basic-cotton-t-shirt", product_title: "Example Basic Cotton T-Shirt", description: "Example wholesale product. Replace before importing.", category: "t-shirts", fabric: "100% cotton jersey", pack_size: "5", moq: "30", stock_status: "low_stock", video_url: "", product_test_marker: "EXAMPLE_ONLY", color: "White", size: "L", sku: "EXAMPLE-TSHIRT-WHT-L", inventory_quantity: "40", image_urls: "",
  },
])

export const validateWholesaleCsvUpload = (filename: unknown, csv: unknown) => {
  if (typeof filename !== "string" || !filename.toLowerCase().endsWith(".csv")) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Only .csv files are accepted.")
  if (typeof csv !== "string") throw new MedusaError(MedusaError.Types.INVALID_DATA, "CSV content is required.")
  return csv
}
import { MedusaError } from "@medusajs/framework/utils"

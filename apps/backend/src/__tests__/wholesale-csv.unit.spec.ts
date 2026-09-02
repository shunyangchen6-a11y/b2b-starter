import {
  parseAndValidateWholesaleCsv,
  serializeWholesaleCsv,
  validateWholesaleCsvUpload,
  WHOLESALE_CSV_COLUMNS,
  wholesaleCsvTemplate,
} from "../lib/wholesale-csv"

const row = (overrides: Record<string, string> = {}) => ({
  product_handle: "csv-test-jogger", product_title: "CSV Test Jogger", description: "Safe description", category: "jogger-pants", fabric: "Cotton", pack_size: "5", moq: "10", stock_status: "in_stock", video_url: "", product_test_marker: "TEST", color: "Black", size: "M", sku: "CSV-TEST-BLK-M", inventory_quantity: "10", image_urls: "", ...overrides,
})

describe("wholesale CSV", () => {
  it("parses a valid UTF-8 CSV", () => {
    const csv = serializeWholesaleCsv([row()])
    const result = parseAndValidateWholesaleCsv(csv)
    expect(result.issues).toEqual([])
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].sku).toBe("CSV-TEST-BLK-M")
  })

  it("rejects required validation errors and formula injection", () => {
    const csv = serializeWholesaleCsv([
      row({ sku: "DUPLICATE" }), row({ sku: "DUPLICATE" }), row({ category: "invalid" }),
      row({ stock_status: "unknown" }), row({ pack_size: "6" }), row({ inventory_quantity: "-1" }),
      row({ product_title: "=SUM(A1:A2)" }), row({ product_title: "" }),
    ]).replace("'=SUM(A1:A2)", "=SUM(A1:A2)")
    const result = parseAndValidateWholesaleCsv(csv)
    expect(result.rows).toHaveLength(1)
    expect(result.issues).toHaveLength(7)
  })

  it("creates a reusable template with every required column", () => {
    const result = parseAndValidateWholesaleCsv(wholesaleCsvTemplate())
    expect(result.issues).toEqual([])
    expect(result.rows).toHaveLength(4)
    expect(WHOLESALE_CSV_COLUMNS).toHaveLength(15)
  })

  it("accepts only CSV uploads", () => {
    expect(() => validateWholesaleCsvUpload("products.xlsx", "data")).toThrow("Only .csv files are accepted.")
    expect(validateWholesaleCsvUpload("products.csv", "data")).toBe("data")
  })
})

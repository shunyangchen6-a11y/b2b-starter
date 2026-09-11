import {
  parseAndValidateWholesaleCsv,
  serializeWholesaleCsv,
  validateWholesaleCsvUpload,
  WHOLESALE_CSV_COLUMNS,
  wholesaleCsvTemplate,
} from "../lib/wholesale-csv"
import {
  missingWholesaleCategoryDefinitions,
  WHOLESALE_CATEGORY_DEFINITIONS,
} from "../lib/wholesale-categories"
import { mergeUsdStandardPrice, planUsdPriceChange } from "../lib/wholesale-csv-service"

const row = (overrides: Record<string, string> = {}) => ({
  product_handle: "csv-test-jogger", product_title: "CSV Test Jogger", description: "Safe description", category: "jogger-pants", fabric: "Cotton", pack_size: "5", moq: "10", stock_status: "in_stock", video_url: "", product_test_marker: "TEST", color: "Black", size: "M", sku: "CSV-TEST-BLK-M", inventory_quantity: "10", usd_price: "2.00", image_urls: "", ...overrides,
})

describe("wholesale CSV", () => {
  it("defines stable wholesale categories and only returns requested missing handles", () => {
    expect(WHOLESALE_CATEGORY_DEFINITIONS).toEqual([
      { handle: "jogger-pants", name: "Jogger Pants" },
      { handle: "cargo-pants", name: "Cargo Pants" },
      { handle: "casual-pants", name: "Casual Pants" },
      { handle: "jeans", name: "Jeans" },
      { handle: "t-shirts", name: "T-Shirts" },
    ])

    const firstRun = missingWholesaleCategoryDefinitions(
      ["jeans"],
      ["casual-pants", "jeans"]
    )
    expect(firstRun).toEqual([
      { handle: "casual-pants", name: "Casual Pants" },
    ])
    expect(
      missingWholesaleCategoryDefinitions(
        ["jeans", ...firstRun.map((category) => category.handle)],
        ["casual-pants", "jeans"]
      )
    ).toEqual([])
  })

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
      row({ stock_status: "unknown" }), row({ pack_size: "6" }), row({ inventory_quantity: "-1" }), row({ usd_price: "2.001" }),
      row({ product_title: "=SUM(A1:A2)" }), row({ product_title: "" }),
    ]).replace("'=SUM(A1:A2)", "=SUM(A1:A2)")
    const result = parseAndValidateWholesaleCsv(csv)
    expect(result.rows).toHaveLength(1)
    expect(result.issues).toHaveLength(8)
  })

  it("creates a reusable template with every required column", () => {
    const result = parseAndValidateWholesaleCsv(wholesaleCsvTemplate())
    expect(result.issues).toEqual([])
    expect(result.rows).toHaveLength(4)
    expect(WHOLESALE_CSV_COLUMNS).toHaveLength(16)
    expect(WHOLESALE_CSV_COLUMNS).toContain("usd_price")
  })

  it("keeps legacy CSV files compatible and treats a missing usd_price column as no price change", () => {
    const legacyColumns = WHOLESALE_CSV_COLUMNS.filter((column) => column !== "usd_price")
    const legacyRow = row()
    const csv = `${legacyColumns.join(",")}\n${legacyColumns.map((column) => legacyRow[column]).join(",")}\n`
    const result = parseAndValidateWholesaleCsv(csv)
    expect(result.issues).toEqual([])
    expect(result.rows[0].usd_price).toBe("")
  })

  it("accepts only CSV uploads", () => {
    expect(() => validateWholesaleCsvUpload("products.xlsx", "data")).toThrow("Only .csv files are accepted.")
    expect(validateWholesaleCsvUpload("products.csv", "data")).toBe("data")
  })

  it("plans and creates a USD standard price in major currency units", () => {
    expect(planUsdPriceChange("SKU-1", [], 2)).toEqual({
      sku: "SKU-1", action: "create", current_amount: null, usd_price: 2, currency_code: "usd",
    })
    expect(mergeUsdStandardPrice([], 2)).toEqual([{ currency_code: "usd", amount: 2 }])
  })

  it("updates the existing USD price without changing other currencies or creating duplicates", () => {
    const prices = [
      { id: "price-usd", currency_code: "usd", amount: 1 },
      { id: "price-eur", currency_code: "eur", amount: 3 },
    ]
    expect(planUsdPriceChange("SKU-1", prices, 2).action).toBe("update")
    const updated = mergeUsdStandardPrice(prices, 2)
    expect(updated).toEqual([
      { id: "price-usd", currency_code: "usd", amount: 2 },
      { id: "price-eur", currency_code: "eur", amount: 3 },
    ])
    expect(mergeUsdStandardPrice(updated, 2)).toEqual(updated)
    expect(updated.filter((price) => price.currency_code === "usd")).toHaveLength(1)
    expect(planUsdPriceChange("SKU-1", updated, 2).action).toBe("unchanged")
  })
})

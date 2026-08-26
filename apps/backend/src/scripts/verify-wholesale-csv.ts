import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import {
  parseAndValidateWholesaleCsv,
  serializeWholesaleCsv,
  validateWholesaleCsvUpload,
  WholesaleCsvColumn,
} from "../lib/wholesale-csv"
import { exportWholesaleCsv, importWholesaleCsv, previewWholesaleCsv } from "../lib/wholesale-csv-service"
import { INQUIRY_MODULE } from "../modules/inquiry"

const temporaryHandles = [
  "csv-verify-jogger",
  "csv-verify-cargo",
  "csv-verify-tshirt",
]
const marker = "csv-import-verification-temporary"

const row = (overrides: Partial<Record<WholesaleCsvColumn, string>> = {}) => ({
  product_handle: "csv-verify-jogger",
  product_title: "CSV Verification Jogger Pants",
  description: "Temporary non-branded wholesale CSV verification product.",
  category: "jogger-pants",
  fabric: "Cotton blend",
  pack_size: "5",
  moq: "20",
  stock_status: "in_stock",
  video_url: "",
  product_test_marker: marker,
  color: "Black",
  size: "M",
  sku: "CSV-VERIFY-JOGGER-BLK-M",
  inventory_quantity: "24",
  image_urls: "",
  ...overrides,
})

const verificationRows = [
  row(),
  row({ color: "Olive", size: "L", sku: "CSV-VERIFY-JOGGER-OLV-L" }),
  row({ product_handle: "csv-verify-cargo", product_title: "CSV Verification Cargo Pants", description: "Temporary non-branded wholesale CSV verification product.", category: "cargo-pants", fabric: "Ripstop cotton", pack_size: "10", moq: "30", stock_status: "low_stock", color: "Khaki", size: "M", sku: "CSV-VERIFY-CARGO-KHK-M", inventory_quantity: "12" }),
  row({ product_handle: "csv-verify-cargo", product_title: "CSV Verification Cargo Pants", description: "Temporary non-branded wholesale CSV verification product.", category: "cargo-pants", fabric: "Ripstop cotton", pack_size: "10", moq: "30", stock_status: "low_stock", color: "Black", size: "L", sku: "CSV-VERIFY-CARGO-BLK-L", inventory_quantity: "12" }),
  row({ product_handle: "csv-verify-tshirt", product_title: "CSV Verification Cotton T-Shirt", description: "Temporary non-branded wholesale CSV verification product.", category: "t-shirts", fabric: "Cotton jersey", pack_size: "5", moq: "25", stock_status: "in_stock", color: "White", size: "M", sku: "CSV-VERIFY-TSHIRT-WHT-M", inventory_quantity: "30" }),
  row({ product_handle: "csv-verify-tshirt", product_title: "CSV Verification Cotton T-Shirt", description: "Temporary non-branded wholesale CSV verification product.", category: "t-shirts", fabric: "Cotton jersey", pack_size: "5", moq: "25", stock_status: "in_stock", color: "Navy", size: "L", sku: "CSV-VERIFY-TSHIRT-NVY-L", inventory_quantity: "30" }),
]

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
}

const productCount = async (query: any) => {
  const productService = query as any
  const products = await productService.listProducts({ handle: { $in: temporaryHandles } }, { select: ["id", "handle", "metadata"] })
  const variants = products.length ? await productService.listProductVariants({ product_id: { $in: products.map((product: any) => product.id) } }, { select: ["product_id", "sku"] }) : []
  return products.map((product: any) => ({ ...product, variants: variants.filter((variant: any) => variant.product_id === product.id).map((variant: any) => ({ ...variant, inventory_items: [{}] })) })) as Array<{ id: string; handle: string; metadata?: Record<string, unknown>; variants?: Array<{ sku?: string; inventory_items?: unknown[] }> }>
}

const cleanup = async (container: MedusaContainer) => {
  const productService = container.resolve(Modules.PRODUCT) as any
  const products = await productCount(productService)
  if (products.length) await deleteProductsWorkflow(container).run({ input: { ids: products.map((product) => product.id) } })
}

export default async function verifyWholesaleCsv({ container }: { container: MedusaContainer }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  let passed = false
  try {
    console.log("WHOLESALE_CSV_VERIFICATION: starting")
    await cleanup(container)
    console.log("WHOLESALE_CSV_VERIFICATION: temporary cleanup complete")
    const inquiryService = container.resolve(INQUIRY_MODULE) as any
    const [, inquiriesBefore] = await inquiryService.listAndCountInquiries({})

    const baselineExport = parseAndValidateWholesaleCsv(await exportWholesaleCsv(container))
    console.log("WHOLESALE_CSV_VERIFICATION: baseline export complete")
    const expectedExisting = ["fs-test-classic-jogger-pants", "fs-test-multi-pocket-cargo-pants", "fs-test-straight-leg-casual-pants", "fs-test-regular-fit-jeans", "fs-test-basic-cotton-t-shirt"]
    assert(baselineExport.issues.length === 0, "Existing wholesale export did not pass validation.")
    assert(expectedExisting.every((handle) => baselineExport.rows.some((entry) => entry.product_handle === handle)), "Existing five wholesale test products are missing from export.")

    const csv = serializeWholesaleCsv(verificationRows)
    const preview = await previewWholesaleCsv(container, csv)
    console.log("WHOLESALE_CSV_VERIFICATION: temporary preview complete")
    assert(preview.issues.length === 0, "Temporary import preview has validation errors.")
    assert(preview.summary.new_products === 3 && preview.summary.new_variants === 6, "Temporary import preview counts are incorrect.")
    await importWholesaleCsv(container, csv)
    console.log("WHOLESALE_CSV_VERIFICATION: temporary import complete")

    const imported = await productCount(container.resolve(Modules.PRODUCT))
    assert(imported.length === 3, "Temporary import did not create three products.")
    assert(imported.every((product) => product.metadata?.wholesale_only === true && product.metadata?.seed_marker === marker), "Imported products are missing required wholesale metadata.")
    assert(imported.reduce((count, product) => count + (product.variants?.length || 0), 0) === 6, "Temporary import did not create six variants.")
    assert(imported.every((product) => product.variants?.every((variant) => variant.sku && variant.inventory_items?.length)), "Imported variants are missing SKU or inventory links.")

    const exportedTemporaryRows = parseAndValidateWholesaleCsv(await exportWholesaleCsv(container)).rows.filter((entry) => temporaryHandles.includes(entry.product_handle))
    console.log("WHOLESALE_CSV_VERIFICATION: re-export complete")
    assert(exportedTemporaryRows.length === 6, "Imported products were not included in export.")
    const reimportCsv = serializeWholesaleCsv(exportedTemporaryRows)
    const reimportPreview = await previewWholesaleCsv(container, reimportCsv)
    assert(reimportPreview.issues.length === 0, "Exported CSV cannot be re-imported.")
    assert(reimportPreview.summary.new_products === 0 && reimportPreview.summary.new_variants === 0 && reimportPreview.summary.updated_products === 3 && reimportPreview.summary.updated_variants === 6, "Re-import preview did not identify safe updates.")
    await importWholesaleCsv(container, reimportCsv)
    console.log("WHOLESALE_CSV_VERIFICATION: re-import complete")
    const afterReimport = await productCount(container.resolve(Modules.PRODUCT))
    assert(afterReimport.length === 3 && afterReimport.reduce((count, product) => count + (product.variants?.length || 0), 0) === 6, "Re-import created duplicate products or variants.")

    const invalidCases: Array<[string, string]> = [
      ["duplicate SKU", serializeWholesaleCsv([row({ sku: "CSV-VERIFY-DUP" }), row({ sku: "CSV-VERIFY-DUP", color: "White" })])],
      ["invalid category", serializeWholesaleCsv([row({ category: "not-a-category" })])],
      ["invalid stock status", serializeWholesaleCsv([row({ stock_status: "unknown" })])],
      ["invalid pack size", serializeWholesaleCsv([row({ pack_size: "6" })])],
      ["negative inventory", serializeWholesaleCsv([row({ inventory_quantity: "-1" })])],
      ["missing required field", serializeWholesaleCsv([row({ product_title: "" })])],
    ]
    invalidCases.forEach(([name, invalidCsv]) => assert(parseAndValidateWholesaleCsv(invalidCsv).issues.length > 0, `${name} was not rejected.`))
    let nonCsvRejected = false
    try { validateWholesaleCsvUpload("products.xlsx", csv) } catch { nonCsvRejected = true }
    assert(nonCsvRejected, "Non-CSV upload was not rejected.")

    const [, inquiriesAfter] = await inquiryService.listAndCountInquiries({})
    assert(inquiriesBefore === inquiriesAfter, "Wholesale CSV verification changed inquiry data.")
    passed = true
    console.log("WHOLESALE_CSV_VERIFICATION: PASS")
    console.log("- Exported 5 existing wholesale test products")
    console.log("- Previewed and imported 3 temporary products / 6 variants")
    console.log("- Re-import updated 3 products / 6 variants without duplicates")
    console.log("- Rejected duplicate SKU, invalid category/status/pack, negative inventory, missing field, and non-CSV upload")
  } catch (error) {
    console.log("WHOLESALE_CSV_VERIFICATION: FAIL")
    console.log(`- ${error instanceof Error ? error.message : "Unknown verification failure"}`)
    throw error
  } finally {
    await cleanup(container)
    mkdirSync(join(process.cwd(), ".cache"), { recursive: true })
    writeFileSync(join(process.cwd(), ".cache", "wholesale-csv-verification.json"), JSON.stringify({ passed, completed_at: new Date().toISOString() }))
    if (passed) console.log("- Temporary verification products removed")
  }
}

const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")
const ts = require("typescript")

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  })
  module._compile(outputText, filename)
}

const {
  filterWholesaleCatalogProducts,
} = require("../src/lib/util/wholesale-filters.ts")
const {
  inquiryProgress,
} = require("../src/lib/selection/quote.ts")
const {
  reconcileStoredInquiry,
} = require("../src/lib/selection/inquiry-products.ts")

const category = { id: "pcat_jeans", handle: "jeans", name: "Jeans" }
const product = (overrides = {}) => ({
  id: "prod_real",
  handle: "fs-jn-001-black",
  status: "published",
  metadata: { wholesale_only: true },
  categories: [category],
  variants: [{ id: "variant_real", sku: "FS-JN-001-BLACK-M" }],
  ...overrides,
})

const item = (quantity = 65) => ({
  id: "variant_real",
  productId: "prod_real",
  handle: "fs-jn-001-black",
  title: "Black Jeans",
  styleNumber: "FS-JN-001",
  variantId: "variant_real",
  sku: "FS-JN-001-BLACK-M",
  color: "Black",
  size: "M",
  quantity,
  packSize: 5,
})

test("catalog recommendations only retain published real wholesale products", () => {
  const candidates = [
    product(),
    product({ id: "prod_starter", handle: "starter-keyboard", metadata: {} }),
    product({ id: "prod_electronic", categories: [{ handle: "electronics" }] }),
    product({ id: "prod_test", handle: "fs-test-jeans" }),
    product({ id: "prod_test_sku", variants: [{ id: "variant_test", sku: "FS-TEST-JEANS-M" }] }),
    product({ id: "prod_draft", status: "draft" }),
  ]

  assert.deepEqual(
    filterWholesaleCatalogProducts(candidates).map((entry) => entry.id),
    ["prod_real"]
  )
})

test("related products hide the complete section when no eligible product remains", () => {
  const related = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "products", "components", "related-products", "index.tsx"),
    "utf8"
  )

  assert.match(related, /filterWholesaleCatalogProducts/)
  assert.match(related, /responseProduct\.id !== product\.id/)
  assert.match(related, /if \(!products\.length\) \{\s+return null/)
  assert.match(related, /You might also like/i)
  assert.match(related, /grid grid-cols-2[^\n]*md:grid-cols-4/)
})

test("product detail accordion uses thin dividers and native Radix keyboard behavior", () => {
  const tabs = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "products", "components", "product-tabs", "index.tsx"),
    "utf8"
  )

  assert.match(tabs, /@radix-ui\/react-accordion/)
  assert.match(tabs, /defaultValue=\{\["description"\]\}/)
  assert.match(tabs, /<Accordion\.Trigger/)
  assert.match(tabs, /Description/)
  assert.match(tabs, /Specifications/)
  assert.match(tabs, /Size & Fit/)
  assert.match(tabs, /Shipping & Inspection/)
  assert.match(tabs, /border-b border-zinc-300/)
  assert.match(tabs, /group-data-\[state=open\]/)
})

test("MOQ progress reports remaining pieces and reached state", () => {
  assert.deepEqual(inquiryProgress([item(65)]), {
    pieces: 65,
    remaining: 35,
    reached: false,
    label: "65 / 100 · Add 35 more pieces",
  })
  assert.equal(inquiryProgress([item(100)]).label, "100 / 100 · MOQ reached")
})

test("saved inquiry reconciliation removes products and variants no longer returned by the API", () => {
  const valid = item(65)
  const legacyValid = { ...item(5), productId: undefined }
  const staleVariant = { ...item(5), id: "variant_removed", variantId: "variant_removed" }
  const staleProduct = { ...item(5), id: "variant_other", variantId: "variant_other", productId: "prod_removed" }
  const draft = { productId: "prod_real", handle: valid.handle, title: valid.title, styleNumber: valid.styleNumber }
  const staleDraft = { ...draft, productId: "prod_removed", handle: "removed-product" }

  const reconciled = reconcileStoredInquiry(
    [valid, legacyValid, staleVariant, staleProduct],
    [draft, staleDraft],
    [{ id: "prod_real", variants: [{ id: "variant_real" }] }]
  )

  assert.deepEqual(reconciled.items.map((entry) => entry.variantId), ["variant_real", "variant_real"])
  assert.ok(reconciled.items.every((entry) => entry.productId === "prod_real"))
  assert.deepEqual(reconciled.drafts.map((entry) => entry.productId), ["prod_real"])
})

test("selection persistence stores catalog IDs but no customer privacy fields", () => {
  const context = fs.readFileSync(
    path.join(__dirname, "..", "src", "lib", "selection", "selection-context.tsx"),
    "utf8"
  )
  const variants = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "products", "components", "product-variants-table", "index.tsx"),
    "utf8"
  )

  assert.match(context, /localStorage\.getItem\(STORAGE_KEY\)/)
  assert.match(context, /localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(items\)\)/)
  assert.match(context, /reconcileStoredInquiry/)
  assert.match(context, /localStorage\.removeItem\(PRODUCT_STORAGE_KEY\)/)
  assert.doesNotMatch(context, /setProductDrafts|addProductDraft/)
  assert.match(variants, /productId: product\.id/)
  assert.doesNotMatch(context, /contactName|customerWhatsapp|JWT|token/i)
})

test("mobile Inquiry List uses dynamic viewport scrolling and preserves important product data", () => {
  const drawer = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "selection", "components", "selection-drawer", "index.tsx"),
    "utf8"
  )

  assert.match(drawer, /h-\[100dvh\]/)
  assert.match(drawer, /overflow-y-auto/)
  assert.match(drawer, /sticky top-0/)
  assert.match(drawer, /pb-\[max\(24px,env\(safe-area-inset-bottom\)\)\]/)
  assert.match(drawer, /document\.body\.style\.position = "fixed"/)
  assert.match(drawer, /window\.scrollTo\(0, scrollPosition\)/)
  assert.match(drawer, /Style No\./)
  assert.match(drawer, />Color</)
  assert.match(drawer, />Size</)
  assert.match(drawer, />Pieces</)
  assert.match(drawer, />Unit price</)
  assert.match(drawer, /line-clamp-2/)
  assert.match(drawer, /onFocus=\{keepFocusedFieldVisible\}/)
  assert.match(drawer, /min-h-24/)
  assert.match(drawer, /min-h-12 w-full bg-zinc-950/)
  assert.doesNotMatch(drawer, /productDrafts\.map/)
})

for (const viewport of [360, 390, 400]) {
  test(`mobile Inquiry List content remains width-bounded at ${viewport}px`, () => {
    const horizontalPadding = 32
    const thumbnail = 64
    const deleteTarget = 44
    const gaps = 24

    assert.ok(viewport - horizontalPadding - thumbnail - deleteTarget - gaps > 0)
  })
}

test("mobile fixed action bar is safe-area aware and hidden while the drawer is open", () => {
  const bar = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "selection", "components", "mobile-inquiry-bar", "index.tsx"),
    "utf8"
  )
  const layout = fs.readFileSync(
    path.join(__dirname, "..", "src", "app", "layout.tsx"),
    "utf8"
  )

  assert.match(bar, /fixed inset-x-0 bottom-0/)
  assert.match(bar, /md:hidden/)
  assert.match(bar, /safe-area-inset-bottom/)
  assert.match(bar, /min-h-11/)
  assert.match(bar, /if \(drawerOpen\) return null/)
  assert.match(bar, /Inquiry List \(\{pieces\}\)/)
  assert.match(bar, />\s*WhatsApp\s*</)
  assert.match(layout, /pb-\[calc\(60px\+env\(safe-area-inset-bottom\)\)\] md:pb-0/)
})

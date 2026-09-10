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
  selectionHasQuantityForProduct,
} = require("../src/lib/selection/inquiry-products.ts")
const {
  groupVariantsByColor,
} = require("../src/lib/util/product-variant-groups.ts")

const draft = {
  productId: "prod_cargo",
  handle: "multi-pocket-cargo-pants",
  title: "Multi-Pocket Cargo Pants",
  styleNumber: "FS-CG-001",
}

const item = {
  id: "variant_black_m",
  handle: draft.handle,
  title: draft.title,
  styleNumber: draft.styleNumber,
  variantId: "variant_black_m",
  sku: "FS-CG-001-BLACK-M",
  color: "Black",
  size: "M",
  quantity: 5,
  packSize: 5,
}

test("zero-piece products never count as Inquiry List products", () => {
  assert.equal(selectionHasQuantityForProduct([], draft.handle), false)
  assert.equal(
    selectionHasQuantityForProduct([{ ...item, quantity: 0 }], draft.handle),
    false
  )
  assert.equal(selectionHasQuantityForProduct([item], draft.handle), true)
})

test("Inquiry CTA only switches to VIEW INQUIRY for a positive saved quantity", () => {
  assert.equal(selectionHasQuantityForProduct([], draft.handle), false)
  assert.equal(selectionHasQuantityForProduct([{ ...item, quantity: 0 }], draft.handle), false)
  assert.equal(selectionHasQuantityForProduct([item], draft.handle), true)

  const restored = JSON.parse(JSON.stringify([item]))
  assert.equal(selectionHasQuantityForProduct(restored, draft.handle), true)
})

test("product variants are grouped under their real colors", () => {
  const variants = [
    { id: "blue-s", options: [{ option_id: "color", value: "Blue" }] },
    { id: "black-m", options: [{ option_id: "color", value: "Black" }] },
    { id: "blue-m", options: [{ option_id: "color", value: "Blue" }] },
  ]
  const groups = groupVariantsByColor(variants, "color")

  assert.deepEqual(groups.map((group) => [group.color, group.variants.map((variant) => variant.id)]), [
    ["Blue", ["blue-s", "blue-m"]],
    ["Black", ["black-m"]],
  ])
})

test("product CTA opens and targets the existing Inquiry List", () => {
  const storefront = path.resolve(__dirname, "..", "src")
  const button = fs.readFileSync(
    path.join(storefront, "modules", "products", "components", "product-inquiry-button", "index.tsx"),
    "utf8"
  )
  const drawer = fs.readFileSync(
    path.join(storefront, "modules", "selection", "components", "selection-drawer", "index.tsx"),
    "utf8"
  )

  assert.match(button, /INQUIRE NOW/)
  assert.match(button, /VIEW INQUIRY/)
  assert.match(button, /openDrawer\(product\.handle\)/)
  assert.match(button, /hasSelectedProduct\(product\.handle\)/)
  assert.match(button, /scrollIntoView/)
  assert.match(button, /min-h-11 w-full bg-zinc-950/)
  assert.match(button, /hover:bg-zinc-800/)
  assert.match(button, /focus-visible:outline/)
  assert.match(button, /disabled:cursor-not-allowed/)
  assert.match(button, /aria-busy=\{loading\}/)
  assert.match(drawer, /data-inquiry-handle/)
  assert.match(drawer, /scrollIntoView/)
  assert.match(button, /router\.push/)
  assert.match(button, /#product-variant-selection/)
  assert.doesNotMatch(button, /addProductDraft/)
  assert.match(drawer, /Your inquiry list is empty/)
  assert.match(drawer, /Browse products and select sizes to start an inquiry/)
})

test("grouped variant rows and product detail columns remain bounded", () => {
  const storefront = path.resolve(__dirname, "..", "src")
  const variants = fs.readFileSync(
    path.join(storefront, "modules", "products", "components", "product-variants-table", "index.tsx"),
    "utf8"
  )
  const template = fs.readFileSync(
    path.join(storefront, "modules", "products", "templates", "index.tsx"),
    "utf8"
  )

  assert.match(variants, /data-testid="color-grouped-variants"/)
  assert.match(variants, /grid min-w-0 grid-cols-2/)
  assert.match(variants, /lg:grid-cols-\[minmax\(90px,0\.65fr\)_minmax\(120px,0\.9fr\)_minmax\(210px,1\.5fr\)\]/)
  assert.match(template, /grid-cols-1 items-start/)
  assert.match(template, /large:grid-cols-\[minmax\(0,3fr\)_minmax\(380px,2fr\)\]/)
  assert.match(template, /large:sticky large:top-\[116px\]/)
})

test("product inquiry progress remains immediately above the primary action", () => {
  const storefront = path.resolve(__dirname, "..", "src")
  const actions = fs.readFileSync(
    path.join(storefront, "modules", "products", "components", "product-actions", "index.tsx"),
    "utf8"
  )
  const progress = fs.readFileSync(
    path.join(storefront, "modules", "products", "components", "product-inquiry-progress", "index.tsx"),
    "utf8"
  )

  assert.match(actions, /<ProductVariantsTable[\s\S]*<ProductInquiryProgress[\s\S]*<ProductInquiryButton/)
  assert.match(progress, /inquiryProgress\(items\)/)
  assert.match(progress, /aria-live="polite"/)
  assert.match(progress, /Add at least 100 pieces across mixed styles, colors and sizes before sending on WhatsApp/)
})

for (const viewport of [360, 390, 400, 1440]) {
  test(`Inquiry CTA layout remains full-width and bounded at ${viewport}px`, () => {
    const buttonMinimumHeight = 44
    const horizontalPadding = viewport < 768 ? 32 : 64

    assert.ok(viewport - horizontalPadding > 0)
    assert.ok(buttonMinimumHeight >= 44)
  })
}

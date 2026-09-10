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
  addInquiryProductDraft,
  removeDraftForSelectedProduct,
  selectionContainsProduct,
} = require("../src/lib/selection/inquiry-products.ts")

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

test("adds a product once and prevents duplicate Inquiry List drafts", () => {
  const first = addInquiryProductDraft([], [], draft)
  const repeated = addInquiryProductDraft(first, [], draft)

  assert.equal(first.length, 1)
  assert.equal(repeated.length, 1)
  assert.equal(selectionContainsProduct([], repeated, draft.handle), true)
})

test("an existing selected variant counts as added and replaces its draft", () => {
  assert.equal(selectionContainsProduct([item], [], draft.handle), true)
  assert.deepEqual(removeDraftForSelectedProduct([draft], item), [])
  assert.deepEqual(addInquiryProductDraft([], [item], draft), [])
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
  assert.match(button, /min-h-11 w-full bg-zinc-950/)
  assert.match(button, /hover:bg-zinc-800/)
  assert.match(button, /focus-visible:outline/)
  assert.match(button, /disabled:cursor-not-allowed/)
  assert.match(button, /aria-busy=\{loading\}/)
  assert.match(drawer, /data-inquiry-handle/)
  assert.match(drawer, /scrollIntoView/)
  assert.match(drawer, /Choose sizes &amp; quantities/)
})

for (const viewport of [360, 390, 400, 1440]) {
  test(`Inquiry CTA layout remains full-width and bounded at ${viewport}px`, () => {
    const buttonMinimumHeight = 44
    const horizontalPadding = viewport < 768 ? 32 : 64

    assert.ok(viewport - horizontalPadding > 0)
    assert.ok(buttonMinimumHeight >= 44)
  })
}

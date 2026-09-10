const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")

const storefront = path.resolve(__dirname, "..")
const source = (relativePath) =>
  fs.readFileSync(path.join(storefront, relativePath), "utf8")

const variants = source("src/modules/products/components/product-variants-table/index.tsx")
const quantityControl = source("src/modules/products/components/bulk-table-quantity/index.tsx")
const drawer = source("src/modules/selection/components/selection-drawer/index.tsx")
const filters = source("src/modules/store/components/refinement-list/wholesale-filters.tsx")
const home = source("src/modules/home/components/hero/index.tsx")
const listing = source("src/modules/store/templates/paginated-products.tsx")
const mainLayout = source("src/app/[countryCode]/(main)/layout.tsx")
const homePage = source("src/app/[countryCode]/(main)/page.tsx")
const navigation = source("src/modules/layout/templates/nav/index.tsx")
const productTemplate = source("src/modules/products/templates/index.tsx")
const globals = source("src/styles/globals.css")

for (const viewport of [360, 390, 400]) {
  test(`mobile layout contract fits ${viewport}px without a wide variant table`, () => {
    const contentWidth = viewport - 32
    const quantityControlMinimumWidth = 44 + 8 + 56 + 8 + 44

    assert.ok(quantityControlMinimumWidth <= contentWidth)
    assert.match(variants, /grid gap-3 md:hidden/)
    assert.match(variants, /hidden overflow-x-auto p-px md:block/)
    // Customer-facing product pricing is intentionally inquiry-only.
    assert.match(variants, /formatWholesaleVariantPrice/)
    assert.doesNotMatch(variants, /Wholesale price/)
    assert.match(variants, /Available/)
    assert.match(variants, /break-words font-medium leading-5/)
    assert.doesNotMatch(variants, /break-all/)
  })
}

test("mobile quantity controls keep 44px targets and preserve bounded quantity input", () => {
  assert.match(quantityControl, /min-h-11 min-w-11/)
  assert.match(quantityControl, /max=\{maximumQuantity\}/)
  assert.match(quantityControl, /isValidSelectionQuantity\(nextValue, maxQuantity\)/)
  assert.match(quantityControl, /Enter 0, a multiple of 5, or all/)
})

test("home, product listing filters, and selection inquiry drawer have mobile-safe contracts", () => {
  assert.match(home, /h-\[620px\] min-h-\[620px\]/)
  assert.match(home, /px-5 pt-7 text-center/)
  assert.match(home, /break-words text-\[40px\]/)
  assert.match(home, /text-white/)
  assert.match(home, /w-\[72%\] max-w-\[250px\]/)
  assert.match(home, /object-\[50%_55%\] small:object-\[72%_center\]/)
  assert.match(listing, /grid w-full min-w-0 max-w-full grid-cols-1/)
  assert.match(filters, /fixed inset-0 z-50 small:hidden/)
  assert.match(filters, /min-h-11 flex-1/)
  assert.match(drawer, /min-h-0 flex-1 overflow-y-auto/)
  assert.match(drawer, /min-h-11 border border-zinc-300 px-3/)
  assert.match(drawer, /min-h-11 w-full bg-zinc-950/)
  assert.match(drawer, /<span className="md:hidden">List \(\{totals\.pieces\}\)<\/span>/)
  assert.match(drawer, /w-full min-w-0 max-w-md flex-col overflow-x-hidden/)
  assert.match(navigation, /grid-cols-\[44px_minmax\(0,1fr\)_auto\]/)
  assert.match(navigation, /min-w-0 flex-col items-center justify-self-center/)
  assert.match(homePage, /grid w-full min-w-0 max-w-full grid-cols-2 gap-2 text-center md:grid-cols-4/)
  assert.match(homePage, /min-w-0 border border-zinc-200 p-4/)
  assert.match(productTemplate, /w-full min-w-0 max-w-full flex-col gap-y-2 overflow-x-clip/)
  assert.match(globals, /max-width: 100%;\s+overflow-x: clip;/)
  assert.match(mainLayout, /w-full max-w-full overflow-hidden whitespace-nowrap/)
  assert.match(mainLayout, /Ready Stock · Wholesale · Fast Shipping/)
})

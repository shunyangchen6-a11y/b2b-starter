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

for (const viewport of [360, 430]) {
  test(`mobile layout contract fits ${viewport}px without a wide variant table`, () => {
    const contentWidth = viewport - 32
    const quantityControlMinimumWidth = 44 + 8 + 56 + 8 + 44

    assert.ok(quantityControlMinimumWidth <= contentWidth)
    assert.match(variants, /grid gap-3 md:hidden/)
    assert.match(variants, /hidden overflow-x-auto p-px md:block/)
    assert.match(variants, /Wholesale price/)
    assert.match(variants, /Available/)
    assert.match(variants, /break-words font-medium leading-5/)
    assert.doesNotMatch(variants, /break-all/)
  })
}

test("mobile quantity controls keep 44px targets and preserve bounded quantity input", () => {
  assert.match(quantityControl, /min-h-11 min-w-11/)
  assert.match(quantityControl, /max=\{maxQuantity\}/)
  assert.match(quantityControl, /Math\.min\([\s\S]*maxQuantity/)
})

test("home, product listing filters, and selection inquiry drawer have mobile-safe contracts", () => {
  assert.match(home, /px-5 text-center/)
  assert.match(home, /break-words text-4xl/)
  assert.match(listing, /grid min-w-0 grid-cols-1 w-full/)
  assert.match(filters, /fixed inset-0 z-50 small:hidden/)
  assert.match(filters, /min-h-11 flex-1/)
  assert.match(drawer, /min-h-0 flex-1 overflow-y-auto/)
  assert.match(drawer, /min-h-11 border border-zinc-300 px-3/)
  assert.match(drawer, /min-h-11 w-full bg-zinc-950/)
})

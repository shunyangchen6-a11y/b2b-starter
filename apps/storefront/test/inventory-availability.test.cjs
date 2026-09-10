const assert = require("node:assert/strict")
const fs = require("node:fs")
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
  isSelectionWithinAvailability,
} = require("../src/lib/selection/quote.ts")
const {
  wholesaleStockStatus,
  wholesaleStockStatusCode,
} = require("../src/lib/util/wholesale.ts")
const {
  filterWholesaleProducts,
} = require("../src/lib/util/wholesale-filters.ts")

const productWithInventory = (quantities) => ({
  metadata: { stock_status: "sold_out" },
  variants: quantities.map((inventory_quantity, index) => ({
    id: `variant_${index}`,
    manage_inventory: true,
    inventory_quantity,
    options: [],
  })),
  categories: [],
  options: [],
})

test("derives wholesale statuses from live variant inventory instead of metadata", () => {
  assert.equal(wholesaleStockStatusCode(productWithInventory([180])), "in_stock")
  assert.equal(wholesaleStockStatus(productWithInventory([24])), "Low Stock")
  assert.equal(wholesaleStockStatusCode(productWithInventory([0])), "sold_out")
})

test("filters wholesale stock status with live inventory", () => {
  const inStock = productWithInventory([180])
  const soldOut = productWithInventory([0])
  const filters = { category: [], size: [], color: [], fabric: [], stock_status: ["in_stock"] }

  assert.deepEqual(filterWholesaleProducts([inStock, soldOut], filters), [inStock])
})

test("rejects a Selection List quantity above actual availability", () => {
  const selection = [{
    id: "variant_blue_s",
    handle: "fs-test-straight-leg-casual-pants",
    title: "Straight-Leg Casual Pants",
    styleNumber: "FS-TEST-CASUAL-PANTS",
    variantId: "variant_blue_s",
    sku: "FS-TEST-CASUAL-PANTS-BLUE-S",
    color: "Blue",
    size: "S",
    quantity: 181,
    availableQuantity: 180,
    packSize: 10,
  }]

  assert.equal(isSelectionWithinAvailability(selection), false)
  assert.equal(isSelectionWithinAvailability([{ ...selection[0], quantity: 180 }]), true)
})

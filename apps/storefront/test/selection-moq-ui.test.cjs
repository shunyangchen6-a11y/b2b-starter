const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")

const source = (file) => fs.readFileSync(
  path.join(__dirname, "..", "src", ...file),
  "utf8"
)

test("variant and Selection List inputs use five-piece increments", () => {
  const variantControl = source(["modules", "products", "components", "bulk-table-quantity", "index.tsx"])
  const drawer = source(["modules", "selection", "components", "selection-drawer", "index.tsx"])

  assert.match(variantControl, /normalizeQuantity\(quantity\) \+ 5/)
  assert.match(variantControl, /step="5"/)
  assert.match(drawer, /step="5"/)
  assert.match(drawer, /maximumSelectableQuantity\(item\.availableQuantity\)/)
})

test("Selection List blocks WhatsApp submission until the global 100-piece MOQ", () => {
  const drawer = source(["modules", "selection", "components", "selection-drawer", "index.tsx"])

  assert.match(drawer, /\{totals\.pieces\} \/ \{WHOLESALE_ORDER_MOQ\} pieces/)
  assert.match(drawer, /Minimum order quantity is 100 pieces in total\. You can mix different styles, colors and sizes\./)
  assert.match(drawer, /!meetsOrderMinimum/)
})

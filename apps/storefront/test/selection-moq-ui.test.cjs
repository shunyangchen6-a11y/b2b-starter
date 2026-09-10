const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")

const source = (file) => fs.readFileSync(
  path.join(__dirname, "..", "src", ...file),
  "utf8"
)

test("variant and Inquiry List inputs use five-piece increments with a final-stock exception", () => {
  const variantControl = source(["modules", "products", "components", "bulk-table-quantity", "index.tsx"])
  const drawer = source(["modules", "selection", "components", "selection-drawer", "index.tsx"])

  assert.match(variantControl, /increaseSelectionQuantity/)
  assert.match(variantControl, /decreaseSelectionQuantity/)
  assert.match(variantControl, /isValidSelectionQuantity/)
  assert.match(variantControl, /or all \$\{maximumQuantity\} available pieces/)
  assert.match(drawer, /BulkTableQuantity/)
  assert.match(drawer, /\{item\.availableQuantity\} available/)
})

test("Selection List blocks WhatsApp submission until the global 100-piece MOQ", () => {
  const drawer = source(["modules", "selection", "components", "selection-drawer", "index.tsx"])

  assert.match(drawer, /\{progress\.label\}/)
  assert.match(drawer, /Minimum order quantity is 100 pieces in total\. You can mix different styles, colors and sizes\./)
  assert.match(drawer, /!meetsOrderMinimum/)
  assert.match(drawer, /WHOLESALE_ORDER_MOQ - totals\.pieces/)
  assert.match(drawer, /Add \{piecesRemaining\} more/)
})

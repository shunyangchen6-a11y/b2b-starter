const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")

test("shows the required wholesale product facts without inventing stock timestamps", () => {
  const productInfo = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "products", "templates", "product-info", "index.tsx"),
    "utf8"
  )
  const productFacts = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "products", "components", "product-facts", "index.tsx"),
    "utf8"
  )

  assert.match(productFacts, />Fabric</)
  assert.match(productInfo, /MOQ:/)
  assert.match(productInfo, /Pack:/)
  assert.match(productFacts, /Category:/)
  assert.match(productFacts, /stock_updated_at/)
  assert.doesNotMatch(productFacts, /new Date\(\)/)
  assert.doesNotMatch(productFacts, /availableQuantity.*available/)
  assert.doesNotMatch(productFacts, /Math\.max\(0, Number\(variant\.inventory_quantity\)/)
  assert.match(productFacts, /CheckCircleSolid/)
})

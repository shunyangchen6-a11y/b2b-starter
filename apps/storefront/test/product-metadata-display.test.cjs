const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")

test("keeps wholesale fabric internal while retaining other product facts", () => {
  const productInfo = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "products", "templates", "product-info", "index.tsx"),
    "utf8"
  )
  const productFacts = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "products", "components", "product-facts", "index.tsx"),
    "utf8"
  )

  assert.doesNotMatch(`${productInfo}\n${productFacts}`, /Fabric:/)
  assert.match(productInfo, /MOQ:/)
  assert.match(productInfo, /Pack:/)
  assert.match(productFacts, /Category:/)
})

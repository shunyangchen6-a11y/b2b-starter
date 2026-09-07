const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")

test("keeps wholesale fabric internal while retaining other product facts", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "products", "templates", "product-info", "index.tsx"),
    "utf8"
  )

  assert.doesNotMatch(source, /Fabric:/)
  assert.match(source, /MOQ:/)
  assert.match(source, /Pack:/)
  assert.match(source, /Category:/)
})

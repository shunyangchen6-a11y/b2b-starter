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
  selectWholesaleFooterCategories,
} = require("../src/lib/util/footer-categories.ts")

test("footer links only active wholesale category handles in the intended order", () => {
  const categories = [
    { id: "1", handle: "jeans" },
    { id: "2", handle: "phones" },
    { id: "3", handle: "cargo-pants" },
    { id: "4", handle: "t-shirts" },
    { id: "5", handle: "jogger-pants" },
  ]

  assert.deepEqual(
    selectWholesaleFooterCategories(categories).map(({ handle, label }) => ({ handle, label })),
    [
      { handle: "cargo-pants", label: "Cargo Pants" },
      { handle: "jeans", label: "Jeans" },
      { handle: "jogger-pants", label: "Jogger Pants" },
      { handle: "t-shirts", label: "T-Shirts" },
    ]
  )
})

test("footer does not retain starter brand or developer links", () => {
  const footer = fs.readFileSync(
    path.join(__dirname, "../src/modules/layout/templates/footer/index.tsx"),
    "utf8"
  )

  assert.match(footer, /FOUR SEASONS CLOTHING/)
  assert.match(footer, /Ready-stock menswear wholesale for global buyers\./)
  assert.match(footer, /© 2026 Four Seasons Clothing\. All rights reserved\./)
  assert.doesNotMatch(footer, /Medusa Store|github\.com\/medusajs|docs\.medusajs\.com|MedusaCTA/)
})

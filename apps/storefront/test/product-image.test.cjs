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
  getProductImageUrl,
  WHOLESALE_PLACEHOLDER_IMAGE,
} = require("../src/lib/util/product-image.ts")

test("uses the repository wholesale placeholder for missing and localhost URLs", () => {
  for (const value of [undefined, null, "", "  ", "http://localhost:8000/images/wholesale-placeholder.svg", "http://127.0.0.1:8000/image.jpg"]) {
    assert.equal(getProductImageUrl(value), WHOLESALE_PLACEHOLDER_IMAGE)
  }
})

test("keeps Cloud-safe relative and HTTPS product image URLs", () => {
  assert.equal(
    getProductImageUrl("/images/wholesale-placeholder.svg"),
    "/images/wholesale-placeholder.svg"
  )
  assert.equal(
    getProductImageUrl("https://example.invalid/product.jpg"),
    "https://example.invalid/product.jpg"
  )
})

test("ships the unified placeholder image as a Storefront public asset", () => {
  const assetPath = path.join(
    __dirname,
    "..",
    "public",
    "images",
    "wholesale-placeholder.svg"
  )

  assert.equal(fs.existsSync(assetPath), true)
  assert.match(fs.readFileSync(assetPath, "utf8"), /WHOLESALE SAMPLE/)
})

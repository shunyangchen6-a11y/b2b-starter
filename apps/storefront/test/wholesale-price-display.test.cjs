const assert = require("node:assert/strict")
const fs = require("node:fs")
const Module = require("node:module")
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

const resolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return resolveFilename.call(
      this,
      path.join(__dirname, "..", "src", request.slice(2)),
      parent,
      isMain,
      options
    )
  }

  return resolveFilename.call(this, request, parent, isMain, options)
}

const {
  formatWholesaleProductPrice,
  formatWholesaleVariantPrice,
} = require("../src/lib/util/get-product-price.ts")

const price = (amount, currency_code = "usd") => ({
  calculated_amount: amount,
  original_amount: amount,
  currency_code,
  calculated_price: { price_list_type: "default" },
})

test("uses the lowest Medusa calculated variant price for wholesale product cards and detail", () => {
  const product = {
    id: "prod_wholesale",
    variants: [
      { id: "variant_high", calculated_price: price(12.5) },
      { id: "variant_low", calculated_price: price(8) },
    ],
  }

  assert.equal(formatWholesaleProductPrice(product), "From $8.00 / pc")
})

test("uses Medusa's calculated currency code instead of a hardcoded currency symbol", () => {
  assert.equal(
    formatWholesaleProductPrice({
      id: "prod_eur_price",
      variants: [{ id: "variant_eur", calculated_price: price(8, "eur") }],
    }),
    "From €8.00 / pc"
  )
})

test("uses the approved Contact for Price fallback when Medusa has no usable variant price", () => {
  assert.equal(
    formatWholesaleProductPrice({ id: "prod_without_price", variants: [] }),
    "Contact for Price"
  )
  assert.equal(formatWholesaleVariantPrice({}), "Contact for Price")
})

test("formats the actual selected variant price per piece without retail sale presentation", () => {
  assert.equal(
    formatWholesaleVariantPrice({ calculated_price: price(10.25) }),
    "$10.25 / pc"
  )
})

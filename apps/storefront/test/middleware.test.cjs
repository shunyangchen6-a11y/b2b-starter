const assert = require("node:assert/strict")
const fs = require("node:fs")
const test = require("node:test")
const ts = require("typescript")

process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL = "https://medusa.test"
process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = "pk_test_country_redirect"
process.env.NEXT_PUBLIC_DEFAULT_REGION = "dk"

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

global.fetch = async () =>
  new Response(
    JSON.stringify({
      regions: [
        {
          id: "reg_test",
          countries: [{ iso_2: "dk" }],
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  )

const { NextRequest } = require("next/server")
const { middleware } = require("../src/middleware.ts")

const runMiddleware = (path) =>
  middleware(new NextRequest(`https://storefront.test${path}`))

test("redirects the root path to the default country exactly once", async () => {
  const response = await runMiddleware("/")

  assert.equal(response.status, 307)
  assert.equal(response.headers.get("location"), "https://storefront.test/dk")
  assert.match(response.headers.get("set-cookie") ?? "", /_medusa_cache_id=/)
})

test("does not redirect an already valid country path to itself", async () => {
  const response = await runMiddleware("/dk")

  assert.equal(response.status, 200)
  assert.equal(response.headers.get("location"), null)
})

test("passes country-prefixed product paths through without a redirect", async () => {
  const response = await runMiddleware("/dk/products?category=jogger-pants")

  assert.equal(response.status, 200)
  assert.equal(response.headers.get("location"), null)
})

test("replaces an invalid two-letter country code with a valid one", async () => {
  const response = await runMiddleware("/zz/products")

  assert.equal(response.status, 307)
  assert.equal(
    response.headers.get("location"),
    "https://storefront.test/dk/products"
  )
})

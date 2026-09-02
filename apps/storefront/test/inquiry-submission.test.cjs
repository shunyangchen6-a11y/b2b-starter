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

const { createStoreInquiryPayload } = require("../src/lib/selection/quote.ts")
const {
  submitInquiryAndOpenWhatsApp,
} = require("../src/lib/selection/submit-inquiry.ts")

const selectionItems = [
  {
    id: "variant_fs_test_black_s",
    handle: "fs-test-classic-jogger-pants",
    title: "Classic Jogger Pants",
    styleNumber: "FS-TEST-JOGGER-PANTS",
    variantId: "variant_fs_test_black_s",
    sku: "FS-TEST-JOGGER-PANTS-BLK-S",
    color: "Black",
    size: "S",
    quantity: 2,
    packSize: 10,
    image: "/images/wholesale-placeholder.svg",
  },
]

const createPayload = () =>
  createStoreInquiryPayload({
    items: selectionItems,
    pageUrl: "https://storefront.test/dk/products/fs-test-classic-jogger-pants",
    contactName: "Preview Customer",
    whatsapp: "+234 801 234 5678",
    country: "Nigeria",
    message: "Please quote mixed sizes.",
  })

test("creates a schema-safe payload for a Cloud wholesale test product", () => {
  const payload = createPayload()

  assert.deepEqual(payload, {
    page_url: "https://storefront.test/dk/products/fs-test-classic-jogger-pants",
    contact_name: "Preview Customer",
    whatsapp: "+234 801 234 5678",
    country: "Nigeria",
    message: "Please quote mixed sizes.",
    total_styles: 1,
    total_pieces: 2,
    items: [
      {
        title: "Classic Jogger Pants",
        styleNumber: "FS-TEST-JOGGER-PANTS",
        variantId: "variant_fs_test_black_s",
        sku: "FS-TEST-JOGGER-PANTS-BLK-S",
        color: "Black",
        size: "S",
        quantity: 2,
        packSize: 10,
      },
    ],
  })
})

test("keeps two Blue variants as distinct SKU and quantity lines", () => {
  const payload = createStoreInquiryPayload({
    items: [
      { ...selectionItems[0], variantId: "variant_blue_s", sku: "FS-TEST-CASUAL-PANTS-BLUE-S", color: "Blue", size: "S", quantity: 444 },
      { ...selectionItems[0], id: "variant_blue_m", variantId: "variant_blue_m", sku: "FS-TEST-CASUAL-PANTS-BLUE-M", color: "Blue", size: "M", quantity: 1111 },
    ],
    pageUrl: "https://storefront.test/dk/products/fs-test-straight-leg-casual-pants",
    contactName: "Preview Customer",
    whatsapp: "+234 801 234 5678",
    country: "Nigeria",
  })

  assert.equal(payload.total_pieces, 1555)
  assert.deepEqual(
    payload.items.map(({ variantId, sku, color, size, quantity }) => ({ variantId, sku, color, size, quantity })),
    [
      { variantId: "variant_blue_s", sku: "FS-TEST-CASUAL-PANTS-BLUE-S", color: "Blue", size: "S", quantity: 444 },
      { variantId: "variant_blue_m", sku: "FS-TEST-CASUAL-PANTS-BLUE-M", color: "Blue", size: "M", quantity: 1111 },
    ]
  )
})

test("opens WhatsApp once only after the inquiry API returns an ID", async () => {
  const openedUrls = []
  let request
  const inquiry = await submitInquiryAndOpenWhatsApp({
    backendUrl: "https://backend.test",
    payload: createPayload(),
    publishableApiKey: "pk_test_inquiry",
    whatsappUrl: "https://wa.me/123?text=test",
    fetcher: async (_url, init) => {
      request = init
      return new Response(JSON.stringify({ inquiry: { id: "inq_test" } }), {
        status: 201,
      })
    },
    openWhatsApp: (url) => openedUrls.push(url),
  })

  assert.equal(inquiry.id, "inq_test")
  assert.deepEqual(openedUrls, ["https://wa.me/123?text=test"])
  assert.equal(request.headers["x-publishable-api-key"], "pk_test_inquiry")
})

test("does not open WhatsApp or mutate the selection after 400 and 500 responses", async () => {
  for (const status of [400, 500]) {
    const openedUrls = []
    const itemsBefore = JSON.stringify(selectionItems)

    await assert.rejects(
      submitInquiryAndOpenWhatsApp({
        backendUrl: "https://backend.test",
        payload: createPayload(),
        whatsappUrl: "https://wa.me/123?text=test",
        fetcher: async () =>
          new Response(JSON.stringify({ message: `Request failed with ${status}` }), {
            status,
          }),
        openWhatsApp: (url) => openedUrls.push(url),
      }),
      new RegExp(`Request failed with ${status}`)
    )

    assert.deepEqual(openedUrls, [])
    assert.equal(JSON.stringify(selectionItems), itemsBefore)
  }
})

test("does not open WhatsApp after a network failure", async () => {
  const openedUrls = []

  await assert.rejects(
    submitInquiryAndOpenWhatsApp({
      backendUrl: "https://backend.test",
      payload: createPayload(),
      whatsappUrl: "https://wa.me/123?text=test",
      fetcher: async () => {
        throw new Error("Network unavailable")
      },
      openWhatsApp: (url) => openedUrls.push(url),
    }),
    /Check your connection and try again/
  )

  assert.deepEqual(openedUrls, [])
})

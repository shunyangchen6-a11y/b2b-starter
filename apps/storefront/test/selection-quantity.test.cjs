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

const {
  applySelectionClearAction,
  decreaseSelectionQuantity,
  createStoreInquiryPayload,
  increaseSelectionQuantity,
  isValidSelectionQuantity,
  isSelectionWithinAvailability,
  maximumSelectableQuantity,
  mergeSelectionItem,
  normalizeQuantity,
  normalizeSelectionQuantity,
  parseStoredSelection,
  meetsWholesaleOrderMinimum,
  selectionTotals,
} = require("../src/lib/selection/quote.ts")

const item = (id, quantity) => ({
  id,
  handle: "classic-jogger-pants",
  title: "Classic Jogger Pants",
  styleNumber: "FSC-JOG-001",
  variantId: id,
  sku: `FSC-JOG-001-${id.toUpperCase()}`,
  color: "Black",
  size: id.split("-").at(-1),
  quantity,
  packSize: 5,
})

test("starts each selected size at five pieces and only accepts five-piece increments", () => {
  assert.equal(normalizeSelectionQuantity("5"), 5)
  assert.equal(normalizeSelectionQuantity("1"), 0)
  assert.equal(normalizeSelectionQuantity("4"), 0)
  assert.equal(normalizeSelectionQuantity("6"), 5)
  assert.equal(isValidSelectionQuantity(5), true)
  assert.equal(isValidSelectionQuantity(6), false)
  assert.equal(isValidSelectionQuantity(0), true)
})

test("adds string quantities as safe five-piece Selection List totals", () => {
  const totals = selectionTotals([
    item("sku-black-s", "5"),
    item("sku-black-m", "10"),
    item("sku-black-l", "30"),
  ])

  assert.equal(totals.styles, 1)
  assert.equal(totals.pieces, 45)
})

test("merges a repeated SKU numerically without creating duplicate entries", () => {
  const merged = mergeSelectionItem([item("sku-black-s", "5")], item("sku-black-s", "5"))

  assert.equal(merged.length, 1)
  assert.equal(merged[0].quantity, 10)
  assert.equal(selectionTotals(merged).pieces, 10)
})

test("sanitizes non-five-piece quantities and stale localStorage entries", () => {
  for (const value of [0, -1, Number.NaN, "", "NaN", "2.5", Infinity]) {
    assert.equal(normalizeQuantity(value), 0)
  }

  const restored = parseStoredSelection(
    JSON.stringify([
      item("sku-black-s", "2"),
      item("sku-black-m", "5"),
      item("sku-black-l", "31"),
      item("invalid-zero", 0),
      item("invalid-negative", "-1"),
      item("invalid-empty", ""),
      { quantity: "99" },
    ])
  )

  assert.deepEqual(
    restored.map((selectionItem) => selectionItem.id),
    ["sku-black-m", "sku-black-l"]
  )
  assert.equal(restored[1].quantity, 30)
  assert.equal(selectionTotals(restored).pieces, 35)
  assert.deepEqual(parseStoredSelection("not-json"), [])
})

test("never turns a stale product style number into a variant SKU", () => {
  const restored = parseStoredSelection(JSON.stringify([{
    id: "variant_stale",
    handle: "classic-jogger-pants",
    title: "Classic Jogger Pants",
    styleNumber: "FSC-JOG-001",
    quantity: 5,
    packSize: 5,
  }]))

  assert.equal(restored[0].variantId, "variant_stale")
  assert.equal(restored[0].sku, "")
})

test("keeps normalized totals after a localStorage refresh", () => {
  const initial = parseStoredSelection(
    JSON.stringify([
      item("sku-black-s", "5"),
      item("sku-black-m", "10"),
      item("sku-black-l", "30"),
    ])
  )
  const refreshed = parseStoredSelection(JSON.stringify(initial))

  assert.equal(selectionTotals(refreshed).pieces, 45)
})

test("keeps the full real inventory available when it has a non-five-piece remainder", () => {
  assert.equal(maximumSelectableQuantity(24), 24)
  assert.equal(normalizeSelectionQuantity(24, 24), 24)
  assert.equal(normalizeSelectionQuantity(25, 24), 24)
  assert.equal(isValidSelectionQuantity(24, 24), true)
  assert.equal(isValidSelectionQuantity(21, 24), false)
  assert.equal(isValidSelectionQuantity(22, 24), false)
  assert.equal(isValidSelectionQuantity(23, 24), false)
  assert.equal(isValidSelectionQuantity(25, 24), false)
})

test("uses the final real inventory as the last increment without permitting oversell", () => {
  const stockTwentyFourSteps = [0]
  while (stockTwentyFourSteps.at(-1) < 24) {
    stockTwentyFourSteps.push(increaseSelectionQuantity(stockTwentyFourSteps.at(-1), 24))
  }

  assert.deepEqual(stockTwentyFourSteps, [0, 5, 10, 15, 20, 24])
  assert.equal(increaseSelectionQuantity(20, 24), 24)
  assert.equal(decreaseSelectionQuantity(24, 24), 20)
  assert.equal(increaseSelectionQuantity(24, 24), 24)

  assert.equal(increaseSelectionQuantity(25, 26), 26)
  assert.equal(decreaseSelectionQuantity(26, 26), 25)
  assert.equal(increaseSelectionQuantity(26, 26), 26)

  assert.equal(increaseSelectionQuantity(15, 20), 20)
  assert.equal(decreaseSelectionQuantity(20, 20), 15)
  assert.equal(increaseSelectionQuantity(20, 20), 20)
})

test("restores a valid final-stock quantity from localStorage without accepting invalid tail values", () => {
  const restored = parseStoredSelection(JSON.stringify([
    { ...item("sku-black-s", 24), availableQuantity: 24 },
    { ...item("sku-black-m", 21), availableQuantity: 24 },
  ]))

  assert.deepEqual(restored.map((selectionItem) => selectionItem.quantity), [24, 20])

  const payload = createStoreInquiryPayload({
    items: [restored[0]],
    pageUrl: "https://example.com/dk/products/classic-jogger-pants",
    contactName: "Preview buyer",
    whatsapp: "0000000000",
    country: "Kenya",
  })

  assert.equal(payload.items[0].quantity, 24)
})

test("keeps front-end inquiry validation aligned with final-stock quantity rules", () => {
  assert.equal(isSelectionWithinAvailability([{ ...item("sku-black-s", 24), availableQuantity: 24 }]), true)
  assert.equal(isSelectionWithinAvailability([{ ...item("sku-black-s", 21), availableQuantity: 24 }]), false)
  assert.equal(isSelectionWithinAvailability([{ ...item("sku-black-s", 25), availableQuantity: 24 }]), false)
})

test("requires 100 mixed pieces across the whole Selection List", () => {
  const ninetyFive = [item("sku-black-s", 95)]
  const mixedHundred = [
    item("sku-black-s", 50),
    { ...item("sku-blue-m", 50), handle: "cargo-pants" },
  ]

  assert.equal(meetsWholesaleOrderMinimum(ninetyFive), false)
  assert.equal(meetsWholesaleOrderMinimum(mixedHundred), true)
  assert.deepEqual(selectionTotals(mixedHundred), { styles: 2, pieces: 100, packs: 20 })
})

test("cancelling the clear confirmation keeps all selected products", () => {
  const current = [item("sku-black-s", 5), item("sku-black-m", 5)]
  const cancelled = applySelectionClearAction(current, "cancel")

  assert.equal(selectionTotals(cancelled).pieces, 10)
})

test("overlay, close button, and Escape dismissal keep the selection", () => {
  const current = [item("sku-black-s", 5), item("sku-black-m", 5)]
  const dismissed = applySelectionClearAction(current, "dismiss")

  assert.equal(selectionTotals(dismissed).pieces, 10)
})

test("only explicit confirmation clears the selection and resets the counter", () => {
  const cleared = applySelectionClearAction(
    [item("sku-black-s", 5), item("sku-black-m", 5)],
    "confirm"
  )

  assert.deepEqual(cleared, [])
  assert.equal(selectionTotals(cleared).pieces, 0)
})

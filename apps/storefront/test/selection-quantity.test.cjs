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
  isValidSelectionQuantity,
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

test("floors a 141-piece inventory limit to 140 selectable pieces", () => {
  assert.equal(maximumSelectableQuantity(141), 140)
  assert.equal(normalizeSelectionQuantity(141, 141), 140)
  assert.equal(normalizeSelectionQuantity(145, 141), 140)
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

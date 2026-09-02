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
  mergeSelectionItem,
  normalizeQuantity,
  parseStoredSelection,
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

test("adds string quantities as numbers for the Selection List piece total", () => {
  const totals = selectionTotals([
    item("sku-black-s", "2"),
    item("sku-black-m", "3"),
    item("sku-black-l", "31"),
  ])

  assert.equal(totals.styles, 1)
  assert.equal(totals.pieces, 36)
})

test("merges a repeated SKU numerically without creating duplicate entries", () => {
  const merged = mergeSelectionItem([item("sku-black-s", "2")], item("sku-black-s", "3"))

  assert.equal(merged.length, 1)
  assert.equal(merged[0].quantity, 5)
  assert.equal(selectionTotals(merged).pieces, 5)
})

test("sanitizes invalid quantities and stale localStorage entries", () => {
  for (const value of [0, -1, Number.NaN, "", "NaN", "2.5", Infinity]) {
    assert.equal(normalizeQuantity(value), 0)
  }

  const restored = parseStoredSelection(
    JSON.stringify([
      item("sku-black-s", "2"),
      item("sku-black-m", "3"),
      item("sku-black-l", "31"),
      item("invalid-zero", 0),
      item("invalid-negative", "-1"),
      item("invalid-empty", ""),
      { quantity: "99" },
    ])
  )

  assert.deepEqual(
    restored.map((selectionItem) => selectionItem.id),
    ["sku-black-s", "sku-black-m", "sku-black-l"]
  )
  assert.equal(selectionTotals(restored).pieces, 36)
  assert.deepEqual(parseStoredSelection("not-json"), [])
})

test("never turns a stale product style number into a variant SKU", () => {
  const restored = parseStoredSelection(JSON.stringify([{
    id: "variant_stale",
    handle: "classic-jogger-pants",
    title: "Classic Jogger Pants",
    styleNumber: "FSC-JOG-001",
    quantity: 2,
    packSize: 5,
  }]))

  assert.equal(restored[0].variantId, "variant_stale")
  assert.equal(restored[0].sku, "")
})

test("keeps normalized totals after a localStorage refresh", () => {
  const initial = parseStoredSelection(
    JSON.stringify([
      item("sku-black-s", "2"),
      item("sku-black-m", "3"),
      item("sku-black-l", "31"),
    ])
  )
  const refreshed = parseStoredSelection(JSON.stringify(initial))

  assert.equal(selectionTotals(refreshed).pieces, 36)
})

test("cancelling the clear confirmation keeps all selected products", () => {
  const current = [item("sku-black-s", 2), item("sku-black-m", 3)]
  const cancelled = applySelectionClearAction(current, "cancel")

  assert.equal(selectionTotals(cancelled).pieces, 5)
})

test("overlay, close button, and Escape dismissal keep the selection", () => {
  const current = [item("sku-black-s", 2), item("sku-black-m", 3)]
  const dismissed = applySelectionClearAction(current, "dismiss")

  assert.equal(selectionTotals(dismissed).pieces, 5)
})

test("only explicit confirmation clears the selection and resets the counter", () => {
  const cleared = applySelectionClearAction(
    [item("sku-black-s", 2), item("sku-black-m", 3)],
    "confirm"
  )

  assert.deepEqual(cleared, [])
  assert.equal(selectionTotals(cleared).pieces, 0)
})

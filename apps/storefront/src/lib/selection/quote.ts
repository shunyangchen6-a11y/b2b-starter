export type SelectionItem = {
  id: string
  handle: string
  title: string
  styleNumber: string
  color: string
  size: string
  quantity: number
  packSize: 5 | 10
  image?: string
}

export const selectionTotals = (items: SelectionItem[]) => ({
  styles: new Set(items.map((item) => item.handle)).size,
  pieces: items.reduce((total, item) => total + item.quantity, 0),
  packs: items.reduce((total, item) => total + Math.ceil(item.quantity / item.packSize), 0),
})

export const createWhatsAppMessage = ({
  items,
  pageUrl,
}: {
  items: SelectionItem[]
  pageUrl: string
}) => {
  const totals = selectionTotals(items)
  const lines = items.map(
    (item) =>
      `• ${item.title} | Style: ${item.styleNumber} | Color: ${item.color} | Size: ${item.size} | Qty: ${item.quantity} pcs | Pack: ${item.packSize} pcs`
  )

  return [
    "Hello FOUR SEASONS CLOTHING, I would like a wholesale quotation.",
    "",
    "Selection List:",
    ...lines,
    "",
    `Total styles: ${totals.styles}`,
    `Total pieces: ${totals.pieces}`,
    `Packing: mixed ${totals.packs} pack(s)`,
    `Page: ${pageUrl}`,
    "",
    "Please confirm wholesale price, ready stock, shipping cost and delivery time.",
  ].join("\n")
}

export const createWhatsAppLink = (phone: string, message: string) => {
  const normalizedPhone = phone.replace(/[^0-9]/g, "")
  if (!normalizedPhone) return null
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}

import {
  createWhatsAppLink,
  createWhatsAppMessage,
  selectionTotals,
} from "../../../storefront/src/lib/selection/quote"

const items = [
  { id: "one", handle: "jogger-01", title: "Jogger Pants", styleNumber: "FS-JG-01", color: "Black", size: "L", quantity: 10, packSize: 5 as const },
  { id: "two", handle: "cargo-01", title: "Cargo Pants", styleNumber: "FS-CG-01", color: "Khaki", size: "XL", quantity: 7, packSize: 10 as const },
]

describe("wholesale selection inquiry", () => {
  it("calculates mixed style and piece totals", () => {
    expect(selectionTotals(items)).toEqual({ styles: 2, pieces: 17, packs: 3 })
  })

  it("creates a clear WhatsApp inquiry message", () => {
    const message = createWhatsAppMessage({ items, pageUrl: "https://example.test/gb/products/jogger-01" })
    expect(message).toContain("Style: FS-JG-01")
    expect(message).toContain("Total styles: 2")
    expect(message).toContain("Total pieces: 17")
    expect(message).toContain("https://example.test/gb/products/jogger-01")
  })

  it("normalizes a WhatsApp number and URL-encodes the message", () => {
    expect(createWhatsAppLink("+234 (801) 234-5678", "Hello & welcome")).toBe("https://wa.me/2348012345678?text=Hello%20%26%20welcome")
    expect(createWhatsAppLink("", "Hello")).toBeNull()
  })
})

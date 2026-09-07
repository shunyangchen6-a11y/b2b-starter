import {
  createStoreInquiryPayload,
  createWhatsAppLink,
  createWhatsAppMessage,
  selectionTotals,
} from "../../../storefront/src/lib/selection/quote"
import { CreateInquiry } from "../api/store/inquiries/validators"

const items = [
  { id: "one", handle: "jogger-01", title: "Jogger Pants", styleNumber: "FS-JG-01", variantId: "one", sku: "FS-JG-01-BLK-L", color: "Black", size: "L", quantity: 50, packSize: 5 as const },
  { id: "two", handle: "cargo-01", title: "Cargo Pants", styleNumber: "FS-CG-01", variantId: "two", sku: "FS-CG-01-KHK-XL", color: "Khaki", size: "XL", quantity: 50, packSize: 5 as const },
]

describe("wholesale selection inquiry", () => {
  it("calculates mixed style and piece totals", () => {
    expect(selectionTotals(items)).toEqual({ styles: 2, pieces: 100, packs: 20 })
  })

  it("creates a clear WhatsApp inquiry message", () => {
    const message = createWhatsAppMessage({ items, pageUrl: "https://example.test/gb/products/jogger-01" })
    expect(message).toContain("Style: FS-JG-01")
    expect(message).toContain("Total styles: 2")
    expect(message).toContain("Total pieces: 100")
    expect(message).toContain("https://example.test/gb/products/jogger-01")
  })

  it("normalizes a WhatsApp number and URL-encodes the message", () => {
    expect(createWhatsAppLink("+234 (801) 234-5678", "Hello & welcome")).toBe("https://wa.me/2348012345678?text=Hello%20%26%20welcome")
    expect(createWhatsAppLink("", "Hello")).toBeNull()
  })

  it("accepts the FS-TEST Storefront payload with the strict inquiry schema", () => {
    const payload = createStoreInquiryPayload({
      items: [
        {
          id: "variant_fs_test_black_s",
          handle: "fs-test-classic-jogger-pants",
          title: "Classic Jogger Pants",
          styleNumber: "FS-TEST-JOGGER-PANTS",
          variantId: "variant_fs_test_black_s",
          sku: "FS-TEST-JOGGER-PANTS-BLK-S",
          color: "Black",
          size: "S",
          quantity: 100,
          packSize: 5,
          image: "/images/wholesale-placeholder.svg",
        },
      ],
      pageUrl: "https://storefront.test/dk/products/fs-test-classic-jogger-pants",
      contactName: "Preview Customer",
      whatsapp: "+234 801 234 5678",
      country: "Nigeria",
      message: "Please quote mixed sizes.",
    })

    expect(CreateInquiry.safeParse(payload).success).toBe(true)
    expect(payload.items[0]).not.toHaveProperty("id")
    expect(payload.items[0]).not.toHaveProperty("handle")
    expect(payload.items[0]).not.toHaveProperty("image")
    expect(payload.contact_name).toBe("Preview Customer")
    expect(payload.items[0]).toMatchObject({
      variantId: "variant_fs_test_black_s",
      sku: "FS-TEST-JOGGER-PANTS-BLK-S",
    })
  })

  it("requires customer details and a real variant SKU", () => {
    const incompletePayload = {
      page_url: "https://storefront.test/dk/products/fs-test-classic-jogger-pants",
      total_styles: 1,
      total_pieces: 100,
      items: [{
        title: "Classic Jogger Pants",
        styleNumber: "FS-TEST-JOGGER-PANTS",
        variantId: "variant_fs_test_black_s",
        color: "Black",
        size: "S",
        quantity: 100,
        packSize: 5,
      }],
    }

    expect(CreateInquiry.safeParse(incompletePayload).success).toBe(false)
  })

  it("rejects requests that bypass the 100-piece and five-piece quantity rules", () => {
    const base = {
      page_url: "https://storefront.test/dk/products/fs-test-classic-jogger-pants",
      total_styles: 1,
      contact_name: "Preview Customer",
      whatsapp: "+234 801 234 5678",
      country: "Nigeria",
      items: [{
        title: "Classic Jogger Pants",
        styleNumber: "FS-TEST-JOGGER-PANTS",
        variantId: "variant_fs_test_black_s",
        sku: "FS-TEST-JOGGER-PANTS-BLK-S",
        color: "Black",
        size: "S",
        packSize: 5,
      }],
    }

    expect(CreateInquiry.safeParse({ ...base, total_pieces: 95, items: [{ ...base.items[0], quantity: 95 }] }).success).toBe(false)
    expect(CreateInquiry.safeParse({ ...base, total_pieces: 100, items: [{ ...base.items[0], quantity: 97 }] }).success).toBe(false)
    expect(CreateInquiry.safeParse({ ...base, total_pieces: 100, items: [{ ...base.items[0], quantity: 100 }] }).success).toBe(true)
  })
})

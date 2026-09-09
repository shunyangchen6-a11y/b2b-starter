const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")

const source = (...segments) => fs.readFileSync(
  path.join(__dirname, "..", "src", ...segments),
  "utf8"
)

test("global wholesale visual tokens keep the storefront monochrome and spacious", () => {
  const styles = source("styles", "globals.css")

  assert.match(styles, /--fs-ink: #111111/)
  assert.match(styles, /--fs-surface: #f4f4f2/)
  assert.match(styles, /w-full min-w-0 max-w-full px-4 small:px-6 large:max-w-\[1440px\] large:px-8/)
  assert.match(styles, /\.wholesale-button/)
  assert.match(styles, /\.wholesale-input/)
  assert.match(styles, /\.wholesale-status--in-stock/)
})

test("the storefront navigation exposes wholesale categories and no retail entry points", () => {
  const navigation = source("modules", "layout", "templates", "nav", "index.tsx")
  const inquiryDrawer = source("modules", "selection", "components", "selection-drawer", "index.tsx")

  for (const label of [
    "New Arrivals",
    "Cargo Pants",
    "Casual Pants",
    "Joggers",
    "Jeans",
    "All Products",
  ]) {
    assert.match(navigation, new RegExp(label))
  }

  assert.match(inquiryDrawer, /Inquiry List/)
  assert.doesNotMatch(navigation, /Checkout|Shopping Cart|Payment|Approval|Account/)
  assert.match(navigation, /四季服饰/)
  assert.match(navigation, /FOUR SEASONS CLOTHING/)
  assert.match(navigation, /grid-cols-\[44px_minmax\(0,1fr\)_auto\]/)
  assert.match(navigation, /medium:flex medium:h-\[76px\] medium:justify-between/)
  assert.doesNotMatch(navigation, /absolute left-1\/2 top-1\/2/)
  assert.match(navigation, /medium:hidden/)
})

test("product cards use a fixed contained 4:5 image frame and real wholesale price copy", () => {
  const preview = source("modules", "products", "components", "product-preview", "index.tsx")
  const thumbnail = source("modules", "products", "components", "thumbnail", "index.tsx")

  assert.match(preview, /aspect-\[4\/5\].*bg-neutral-100/)
  assert.match(preview, /formatWholesaleProductPrice/)
  assert.match(preview, /data-testid="wholesale-product-price"/)
  assert.match(thumbnail, /object-contain object-center/)
  assert.doesNotMatch(thumbnail, /object-cover/)
})

test("homepage hero uses separate efficient desktop and mobile campaign images", () => {
  const hero = source("modules", "home", "components", "hero", "index.tsx")
  const publicDirectory = path.join(__dirname, "..", "public", "images")

  assert.match(hero, /from "next\/image"/)
  assert.match(hero, /hero-menswear-desktop\.webp/)
  assert.match(hero, /hero-menswear-mobile\.webp/)
  assert.match(hero, /media="\(max-width: 639px\)"/)
  assert.match(hero, /loading="eager"/)
  assert.ok(fs.existsSync(path.join(publicDirectory, "hero-menswear-desktop.webp")))
  assert.ok(fs.existsSync(path.join(publicDirectory, "hero-menswear-mobile.webp")))
})

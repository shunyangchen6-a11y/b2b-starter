const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")

const source = (...segments) => fs.readFileSync(
  path.join(__dirname, "..", "src", ...segments),
  "utf8"
)

test("product cards use a full-width 4:5 cover image without inset padding", () => {
  const preview = source("modules", "products", "components", "product-preview", "index.tsx")

  assert.match(preview, /w-full aspect-\[4\/5\] overflow-hidden/)
  assert.match(preview, /size="full"/)
  assert.match(preview, /fit="cover"/)
  assert.doesNotMatch(preview, /p-10/)
})

test("product detail gallery and thumbnails crop images with object-cover", () => {
  const gallery = source("modules", "products", "components", "image-gallery", "index.tsx")

  assert.match(gallery, /aspect-\[4\/5\] w-full overflow-hidden rounded-rounded/)
  assert.match(gallery, /className="absolute inset-0 object-cover"/)
  assert.match(gallery, /w-12 aspect-\[4\/5\] shrink-0 overflow-hidden rounded-rounded/)
  assert.doesNotMatch(gallery, /p-20|p-48|object-contain/)
})

test("thumbnail cover mode removes contain padding", () => {
  const thumbnail = source("modules", "products", "components", "thumbnail", "index.tsx")

  assert.match(thumbnail, /fit\?: "contain" \| "cover"/)
  assert.match(thumbnail, /"object-cover": fit === "cover"/)
  assert.match(thumbnail, /fit !== "cover" && type === "preview"/)
})

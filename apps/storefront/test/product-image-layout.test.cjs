const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")

const source = (...segments) => fs.readFileSync(
  path.join(__dirname, "..", "src", ...segments),
  "utf8"
)

test("product cards preserve each uploaded image's natural aspect ratio", () => {
  const preview = source("modules", "products", "components", "product-preview", "index.tsx")

  assert.match(preview, /<div className="w-full">/)
  assert.match(preview, /size="full"/)
  assert.match(preview, /natural/)
  assert.doesNotMatch(preview, /aspect-\[4\/5\]|fit="cover"|p-10/)
})

test("product detail images preserve their original framing without crop rules", () => {
  const gallery = source("modules", "products", "components", "image-gallery", "index.tsx")

  assert.match(gallery, /<div className="w-full" id=\{selectedImage\.id\}>/)
  assert.match(gallery, /className="block h-auto w-full object-contain"/)
  assert.match(gallery, /className="flex w-16 shrink-0 rounded-rounded"/)
  assert.match(gallery, /block h-auto w-full object-contain hover:opacity-100/)
  assert.doesNotMatch(gallery, /aspect-\[4\/5\]|object-cover|object-\[|absolute inset-0|p-20|p-48|translate|scale-/)
})

test("natural thumbnails use a full-width auto-height contained image", () => {
  const thumbnail = source("modules", "products", "components", "thumbnail", "index.tsx")

  assert.match(thumbnail, /natural\?: boolean/)
  assert.match(thumbnail, /className="block h-auto w-full object-contain"/)
  assert.doesNotMatch(thumbnail, /object-cover|object-\[50%_35%\]/)
})

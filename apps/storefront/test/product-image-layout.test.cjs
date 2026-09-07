const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")

const source = (...segments) => fs.readFileSync(
  path.join(__dirname, "..", "src", ...segments),
  "utf8"
)

test("9:16, 2:3, 4:5, and 1:1 product images share a fixed card image height", () => {
  const preview = source("modules", "products", "components", "product-preview", "index.tsx")

  assert.match(preview, /<div className="relative aspect-\[4\/5\] w-full overflow-hidden">/)
  assert.match(preview, /size="full"/)
  assert.match(preview, /framed/)
  assert.match(preview, /className="flex min-w-0 flex-col gap-4 p-4 txt-compact-medium"/)
  assert.match(preview, /min-h-10 line-clamp-2 break-words text-ui-fg-base/)
  assert.doesNotMatch(preview, /h-auto|fit="cover"|p-10/)
})

test("product detail foreground contains the original image while the background fills its frame", () => {
  const gallery = source("modules", "products", "components", "image-gallery", "index.tsx")

  assert.match(gallery, /relative aspect-\[4\/5\] w-full overflow-hidden rounded-rounded/)
  assert.match(gallery, /scale-110 object-cover blur-md opacity-40/)
  assert.match(gallery, /object-contain object-center/)
  assert.match(gallery, /w-12 aspect-\[4\/5\] shrink-0 overflow-hidden rounded-rounded/)
  assert.doesNotMatch(gallery, /object-\[|p-20|p-48|translate/)
})

test("framed card images use a cover background and a contained foreground", () => {
  const thumbnail = source("modules", "products", "components", "thumbnail", "index.tsx")

  assert.match(thumbnail, /framed\?: boolean/)
  assert.match(thumbnail, /scale-110 object-cover blur-md opacity-40/)
  assert.match(thumbnail, /object-contain object-center/)
  assert.doesNotMatch(thumbnail, /object-\[50%_35%\]|h-auto/)
})

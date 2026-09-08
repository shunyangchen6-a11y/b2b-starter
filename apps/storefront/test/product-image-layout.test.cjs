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

  assert.match(preview, /data-testid="product-image-frame" className="relative aspect-\[4\/5\] w-full overflow-hidden bg-neutral-100"/)
  assert.match(preview, /size="full"/)
  assert.match(preview, /framed/)
  assert.match(preview, /className="flex min-w-0 flex-1 flex-col gap-2 border-t border-zinc-100 pt-3 txt-compact-medium"/)
  assert.match(preview, /min-h-10 line-clamp-2 break-words text-sm font-medium leading-5 text-zinc-950/)
  assert.doesNotMatch(preview, /h-auto|fit="cover"|p-10/)
})

test("product detail images center the complete original inside a light-gray 4:5 frame", () => {
  const gallery = source("modules", "products", "components", "image-gallery", "index.tsx")

  assert.match(gallery, /relative aspect-\[4\/5\] w-full overflow-hidden rounded-rounded/)
  assert.match(gallery, /<div aria-hidden className="absolute inset-0 bg-neutral-100"\s*\/>/)
  assert.match(gallery, /object-contain object-center/)
  assert.match(gallery, /w-12 aspect-\[4\/5\] shrink-0 overflow-hidden rounded-rounded/)
  assert.doesNotMatch(gallery, /object-cover|blur-|scale-|object-\[|p-20|p-48|translate/)
})

test("framed card images use a light-gray background and a contained foreground", () => {
  const thumbnail = source("modules", "products", "components", "thumbnail", "index.tsx")

  assert.match(thumbnail, /framed\?: boolean/)
  assert.match(thumbnail, /<div aria-hidden className="absolute inset-0 bg-neutral-100"\s*\/>/)
  assert.match(thumbnail, /object-contain object-center/)
  assert.doesNotMatch(thumbnail, /object-cover|blur-|scale-|object-\[50%_35%\]|h-auto/)
})

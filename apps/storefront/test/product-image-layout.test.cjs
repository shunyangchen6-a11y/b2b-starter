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

test("product detail gallery uses a vertical desktop rail and complete 4:5 main image", () => {
  const gallery = source("modules", "products", "components", "image-gallery", "index.tsx")

  assert.match(gallery, /large:grid-cols-\[72px_minmax\(0,1fr\)\]/)
  assert.match(gallery, /large:sticky large:top-\[116px\]/)
  assert.match(gallery, /overflow-x-auto[^\n]*large:flex-col/)
  assert.match(gallery, /aspect-\[4\/5\] w-14[^\n]*large:w-\[72px\]/)
  assert.match(gallery, /border border-zinc-950/)
  assert.match(gallery, /group relative order-1 aspect-\[4\/5\] w-full/)
  assert.doesNotMatch(gallery, /72vh|md:aspect-auto/)
  assert.match(gallery, /object-contain object-center/)
  assert.doesNotMatch(gallery, /object-cover|blur-|scale-|object-\[|p-20|p-48|translate/)
})

test("thumbnail selection and image zoom are keyboard-accessible", () => {
  const gallery = source("modules", "products", "components", "image-gallery", "index.tsx")

  assert.match(gallery, /onClick=\{\(\) => handleImageClick\(image\)\}/)
  assert.match(gallery, /aria-current=\{index === selectedImageIndex/)
  assert.match(gallery, /onClick=\{\(\) => setZoomOpen\(true\)\}/)
  assert.match(gallery, /role="dialog"/)
  assert.match(gallery, /aria-modal="true"/)
  assert.match(gallery, /e\.key === "Escape" && zoomOpen/)
  assert.match(gallery, /aria-label="Close enlarged image"/)
  assert.match(gallery, /event\.target === event\.currentTarget/)
})

test("framed card images use a light-gray background and a contained foreground", () => {
  const thumbnail = source("modules", "products", "components", "thumbnail", "index.tsx")

  assert.match(thumbnail, /framed\?: boolean/)
  assert.match(thumbnail, /<div aria-hidden className="absolute inset-0 bg-neutral-100"\s*\/>/)
  assert.match(thumbnail, /object-contain object-center/)
  assert.doesNotMatch(thumbnail, /object-cover|blur-|scale-|object-\[50%_35%\]|h-auto/)
})

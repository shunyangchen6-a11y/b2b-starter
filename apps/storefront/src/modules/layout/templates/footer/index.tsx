import { listCategories } from "@/lib/data/categories"
import { selectWholesaleFooterCategories } from "@/lib/util/footer-categories"
import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export default async function Footer() {
  const categories = await listCategories().catch(() => [])
  const wholesaleCategories = selectWholesaleFooterCategories(categories)

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-950 text-white">
      <div className="content-container flex w-full flex-col">
        <div className="grid gap-10 py-12 small:grid-cols-[1.25fr_1fr] small:py-16 medium:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-md">
            <LocalizedClientLink
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.13em] text-white"
            >
              FOUR SEASONS CLOTHING
            </LocalizedClientLink>
            <Text className="mt-4 text-sm leading-6 text-zinc-300">
              Ready-stock menswear wholesale for global buyers.
            </Text>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D9D2C6]">
              Wholesale · Ready Stock · Mixed Styles
            </p>
          </div>
          <div className="w-full">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white">Shop by category</span>
            <ul
              className="mt-4 grid grid-cols-1 gap-3 text-sm text-zinc-300 xsmall:grid-cols-2"
              data-testid="footer-categories"
            >
              {wholesaleCategories.map(({ category, handle, label }) => (
                <li key={category.id} className="min-w-0">
                  <LocalizedClientLink
                    className="block break-words transition-colors hover:text-white"
                    href={`/categories/${handle}`}
                    data-testid="category-link"
                  >
                    {label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white">How it works</span>
            <ol className="mt-4 space-y-3 text-sm leading-5 text-zinc-300">
              <li>1. Browse ready-stock styles</li>
              <li>2. Add sizes and quantities to your Inquiry List</li>
              <li>3. Send one inquiry on WhatsApp</li>
            </ol>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 border-t border-zinc-800 py-5 text-zinc-400 xsmall:flex-row xsmall:items-center xsmall:justify-between">
          <Text className="text-xs">
            © 2026 Four Seasons Clothing. All rights reserved.
          </Text>
          <Text className="text-xs">Contact for price, availability and shipping.</Text>
        </div>
      </div>
    </footer>
  )
}

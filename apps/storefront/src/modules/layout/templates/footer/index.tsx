import { listCategories } from "@/lib/data/categories"
import { selectWholesaleFooterCategories } from "@/lib/util/footer-categories"
import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export default async function Footer() {
  const categories = await listCategories().catch(() => [])
  const wholesaleCategories = selectWholesaleFooterCategories(categories)

  return (
    <footer className="w-full border-t border-ui-border-base">
      <div className="content-container flex w-full flex-col">
        <div className="flex flex-col items-start justify-between gap-8 py-12 md:flex-row md:py-16">
          <div className="max-w-sm">
            <LocalizedClientLink
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.12em] text-ui-fg-base hover:text-amber-700"
            >
              FOUR SEASONS CLOTHING
            </LocalizedClientLink>
            <Text className="mt-3 text-sm leading-6 text-ui-fg-subtle">
              Ready-stock menswear wholesale for global buyers.
            </Text>
          </div>
          <div className="w-full max-w-sm">
            <span className="text-sm font-semibold text-ui-fg-base">Categories</span>
            <ul
              className="mt-3 grid grid-cols-1 gap-2 text-sm text-ui-fg-subtle xsmall:grid-cols-2"
              data-testid="footer-categories"
            >
              {wholesaleCategories.map(({ category, handle, label }) => (
                <li key={category.id} className="min-w-0">
                  <LocalizedClientLink
                    className="block break-words hover:text-ui-fg-base"
                    href={`/categories/${handle}`}
                    data-testid="category-link"
                  >
                    {label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mb-8 flex w-full border-t border-ui-border-base py-5 text-ui-fg-muted">
          <Text className="text-xs">
            © 2026 Four Seasons Clothing. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  )
}

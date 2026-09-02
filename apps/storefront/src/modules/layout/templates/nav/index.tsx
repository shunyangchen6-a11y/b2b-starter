import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { MegaMenuWrapper } from "@/modules/layout/components/mega-menu"
import SkeletonMegaMenu from "@/modules/skeletons/components/skeleton-mega-menu"
import SelectionDrawer from "@/modules/selection/components/selection-drawer"
import { Suspense } from "react"

export async function NavigationHeader() {
  return (
    <div className="sticky top-0 inset-x-0 group bg-white text-zinc-900 small:p-4 p-3 text-sm border-b duration-200 border-ui-border-base z-50">
      <header className="relative flex w-full min-w-0 content-container justify-between small:mx-auto">
        <div className="flex min-w-0 items-center justify-between small:mx-auto small:min-w-full">
          <div className="flex min-w-0 items-center small:space-x-4">
            <LocalizedClientLink
              className="hover:text-ui-fg-base flex items-center w-fit"
              href="/"
            >
              <h1 className="flex items-center text-xs font-semibold tracking-[0.08em] xsmall:text-sm small:text-base small:tracking-[0.12em]">
                FOUR SEASONS CLOTHING
              </h1>
            </LocalizedClientLink>

            <nav>
              <ul className="space-x-4 hidden small:flex">
                <li>
                  <Suspense fallback={<SkeletonMegaMenu />}>
                    <MegaMenuWrapper />
                  </Suspense>
                </li>
              </ul>
            </nav>
          </div>
          <div className="ml-2 flex shrink-0 items-center justify-end gap-2">
            <SelectionDrawer />
          </div>
        </div>
      </header>
    </div>
  )
}

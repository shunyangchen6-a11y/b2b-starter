import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { MegaMenuWrapper } from "@/modules/layout/components/mega-menu"
import SkeletonMegaMenu from "@/modules/skeletons/components/skeleton-mega-menu"
import SelectionDrawer from "@/modules/selection/components/selection-drawer"
import { Suspense } from "react"

export async function NavigationHeader() {
  return (
    <div className="sticky top-0 inset-x-0 group bg-white text-zinc-900 small:p-4 p-3 text-sm border-b duration-200 border-ui-border-base z-50">
      <header className="flex w-full content-container relative small:mx-auto justify-between">
        <div className="small:mx-auto flex justify-between items-center min-w-full">
          <div className="flex items-center small:space-x-4">
            <LocalizedClientLink
              className="hover:text-ui-fg-base flex items-center w-fit"
              href="/"
            >
              <h1 className="small:text-base text-sm font-semibold tracking-[0.12em] flex items-center">
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
          <div className="flex justify-end items-center gap-2">
            <SelectionDrawer />
          </div>
        </div>
      </header>
    </div>
  )
}

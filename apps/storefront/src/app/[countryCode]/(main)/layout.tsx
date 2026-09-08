import { getBaseURL } from "@/lib/util/env"
import Footer from "@/modules/layout/templates/footer"
import { NavigationHeader } from "@/modules/layout/templates/nav"
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <NavigationHeader />
      <div className="whitespace-nowrap bg-zinc-950 px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-white xsmall:text-[11px] small:px-3 small:py-2 small:text-xs small:tracking-[0.14em]">
        <span className="small:hidden">Ready Stock · Wholesale · Fast Shipping</span>
        <span className="hidden small:inline">Wholesale · Ready Stock · Mixed Styles · Fast Shipping</span>
      </div>

      {props.children}

      <Footer />

    </>
  )
}

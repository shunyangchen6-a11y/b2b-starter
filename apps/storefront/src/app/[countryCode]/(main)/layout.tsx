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
      <div className="bg-zinc-950 px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.14em] text-white">Wholesale · Ready Stock · Mixed Styles · Fast Shipping</div>

      {props.children}

      <Footer />

    </>
  )
}

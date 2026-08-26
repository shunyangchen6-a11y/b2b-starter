import FeaturedProducts from "@/modules/home/components/featured-products"
import Hero from "@/modules/home/components/hero"
import SkeletonFeaturedProducts from "@/modules/skeletons/templates/skeleton-featured-products"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "FOUR SEASONS CLOTHING | Menswear Wholesale",
  description: "Ready-stock men's clothing wholesale. Build a selection list and request a WhatsApp quote.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  return (
    <div className="flex flex-col gap-y-8 m-2">
      <Hero />
      <section className="content-container grid grid-cols-2 gap-2 small:grid-cols-4 text-center"><div className="border border-zinc-200 p-4"><p className="font-semibold">Wholesale</p><p className="text-xs text-zinc-500">Contact for quotation</p></div><div className="border border-zinc-200 p-4"><p className="font-semibold">Ready Stock</p><p className="text-xs text-zinc-500">Live confirmation on WhatsApp</p></div><div className="border border-zinc-200 p-4"><p className="font-semibold">Mixed Styles</p><p className="text-xs text-zinc-500">Build your own selection</p></div><div className="border border-zinc-200 p-4"><p className="font-semibold">Fast Shipping</p><p className="text-xs text-zinc-500">Freight quote on request</p></div></section>
      <section id="latest-arrivals"><Suspense fallback={<SkeletonFeaturedProducts />}><FeaturedProducts countryCode={countryCode} /></Suspense></section>
    </div>
  )
}

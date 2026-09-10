"use client"

import { Heading } from "@medusajs/ui"
import Image from "next/image"
import Button from "@/modules/common/components/button"

const Hero = () => {
  return (
    <section className="relative h-[620px] min-h-[620px] w-full overflow-hidden border-b border-zinc-800 bg-zinc-950 xsmall:h-[660px] xsmall:min-h-[660px] small:h-[64vh] small:min-h-[430px]" aria-label="Menswear wholesale">
      <picture className="absolute inset-0 block">
        <source media="(max-width: 639px)" srcSet="/images/hero-menswear-mobile.webp" type="image/webp" />
        <Image
          alt="Model wearing charcoal cargo pants"
          className="h-full w-full object-cover object-[50%_55%] small:object-[72%_center]"
          fill
          loading="eager"
          sizes="100vw"
          src="/images/hero-menswear-desktop.webp"
        />
      </picture>
      <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
      <div className="content-container relative z-10 flex h-full items-start px-5 pt-7 text-center xsmall:pt-8 small:items-center small:px-6 small:py-0 small:text-left large:px-8">
        <div className="mx-auto w-full max-w-[320px] small:mx-0 small:max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b7a17a] xsmall:text-xs small:tracking-[0.22em]">
            Ready Stock Menswear Wholesale
          </p>

          <Heading
            level="h1"
            className="mt-3 break-words text-[40px] font-medium leading-[0.92] tracking-[-0.04em] text-white xsmall:text-[44px] small:mt-8 small:text-[68px] medium:text-[76px] large:text-[84px]"
          >
            <span className="block">MEN&apos;S PANTS</span>
            <span className="block">WHOLESALE</span>
          </Heading>

          <p className="mx-auto mt-3 max-w-lg text-[15px] font-normal leading-5 text-zinc-100 xsmall:mt-4 xsmall:text-base xsmall:leading-6 small:mx-0 small:mt-8 small:text-lg small:leading-7">
            <span className="block">Mixed styles. Flexible pack sizes.</span>
            <span className="block">Built for African wholesalers.</span>
          </p>
          <a className="mt-4 inline-flex w-[72%] max-w-[250px] small:mt-10 small:w-auto small:max-w-none" href="#latest-arrivals">
            <Button variant="secondary" className="min-h-12 w-full border-white bg-white px-5 text-zinc-950 small:min-w-[230px] small:w-auto small:px-8">
              Explore New Arrivals
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}

export default Hero

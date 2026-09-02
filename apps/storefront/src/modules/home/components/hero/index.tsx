"use client"

import { Heading } from "@medusajs/ui"
import Button from "@/modules/common/components/button"

const Hero = () => {
  return (
    <div className="h-[68vh] min-h-[440px] w-full border-b border-ui-border-base relative overflow-hidden bg-zinc-950">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-amber-500/30" />
      <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full border border-white/10" />
      <div className="absolute inset-0 z-1 flex flex-col items-center justify-center gap-6 px-5 text-center small:p-32">
        <span>
          <p className="text-amber-300 text-xs font-semibold tracking-[0.25em] uppercase">
            Ready Stock Menswear Wholesale
          </p>

          <Heading
            level="h1"
            className="mt-8 mb-5 break-words text-4xl font-normal leading-tight text-ui-fg-base xsmall:text-5xl small:mt-10 small:text-6xl small:leading-10"
          >
            FOUR SEASONS CLOTHING
          </Heading>

          <p className="leading-7 text-white font-normal text-lg max-w-xl">
            Mixed styles. Flexible pack sizes. Fast response for African wholesale buyers.
          </p>
        </span>
        <a href="#latest-arrivals">
          <Button variant="secondary" className="rounded-none border-amber-400 bg-white text-zinc-950">
            View Latest Arrivals
          </Button>
        </a>
      </div>
    </div>
  )
}

export default Hero

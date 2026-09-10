import { getBaseURL } from "@/lib/util/env"
import { Toaster } from "@medusajs/ui"
import { Analytics } from "@vercel/analytics/next"
import { GeistSans } from "geist/font/sans"
import { Metadata } from "next"
import { SelectionProvider } from "@/lib/selection/selection-context"
import MobileInquiryBar from "@/modules/selection/components/mobile-inquiry-bar"
import "@/styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={GeistSans.variable}>
      <body>
        <SelectionProvider>
          <main className="relative pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0">
            {props.children}
          </main>
          <MobileInquiryBar />
        </SelectionProvider>
        <Toaster className="z-[99999]" position="bottom-left" />
        <Analytics />
      </body>
    </html>
  )
}

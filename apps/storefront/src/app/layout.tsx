import { getBaseURL } from "@/lib/util/env"
import { Toaster } from "@medusajs/ui"
import { Analytics } from "@vercel/analytics/next"
import { GeistSans } from "geist/font/sans"
import { Metadata } from "next"
import { SelectionProvider } from "@/lib/selection/selection-context"
import "@/styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={GeistSans.variable}>
      <body>
        <SelectionProvider>
          <main className="relative">{props.children}</main>
        </SelectionProvider>
        <Toaster className="z-[99999]" position="bottom-left" />
        <Analytics />
      </body>
    </html>
  )
}

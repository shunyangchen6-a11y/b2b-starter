"use client"

import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import SelectionDrawer from "@/modules/selection/components/selection-drawer"
import { useEffect, useState } from "react"

const primaryLinks = [
  { label: "New Arrivals", href: "/store?sortBy=created_at" },
  { label: "Cargo Pants", href: "/categories/cargo-pants" },
  { label: "Casual Pants", href: "/categories/casual-pants" },
  { label: "Joggers", href: "/categories/jogger-pants" },
  { label: "Jeans", href: "/categories/jeans" },
  { label: "All Products", href: "/store" },
]

const MenuIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.75" />
  </svg>
)

const SearchIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
    <circle cx="10.75" cy="10.75" r="6.5" stroke="currentColor" strokeWidth="1.75" />
    <path d="m16 16 4.25 4.25" stroke="currentColor" strokeWidth="1.75" />
  </svg>
)

const CloseIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
    <path d="M5 5 19 19M19 5 5 19" stroke="currentColor" strokeWidth="1.75" />
  </svg>
)

export function NavigationHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "")

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white text-zinc-950">
        <div className="content-container relative flex h-16 items-center justify-between medium:h-[76px]">
          <div className="flex items-center medium:hidden">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              className="flex min-h-11 min-w-11 items-center justify-center"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

          <LocalizedClientLink
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-zinc-950 medium:static medium:translate-x-0 medium:translate-y-0"
            href="/"
          >
            <span className="font-sans text-[21px] font-semibold leading-none tracking-[0.08em] xsmall:text-[24px] medium:text-[26px]">
              四季服饰
            </span>
            <span className="mt-1 hidden text-[7px] font-semibold uppercase leading-none tracking-[0.22em] text-zinc-600 xsmall:block medium:text-[8px]">
              FOUR SEASONS CLOTHING
            </span>
          </LocalizedClientLink>

          <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 justify-center px-4 medium:flex large:px-6">
            <ul className="flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700 large:gap-5 large:text-[11px] large:tracking-[0.11em]">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <LocalizedClientLink className="whitespace-nowrap transition-colors hover:text-zinc-950" href={link.href}>
                    {link.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-1 small:gap-3">
            <LocalizedClientLink
              href="/store"
              aria-label="Search products"
              className="hidden min-h-11 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-zinc-700 hover:text-zinc-950 medium:flex"
            >
              <SearchIcon />
              <span>Search</span>
            </LocalizedClientLink>
            {whatsappNumber && (
              <a
                className="hidden min-h-11 items-center text-[11px] font-semibold uppercase tracking-[0.11em] text-zinc-700 hover:text-zinc-950 medium:flex"
                href={`https://wa.me/${whatsappNumber}`}
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
            )}
            <SelectionDrawer />
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col bg-white medium:hidden" role="dialog" aria-label="Navigation menu">
          <nav className="content-container flex min-h-0 flex-1 flex-col overflow-y-auto py-6" aria-label="Mobile navigation">
            <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <LocalizedClientLink
                    className="flex min-h-14 items-center justify-between text-sm font-semibold uppercase tracking-[0.1em] text-zinc-950"
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                    <span aria-hidden="true">↗</span>
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
            {whatsappNumber && (
              <a
                className="wholesale-button mt-6 w-full"
                href={`https://wa.me/${whatsappNumber}`}
                rel="noreferrer"
                target="_blank"
              >
                Contact on WhatsApp
              </a>
            )}
            <p className="mt-auto pt-8 text-xs leading-5 text-zinc-500">
              Ready stock menswear wholesale for global buyers.
            </p>
          </nav>
        </div>
      )}
    </>
  )
}

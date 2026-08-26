"use client"

import {
  getWholesaleFilterLabel,
  getWholesaleFilterOptions,
  wholesaleFilterCount,
} from "@/lib/util/wholesale-filters"
import type { WholesaleFilterKey, WholesaleFilters } from "@/lib/util/wholesale-filters"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const filterLabels: Record<WholesaleFilterKey, string> = {
  category: "Category",
  size: "Size",
  color: "Color",
  fabric: "Fabric",
  stock_status: "Stock Status",
}

const filterKeys = Object.keys(filterLabels) as WholesaleFilterKey[]

const cloneFilters = (filters: WholesaleFilters): WholesaleFilters => ({
  category: [...filters.category],
  size: [...filters.size],
  color: [...filters.color],
  fabric: [...filters.fabric],
  stock_status: [...filters.stock_status],
})

const FilterFields = ({
  filters,
  onToggle,
  options,
}: {
  filters: WholesaleFilters
  onToggle: (key: WholesaleFilterKey, value: string) => void
  options: ReturnType<typeof getWholesaleFilterOptions>
}) => (
  <div className="flex flex-col divide-y divide-neutral-200">
    {filterKeys.map((key) => (
      <fieldset key={key} className="px-4 py-4">
        <legend className="text-sm font-semibold text-neutral-900">{filterLabels[key]}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {options[key].length ? (
            options[key].map((option) => {
              const selected = filters[key].includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onToggle(key, option.value)}
                  className={`min-h-9 rounded-full border px-3 text-xs transition-colors ${
                    selected
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-600"
                  }`}
                  aria-pressed={selected}
                >
                  {option.label}
                </button>
              )
            })
          ) : (
            <p className="text-xs text-neutral-500">No options available</p>
          )}
        </div>
      </fieldset>
    ))}
  </div>
)

export default function WholesaleFilters({
  products,
  selectedFilters,
}: {
  products: HttpTypes.StoreProduct[]
  selectedFilters: WholesaleFilters
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<WholesaleFilters>(selectedFilters)
  const options = useMemo(() => getWholesaleFilterOptions(products), [products])
  const selectedCount = wholesaleFilterCount(selectedFilters)

  useEffect(() => setDraftFilters(selectedFilters), [selectedFilters])
  useEffect(() => {
    if (!drawerOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [drawerOpen])

  const navigate = (filters: WholesaleFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    filterKeys.forEach((key) => {
      params.delete(key)
      if (filters[key].length) params.set(key, filters[key].join(","))
    })
    params.delete("page")
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const toggle = (filters: WholesaleFilters, key: WholesaleFilterKey, value: string) => {
    const next = cloneFilters(filters)
    next[key] = next[key].includes(value)
      ? next[key].filter((item) => item !== value)
      : [...next[key], value]
    return next
  }

  const removeFilter = (key: WholesaleFilterKey, value: string) => {
    const next = cloneFilters(selectedFilters)
    next[key] = next[key].filter((item) => item !== value)
    navigate(next)
  }

  const clearAll = () => navigate({ category: [], size: [], color: [], fabric: [], stock_status: [] })

  return (
    <>
      <div className="small:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex min-h-11 w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900"
        >
          <span>Filter</span>
          <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white">{selectedCount}</span>
        </button>
      </div>

      <div className="hidden small:block rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold text-neutral-900">Filters</p>
          {selectedCount > 0 && (
            <button type="button" onClick={clearAll} className="text-xs font-medium text-amber-700 hover:text-amber-800">
              Clear All
            </button>
          )}
        </div>
        <FilterFields
          filters={selectedFilters}
          options={options}
          onToggle={(key, value) => navigate(toggle(selectedFilters, key, value))}
        />
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2 small:pt-1" aria-label="Selected filters">
          {filterKeys.flatMap((key) =>
            selectedFilters[key].map((value) => (
              <button
                type="button"
                key={`${key}-${value}`}
                onClick={() => removeFilter(key, value)}
                className="max-w-full truncate rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-neutral-800"
                title={`Remove ${filterLabels[key]}: ${getWholesaleFilterLabel(options, key, value)}`}
              >
                {filterLabels[key]}: {getWholesaleFilterLabel(options, key, value)} ×
              </button>
            ))
          )}
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 small:hidden" role="dialog" aria-modal="true" aria-label="Product filters">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close filters" onClick={() => setDrawerOpen(false)} />
          <section className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
              <div>
                <p className="text-base font-semibold text-neutral-900">Filters</p>
                <p className="text-xs text-neutral-500">{wholesaleFilterCount(draftFilters)} selected</p>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} className="min-h-10 px-2 text-sm text-neutral-700">Close</button>
            </div>
            <FilterFields
              filters={draftFilters}
              options={options}
              onToggle={(key, value) => setDraftFilters((current) => toggle(current, key, value))}
            />
            <div className="sticky bottom-0 flex gap-3 border-t border-neutral-200 bg-white p-4">
              <button
                type="button"
                onClick={() => setDraftFilters({ category: [], size: [], color: [], fabric: [], stock_status: [] })}
                className="min-h-11 flex-1 rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-800"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate(draftFilters)
                  setDrawerOpen(false)
                }}
                className="min-h-11 flex-1 rounded-lg bg-neutral-900 px-3 text-sm font-semibold text-white"
              >
                Apply Filters
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

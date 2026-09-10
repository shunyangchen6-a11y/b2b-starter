"use client"

import { HttpTypes } from "@medusajs/types"
import * as Accordion from "@radix-ui/react-accordion"
import Markdown from "react-markdown"
import ProductFacts from "../product-facts"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const optionValues = (product: HttpTypes.StoreProduct, title: string) => {
  const optionId = product.options?.find(
    (option) => option.title?.toLowerCase() === title.toLowerCase()
  )?.id

  return Array.from(new Set(
    product.variants
      ?.flatMap((variant) => variant.options || [])
      .filter((option) => option.option_id === optionId)
      .map((option) => option.value)
      .filter(Boolean) || []
  ))
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const colors = optionValues(product, "Color")
  const sizes = optionValues(product, "Size")

  return (
    <Accordion.Root
      type="multiple"
      defaultValue={["description"]}
      className="w-full border-t border-zinc-300"
      data-testid="product-detail-accordion"
    >
      <DetailSection value="description" title="Description">
        <div className="prose prose-sm max-w-none text-zinc-600 prose-p:leading-6">
          <Markdown>{product.description || product.subtitle || "Product description available on request."}</Markdown>
        </div>
      </DetailSection>

      <DetailSection value="specifications" title="Specifications">
        <ProductFacts product={product} />
      </DetailSection>

      <DetailSection value="size-fit" title="Size & Fit">
        <dl className="grid gap-2 text-sm text-zinc-600">
          {colors.length > 0 && (
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
              <dt className="font-medium text-zinc-950">Colors</dt>
              <dd>{colors.join(", ")}</dd>
            </div>
          )}
          {sizes.length > 0 && (
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
              <dt className="font-medium text-zinc-950">Available sizes</dt>
              <dd>{sizes.join(", ")}</dd>
            </div>
          )}
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
            <dt className="font-medium text-zinc-950">Ordering</dt>
            <dd>Select quantities by color and size above.</dd>
          </div>
        </dl>
      </DetailSection>

      <DetailSection value="shipping-inspection" title="Shipping & Inspection">
        <ul className="grid gap-2 text-sm leading-5 text-zinc-600">
          <li>Ready stock in Guangzhou, China</li>
          <li>Product inspection available</li>
          <li>Worldwide freight quotation available</li>
          <li>Confirm stock and shipping on WhatsApp</li>
        </ul>
      </DetailSection>
    </Accordion.Root>
  )
}

function DetailSection({
  value,
  title,
  children,
}: {
  value: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Accordion.Item value={value} className="border-b border-zinc-300">
      <Accordion.Header>
        <Accordion.Trigger className="group flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950">
          <span>{title}</span>
          <span aria-hidden className="text-lg font-normal leading-none">
            <span className="group-data-[state=open]:hidden">+</span>
            <span className="hidden group-data-[state=open]:inline">−</span>
          </span>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden pb-5 data-[state=closed]:animate-accordion-close data-[state=open]:animate-accordion-open">
        {children}
      </Accordion.Content>
    </Accordion.Item>
  )
}

export default ProductTabs

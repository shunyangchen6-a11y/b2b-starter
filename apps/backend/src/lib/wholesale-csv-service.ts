import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductVariantsWorkflow,
  createProductsWorkflow,
  linkProductsToSalesChannelWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  parseAndValidateWholesaleCsv,
  serializeWholesaleCsv,
  WholesaleCsvIssue,
  WholesaleCsvColumn,
  WholesaleCsvRow,
  WHOLESALE_CATEGORIES,
} from "./wholesale-csv"

type ExistingVariant = { id: string; sku: string | null; inventory_items?: { inventory_item_id: string }[] }
type ExistingProduct = { id: string; handle: string; metadata?: Record<string, unknown> | null; variants?: ExistingVariant[] }
export type WholesaleCsvPreview = {
  rows: WholesaleCsvRow[]
  issues: WholesaleCsvIssue[]
  summary: { new_products: number; updated_products: number; new_variants: number; updated_variants: number; skipped: number; errors: number }
}

const groupRows = (rows: WholesaleCsvRow[]) =>
  Array.from(rows.reduce((groups, row) => {
    const current = groups.get(row.product_handle) || []
    current.push(row)
    groups.set(row.product_handle, current)
    return groups
  }, new Map<string, WholesaleCsvRow[]>()).entries())

const imagesFor = (rows: WholesaleCsvRow[]) => Array.from(new Set(rows.flatMap((row) => row.image_urls ? row.image_urls.split("|").map((url) => url.trim()).filter(Boolean) : [])))

const wholesaleMetadata = (row: WholesaleCsvRow) => ({
  category: row.category,
  fabric: row.fabric,
  pack_size: Number(row.pack_size),
  moq: Number(row.moq),
  stock_status: row.stock_status,
  video_url: row.video_url,
  wholesale_only: true,
  test_data: Boolean(row.product_test_marker),
  seed_marker: row.product_test_marker || undefined,
})

export const previewWholesaleCsv = async (container: MedusaContainer, csv: string): Promise<WholesaleCsvPreview> => {
  const parsed = parseAndValidateWholesaleCsv(csv)
  const issues = [...parsed.issues]
  if (!parsed.rows.length) return { rows: [], issues, summary: { new_products: 0, updated_products: 0, new_variants: 0, updated_variants: 0, skipped: 0, errors: issues.length } }

  const handles = Array.from(new Set(parsed.rows.map((row) => row.product_handle)))
  const productService = container.resolve(Modules.PRODUCT) as any
  const products = await productService.listProducts({ handle: { $in: handles } }, { relations: ["variants"] }) as ExistingProduct[]
  const existingByHandle = new Map(products.map((product) => [product.handle, product]))
  const existingVariants = await productService.listProductVariants({}, { select: ["sku", "product_id"] })
  const skuProductIds = new Map<string, string>()
  existingVariants.forEach((variant: { sku?: string; product_id?: string }) => { if (variant.sku && variant.product_id) skuProductIds.set(variant.sku, variant.product_id) })

  for (const row of parsed.rows) {
    const skuOwnerProductId = skuProductIds.get(row.sku)
    if (skuOwnerProductId && skuOwnerProductId !== existingByHandle.get(row.product_handle)?.id) issues.push({ line: row.line, sku: row.sku, reason: "SKU already belongs to another product." })
    const existing = existingByHandle.get(row.product_handle)
    if (existing && existing.metadata?.wholesale_only !== true) issues.push({ line: row.line, sku: row.sku, reason: "Only products marked wholesale_only can be changed through Wholesale CSV." })
  }

  for (const [, group] of groupRows(parsed.rows)) {
    const first = group[0]
    const productFields = ["product_title", "description", "category", "fabric", "pack_size", "moq", "stock_status", "video_url", "product_test_marker", "image_urls"] as const
    group.slice(1).forEach((row) => {
      if (productFields.some((field) => row[field] !== first[field])) {
        issues.push({ line: row.line, sku: row.sku, reason: "All rows with the same product_handle must use identical product-level fields." })
      }
    })
  }

  const invalidLines = new Set(issues.map((issue) => issue.line))
  const rows = parsed.rows.filter((row) => !invalidLines.has(row.line))
  let newProducts = 0; let updatedProducts = 0; let newVariants = 0; let updatedVariants = 0
  groupRows(rows).forEach(([handle, group]) => {
    const existing = existingByHandle.get(handle)
    if (existing) updatedProducts++
    else newProducts++
    const existingSkus = new Set(existing?.variants?.map((variant) => variant.sku).filter(Boolean))
    group.forEach((row) => existingSkus.has(row.sku) ? updatedVariants++ : newVariants++)
  })

  return {
    rows,
    issues,
    summary: { new_products: newProducts, updated_products: updatedProducts, new_variants: newVariants, updated_variants: updatedVariants, skipped: parsed.rows.length - rows.length, errors: issues.length },
  }
}

const ensureInventory = async (container: MedusaContainer, rows: WholesaleCsvRow[]) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const link = container.resolve(ContainerRegistrationKeys.LINK) as any
  const inventoryService = container.resolve(Modules.INVENTORY) as any
  const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id"] })
  if (!locations[0]) throw new MedusaError(MedusaError.Types.INVALID_DATA, "A stock location is required for wholesale CSV inventory.")
  const rowsBySku = new Map(rows.map((row) => [row.sku, row]))
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku", "variants.inventory_items.inventory_item_id"],
    filters: { handle: { $in: Array.from(new Set(rows.map((row) => row.product_handle))) } },
  })
  const variants = products.flatMap((product: any) => product.variants || []).filter((variant: any) => rowsBySku.has(variant.sku))
  const withoutInventory = variants.filter((variant: any) => !variant.inventory_items?.length)

  if (withoutInventory.length) {
    const items = await inventoryService.createInventoryItems(withoutInventory.map((variant: any) => ({ sku: variant.sku })))
    await Promise.all(withoutInventory.map((variant: any, index: number) => link.create({
      [Modules.PRODUCT]: { variant_id: variant.id },
      [Modules.INVENTORY]: { inventory_item_id: items[index].id },
    })))
    await inventoryService.createInventoryLevels(withoutInventory.map((variant: any, index: number) => ({
      inventory_item_id: items[index].id,
      location_id: locations[0].id,
      stocked_quantity: Number(rowsBySku.get(variant.sku)!.inventory_quantity),
    })))
  }

  const refreshed = await query.graph({
    entity: "product",
    fields: ["variants.sku", "variants.inventory_items.inventory_item_id"],
    filters: { handle: { $in: Array.from(new Set(rows.map((row) => row.product_handle))) } },
  })
  for (const variant of refreshed.data.flatMap((product: any) => product.variants || [])) {
    const row = rowsBySku.get(variant.sku)
    const itemId = variant.inventory_items?.[0]?.inventory_item_id
    if (!row || !itemId) continue
    const levels = await inventoryService.listInventoryLevels({ inventory_item_id: itemId, location_id: locations[0].id })
    if (levels[0]) await inventoryService.updateInventoryLevels({ id: levels[0].id, stocked_quantity: Number(row.inventory_quantity) })
    else await inventoryService.createInventoryLevels({ inventory_item_id: itemId, location_id: locations[0].id, stocked_quantity: Number(row.inventory_quantity) })
  }
}

export const importWholesaleCsv = async (container: MedusaContainer, csv: string) => {
  const preview = await previewWholesaleCsv(container, csv)
  if (preview.issues.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "CSV validation failed.", "WHOLESALE_CSV_VALIDATION_ERROR")
  if (!preview.rows.length) return preview.summary

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const { data: categories } = await query.graph({ entity: "product_category", fields: ["id", "handle"] })
  const categoryIds = new Map<string, string>(categories.map((category: { id: string; handle: string }) => [category.handle, category.id]))
  if (WHOLESALE_CATEGORIES.size !== Array.from(categoryIds.keys()).filter((handle) => WHOLESALE_CATEGORIES.has(handle)).length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Wholesale product categories must be seeded before import.")
  const { data: currentProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata", "variants.id", "variants.sku"],
    filters: { handle: { $in: Array.from(new Set(preview.rows.map((row) => row.product_handle))) } },
  }) as { data: ExistingProduct[] }
  const byHandle = new Map(currentProducts.map((product) => [product.handle, product]))
  const groups = groupRows(preview.rows)
  const newGroups = groups.filter(([handle]) => !byHandle.has(handle))
  const existingGroups = groups.filter(([handle]) => byHandle.has(handle))

  if (newGroups.length) {
    await createProductsWorkflow(container).run({ input: { products: newGroups.map(([handle, rows]) => {
      const first = rows[0]; const images = imagesFor(rows)
      return {
        title: first.product_title, handle, description: first.description, status: ProductStatus.PUBLISHED,
        category_ids: [categoryIds.get(first.category)!], metadata: wholesaleMetadata(first),
        images: images.map((url) => ({ url })), thumbnail: images[0],
        options: [{ title: "Color", values: Array.from(new Set(rows.map((row) => row.color))) }, { title: "Size", values: Array.from(new Set(rows.map((row) => row.size))) }],
        variants: rows.map((row) => ({ title: `${row.color} / ${row.size}`, sku: row.sku, options: { Color: row.color, Size: row.size }, manage_inventory: true, allow_backorder: false, prices: [{ amount: 1, currency_code: "usd" }] })),
      }
    }) } })
  }

  if (existingGroups.length) {
    await updateProductsWorkflow(container).run({ input: { products: existingGroups.map(([handle, rows]) => {
      const existing = byHandle.get(handle)!; const first = rows[0]; const images = imagesFor(rows)
      return { id: existing.id, title: first.product_title, description: first.description, category_ids: [categoryIds.get(first.category)!], metadata: { ...(existing.metadata || {}), ...wholesaleMetadata(first) }, ...(images.length ? { images: images.map((url) => ({ url })), thumbnail: images[0] } : {}) }
    }) } })
  }

  const { data: importedProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku"],
    filters: { handle: { $in: Array.from(new Set(preview.rows.map((row) => row.product_handle))) } },
  }) as { data: ExistingProduct[] }
  const productByHandle = new Map(importedProducts.map((product) => [product.handle, product]))
  const rowsForNewVariants = preview.rows.filter((row) => !productByHandle.get(row.product_handle)?.variants?.some((variant) => variant.sku === row.sku))
  if (rowsForNewVariants.length) {
    await createProductVariantsWorkflow(container).run({ input: { product_variants: rowsForNewVariants.map((row) => ({
      product_id: productByHandle.get(row.product_handle)!.id, title: `${row.color} / ${row.size}`, sku: row.sku,
      options: { Color: row.color, Size: row.size }, manage_inventory: true, allow_backorder: false, prices: [{ amount: 1, currency_code: "usd" }],
    })) } })
  }

  const { data: productsWithVariants } = await query.graph({
    entity: "product", fields: ["id", "handle", "variants.id", "variants.sku"],
    filters: { handle: { $in: Array.from(new Set(preview.rows.map((row) => row.product_handle))) } },
  }) as { data: ExistingProduct[] }
  const variantIdBySku = new Map(productsWithVariants.flatMap((product) => product.variants || []).map((variant) => [variant.sku, variant.id]))
  await updateProductVariantsWorkflow(container).run({ input: { product_variants: preview.rows.map((row) => ({
    id: variantIdBySku.get(row.sku)!, title: `${row.color} / ${row.size}`, sku: row.sku, options: { Color: row.color, Size: row.size }, manage_inventory: true, allow_backorder: false,
  })) } })

  const { data: salesChannels } = await query.graph({ entity: "sales_channel", fields: ["id"] })
  for (const salesChannel of salesChannels as Array<{ id: string }>) {
    await linkProductsToSalesChannelWorkflow(container).run({
      input: { id: salesChannel.id, add: productsWithVariants.map((product) => product.id) },
    })
  }
  await ensureInventory(container, preview.rows)
  return preview.summary
}

const optionValue = (product: any, variant: any, title: string) => {
  const option = product.options?.find((item: any) => item.title?.toLowerCase() === title.toLowerCase())
  return variant.options?.find((item: any) => item.option_id === option?.id)?.value || ""
}

export const exportWholesaleCsv = async (container: MedusaContainer, category?: string) => {
  const productService = container.resolve(Modules.PRODUCT) as any
  const inventoryService = container.resolve(Modules.INVENTORY) as any
  const products = await productService.listProducts({}, { take: 1000, relations: ["categories", "options", "variants", "variants.options", "images"] })
  const wholesaleProducts = products.filter((item: any) => item.metadata?.wholesale_only === true && (!category || item.categories?.some((entry: any) => entry.handle === category)))
  const skus = wholesaleProducts.flatMap((product: any) => (product.variants || []).map((variant: any) => variant.sku).filter(Boolean))
  const inventoryItems = skus.length ? await inventoryService.listInventoryItems({ sku: skus }) : []
  const levels = inventoryItems.length ? await inventoryService.listInventoryLevels({ inventory_item_id: inventoryItems.map((item: any) => item.id) }) : []
  const quantityBySku = new Map<string, number>(inventoryItems.map((item: any) => [item.sku, levels.filter((level: any) => level.inventory_item_id === item.id).reduce((total: number, level: any) => total + Number(level.stocked_quantity || 0), 0)]))
  const rows: Array<Record<WholesaleCsvColumn, string | number | boolean | null | undefined>> = []
  for (const product of wholesaleProducts) {
    for (const variant of product.variants || []) {
      rows.push({
        product_handle: product.handle || "", product_title: product.title || "", description: product.description || "", category: product.metadata?.category || product.categories?.[0]?.handle || "", fabric: product.metadata?.fabric || "", pack_size: product.metadata?.pack_size ?? "", moq: product.metadata?.moq ?? "", stock_status: product.metadata?.stock_status || "", video_url: product.metadata?.video_url || "", product_test_marker: product.metadata?.seed_marker || "", color: optionValue(product, variant, "Color"), size: optionValue(product, variant, "Size"), sku: variant.sku || "", inventory_quantity: quantityBySku.get(variant.sku) || 0, image_urls: (product.images || []).map((image: any) => image.url).filter(Boolean).join("|"),
      })
    }
  }
  return serializeWholesaleCsv(rows)
}

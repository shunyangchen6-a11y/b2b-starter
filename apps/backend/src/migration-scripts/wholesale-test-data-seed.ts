import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  linkProductsToSalesChannelWorkflow,
  updateProductVariantsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

type WholesaleProductSeed = {
  title: string
  handle: string
  category: string
  fabric: string
  packSize: 5 | 10
  moq: number
  stockStatus: "in_stock" | "low_stock" | "sold_out"
  colors: string[]
  sizes: string[]
}

const TEST_DATA_MARKER = "four-seasons-wholesale-test-data"
const PLACEHOLDER_PATH = "/images/wholesale-placeholder.svg"

const products: WholesaleProductSeed[] = [
  {
    title: "Classic Jogger Pants",
    handle: "fs-test-classic-jogger-pants",
    category: "jogger-pants",
    fabric: "Cotton blend fleece",
    packSize: 10,
    moq: 50,
    stockStatus: "in_stock",
    colors: ["Black", "Blue"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    title: "Multi-Pocket Cargo Pants",
    handle: "fs-test-multi-pocket-cargo-pants",
    category: "cargo-pants",
    fabric: "Cotton twill",
    packSize: 5,
    moq: 30,
    stockStatus: "low_stock",
    colors: ["Black", "White"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    title: "Straight-Leg Casual Pants",
    handle: "fs-test-straight-leg-casual-pants",
    category: "casual-pants",
    fabric: "Polyester cotton",
    packSize: 10,
    moq: 40,
    stockStatus: "in_stock",
    colors: ["Blue", "Black"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    title: "Regular Fit Jeans",
    handle: "fs-test-regular-fit-jeans",
    category: "jeans",
    fabric: "Cotton denim",
    packSize: 5,
    moq: 30,
    stockStatus: "low_stock",
    colors: ["Blue", "Black"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    title: "Basic Cotton T-Shirt",
    handle: "fs-test-basic-cotton-t-shirt",
    category: "t-shirts",
    fabric: "100% cotton jersey",
    packSize: 10,
    moq: 50,
    stockStatus: "sold_out",
    colors: ["Black", "White"],
    sizes: ["M", "L", "XL", "2XL", "3XL"],
  },
]

const stockQuantityFor = (status: WholesaleProductSeed["stockStatus"]) =>
  status === "in_stock" ? 180 : status === "low_stock" ? 24 : 0

export default async function wholesale_test_data_seed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const link = container.resolve(ContainerRegistrationKeys.LINK) as any
  const inventoryService = container.resolve(Modules.INVENTORY) as any

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const salesChannel = salesChannels.find(
    (channel: { name: string }) => channel.name === "Default Sales Channel"
  )

  if (!salesChannel) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Default Sales Channel is required before wholesale test data can be seeded."
    )
  }
  const salesChannelIds = salesChannels.map((channel: { id: string }) => channel.id)

  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "name"],
  })
  const missingCategories = products.filter(
    (product) => !existingCategories.some((category: { handle: string }) => category.handle === product.category)
  )

  if (missingCategories.length) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingCategories.map((product) => ({
          name: product.category
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" "),
          handle: product.category,
          is_active: true,
        })),
      },
    })
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  })
  const categoryByHandle = new Map<string, string>(
    categories.map((category: { id: string; handle: string }) => [category.handle, category.id])
  )

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: { $in: products.map((product) => product.handle) } },
  })
  const existingHandles = new Set(
    existingProducts.map((product: { handle: string }) => product.handle)
  )
  const missingProducts = products.filter((product) => !existingHandles.has(product.handle))

  if (missingProducts.length) {
    await createProductsWorkflow(container).run({
      input: {
        products: missingProducts.map((product) => ({
          title: product.title,
          handle: product.handle,
          description: `Neutral wholesale sample data for ${product.title}. Remove products tagged ${TEST_DATA_MARKER} when no longer needed.`,
          status: ProductStatus.PUBLISHED,
          category_ids: [categoryByHandle.get(product.category)!],
          images: [{ url: PLACEHOLDER_PATH }],
          thumbnail: PLACEHOLDER_PATH,
          metadata: {
            category: product.category,
            fabric: product.fabric,
            pack_size: product.packSize,
            moq: product.moq,
            stock_status: product.stockStatus,
            video_url: "",
            wholesale_only: true,
            style_number: `FS-TEST-${product.category.toUpperCase()}`,
            test_data: true,
            seed_marker: TEST_DATA_MARKER,
          },
          options: [
            { title: "Color", values: product.colors },
            { title: "Size", values: product.sizes },
          ],
          variants: product.colors.flatMap((color) =>
            product.sizes.map((size) => ({
              title: `${color} / ${size}`,
              sku: `FS-TEST-${product.category.toUpperCase()}-${color.toUpperCase()}-${size}`,
              options: { Color: color, Size: size },
              manage_inventory: true,
              allow_backorder: product.stockStatus === "sold_out",
              prices: [{ amount: 1, currency_code: "usd" }],
            }))
          ),
        })),
      },
    })
  }

  const { data: seededProductImages } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "thumbnail", "images.url"],
    filters: { handle: { $in: products.map((product) => product.handle) } },
  })
  const productsWithOutdatedImages = seededProductImages.filter((product: any) =>
    product.thumbnail !== PLACEHOLDER_PATH ||
    !product.images?.some((image: { url: string }) => image.url === PLACEHOLDER_PATH)
  )

  if (productsWithOutdatedImages.length) {
    await updateProductsWorkflow(container).run({
      input: {
        products: productsWithOutdatedImages.map((product: any) => ({
          id: product.id,
          thumbnail: PLACEHOLDER_PATH,
          images: [{ url: PLACEHOLDER_PATH }],
        })),
      },
    })
  }

  const { data: seededProductRefs } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: { $in: products.map((product) => product.handle) } },
  })

  await Promise.all(
    salesChannelIds.map((salesChannelId: string) =>
      linkProductsToSalesChannelWorkflow(container).run({
        input: {
          id: salesChannelId,
          add: seededProductRefs.map((product: { id: string }) => product.id),
        },
      })
    )
  )

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  })
  const stockLocation = stockLocations[0]
  if (!stockLocation) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A stock location is required before wholesale test inventory can be seeded."
    )
  }

  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku", "variants.inventory_items.inventory_item_id"],
    filters: { handle: { $in: products.map((product) => product.handle) } },
  })

  const variantsWithoutInventory = seededProducts.flatMap((product: any) => {
    const definition = products.find((item) => item.handle === product.handle)!
    return (product.variants || [])
      .filter((variant: any) => !variant.inventory_items?.length)
      .map((variant: any) => ({ variant, definition }))
  })

  if (variantsWithoutInventory.length) {
    const inventoryItems = await inventoryService.createInventoryItems(
      variantsWithoutInventory.map(({ variant }: any) => ({ sku: variant.sku }))
    )

    await Promise.all(
      variantsWithoutInventory.map(({ variant }: any, index: number) =>
        link.create({
          [Modules.PRODUCT]: { variant_id: variant.id },
          [Modules.INVENTORY]: { inventory_item_id: inventoryItems[index].id },
        })
      )
    )

  }

  const { data: inventoryReadyProducts } = await query.graph({
    entity: "product",
    fields: ["handle", "variants.id", "variants.sku", "variants.inventory_items.inventory_item_id"],
    filters: { handle: { $in: products.map((product) => product.handle) } },
  })
  const variantsWithDefinitions = inventoryReadyProducts.flatMap((product: any) => {
    const definition = products.find((item) => item.handle === product.handle)!
    return (product.variants || []).map((variant: any) => ({ variant, definition }))
  })

  await updateProductVariantsWorkflow(container).run({
    input: {
      product_variants: variantsWithDefinitions.map(({ variant }: any) => ({
        id: variant.id,
        manage_inventory: true,
        allow_backorder: false,
      })),
    },
  })

  for (const { variant, definition } of variantsWithDefinitions) {
    const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
    if (!inventoryItemId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Missing inventory item for wholesale variant ${variant.sku}.`
      )
    }
    const stockedQuantity = stockQuantityFor(definition.stockStatus)
    const levels = await inventoryService.listInventoryLevels({
      inventory_item_id: inventoryItemId,
      location_id: stockLocation.id,
    })
    if (levels[0]) {
      await inventoryService.updateInventoryLevels({
        id: levels[0].id,
        stocked_quantity: stockedQuantity,
      })
    } else {
      await inventoryService.createInventoryLevels({
        inventory_item_id: inventoryItemId,
        location_id: stockLocation.id,
        stocked_quantity: stockedQuantity,
      })
    }
  }

  logger.info(`Wholesale test data ready: ${products.length} products (${TEST_DATA_MARKER}).`)
}

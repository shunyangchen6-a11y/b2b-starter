import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"
import {
  missingWholesaleCategoryDefinitions,
  WHOLESALE_CATEGORY_DEFINITIONS,
} from "../lib/wholesale-categories"

export default async function setupWholesaleCategories({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  })
  const missingCategories = missingWholesaleCategoryDefinitions(
    existingCategories.map((category: { handle: string }) => category.handle)
  )

  if (!missingCategories.length) {
    logger.info("Wholesale product categories already exist; no changes required.")
    return
  }

  await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: missingCategories.map((category) => ({
        ...category,
        is_active: true,
      })),
    },
  })

  logger.info(
    `Created ${missingCategories.length} missing wholesale product categories. ${WHOLESALE_CATEGORY_DEFINITIONS.length - missingCategories.length} already existed.`
  )
}

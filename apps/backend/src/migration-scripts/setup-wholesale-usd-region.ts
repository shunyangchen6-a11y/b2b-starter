import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createTaxRegionsWorkflow,
} from "@medusajs/medusa/core-flows"

const REGION_NAME = "Wholesale USD"
const REGION_CURRENCY = "usd"
const TARGET_COUNTRIES = ["ng", "gh", "ke", "za", "tz", "ug"]

type RegionRecord = {
  id: string
  name: string
  currency_code: string
  countries?: Array<{ iso_2?: string }>
}

/**
 * Creates the USD wholesale pricing context used by the Storefront's African
 * country paths. It never edits an existing Region, product, price, or stock
 * record. Unexpected country assignments fail safely instead of being moved.
 */
export default async function setupWholesaleUsdRegion({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2"],
  })
  const regionRecords = (regions ?? []) as RegionRecord[]
  const existing = regionRecords.find((region) => region.name === REGION_NAME)

  const conflicts = regionRecords.flatMap((region) =>
    (region.countries ?? [])
      .filter(
        (country) =>
          TARGET_COUNTRIES.includes(country.iso_2 ?? "") &&
          region.name !== REGION_NAME
      )
      .map((country) => `${country.iso_2} (${region.name})`)
  )

  if (conflicts.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Cannot configure ${REGION_NAME}; country mappings already exist: ${conflicts.join(", ")}`
    )
  }

  if (existing) {
    const configuredCountries = (existing.countries ?? [])
      .map((country) => country.iso_2)
      .filter((country): country is string => Boolean(country))
      .sort()
    const expectedCountries = [...TARGET_COUNTRIES].sort()

    if (
      existing.currency_code !== REGION_CURRENCY ||
      configuredCountries.join(",") !== expectedCountries.join(",")
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `${REGION_NAME} already exists but does not match the expected USD country configuration. No changes were made.`
      )
    }

    logger.info(`${REGION_NAME} already exists (${existing.id}); reusing it.`)
  } else {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: REGION_NAME,
            currency_code: REGION_CURRENCY,
            countries: TARGET_COUNTRIES,
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    })

    logger.info(`${REGION_NAME} created (${result[0].id}).`)
  }

  const { data: taxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
  })
  const configuredTaxCountries = new Set(
    (taxRegions ?? []).map((taxRegion: { country_code?: string }) =>
      taxRegion.country_code?.toLowerCase()
    )
  )
  const missingTaxCountries = TARGET_COUNTRIES.filter(
    (countryCode) => !configuredTaxCountries.has(countryCode)
  )

  if (missingTaxCountries.length) {
    await createTaxRegionsWorkflow(container).run({
      input: missingTaxCountries.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    })
    logger.info(
      `Created tax regions for ${missingTaxCountries.join(", ")}.`
    )
  } else {
    logger.info("Wholesale USD tax regions already exist; no changes made.")
  }
}

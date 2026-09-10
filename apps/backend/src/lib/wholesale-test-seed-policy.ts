const MEDUSA_CLOUD_IDENTITY_VARIABLES = [
  "MEDUSA_CLOUD_ENVIRONMENT_HANDLE",
  "MEDUSA_CLOUD_ENVIRONMENT_TYPE",
  "MEDUSA_CLOUD_ENVIRONMENT_NAME",
  "MEDUSA_CLOUD_PROJECT_HANDLE",
] as const

export type WholesaleTestSeedEnvironment = Record<
  string,
  string | undefined
>

/**
 * Test catalog data is opt-in for local development only. Any Cloud marker,
 * production-like NODE_ENV, missing environment identity, or missing explicit
 * authorization fails closed.
 */
export const canRunWholesaleTestSeed = (
  environment: WholesaleTestSeedEnvironment
) => {
  const explicitlyAllowed =
    environment.ALLOW_WHOLESALE_TEST_SEED === "true"
  const isKnownLocalDevelopment = environment.NODE_ENV === "development"
  const hasCloudIdentity = MEDUSA_CLOUD_IDENTITY_VARIABLES.some((key) =>
    Boolean(environment[key]?.trim())
  )

  return explicitlyAllowed && isKnownLocalDevelopment && !hasCloudIdentity
}

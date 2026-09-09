import { canRunWholesaleTestSeed } from "../lib/wholesale-test-seed-policy"
import wholesaleTestDataSeed from "../migration-scripts/wholesale-test-data-seed"

describe("wholesale test seed policy", () => {
  it("rejects execution when explicit authorization is missing", () => {
    expect(canRunWholesaleTestSeed({ NODE_ENV: "development" })).toBe(false)
    expect(
      canRunWholesaleTestSeed({
        NODE_ENV: "development",
        ALLOW_WHOLESALE_TEST_SEED: "false",
      })
    ).toBe(false)
  })

  it.each([
    "preview-instance",
    "long-lived",
    "production",
  ])("rejects every Medusa Cloud environment type: %s", (environmentType) => {
    expect(
      canRunWholesaleTestSeed({
        NODE_ENV: "development",
        ALLOW_WHOLESALE_TEST_SEED: "true",
        MEDUSA_CLOUD_ENVIRONMENT_TYPE: environmentType,
      })
    ).toBe(false)
  })

  it("rejects production even when explicitly authorized", () => {
    expect(
      canRunWholesaleTestSeed({
        NODE_ENV: "production",
        ALLOW_WHOLESALE_TEST_SEED: "true",
      })
    ).toBe(false)
  })

  it("rejects an unidentified environment", () => {
    expect(
      canRunWholesaleTestSeed({ ALLOW_WHOLESALE_TEST_SEED: "true" })
    ).toBe(false)
  })

  it("allows only explicitly authorized local development", () => {
    expect(
      canRunWholesaleTestSeed({
        NODE_ENV: "development",
        ALLOW_WHOLESALE_TEST_SEED: "true",
      })
    ).toBe(true)
  })

  it("returns before resolving services, preserving all existing products", async () => {
    const resolve = jest.fn()

    await wholesaleTestDataSeed(
      { container: { resolve } as never },
      { NODE_ENV: "production", ALLOW_WHOLESALE_TEST_SEED: "true" }
    )

    expect(resolve).not.toHaveBeenCalled()
  })
})

export const WHOLESALE_PLACEHOLDER_IMAGE = "/images/wholesale-placeholder.svg"

const isLocalhostImage = (url: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(url)

export const getProductImageUrl = (value: unknown) => {
  if (typeof value !== "string") {
    return WHOLESALE_PLACEHOLDER_IMAGE
  }

  const url = value.trim()
  if (!url || isLocalhostImage(url)) {
    return WHOLESALE_PLACEHOLDER_IMAGE
  }

  return url.startsWith("/") || /^https?:\/\//i.test(url)
    ? url
    : WHOLESALE_PLACEHOLDER_IMAGE
}

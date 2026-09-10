import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
    }).then(async (response) => {
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message)
      }

      return json
    })

    if (!regions?.length) {
      throw new Error(
        "No regions found. Please set up regions in your Medusa Admin."
      )
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = (
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry")
    )?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable?"
      )
    }
  }
}

function getCacheId(request: NextRequest) {
  const cacheId = request.nextUrl.searchParams.get("_medusa_cache_id")

  if (cacheId) {
    return { cacheId, shouldSetCookie: false }
  }

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")

  return {
    cacheId: cacheIdCookie?.value ?? crypto.randomUUID(),
    shouldSetCookie: !cacheIdCookie,
  }
}

function setCacheId(
  response: NextResponse,
  cacheId: string,
  shouldSetCookie: boolean
) {
  if (shouldSetCookie) {
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })
  }

  return response
}

/**
 * Middleware to handle region selection and cache id.
 */
export async function middleware(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const cartId = searchParams.get("cart_id")
  const checkoutStep = searchParams.get("step")
  const { cacheId, shouldSetCookie } = getCacheId(request)

  const regionMap = await getRegionMap(cacheId)

  const countryCode = regionMap && (await getCountryCode(request, regionMap))
  const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

  const urlHasCountryCode = Boolean(
    urlCountryCode && regionMap.has(urlCountryCode)
  )

  // check if the url is a static asset
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const looksLikeCountryCode = Boolean(urlCountryCode?.match(/^[a-z]{2}$/))
  const redirectPath = looksLikeCountryCode
    ? request.nextUrl.pathname.replace(/^\/[^/]+/, "") || "/"
    : request.nextUrl.pathname === "/"
      ? ""
      : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""
  let redirectUrl: string | undefined

  // If no country code is set, we redirect to the relevant region.
  if (!urlHasCountryCode && countryCode) {
    redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
  }

  // If a cart_id is in the params, we set it as a cookie and redirect to the address step.
  if (cartId && !checkoutStep) {
    const cartUrl = new URL(redirectUrl ?? request.nextUrl.href)
    cartUrl.searchParams.set("step", "address")
    redirectUrl = cartUrl.href
  }

  if (redirectUrl) {
    const response = NextResponse.redirect(redirectUrl, 307)
    setCacheId(response, cacheId, shouldSetCookie)

    if (cartId && !checkoutStep) {
      response.cookies.set("_medusa_cart_id", cartId, {
        maxAge: 60 * 60 * 24,
      })
    }

    return response
  }

  const response = NextResponse.next()
  setCacheId(response, cacheId, shouldSetCookie)

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}

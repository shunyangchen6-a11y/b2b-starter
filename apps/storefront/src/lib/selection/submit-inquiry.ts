import type { StoreInquiryPayload } from "./quote"

type InquiryResponse = {
  inquiry?: {
    id?: string
  }
  message?: string
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

const submissionError = (message?: string) =>
  new Error(message || "Unable to save your inquiry. Please try again.")

export const submitStoreInquiry = async ({
  backendUrl,
  payload,
  publishableApiKey,
  fetcher = fetch,
}: {
  backendUrl: string
  payload: StoreInquiryPayload
  publishableApiKey?: string
  fetcher?: FetchLike
}) => {
  let response: Response

  try {
    response = await fetcher(`${backendUrl.replace(/\/$/, "")}/store/inquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(publishableApiKey
          ? { "x-publishable-api-key": publishableApiKey }
          : {}),
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw submissionError("Unable to save your inquiry. Check your connection and try again.")
  }

  const body = (await response.json().catch(() => null)) as InquiryResponse | null

  if (!response.ok) {
    throw submissionError(body?.message)
  }

  if (!body?.inquiry?.id) {
    throw submissionError("Inquiry was not saved. Please try again.")
  }

  return body.inquiry
}

export const submitInquiryAndOpenWhatsApp = async ({
  backendUrl,
  payload,
  publishableApiKey,
  whatsappUrl,
  fetcher,
  openWhatsApp,
}: {
  backendUrl: string
  payload: StoreInquiryPayload
  publishableApiKey?: string
  whatsappUrl: string
  fetcher?: FetchLike
  openWhatsApp: (url: string) => void
}) => {
  const inquiry = await submitStoreInquiry({
    backendUrl,
    payload,
    publishableApiKey,
    fetcher,
  })
  openWhatsApp(whatsappUrl)
  return inquiry
}

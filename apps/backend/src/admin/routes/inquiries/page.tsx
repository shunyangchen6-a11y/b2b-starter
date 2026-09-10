import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Select, Text, toast } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

type Inquiry = {
  id: string; contact_name?: string; whatsapp?: string; country?: string; total_styles: number; total_pieces: number; status: string; created_at: string
}

const statusOptions = ["new", "contacted", "quoted", "closed"]

const InquiriesPage = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const response = await fetch("/admin/inquiries?limit=100", { credentials: "include" })
      if (!response.ok) throw new Error("Unable to load inquiries")
      const data = await response.json()
      setInquiries(data.inquiries || [])
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load inquiries") }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  const rows = useMemo(() => status === "all" ? inquiries : inquiries.filter((inquiry) => inquiry.status === status), [inquiries, status])

  return <Container className="flex flex-col gap-y-4 p-6">
    <div className="flex items-center justify-between"><Heading>Inquiries</Heading><Button variant="secondary" size="small" onClick={() => void load()} isLoading={loading}>Refresh</Button></div>
    <div className="max-w-48"><Select value={status} onValueChange={setStatus}><Select.Trigger><Select.Value placeholder="All statuses" /></Select.Trigger><Select.Content><Select.Item value="all">All statuses</Select.Item>{statusOptions.map((value) => <Select.Item key={value} value={value}>{value}</Select.Item>)}</Select.Content></Select></div>
    {error && <Text className="text-ui-fg-error">{error}</Text>}
    {!loading && !error && rows.length === 0 && <Text className="text-ui-fg-subtle">No inquiries yet</Text>}
    {!loading && rows.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-ui-fg-subtle"><th className="p-2">Inquiry ID</th><th>Customer Name</th><th>WhatsApp</th><th>Country</th><th>Number of Styles</th><th>Total Pieces</th><th>Status</th><th>Created At</th></tr></thead><tbody>{rows.map((inquiry) => <tr key={inquiry.id} className="border-b hover:bg-ui-bg-subtle"><td className="p-2"><a className="text-ui-fg-interactive" href={`/app/inquiries/${inquiry.id}`}>{inquiry.id}</a></td><td>{inquiry.contact_name || "—"}</td><td>{inquiry.whatsapp || "—"}</td><td>{inquiry.country || "—"}</td><td>{inquiry.total_styles}</td><td>{inquiry.total_pieces}</td><td><Badge color={inquiry.status === "closed" ? "grey" : inquiry.status === "quoted" ? "green" : "blue"}>{inquiry.status}</Badge></td><td>{new Date(inquiry.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}
  </Container>
}

export const config = defineRouteConfig({ label: "Inquiries", icon: ChatBubbleLeftRight })
export default InquiriesPage

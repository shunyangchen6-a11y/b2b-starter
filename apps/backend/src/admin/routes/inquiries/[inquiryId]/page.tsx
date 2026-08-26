import { Button, Container, Heading, Select, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

const statuses = ["new", "contacted", "quoted", "closed"]

const InquiryDetailPage = () => {
  const { inquiryId } = useParams(); const navigate = useNavigate()
  const [inquiry, setInquiry] = useState<any>(null); const [status, setStatus] = useState("new"); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null)
  const load = async () => { setLoading(true); setError(null); try { const response = await fetch(`/admin/inquiries/${inquiryId}`, { credentials: "include" }); if (!response.ok) throw new Error("Unable to load inquiry details"); const data = await response.json(); setInquiry(data.inquiry); setStatus(data.inquiry.status) } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load inquiry details") } finally { setLoading(false) } }
  useEffect(() => { void load() }, [inquiryId])
  const saveStatus = async () => { setSaving(true); try { const response = await fetch(`/admin/inquiries/${inquiryId}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (!response.ok) throw new Error("Unable to update inquiry status"); toast.success("Inquiry status updated"); await load() } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Unable to update inquiry status") } finally { setSaving(false) } }
  const remove = async () => { if (!window.confirm("Delete this inquiry? This cannot be undone.")) return; try { const response = await fetch(`/admin/inquiries/${inquiryId}`, { method: "DELETE", credentials: "include" }); if (!response.ok) throw new Error("Unable to delete inquiry"); toast.success("Inquiry deleted"); navigate("/inquiries") } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Unable to delete inquiry") } }
  if (loading) return <Container className="p-6"><Text>Loading inquiry…</Text></Container>
  if (error || !inquiry) return <Container className="p-6"><Text className="text-ui-fg-error">{error || "Inquiry not found"}</Text></Container>
  const items = inquiry.items?.selection || []
  return <Container className="flex flex-col gap-y-6 p-6"><div className="flex justify-between"><div><Heading>Inquiry {inquiry.id}</Heading><Text className="text-ui-fg-subtle">{new Date(inquiry.created_at).toLocaleString()}</Text></div><Button variant="danger" onClick={() => void remove()}>Delete inquiry</Button></div><div className="grid grid-cols-2 gap-4 text-sm"><Text>Customer: {inquiry.contact_name || "—"}</Text><Text>WhatsApp: {inquiry.whatsapp || "—"}</Text><Text>Country: {inquiry.country || "—"}</Text><Text>Message: {inquiry.message || "—"}</Text></div><div className="flex max-w-sm gap-2"><Select value={status} onValueChange={setStatus}><Select.Trigger><Select.Value /></Select.Trigger><Select.Content>{statuses.map((value) => <Select.Item key={value} value={value}>{value}</Select.Item>)}</Select.Content></Select><Button onClick={() => void saveStatus()} isLoading={saving}>Save status</Button></div><div><Heading level="h2">Selected products</Heading>{items.length === 0 ? <Text>No product details supplied.</Text> : <table className="mt-3 w-full text-sm"><thead><tr className="border-b text-left"><th>Product Name</th><th>SKU</th><th>Color</th><th>Size</th><th>Quantity</th><th>Pack Size</th></tr></thead><tbody>{items.map((item: any, index: number) => <tr key={`${item.styleNumber}-${index}`} className="border-b"><td>{item.title}</td><td>{item.styleNumber}</td><td>{item.color}</td><td>{item.size}</td><td>{item.quantity}</td><td>{item.packSize}</td></tr>)}</tbody></table>}</div></Container>
}

export default InquiryDetailPage

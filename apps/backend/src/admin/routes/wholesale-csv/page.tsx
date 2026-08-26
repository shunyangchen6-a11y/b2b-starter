import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Select, Text, toast } from "@medusajs/ui"
import { ChangeEvent, useMemo, useState } from "react"

type Issue = { line: number; sku?: string; reason: string }
type Summary = { new_products: number; updated_products: number; new_variants: number; updated_variants: number; skipped: number; errors: number }
type Preview = { issues: Issue[]; summary: Summary }

const categories = ["all", "jogger-pants", "cargo-pants", "casual-pants", "jeans", "t-shirts"]

const WholesaleCsvPage = () => {
  const [filename, setFilename] = useState("")
  const [csv, setCsv] = useState("")
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState("all")
  const canImport = Boolean(preview && preview.issues.length === 0 && csv)
  const summaryRows = useMemo(() => preview ? [
    ["New products", preview.summary.new_products], ["Updated products", preview.summary.updated_products],
    ["New variants", preview.summary.new_variants], ["Updated variants", preview.summary.updated_variants],
    ["Skipped rows", preview.summary.skipped], ["Errors", preview.summary.errors],
  ] : [], [preview])

  const downloadTemplate = () => { window.location.assign("/admin/wholesale-csv/template") }
  const exportCsv = () => { window.location.assign(`/admin/wholesale-csv/export${category === "all" ? "" : `?category=${encodeURIComponent(category)}`}`) }

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setPreview(null); setError(null); setCsv(""); setFilename("")
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Only .csv files are accepted."); return }
    if (file.size > 2 * 1024 * 1024) { setError("CSV exceeds the 2 MB limit."); return }
    setFilename(file.name)
    setCsv(await file.text())
  }

  const previewCsv = async () => {
    if (!csv) { setError("Choose a CSV file first."); return }
    setLoading(true); setError(null)
    try {
      const response = await fetch("/admin/wholesale-csv/preview", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename, csv }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Unable to preview CSV.")
      setPreview(data)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to preview CSV.") }
    finally { setLoading(false) }
  }

  const confirmImport = async () => {
    if (!canImport) return
    setLoading(true); setError(null)
    try {
      const response = await fetch("/admin/wholesale-csv/import", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename, csv, confirm: true }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Import failed.")
      setPreview({ issues: [], summary: data.summary })
      toast.success("Wholesale CSV import completed")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Import failed."); toast.error("Wholesale CSV import failed") }
    finally { setLoading(false) }
  }

  return <Container className="flex max-w-5xl flex-col gap-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><Heading>Wholesale CSV</Heading><Text className="text-ui-fg-subtle">Import and export wholesale products only. Every CSV row is one color and size variant.</Text></div><Button variant="secondary" onClick={downloadTemplate}>Download Template</Button></div>
    <Container className="flex flex-col gap-y-4 p-5">
      <Heading level="h2">Export CSV</Heading>
      <div className="flex flex-wrap gap-3"><div className="w-56"><Select value={category} onValueChange={setCategory}><Select.Trigger><Select.Value /></Select.Trigger><Select.Content>{categories.map((value) => <Select.Item key={value} value={value}>{value === "all" ? "All wholesale categories" : value}</Select.Item>)}</Select.Content></Select></div><Button variant="secondary" onClick={exportCsv}>Export CSV</Button></div>
    </Container>
    <Container className="flex flex-col gap-y-4 p-5">
      <div><Heading level="h2">Import CSV</Heading><Text className="text-ui-fg-subtle">Upload, review validation results, then explicitly confirm the import. Files are limited to 2 MB.</Text></div>
      <input aria-label="Wholesale CSV file" type="file" accept=".csv,text/csv" onChange={(event) => void selectFile(event)} />
      {filename && <Text className="text-ui-fg-subtle">Selected: {filename}</Text>}
      <div className="flex gap-3"><Button variant="secondary" onClick={() => void previewCsv()} disabled={!csv} isLoading={loading}>Preview CSV</Button><Button onClick={() => void confirmImport()} disabled={!canImport} isLoading={loading}>Confirm Import</Button></div>
      {error && <Text className="text-ui-fg-error">{error}</Text>}
      {preview && <div className="flex flex-col gap-y-4"><div className="grid grid-cols-2 gap-3 small:grid-cols-3">{summaryRows.map(([label, count]) => <div key={String(label)} className="rounded-lg border border-ui-border-base p-3"><Text className="text-ui-fg-subtle">{label}</Text><Text className="text-lg font-semibold">{count}</Text></div>)}</div>
        {preview.issues.length > 0 ? <div><Heading level="h3">Validation errors</Heading><div className="mt-2 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Line</th><th>SKU</th><th>Reason</th></tr></thead><tbody>{preview.issues.map((issue) => <tr key={`${issue.line}-${issue.reason}`} className="border-b"><td className="p-2">{issue.line}</td><td>{issue.sku || "-"}</td><td className="text-ui-fg-error">{issue.reason}</td></tr>)}</tbody></table></div></div> : <Badge color="green">Preview has no validation errors</Badge>}
      </div>}
    </Container>
  </Container>
}

export const config = defineRouteConfig({ label: "Wholesale CSV", icon: DocumentText })
export default WholesaleCsvPage

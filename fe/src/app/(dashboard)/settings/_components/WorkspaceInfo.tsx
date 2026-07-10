import { useState } from "react";
import { Copy, Check, AlertTriangle, Building2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button }   from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ── Copy row ──────────────────────────────────────────────────────────────────
function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#E8E7E2] dark:border-border last:border-0">
      <span className="text-[#6B6B67] dark:text-muted-foreground shrink-0" style={{ fontSize: 13, width: 120 }}>{label}</span>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <code
          className="flex-1 px-3 py-1.5 rounded-lg truncate bg-[#F8F8F7] dark:bg-muted text-[#1A1A18] dark:text-foreground border border-[#E8E7E2] dark:border-border"
          style={{ fontSize: 12, fontFamily: "monospace" }}
        >
          {value}
        </code>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="size-8 shrink-0 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#6B6B67] dark:text-muted-foreground hover:bg-[#F1EFE8] dark:hover:bg-muted"
          title="Sao chép"
        >
          {copied ? <Check size={13} className="text-[#1D9E75]" /> : <Copy size={13} />}
        </Button>
      </div>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border p-5">
      <h2 className="text-[#1A1A18] dark:text-foreground mb-4" style={{ fontSize: 14, fontWeight: 500 }}>{title}</h2>
      <div className="border-t border-[#E8E7E2] dark:border-border pt-4">{children}</div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function WorkspaceInfo() {
  const [form, setForm] = useState({
    name:     "Công ty ABC",
    website:  "",
    industry: "Công nghệ thông tin",
    size:     "11-50 nhân viên",
    timezone: "Asia/Ho_Chi_Minh (GMT+7)",
    language: "Tiếng Việt",
    address:  "",
  });

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="flex flex-col gap-5">

      {/* Content header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1 }}>Workspace</h1>
          <p className="text-[#6B6B67] dark:text-muted-foreground mt-1.5" style={{ fontSize: 13 }}>Quản lý thông tin công ty và cài đặt chung</p>
        </div>
        <Button
          onClick={() => toast.success("Đã lưu thay đổi")}
          className="h-9 rounded-[10px] bg-[#534AB7] hover:bg-[#4840A0] text-white shrink-0"
          style={{ fontSize: 13 }}
        >
          Lưu thay đổi
        </Button>
      </div>

      {/* Section 1 */}
      <SectionCard title="Thông tin workspace">
        <div className="flex gap-6">

          {/* Logo upload */}
          <div className="flex flex-col items-center shrink-0 gap-2">
            <div
              className="size-[100px] rounded-[10px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F8F8F7] dark:hover:bg-muted transition-colors border-2 border-dashed border-[#E8E7E2] dark:border-border"
            >
              <Building2 size={28} style={{ color: "#D1CFED" }} />
              <Upload size={12} className="mt-1.5 text-[#6B6B67] dark:text-muted-foreground" />
            </div>
            <p className="text-[#6B6B67] dark:text-muted-foreground text-center" style={{ fontSize: 11 }}>Tải logo lên</p>
            <p className="text-[#6B6B67] dark:text-muted-foreground text-center" style={{ fontSize: 10 }}>PNG, JPG tối đa 2MB</p>
          </div>

          {/* Form */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-4">

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Tên công ty</Label>
              <Input value={form.name} onChange={(e) => set("name")(e.target.value)} className="h-10 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]" style={{ fontSize: 13 }} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Website</Label>
              <Input value={form.website} onChange={(e) => set("website")(e.target.value)} placeholder="https://congtyabc.vn" className="h-10 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]" style={{ fontSize: 13 }} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Ngành</Label>
              <Select value={form.industry} onValueChange={set("industry")}>
                <SelectTrigger className="h-10 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus:ring-[#534AB7]/30 focus:border-[#534AB7]" style={{ fontSize: 13 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border-[#E8E7E2] dark:border-border bg-background">
                  {["Công nghệ thông tin", "Tài chính", "Bán lẻ", "Y tế", "Sản xuất", "Khác"].map((o) => (
                    <SelectItem key={o} value={o} style={{ fontSize: 13 }}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Quy mô</Label>
              <Select value={form.size} onValueChange={set("size")}>
                <SelectTrigger className="h-10 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus:ring-[#534AB7]/30 focus:border-[#534AB7]" style={{ fontSize: 13 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border-[#E8E7E2] dark:border-border bg-background">
                  {["1-10 nhân viên", "11-50 nhân viên", "51-200 nhân viên", "201-500 nhân viên", "500+"].map((o) => (
                    <SelectItem key={o} value={o} style={{ fontSize: 13 }}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Múi giờ</Label>
              <Select value={form.timezone} onValueChange={set("timezone")}>
                <SelectTrigger className="h-10 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus:ring-[#534AB7]/30 focus:border-[#534AB7]" style={{ fontSize: 13 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border-[#E8E7E2] dark:border-border bg-background">
                  {["Asia/Ho_Chi_Minh (GMT+7)", "Asia/Singapore (GMT+8)", "UTC (GMT+0)"].map((o) => (
                    <SelectItem key={o} value={o} style={{ fontSize: 13 }}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Ngôn ngữ</Label>
              <Select value={form.language} onValueChange={set("language")}>
                <SelectTrigger className="h-10 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus:ring-[#534AB7]/30 focus:border-[#534AB7]" style={{ fontSize: 13 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border-[#E8E7E2] dark:border-border bg-background">
                  {["Tiếng Việt", "English"].map((o) => (
                    <SelectItem key={o} value={o} style={{ fontSize: 13 }}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Địa chỉ</Label>
              <Textarea
                value={form.address}
                onChange={(e) => set("address")(e.target.value)}
                placeholder="Địa chỉ công ty"
                rows={2}
                className="rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7] resize-none"
                style={{ fontSize: 13 }}
              />
            </div>

          </div>
        </div>
      </SectionCard>

      {/* Section 2 */}
      <SectionCard title="Workspace ID &amp; API">
        <CopyRow label="Workspace ID" value="ws_abc123xyz789" />
        <CopyRow label="Subdomain"    value="congtyabc.salesflow.vn" />
        <div className="flex items-center justify-between gap-4 py-3 border-b border-[#E8E7E2] dark:border-border">
          <span className="text-[#6B6B67] dark:text-muted-foreground shrink-0" style={{ fontSize: 13, width: 120 }}>Ngày tạo</span>
          <span className="flex-1 text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>12 tháng 1, 2026</span>
        </div>
        <div className="flex items-start gap-2.5 mt-4 px-3 py-2.5 rounded-[10px] bg-[#FFFBEB] dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-900">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-[#D97706] dark:text-amber-400" />
          <p style={{ fontSize: 12, color: "#92400E" }} className="dark:text-amber-300">
            Workspace ID được dùng để tích hợp API. Không thể thay đổi sau khi tạo.
          </p>
        </div>
      </SectionCard>

    </div>
  );
}

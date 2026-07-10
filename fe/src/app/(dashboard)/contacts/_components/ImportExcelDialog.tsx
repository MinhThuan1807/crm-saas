"use client";
import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBulkImportContacts } from "@/hooks/useContacts";
import { contactsService } from "@/services/contacts.service";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Upload, AlertCircle, CheckCircle, Trash2, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportExcelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  rowNum: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  tags: string[];
  ownerEmail: string | null;
  dealTitle: string | null;
  dealValue: number | null;
  dealStage: string | null;
  dealNote: string | null;
  isValid: boolean;
  errors: string[];
}

const systemFieldsList = [
  { key: "name", label: "Họ và tên *", required: true },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Số điện thoại", required: false },
  { key: "company", label: "Công ty", required: false },
  { key: "position", label: "Chức vụ", required: false },
  { key: "tags", label: "Tags (Nhãn)", required: false },
  { key: "ownerEmail", label: "Email người sở hữu", required: false },
  { key: "dealTitle", label: "Tên Deal đi kèm", required: false },
  { key: "dealValue", label: "Giá trị Deal (VND)", required: false },
  { key: "dealStage", label: "Trạng thái Deal", required: false },
  { key: "dealNote", label: "Ghi chú Deal", required: false }
];

export default function ImportExcelDialog({ isOpen, onOpenChange }: ImportExcelDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [aiMappings, setAiMappings] = useState<Record<string, string | null>>({});
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({});
  const [isMappingPending, setIsMappingPending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rawExcelRows, setRawExcelRows] = useState<any[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const { mutateAsync: bulkImport, isPending } = useBulkImportContacts();

  // 1. Tự động sinh file Excel mẫu và tải xuống client-side
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Họ và tên *": "Nguyễn Văn A",
        "Email": "nguyenvana@gmail.com",
        "Số điện thoại": "0987654321",
        "Công ty": "Công ty Cổ phần ABC",
        "Chức vụ": "Trưởng phòng Kinh doanh",
        "Tags (Chỉ nhận: Vip, Tiềm năng, Enterprise - phân cách bằng dấu phẩy)": "Vip, Tiềm năng",
        "Email người sở hữu": "sales_member@example.com",
        "Tên Deal đi kèm": "Hợp đồng thiết kế Web 2026",
        "Giá trị Deal (VND)": 15000000,
        "Trạng thái Deal": "Thương lượng",
        "Ghi chú Deal": "Khách hàng muốn triển khai sớm"
      },
      {
        "Họ và tên *": "Trần Thị B",
        "Email": "tranthib@gmail.com",
        "Số điện thoại": "0912345678",
        "Công ty": "",
        "Chức vụ": "",
        "Tags (Chỉ nhận: Vip, Tiềm năng, Enterprise - phân cách bằng dấu phẩy)": "Enterprise",
        "Email người sở hữu": "",
        "Tên Deal đi kèm": "",
        "Giá trị Deal (VND)": 0,
        "Trạng thái Deal": "",
        "Ghi chú Deal": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Contacts");
    XLSX.writeFile(workbook, "Mau_Import_Contacts.xlsx");
    toast.success("Đã tải xuống file mẫu thành công!");
  };

  // So khớp cột tự động bằng thuật toán synonyms cục bộ trước
  const autoMatchSynonyms = (headers: string[]) => {
    const mapped: Record<string, string | null> = {};
    const systemFields = [
      { key: "name", synonyms: ["Họ và tên", "Tên liên hệ", "Name", "Tên", "Họ tên"] },
      { key: "email", synonyms: ["Email", "Địa chỉ email", "Hòm thư"] },
      { key: "phone", synonyms: ["Số điện thoại", "Điện thoại", "Phone", "SĐT"] },
      { key: "company", synonyms: ["Công ty", "Company", "Doanh nghiệp"] },
      { key: "position", synonyms: ["Chức vụ", "Position", "Vai trò"] },
      { key: "tags", synonyms: ["Tags", "Nhãn", "Tag"] },
      { key: "ownerEmail", synonyms: ["Email người sở hữu", "Owner Email", "Chủ sở hữu"] },
      { key: "dealTitle", synonyms: ["Tên Deal đi kèm", "Tên Deal", "Deal Title", "Cơ hội"] },
      { key: "dealValue", synonyms: ["Giá trị Deal (VND)", "Giá trị Deal", "Giá trị", "Value", "Giá trị cơ hội"] },
      { key: "dealStage", synonyms: ["Trạng thái Deal", "Trạng thái", "Stage", "Trạng thái cơ hội"] },
      { key: "dealNote", synonyms: ["Ghi chú Deal", "Ghi chú", "Note"] }
    ];

    let allMatched = true;
    for (const field of systemFields) {
      const match = headers.find(h =>
        field.synonyms.some(syn => h.toLowerCase().trim() === syn.toLowerCase() || h.toLowerCase().trim().includes(syn.toLowerCase()))
      );
      if (match) {
        mapped[field.key] = match;
      } else {
        mapped[field.key] = null;
        if (field.key === "name") allMatched = false;
      }
    }

    const matchedHeadersCount = Object.values(mapped).filter(Boolean).length;
    if (matchedHeadersCount < headers.length * 0.7) {
      allMatched = false;
    }

    return { mapped, allMatched };
  };

  // Nhận file Excel và xử lý phân tích cấu trúc cột
  const handleUploadFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (rawJson.length === 0) {
          toast.error("File Excel trống hoặc không có dữ liệu!");
          return;
        }

        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
        const firstRow = rawRows[0] as string[];
        const headers = firstRow ? firstRow.filter(Boolean).map(String) : [];

        if (headers.length === 0) {
          toast.error("Không tìm thấy tiêu đề cột trong file của bạn!");
          return;
        }

        setRawHeaders(headers);
        setRawExcelRows(rawJson);

        // Chạy so khớp nhanh
        const { mapped, allMatched } = autoMatchSynonyms(headers);

        if (allMatched) {
          // Khớp hoàn hảo, chuyển thẳng sang màn hình Preview
          const cleanMappings: Record<string, string> = {};
          Object.entries(mapped).forEach(([key, val]) => {
            if (val) cleanMappings[key] = val;
          });
          setCustomMappings(cleanMappings);
          parseExcelRows(rawJson, cleanMappings);
          setStep("preview");
        } else {
          // Không khớp 100% cột mặc định -> Gọi AI phân tích và hiển thị Mapping UI
          setIsMappingPending(true);
          try {
            const aiRes = await contactsService.aiMapColumns(headers);
            setAiMappings(aiRes.mappings);

            const initialCustomMappings: Record<string, string> = {};
            Object.entries(aiRes.mappings).forEach(([key, val]) => {
              if (val) initialCustomMappings[key] = val;
            });

            // Gộp với những gì autoMatch tìm thấy nếu AI bỏ sót
            Object.entries(mapped).forEach(([key, val]) => {
              if (val && !initialCustomMappings[key]) {
                initialCustomMappings[key] = val;
              }
            });

            setCustomMappings(initialCustomMappings);
            setStep("mapping");
          } catch (err) {
            console.error("Lỗi AI Auto-mapping:", err);
            // Fallback sang tự map thủ công
            setAiMappings({});
            setStep("mapping");
          } finally {
            setIsMappingPending(false);
          }
        }
      } catch (err) {
        console.error("Lỗi đọc file:", err);
        toast.error("Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file!");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Hàm parse dữ liệu dòng dựa trên ánh xạ cột (Mapping) đã chọn
  const parseExcelRows = (rawJson: any[], mappings: Record<string, string>) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedTags = ["Enterprise", "Vip", "Tiềm năng"];

    const parsedRows: ParsedRow[] = rawJson.map((row, index) => {
      const rowNum = index + 2;

      const nameVal = mappings["name"] ? row[mappings["name"]] : undefined;
      const emailVal = mappings["email"] ? row[mappings["email"]] : undefined;
      const phoneVal = mappings["phone"] ? row[mappings["phone"]] : undefined;
      const companyVal = mappings["company"] ? row[mappings["company"]] : undefined;
      const positionVal = mappings["position"] ? row[mappings["position"]] : undefined;
      const tagsVal = mappings["tags"] ? row[mappings["tags"]] : undefined;
      const ownerEmailVal = mappings["ownerEmail"] ? row[mappings["ownerEmail"]] : undefined;
      const dealTitleVal = mappings["dealTitle"] ? row[mappings["dealTitle"]] : undefined;
      const dealValueRaw = mappings["dealValue"] ? row[mappings["dealValue"]] : undefined;
      const dealStageVal = mappings["dealStage"] ? row[mappings["dealStage"]] : undefined;
      const dealNoteVal = mappings["dealNote"] ? row[mappings["dealNote"]] : undefined;

      const errors: string[] = [];

      // Validate Họ tên bắt buộc
      if (!nameVal || String(nameVal).trim() === "") {
        errors.push("Tên không được để trống");
      }

      // Validate Email định dạng
      const emailStr = emailVal ? String(emailVal).trim() : "";
      if (emailStr && !emailRegex.test(emailStr)) {
        errors.push(`Email '${emailStr}' sai định dạng`);
      }

      // Validate Email Owner định dạng
      const ownerEmailStr = ownerEmailVal ? String(ownerEmailVal).trim() : "";
      if (ownerEmailStr && !emailRegex.test(ownerEmailStr)) {
        errors.push(`Email chủ sở hữu '${ownerEmailStr}' sai định dạng`);
      }

      // Validate Giá trị Deal
      let dealValue = null;
      if (dealValueRaw !== undefined && dealValueRaw !== "") {
        dealValue = Number(dealValueRaw);
        if (isNaN(dealValue) || dealValue < 0) {
          errors.push("Giá trị Deal phải là số không âm");
          dealValue = null;
        }
      }

      // Validate Tags
      const tags = tagsVal
        ? String(tagsVal).split(",").map(t => t.trim()).filter(Boolean)
        : [];

      tags.forEach(tag => {
        if (!allowedTags.includes(tag)) {
          errors.push(`Tag '${tag}' không hợp lệ. Chỉ chấp nhận: Enterprise, Vip, Tiềm năng`);
        }
      });

      return {
        rowNum,
        name: nameVal ? String(nameVal).trim() : "",
        email: emailStr || null,
        phone: phoneVal ? String(phoneVal).trim() : null,
        company: companyVal ? String(companyVal).trim() : null,
        position: positionVal ? String(positionVal).trim() : null,
        tags,
        ownerEmail: ownerEmailStr || null,
        dealTitle: dealTitleVal ? String(dealTitleVal).trim() : null,
        dealValue,
        dealStage: dealStageVal ? String(dealStageVal).trim() : null,
        dealNote: dealNoteVal ? String(dealNoteVal).trim() : null,
        isValid: errors.length === 0,
        errors,
      };
    });

    setRows(parsedRows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "xlsx" && fileExtension !== "xls" && fileExtension !== "csv") {
      toast.error("Chỉ chấp nhận các định dạng file .xlsx, .xls hoặc .csv!");
      return;
    }

    handleUploadFile(file);
  };

  const handleReset = () => {
    setFileName(null);
    setRows([]);
    setRawHeaders([]);
    setRawExcelRows([]);
    setAiMappings({});
    setCustomMappings({});
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleApplyMapping = () => {
    if (!customMappings["name"]) {
      toast.error("Trường 'Họ và tên' bắt buộc phải được ánh xạ!");
      return;
    }
    parseExcelRows(rawExcelRows, customMappings);
    setStep("preview");
  };

  const handleConfirmImport = async () => {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error("Không tìm thấy dòng dữ liệu nào hợp lệ để import!");
      return;
    }

    try {
      const result = await bulkImport(validRows);
      toast.success(`Import thành công ${result.count} liên hệ vào hệ thống!`);
      handleReset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Import thất bại. Vui lòng thử lại!");
    }
  };

  const totalRows = rows.length;
  const validRowsCount = rows.filter(r => r.isValid).length;
  const invalidRowsCount = totalRows - validRowsCount;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleReset();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <span>Import Contacts từ Excel / CSV</span>
            {step === "mapping" && <span className="text-xs font-normal bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">Ánh xạ cột AI</span>}
            {step === "preview" && <span className="text-xs font-normal bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full border border-green-200">Xem trước dữ liệu</span>}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Tự động đối chiếu thông tin tiêu đề cột thô bằng trí tuệ nhân tạo (AI) và chuyển đổi dữ liệu nhanh chóng vào CRM.
          </DialogDescription>
        </DialogHeader>

        {/* ──────── BƯỚC 1: TẢI FILE LÊN ──────── */}
        {step === "upload" && !isMappingPending && (
          <div className="flex flex-col gap-3 my-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Chọn hoặc kéo thả file dữ liệu:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-1.5 text-xs h-8 cursor-pointer border-border text-muted-foreground hover:text-foreground"
              >
                <Download size={13} />
                Tải file mẫu (.xlsx)
              </Button>
            </div>

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.99] shadow-inner"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <Upload size={32} className={`mb-3 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground/60"}`} />
              <p className="text-xs font-medium text-foreground mb-1">
                Kéo thả file Excel hoặc CSV vào đây
              </p>
              <p className="text-[10px] text-muted-foreground">
                Hoặc <span className="text-primary hover:underline font-semibold">chọn file từ máy tính</span> (hỗ trợ .xlsx, .xls, .csv)
              </p>
            </div>
          </div>
        )}

        {/* Trạng thái AI Loading */}
        {isMappingPending && (
          <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border border-dashed rounded-xl my-6 shrink-0">
            <Loader2 className="animate-spin text-primary mb-3" size={32} />
            <p className="text-xs font-semibold text-foreground">Đang xử lý phân tích tiêu đề cột bằng AI...</p>
            <p className="text-[10px] text-muted-foreground mt-1">Hệ thống đang tự động tìm mối tương quan giữa các cột thô</p>
          </div>
        )}

        {/* ──────── BƯỚC 2: MÀN HÌNH MAPPING (MAPPING UI) ──────── */}
        {step === "mapping" && (
          <div className="flex-1 overflow-y-auto space-y-4 my-2">
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
              <FileSpreadsheet size={20} className="text-primary mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">Phân tích cột bằng AI hoàn tất</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Chúng tôi đã tự động nhận diện các cột thô từ file Excel của bạn. Bạn hãy kiểm tra lại và chỉnh sửa qua dropdown nếu cần thiết.
                </p>
              </div>
            </div>

            <div className="border border-border/80 rounded-xl bg-background overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted text-muted-foreground font-semibold border-b border-border/75">
                  <tr>
                    <th className="p-3 w-1/3">Trường thông tin CRM</th>
                    <th className="p-3">Cột tương ứng trong file Excel của bạn</th>
                    <th className="p-3 text-center w-24">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {systemFieldsList.map((field) => {
                    const mappedValue = customMappings[field.key] || "";
                    const isMatchedByAi = aiMappings[field.key] !== null && aiMappings[field.key] !== undefined;

                    return (
                      <tr key={field.key} className="hover:bg-muted/15 transition-colors">
                        <td className="p-3 font-semibold text-foreground">
                          {field.label}
                        </td>
                        <td className="p-3">
                          <select
                            value={mappedValue}
                            onChange={(e) => setCustomMappings({ ...customMappings, [field.key]: e.target.value })}
                            className="w-full max-w-md h-9 px-3 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                          >
                            <option value="">-- Bỏ qua cột này / Không import --</option>
                            {rawHeaders.map((header) => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          {mappedValue ? (
                            isMatchedByAi ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] bg-green-50 text-green-700 border border-green-200 font-semibold shadow-2xs">
                                AI Match
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] bg-sky-50 text-sky-700 border border-sky-200 font-semibold shadow-2xs">
                                Manual
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">Trống</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ──────── BƯỚC 3: BẢNG XEM TRƯỚC (PREVIEW TABLE) ──────── */}
        {step === "preview" && (
          <>
            {/* Thẻ file hiện tại */}
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border/80 text-xs mb-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-green-600 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground max-w-[260px] truncate">{fileName}</span>
                  <span className="text-[10px] text-muted-foreground">Đã ánh xạ cột thành công</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer gap-1.5"
              >
                <Trash2 size={13} />
                Chọn file khác
              </Button>
            </div>

            {/* Tóm tắt chất lượng dữ liệu */}
            {totalRows > 0 && (
              <div className="flex gap-4 p-3 bg-muted/50 rounded-lg border text-xs mb-3 shrink-0 font-medium">
                <div className="flex items-center gap-1.5 text-foreground">
                  <span>Tổng số:</span>
                  <strong className="text-sm font-semibold">{totalRows} dòng</strong>
                </div>
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle size={14} />
                  <span>Hợp lệ:</span>
                  <strong className="text-sm font-semibold">{validRowsCount}</strong>
                </div>
                {invalidRowsCount > 0 && (
                  <div className="flex items-center gap-1.5 text-destructive">
                    <AlertCircle size={14} />
                    <span>Không hợp lệ (bị bỏ qua):</span>
                    <strong className="text-sm font-semibold">{invalidRowsCount}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Bảng xem trước dữ liệu (Preview Table) */}
            <div className="flex-1 min-h-[250px] overflow-auto border rounded-lg bg-background">
              {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                  <FileSpreadsheet size={44} className="stroke-[1.2] mb-3 text-muted-foreground/60" />
                  <p className="text-xs">Không có dữ liệu xem trước.</p>
                </div>
              ) : (
                <table className="w-full text-[11px] text-left border-collapse min-w-[800px]">
                  <thead className="bg-muted sticky top-0 font-semibold border-b text-muted-foreground uppercase tracking-wider h-8">
                    <tr>
                      <th className="px-3 border-r w-12 text-center">Dòng</th>
                      <th className="px-3 border-r">Họ tên *</th>
                      <th className="px-3 border-r">Email</th>
                      <th className="px-3 border-r">Điện thoại</th>
                      <th className="px-3 border-r">Công ty</th>
                      <th className="px-3 border-r">Deal Title</th>
                      <th className="px-3 border-r text-right">Trị giá Deal</th>
                      <th className="px-3 border-r text-center">Trạng thái Deal</th>
                      <th className="px-3 text-center">Trạng thái dòng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? "hover:bg-muted/30" : "bg-destructive/10 hover:bg-destructive/15"}>
                        <td className="px-3 py-1.5 border-r text-center text-muted-foreground font-medium">{row.rowNum}</td>
                        <td className="px-3 py-1.5 border-r font-medium text-foreground">{row.name}</td>
                        <td className="px-3 py-1.5 border-r text-muted-foreground">{row.email || "-"}</td>
                        <td className="px-3 py-1.5 border-r text-muted-foreground">{row.phone || "-"}</td>
                        <td className="px-3 py-1.5 border-r text-muted-foreground">{row.company || "-"}</td>
                        <td className="px-3 py-1.5 border-r text-muted-foreground font-medium">{row.dealTitle || "-"}</td>
                        <td className="px-3 py-1.5 border-r text-right text-muted-foreground">
                          {row.dealValue !== null ? row.dealValue.toLocaleString() : "-"}
                        </td>
                        <td className="px-3 py-1.5 border-r text-center">
                          {row.dealStage ? (
                            <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] bg-sky-50 text-sky-700 border border-sky-200">
                              {row.dealStage}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="px-3 py-1.5">
                          {row.isValid ? (
                            <span className="flex items-center justify-center text-green-600 gap-1 font-semibold text-[10px]">
                              <CheckCircle size={12} /> Hợp lệ
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5 text-destructive font-medium text-[10px]">
                              {row.errors.map((err, eIdx) => (
                                <span key={eIdx} className="flex items-center gap-1">
                                  <AlertCircle size={10} /> {err}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ──────── ĐIỀU KHIỂN NÚT HÀNH ĐỘNG ──────── */}
        <div className="shrink-0 flex items-center justify-between pt-4 border-t mt-4">
          <div>
            {step === "mapping" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs h-9 cursor-pointer gap-1.5 border-border"
              >
                <ArrowLeft size={13} />
                Quay lại Upload
              </Button>
            )}
            {step === "preview" && rawHeaders.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("mapping")}
                className="text-xs h-9 cursor-pointer gap-1.5 border-border"
              >
                <ArrowLeft size={13} />
                Sửa Ánh xạ cột
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
              className="text-xs h-9 cursor-pointer border border-transparent hover:bg-muted"
            >
              Hủy bỏ
            </Button>

            {step === "mapping" && (
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyMapping}
                className="text-xs h-9 cursor-pointer gap-1.5 bg-primary text-white"
              >
                Xem trước dữ liệu
                <ChevronRight size={13} />
              </Button>
            )}

            {step === "preview" && (
              <Button
                variant="default"
                size="sm"
                onClick={handleConfirmImport}
                disabled={isPending || validRowsCount === 0}
                className="text-xs h-9 cursor-pointer bg-primary text-white"
              >
                {isPending ? "Đang import..." : `Xác nhận Import (${validRowsCount} dòng)`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

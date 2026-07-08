"use client";
import React, { useState } from "react";
import { useGetAuditLogs } from "@/hooks/useAudit-logs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Filter, RefreshCw, Eye } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";
import { AuditLogItem } from "@/services/audit-logs.service";
import { formatDate } from "@/lib/helper";

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 300);
  const [action, setAction] = useState<string>("all");
  const [targetType, setTargetType] = useState<string>("all");

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useGetAuditLogs({
    limit: 15,
    search: debouncedSearch || undefined,
    action: action !== "all" ? action : undefined,
    targetType: targetType !== "all" ? targetType : undefined,
  });

  const logs = data?.pages.flatMap((page) => page.data) ?? [];

  const getActionBadgeStyle = (act: string) => {
    switch (act) {
      case "CREATE":
        return "bg-green-50 text-green-700 border-green-200";
      case "UPDATE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "DELETE":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="h-14 shrink-0 border-b flex items-center justify-between px-6">
        <h1 className="text-[#1A1A18] text-sm font-semibold tracking-tight">Audit Logs</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tìm theo đối tượng, người dùng..."
              className="h-8 pl-8 w-48 text-xs border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="Hành động" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi hành động</SelectItem>
              <SelectItem value="CREATE">CREATE</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>

          <Select value={targetType} onValueChange={setTargetType}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="Thực thể" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi thực thể</SelectItem>
              <SelectItem value="DEAL">DEAL</SelectItem>
              <SelectItem value="CONTACT">CONTACT</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => refetch()}>
            <RefreshCw size={13} />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#F8F8F7] p-5">
        <div className="bg-background rounded-xl border border-border/70 p-4 shadow-sm min-h-full flex flex-col justify-between">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Thời gian</TableHead>
                  <TableHead className="w-[160px]">Người thực hiện</TableHead>
                  <TableHead className="w-[110px]">Hành động</TableHead>
                  <TableHead className="w-[130px]">Loại thực thể</TableHead>
                  <TableHead>Tên đối tượng</TableHead>
                  <TableHead className="text-right w-[80px]">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt)} <br />
                    </TableCell>
                    <TableCell className="text-sm font-medium text-[#1A1A18]">
                      {log.user?.name || "Hệ thống"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-full ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-[#534AB7]">{log.targetType}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate text-[#495057]">{log.targetName || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer hover:bg-muted"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">Không tìm thấy bản ghi nhật ký hoạt động nào.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 cursor-pointer"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Đang tải..." : "Tải thêm nhật ký"}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        {selectedLog && (
          <DialogContent className="max-w-xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">Chi tiết thay đổi</DialogTitle>
              <DialogDescription className="text-xs">
                Mô tả chi tiết những dữ liệu đã được điều chỉnh.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2 text-xs border-b pb-3">
                <div>
                  <span className="text-[#868E96] block">Người thực hiện</span>
                  <strong className="text-[#212529]">{selectedLog.user?.name} ({selectedLog.user?.role})</strong>
                </div>
                <div>
                  <span className="text-[#868E96] block">Đối tượng tác động</span>
                  <strong className="text-[#212529]">{selectedLog.targetType}: {selectedLog.targetName}</strong>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-1">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trường</TableHead>
                      <TableHead>Giá trị cũ (Old)</TableHead>
                      <TableHead>Giá trị mới (New)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(selectedLog.changes || {}).map(([field, val]: [string, any]) => (
                      <TableRow key={field}>
                        <TableCell className="font-medium text-[#534AB7]">{field}</TableCell>
                        <TableCell className="text-red-600 line-through bg-red-50/50 max-w-[150px] truncate">
                          {val.old !== null && val.old !== undefined ? String(val.old) : "NULL"}
                        </TableCell>
                        <TableCell className="text-green-700 font-semibold bg-green-50/50 max-w-[150px] truncate">
                          {val.new !== null && val.new !== undefined ? String(val.new) : "NULL"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

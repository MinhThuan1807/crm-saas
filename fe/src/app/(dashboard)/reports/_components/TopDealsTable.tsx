import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getAvatarColors, formatVndShort, formatDate } from "@/lib/helper";

type Filter = "all" | "won" | "lost";

const FILTER_LABELS: Record<Filter, string> = {
  all: "Tất cả",
  won: "Closed Won",
  lost: "Closed Lost",
};

export interface TopDeal {
  id: string;
  name: string;
  company: string;
  owner: {
    id: string;
    name: string;
  };
  value: number;
  closedAt: string;
  stage: string;
}

interface TopDealsTableProps {
  deals?: TopDeal[];
}

export function TopDealsTable({ deals = [] }: TopDealsTableProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filtered = filter === "all"
    ? deals
    : deals.filter((d) =>
        filter === "won" ? d.stage === "CLOSED_WON" : d.stage === "CLOSED_LOST"
      );

  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedDeals = filtered.slice(startIndex, endIndex);

  

  return (
    <div className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E8E7E2] dark:border-border">
        <div>
          <h3 className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
            Top Deals đã chốt
          </h3>
          <p className="text-[#6B6B67] dark:text-muted-foreground mt-0.5" style={{ fontSize: 11 }}>
            Deals đóng trong kỳ được chọn
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 bg-[#F1EFE8] dark:bg-muted p-0.5 rounded-lg">
          {(["all", "won", "lost"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 h-7 rounded-md transition-all cursor-pointer whitespace-nowrap"
              style={{
                fontSize: 12,
                fontWeight: filter === f ? 500 : 400,
                background: filter === f ? "var(--card)" : "transparent",
                color: filter === f ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: filter === f ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Deal", "Công ty", "Owner", "Giá trị", "Ngày chốt", "Giai đoạn"].map((col) => (
                <th
                  key={col}
                  className="text-left text-[#6B6B67] dark:text-muted-foreground px-5 py-3"
                  style={{ fontSize: 11, fontWeight: 500 }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedDeals.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 12 }}>
                  Không có dữ liệu trong kỳ
                </td>
              </tr>
            ) : (
              paginatedDeals.map((deal, i) => (
                <tr
                  key={deal.id}
                  className="hover:bg-[#F8F8F7] dark:hover:bg-muted/50 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  {/* Deal name */}
                  <td className="px-5 py-3">
                    <span className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 12, fontWeight: 500 }}>
                      {deal.name}
                    </span>
                  </td>

                  {/* Company */}
                  <td className="px-5 py-3">
                    <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 12 }}>{deal.company}</span>
                  </td>

                  {/* Owner */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6 shrink-0">
                        <AvatarFallback
                          style={{
                            background: getAvatarColors(deal.owner.id).bg,
                            color: getAvatarColors(deal.owner.id).color,
                            fontSize: 8,
                            fontWeight: 700,
                          }}
                          className="border-0"
                        >
                          {getInitials(deal.owner.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[#1A1A18] dark:text-foreground whitespace-nowrap" style={{ fontSize: 12 }}>
                        {deal.owner.name}
                      </span>
                    </div>
                  </td>

                  {/* Value */}
                  <td className="px-5 py-3">
                    <span className="text-[#1A1A18] dark:text-foreground tabular-nums" style={{ fontSize: 12, fontWeight: 600 }}>
                      {formatVndShort(deal.value)}
                    </span>
                  </td>

                  {/* Close date */}
                  <td className="px-5 py-3">
                    <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 12 }}>{formatDate(deal.closedAt)}</span>
                  </td>

                  {/* Stage */}
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        background: deal.stage === "CLOSED_WON" ? "#DCFCE7" : "#FEE2E2",
                        color:      deal.stage === "CLOSED_WON" ? "#166534" : "#991B1B",
                      }}
                    >
                      {deal.stage === "CLOSED_WON" ? "Closed Won" : "Closed Lost"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#E8E7E2] dark:border-border">
        <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 12 }}>
          Hiển thị {totalItems > 0 ? startIndex + 1 : 0} - {endIndex} trong {totalItems} deals
        </span>
        
        <div className="flex items-center gap-1">
          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 12 }}>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            className="size-7 flex items-center justify-center rounded hover:bg-[#F1EFE8] dark:hover:bg-muted transition-colors cursor-pointer"
            style={{ border: "1px solid var(--border)", background: "var(--card)" }}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            >
            <ChevronLeft size={14} className="text-[#6B6B67] dark:text-muted-foreground" />
          </button>
          <button
            className="size-7 flex items-center justify-center rounded hover:bg-[#F1EFE8] dark:hover:bg-muted transition-colors cursor-pointer"
            style={{ border: "1px solid var(--border)", background: "var(--card)" }}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight size={14} className="text-[#6B6B67] dark:text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

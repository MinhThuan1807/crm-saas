import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { topDeals } from "./reportsData";

type Filter = "all" | "won" | "lost";

const FILTER_LABELS: Record<Filter, string> = {
  all: "Tất cả",
  won: "Closed Won",
  lost: "Closed Lost",
};

export function TopDealsTable() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all"
    ? topDeals
    : topDeals.filter((d) =>
        filter === "won" ? d.stage === "CLOSED_WON" : d.stage === "CLOSED_LOST"
      );

  return (
    <div className="bg-white rounded-[10px] border border-[#E8E7E2]">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E8E7E2]">
        <div>
          <h3 className="text-[#1A1A18]" style={{ fontSize: 13, fontWeight: 600 }}>
            Top Deals đã chốt
          </h3>
          <p className="text-[#6B6B67] mt-0.5" style={{ fontSize: 11 }}>
            Deals đóng trong kỳ được chọn
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 bg-[#F1EFE8] p-0.5 rounded-lg">
          {(["all", "won", "lost"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 h-7 rounded-md transition-all cursor-pointer whitespace-nowrap"
              style={{
                fontSize: 12,
                fontWeight: filter === f ? 500 : 400,
                background: filter === f ? "#ffffff" : "transparent",
                color: filter === f ? "#1A1A18" : "#6B6B67",
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
            <tr style={{ borderBottom: "1px solid #E8E7E2" }}>
              {["Deal", "Công ty", "Owner", "Giá trị", "Ngày chốt", "Nguồn", "Giai đoạn"].map((col) => (
                <th
                  key={col}
                  className="text-left text-[#6B6B67] px-5 py-3"
                  style={{ fontSize: 11, fontWeight: 500 }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((deal, i) => (
              <tr
                key={deal.id}
                className="hover:bg-[#F8F8F7] transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid #E8E7E2" : "none" }}
              >
                {/* Deal name */}
                <td className="px-5 py-3">
                  <span className="text-[#1A1A18]" style={{ fontSize: 12, fontWeight: 500 }}>
                    {deal.name}
                  </span>
                </td>

                {/* Company */}
                <td className="px-5 py-3">
                  <span className="text-[#6B6B67]" style={{ fontSize: 12 }}>{deal.company}</span>
                </td>

                {/* Owner */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback
                        style={{ background: deal.ownerBg, color: deal.ownerC, fontSize: 8, fontWeight: 700 }}
                        className="border-0"
                      >
                        {deal.ownerI}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[#1A1A18] whitespace-nowrap" style={{ fontSize: 12 }}>
                      {deal.owner}
                    </span>
                  </div>
                </td>

                {/* Value */}
                <td className="px-5 py-3">
                  <span className="text-[#1A1A18] tabular-nums" style={{ fontSize: 12, fontWeight: 600 }}>
                    {deal.value}
                  </span>
                </td>

                {/* Close date */}
                <td className="px-5 py-3">
                  <span className="text-[#6B6B67]" style={{ fontSize: 12 }}>{deal.closedAt}</span>
                </td>

                {/* Source */}
                <td className="px-5 py-3">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      background: "#F1EFE8",
                      color: "#6B6B67",
                    }}
                  >
                    {deal.source}
                  </span>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#E8E7E2]">
        <span className="text-[#6B6B67]" style={{ fontSize: 12 }}>
          Hiển thị {filtered.length} trong 23 deals
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[#6B6B67]" style={{ fontSize: 12 }}>1–6 / 23</span>
          <button
            className="size-7 flex items-center justify-center rounded hover:bg-[#F1EFE8] transition-colors cursor-pointer"
            style={{ border: "1px solid #E8E7E2", background: "white" }}
          >
            <ChevronLeft size={14} className="text-[#6B6B67]" />
          </button>
          <button
            className="size-7 flex items-center justify-center rounded hover:bg-[#F1EFE8] transition-colors cursor-pointer"
            style={{ border: "1px solid #E8E7E2", background: "white" }}
          >
            <ChevronRight size={14} className="text-[#6B6B67]" />
          </button>
        </div>
      </div>
    </div>
  );
}

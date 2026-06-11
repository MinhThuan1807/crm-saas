import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { activityTrendData, activityStatusData } from "./reportsData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E7E2] rounded-lg shadow-md px-3 py-2.5 text-xs">
      <p className="text-[#1A1A18] mb-1.5" style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between items-center gap-6 mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full shrink-0" style={{ background: p.fill }} />
            <span className="text-[#6B6B67]">{p.name}:</span>
          </div>
          <span className="text-[#1A1A18] font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const LEGEND = [
  { color: "#534AB7", name: "Calls" },
  { color: "#7F77DD", name: "Emails" },
  { color: "#AFA9EC", name: "Meetings" },
  { color: "#1D9E75", name: "Tasks" },
];

export function ActivityReportTab() {
  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-[10px] border border-[#E8E7E2] p-4 flex flex-col gap-1.5">
          <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>Tỷ lệ Gọi / Hẹn gặp</span>
          <span className="text-[#1A1A18] font-bold" style={{ fontSize: 20 }}>7.2 : 1</span>
          <span className="text-[#6B6B67]" style={{ fontSize: 10 }}>7.2 cuộc gọi để tạo 1 cuộc hẹn</span>
        </div>
        <div className="bg-white rounded-[10px] border border-[#E8E7E2] p-4 flex flex-col gap-1.5">
          <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>Tỷ lệ Gặp / Chốt deal</span>
          <span className="text-[#1A1A18] font-bold" style={{ fontSize: 20 }}>3.5 : 1</span>
          <span className="text-[#6B6B67]" style={{ fontSize: 10 }}>3.5 cuộc họp để chốt 1 hợp đồng</span>
        </div>
        <div className="bg-white rounded-[10px] border border-[#E8E7E2] p-4 flex flex-col gap-1.5">
          <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>Tần suất hoạt động / Deal</span>
          <span className="text-[#1A1A18] font-bold" style={{ fontSize: 20 }}>48</span>
          <span className="text-[#6B6B67]" style={{ fontSize: 10 }}>Số tương tác trung bình mỗi deal thắng</span>
        </div>
        <div className="bg-white rounded-[10px] border border-[#E8E7E2] p-4 flex flex-col gap-1.5">
          <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>Nhiệm vụ trễ hạn (Overdue)</span>
          <span className="text-[#D85A30] font-bold" style={{ fontSize: 20 }}>14%</span>
          <span className="text-[#6B6B67]" style={{ fontSize: 10 }}>Cần tập trung giải quyết việc quá hạn</span>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trend Bar Chart */}
        <div className="md:col-span-2">
          <ChartCard
            title="Xu hướng hoạt động theo tháng"
            subtitle="Phân bố các loại cuộc gọi, email, họp mặt và nhiệm vụ"
            action={
              <div className="flex items-center gap-3 mr-1">
                {LEGEND.map((l) => (
                  <div key={l.name} className="flex items-center gap-1">
                    <div className="size-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
                    <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>{l.name}</span>
                  </div>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={activityTrendData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B6B67" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B6B67" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Calls" stackId="activities" name="Calls" fill="#534AB7" />
                <Bar dataKey="Emails" stackId="activities" name="Emails" fill="#7F77DD" />
                <Bar dataKey="Meetings" stackId="activities" name="Meetings" fill="#AFA9EC" />
                <Bar dataKey="Tasks" stackId="activities" name="Tasks" fill="#1D9E75" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Task status Donut Chart */}
        <ChartCard
          title="Trạng thái nhiệm vụ"
          subtitle="Tỷ lệ hoàn thành công việc được giao"
        >
          <div className="flex flex-col items-center gap-2" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={activityStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {activityStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom status legend labels */}
            <div className="w-full grid grid-cols-3 gap-1 mt-1">
              {activityStatusData.map((d) => (
                <div key={d.name} className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1 mb-0.5">
                    <div className="size-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-[#6B6B67]" style={{ fontSize: 10 }}>{d.name}</span>
                  </div>
                  <span className="text-[#1A1A18] font-bold" style={{ fontSize: 12 }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

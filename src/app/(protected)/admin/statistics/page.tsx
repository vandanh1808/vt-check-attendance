"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import PageHeader from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { getDefaultDateRange } from "@/lib/helpers/date";

interface TodayOverview {
  totalEmployees: number;
  checkedIn: number;
  notCheckedIn: number;
  lateCount: number;
}

interface DeptStats {
  tenPhongBan: string;
  totalEmployees: number;
  attendanceRate: number;
  lateCount: number;
  avgCheckInMinutes: number;
}

interface EmployeeRanking {
  maNhanVien: string;
  tenNhanVien: string;
  tenPhongBan: string | null;
  absentDays: number;
  lateDays: number;
  presentDays: number;
  totalWorkdays: number;
  attendanceRate: number;
}

interface DailyTrend {
  date: string;
  presentCount: number;
  totalEmployees: number;
  lateCount: number;
}

interface OvertimeEmployee {
  maNhanVien: string;
  tenNhanVien: string;
  tenPhongBan: string | null;
  overtimeDays: number;
  totalOvertimeMinutes: number;
}

interface DeptOvertime {
  tenPhongBan: string;
  overtimeDays: number;
  totalOvertimeMinutes: number;
  employeeCount: number;
}

interface DeptWorkingHours {
  tenPhongBan: string;
  avgWorkingMinutes: number;
  minWorkingMinutes: number;
  maxWorkingMinutes: number;
}

interface EarlyLeaveEmployee {
  maNhanVien: string;
  tenNhanVien: string;
  tenPhongBan: string | null;
  earlyLeaveDays: number;
  avgCheckOutMinutes: number;
}

interface WeekdayPattern {
  dayOfWeek: number;
  dayName: string;
  presentCount: number;
  lateCount: number;
  avgCount: number;
}

interface StatsData {
  overview: TodayOverview;
  deptStats: DeptStats[];
  rankings: { mostAbsent: EmployeeRanking[]; mostLate: EmployeeRanking[] };
  trend: DailyTrend[];
  overtime: { employees: OvertimeEmployee[]; departments: DeptOvertime[] };
  workingHours: DeptWorkingHours[];
  earlyLeave: EarlyLeaveEmployee[];
  weekday: WeekdayPattern[];
  meta: { workdays: number; holidays: number };
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${color.replace("text-", "bg-").replace("700", "50").replace("600", "50").replace("900", "50")}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

const DEPT_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
];

export default function AdminStatisticsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(() => getDefaultDateRange().fromDate);
  const [toDate, setToDate] = useState(() => getDefaultDateRange().toDate);
  const [lateThreshold, setLateThreshold] = useState("08:00");
  const [overtimeAfter, setOvertimeAfter] = useState("17:00");
  const [earlyBefore, setEarlyBefore] = useState("17:00");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ fromDate, toDate, lateThreshold, overtimeAfter, earlyBefore });
      const res = await fetch(`/api/admin/statistics?${query}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Lỗi khi tải thống kê");
        return;
      }
      setData(json.data);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, lateThreshold, overtimeAfter, earlyBefore]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thống kê chấm công"
        description="Tổng quan chuyên cần và phân tích xu hướng"
      />

      <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Từ ngày</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Đến ngày</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Giờ trễ sau</label>
          <input
            type="time"
            value={lateThreshold}
            onChange={(e) => { if (e.target.value) setLateThreshold(e.target.value); }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Tăng ca sau</label>
          <input
            type="time"
            value={overtimeAfter}
            onChange={(e) => { if (e.target.value) setOvertimeAfter(e.target.value); }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Về sớm trước</label>
          <input
            type="time"
            value={earlyBefore}
            onChange={(e) => { if (e.target.value) setEarlyBefore(e.target.value); }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        {data && (
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
            <span>{data.meta.workdays} ngày làm việc</span>
            {data.meta.holidays > 0 && <span>{data.meta.holidays} ngày lễ</span>}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <Spinner className="py-12" />
      ) : data ? (
        <div className="space-y-6">
          {/* Today overview */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Tổng nhân viên"
              value={data.overview.totalEmployees}
              color="text-slate-900"
              icon={<UsersIcon className="h-5 w-5 text-slate-500" />}
            />
            <StatCard
              label="Đã check-in hôm nay"
              value={data.overview.checkedIn}
              sub={`${data.overview.notCheckedIn} chưa check-in`}
              color="text-emerald-600"
              icon={<CheckIcon className="h-5 w-5 text-emerald-600" />}
            />
            <StatCard
              label="Chưa check-in"
              value={data.overview.notCheckedIn}
              color={data.overview.notCheckedIn > 0 ? "text-red-600" : "text-emerald-600"}
              icon={<XIcon className="h-5 w-5 text-red-500" />}
            />
            <StatCard
              label="Đi trễ hôm nay"
              value={data.overview.lateCount}
              sub={`Sau ${lateThreshold}`}
              color={data.overview.lateCount > 0 ? "text-amber-600" : "text-emerald-600"}
              icon={<ClockIcon className="h-5 w-5 text-amber-500" />}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Department attendance rate */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Tỷ lệ chuyên cần theo phòng ban
              </h3>
              {data.deptStats.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Không có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.deptStats} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="tenPhongBan" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => `${Math.round(Number(value) * 100)}%`}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Bar dataKey="attendanceRate" name="Chuyên cần" radius={[0, 4, 4, 0]}>
                      {data.deptStats.map((_, i) => (
                        <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Avg check-in time by department */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Giờ check-in trung bình theo phòng ban
              </h3>
              {data.deptStats.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Không có dữ liệu</p>
              ) : (
                <div className="space-y-2.5">
                  {data.deptStats
                    .filter((d) => d.avgCheckInMinutes > 0)
                    .sort((a, b) => a.avgCheckInMinutes - b.avgCheckInMinutes)
                    .map((dept, i) => {
                      const time = minutesToTime(dept.avgCheckInMinutes);
                      const isLate = time > lateThreshold;
                      return (
                        <div key={dept.tenPhongBan} className="flex items-center gap-3">
                          <span className="w-28 truncate text-sm text-slate-600">{dept.tenPhongBan}</span>
                          <div className="relative h-6 flex-1 rounded-full bg-slate-100">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (dept.avgCheckInMinutes / 600) * 100)}%`,
                                backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length],
                                opacity: 0.8,
                              }}
                            />
                          </div>
                          <span className={`w-12 text-right text-sm font-medium ${isLate ? "text-amber-600" : "text-slate-700"}`}>
                            {time}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Trend chart */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Xu hướng chuyên cần
            </h3>
            {data.trend.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Không có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(label) => formatShortDate(label as string)}
                    contentStyle={{ borderRadius: 8, fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="presentCount"
                    name="Có mặt"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lateCount"
                    name="Đi trễ"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Most absent */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Top nghỉ nhiều nhất
              </h3>
              <RankingTable
                data={data.rankings.mostAbsent}
                valueKey="absentDays"
                valueLabel="Ngày nghỉ"
                emptyMessage="Không có ai nghỉ"
              />
            </div>

            {/* Most late */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Top đi trễ nhiều nhất
              </h3>
              <RankingTable
                data={data.rankings.mostLate}
                valueKey="lateDays"
                valueLabel="Ngày trễ"
                emptyMessage="Không có ai đi trễ"
              />
            </div>
          </div>

          {/* Overtime section */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Top overtime employees */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Top tăng ca nhiều nhất
              </h3>
              <OvertimeTable data={data.overtime.employees} />
            </div>

            {/* Overtime by department */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Tăng ca theo phòng ban
              </h3>
              {data.overtime.departments.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Không có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.overtime.departments} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 60)}h`} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="tenPhongBan" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => formatDuration(Number(value))}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Bar dataKey="totalOvertimeMinutes" name="Tổng tăng ca" radius={[0, 4, 4, 0]}>
                      {data.overtime.departments.map((_, i) => (
                        <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Working hours + Early leave */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Working hours by department */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Giờ làm trung bình theo phòng ban
              </h3>
              {data.workingHours.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Không có dữ liệu</p>
              ) : (
                <div className="space-y-2.5">
                  {data.workingHours.map((dept, i) => {
                    const avgTime = minutesToTime(dept.avgWorkingMinutes);
                    const avgHours = dept.avgWorkingMinutes / 60;
                    return (
                      <div key={dept.tenPhongBan} className="flex items-center gap-3">
                        <span className="w-28 truncate text-sm text-slate-600">{dept.tenPhongBan}</span>
                        <div className="relative h-6 flex-1 rounded-full bg-slate-100">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (dept.avgWorkingMinutes / 720) * 100)}%`,
                              backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length],
                              opacity: 0.8,
                            }}
                          />
                        </div>
                        <span className={`w-14 text-right text-sm font-medium ${avgHours < 8 ? "text-amber-600" : "text-slate-700"}`}>
                          {avgTime}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Early leave ranking */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Top về sớm nhiều nhất
              </h3>
              <EarlyLeaveTable data={data.earlyLeave} />
            </div>
          </div>

          {/* Weekday pattern */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Thói quen theo thứ trong tuần
            </h3>
            {data.weekday.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Không có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.weekday} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="avgCount" name="TB có mặt/ngày" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lateCount" name="Tổng đi trễ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h${m > 0 ? `${m}p` : ""}`;
}

function OvertimeTable({ data }: { data: OvertimeEmployee[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Không có ai tăng ca</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <th className="pb-2 pr-3 font-semibold">#</th>
            <th className="pb-2 pr-3 font-semibold">Nhân viên</th>
            <th className="pb-2 pr-3 font-semibold">Phòng ban</th>
            <th className="pb-2 pr-3 text-right font-semibold">Số ngày</th>
            <th className="pb-2 text-right font-semibold">Tổng giờ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((emp, i) => (
            <tr key={emp.maNhanVien} className="hover:bg-slate-50/50">
              <td className="py-2.5 pr-3 font-medium text-slate-400">{i + 1}</td>
              <td className="py-2.5 pr-3">
                <span className="font-medium text-slate-900">{emp.tenNhanVien}</span>
                <span className="ml-1.5 text-xs text-slate-400">{emp.maNhanVien}</span>
              </td>
              <td className="py-2.5 pr-3 text-slate-500">{emp.tenPhongBan ?? "--"}</td>
              <td className="py-2.5 pr-3 text-right font-semibold text-slate-900">{emp.overtimeDays}</td>
              <td className="py-2.5 text-right">
                <Badge variant="info">{formatDuration(emp.totalOvertimeMinutes)}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EarlyLeaveTable({ data }: { data: EarlyLeaveEmployee[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Không có ai về sớm</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <th className="pb-2 pr-3 font-semibold">#</th>
            <th className="pb-2 pr-3 font-semibold">Nhân viên</th>
            <th className="pb-2 pr-3 font-semibold">Phòng ban</th>
            <th className="pb-2 pr-3 text-right font-semibold">Số ngày</th>
            <th className="pb-2 text-right font-semibold">TB ra</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((emp, i) => (
            <tr key={emp.maNhanVien} className="hover:bg-slate-50/50">
              <td className="py-2.5 pr-3 font-medium text-slate-400">{i + 1}</td>
              <td className="py-2.5 pr-3">
                <span className="font-medium text-slate-900">{emp.tenNhanVien}</span>
                <span className="ml-1.5 text-xs text-slate-400">{emp.maNhanVien}</span>
              </td>
              <td className="py-2.5 pr-3 text-slate-500">{emp.tenPhongBan ?? "--"}</td>
              <td className="py-2.5 pr-3 text-right font-semibold text-slate-900">{emp.earlyLeaveDays}</td>
              <td className="py-2.5 text-right">
                <Badge variant="warning">{minutesToTime(emp.avgCheckOutMinutes)}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankingTable({
  data,
  valueKey,
  valueLabel,
  emptyMessage,
}: {
  data: EmployeeRanking[];
  valueKey: "absentDays" | "lateDays";
  valueLabel: string;
  emptyMessage: string;
}) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <th className="pb-2 pr-3 font-semibold">#</th>
            <th className="pb-2 pr-3 font-semibold">Nhân viên</th>
            <th className="pb-2 pr-3 font-semibold">Phòng ban</th>
            <th className="pb-2 pr-3 text-right font-semibold">{valueLabel}</th>
            <th className="pb-2 text-right font-semibold">Chuyên cần</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((emp, i) => {
            const pct = Math.round(emp.attendanceRate * 100);
            const variant = pct >= 90 ? "success" : pct >= 70 ? "warning" : "danger";
            return (
              <tr key={emp.maNhanVien} className="hover:bg-slate-50/50">
                <td className="py-2.5 pr-3 font-medium text-slate-400">{i + 1}</td>
                <td className="py-2.5 pr-3">
                  <div>
                    <span className="font-medium text-slate-900">{emp.tenNhanVien}</span>
                    <span className="ml-1.5 text-xs text-slate-400">{emp.maNhanVien}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-3 text-slate-500">{emp.tenPhongBan ?? "--"}</td>
                <td className="py-2.5 pr-3 text-right font-semibold text-slate-900">
                  {emp[valueKey]}
                </td>
                <td className="py-2.5 text-right">
                  <Badge variant={variant}>{pct}%</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

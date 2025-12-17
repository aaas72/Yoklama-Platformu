import React, { useState, useEffect } from "react";
import {
  Users,
  School,
  Calendar,
  TrendingUp,
  MoreHorizontal,
  ArrowUpRight,
  Camera,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  getAttendanceStats,
  triggerTraining,
} from "../../services/attendanceService";
import { getSchoolInfo, type SchoolInfo } from "../../services/schoolService";

const Overview: React.FC = () => {
  interface WeeklyStat {
    name: string;
    attendance: number;
    absence: number;
    total: number;
  }
  const [stats, setStats] = useState({
    today_count: 0,
    total_students: 0,
    total_classes: 0,
    weekly_stats: [] as WeeklyStat[],
  });
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainMessage, setTrainMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, schoolData] = await Promise.all([
          getAttendanceStats(),
          getSchoolInfo(),
        ]);
        setStats(statsData);
        setSchool(schoolData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate attendance rate
  const attendanceRate =
    stats.total_students > 0
      ? Math.round((stats.today_count / stats.total_students) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {school?.name || "Genel Bakış"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {school?.manager_name && (
              <>
                <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                  Müdür: {school.manager_name}
                </span>
                <span className="text-gray-300">|</span>
              </>
            )}
            <p className="text-xs text-gray-500">
              Okul performansı ve günlük istatistikler
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            window.open("/attendance-scanner", "_blank", "noopener,noreferrer")
          }
          className="group flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition shadow-lg shadow-black/10 hover:shadow-black/20"
        >
          <div className="p-1 bg-white/20 rounded-md group-hover:bg-white/30 transition">
            <Camera className="h-3.5 w-3.5" />
          </div>
          <span>Yoklama Başlat</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Toplam Öğrenci
            </h3>
            <div className="p-1 bg-gray-50 rounded-md">
              <Users className="h-3.5 w-3.5 text-black" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-gray-900 tracking-tight">
              {loading ? "..." : stats.total_students}
            </p>
            <span className="text-[10px] text-green-600 flex items-center gap-0.5 font-bold bg-green-50 px-1.5 py-0.5 rounded-full">
              <TrendingUp className="h-2.5 w-2.5" />
              +5%
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">
            Geçen aya göre artış
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Sınıf Sayısı
            </h3>
            <div className="p-1 bg-gray-50 rounded-md">
              <School className="h-3.5 w-3.5 text-black" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-gray-900 tracking-tight">
              {loading ? "..." : stats.total_classes}
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">
            Aktif sınıflar
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Katılım Oranı
            </h3>
            <div className="p-1 bg-gray-50 rounded-md">
              <Calendar className="h-3.5 w-3.5 text-black" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-gray-900 tracking-tight">
              %{loading ? "..." : attendanceRate}
            </p>
            <span className="text-[10px] text-green-600 flex items-center gap-0.5 font-bold bg-green-50 px-1.5 py-0.5 rounded-full">
              <TrendingUp className="h-2.5 w-2.5" />
              +2%
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">
            Bugünkü ortalama değer
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              Haftalık Yoklama Analizi
              <span className="text-[10px] font-normal text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                Son 7 Gün
              </span>
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">
              Öğrenci katılım ve devamsızlık oranlarının günlük karşılaştırması.
            </p>
          </div>
          <button className="text-gray-400 hover:text-black transition">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="h-64 w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Yükleniyor...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.weekly_stats}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={32}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="name"
                  stroke="#d1d5db"
                  tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  dy={10}
                />
                <YAxis
                  stroke="#d1d5db"
                  tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "#f9fafb", opacity: 0.8 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-xs">
                          <p className="font-bold text-gray-900 mb-2 border-b border-gray-50 pb-1">
                            {label}
                          </p>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-black"></div>
                              <span className="text-gray-500">Mevcut:</span>
                              <span className="font-bold text-gray-900">
                                {payload[0].value}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                              <span className="text-gray-500">Devamsız:</span>
                              <span className="font-bold text-gray-900">
                                {payload[1].value}
                              </span>
                            </div>
                            <div className="pt-1 mt-1 border-t border-gray-50 flex items-center gap-2 text-gray-400">
                              <span>Oran:</span>
                              <span className="font-medium text-green-600">
                                %
                                {Math.round(
                                  (Number(payload[0].value) /
                                    (Number(payload[0].value) +
                                      Number(payload[1].value))) *
                                    100
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs font-medium text-gray-600 ml-1">
                      {value}
                    </span>
                  )}
                />
                <ReferenceLine
                  y={stats.total_students * 0.9}
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{
                    position: "right",
                    value: "Hedef",
                    fontSize: 10,
                    fill: "#22c55e",
                  }}
                />

                <Bar
                  dataKey="attendance"
                  name="Mevcut Öğrenciler"
                  fill="#18181b"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="absence"
                  name="Devamsızlık"
                  fill="#e5e7eb"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                Ortalama Katılım
              </p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                %{attendanceRate}
              </p>
            </div>
            <div className="text-center border-l border-gray-100 pl-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                Toplam Devamsızlık
              </p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {stats.total_students - stats.today_count}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setTrainLoading(true);
                setTrainMessage(null);
                try {
                  const res = await triggerTraining();
                  setTrainMessage(res.message || "Eğitim başlatıldı");
                } catch {
                  setTrainMessage("Eğitim başlatılamadı");
                } finally {
                  setTrainLoading(false);
                }
              }}
              className="group flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-50"
              disabled={trainLoading}
            >
              {trainLoading ? "Eğitim Başlatılıyor..." : "MLP Eğitimi Başlat"}
              <ArrowUpRight className="h-3 w-3" />
            </button>
            {trainMessage && (
              <span className="text-[10px] text-gray-500">{trainMessage}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;

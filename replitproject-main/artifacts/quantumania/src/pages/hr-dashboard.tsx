import { useEffect, useState } from "react";
import {
  Users, Mail, Phone, FileText, Calendar, BarChart2,
  TrendingUp, AlertTriangle, CheckCircle, Clock, Briefcase
} from "lucide-react";

interface Overview {
  totalEmployees: number;
  activeEmployees: number;
  departments: string[];
  attendanceLast30Days: number;
  pendingLeaves: number;
  approvedLeaves: number;
  totalResumes: number;
  shortlistedResumes: number;
  avgAtsScore: number;
  callsLast30Days: number;
  emailsLast30Days: number;
  totalPosts: number;
  totalInterviews: number;
  disqualifiedInterviews: number;
}

interface Trend { date: string; count: number }

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-white/50">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function HRDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/hr-analytics/overview").then(r => r.json()),
      fetch("/api/hr-analytics/attendance-trend").then(r => r.json()),
    ])
      .then(([ov, tr]) => {
        setOverview(ov);
        setTrend(Array.isArray(tr) ? tr : []);
      })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/50 text-lg animate-pulse">Loading HR Analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  const maxTrendCount = Math.max(...trend.map(t => t.count), 1);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="text-purple-400" size={32} />
            HR Analytics Dashboard
          </h1>
          <p className="text-white/40 mt-1">Real-time overview of all company AI features</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Employees" value={overview?.totalEmployees ?? 0}
            sub={`${overview?.activeEmployees ?? 0} active`} color="bg-blue-600" />
          <StatCard icon={Calendar} label="Attendance (30d)" value={overview?.attendanceLast30Days ?? 0}
            sub="check-ins" color="bg-green-600" />
          <StatCard icon={Clock} label="Pending Leaves" value={overview?.pendingLeaves ?? 0}
            sub={`${overview?.approvedLeaves ?? 0} approved`} color="bg-yellow-600" />
          <StatCard icon={FileText} label="Resumes Processed" value={overview?.totalResumes ?? 0}
            sub={`${overview?.shortlistedResumes ?? 0} shortlisted`} color="bg-purple-600" />
          <StatCard icon={TrendingUp} label="Avg ATS Score" value={`${overview?.avgAtsScore ?? 0}%`}
            sub="across all resumes" color="bg-indigo-600" />
          <StatCard icon={Phone} label="Calls (30d)" value={overview?.callsLast30Days ?? 0}
            sub="AI-handled calls" color="bg-cyan-600" />
          <StatCard icon={Mail} label="Emails (30d)" value={overview?.emailsLast30Days ?? 0}
            sub="AI-sent emails" color="bg-pink-600" />
          <StatCard icon={Briefcase} label="Posts Created" value={overview?.totalPosts ?? 0}
            sub="job / social posts" color="bg-orange-600" />
          <StatCard icon={CheckCircle} label="Interviews" value={overview?.totalInterviews ?? 0}
            sub={`${overview?.disqualifiedInterviews ?? 0} disqualified`} color="bg-teal-600" />
          <StatCard icon={AlertTriangle} label="Departments" value={overview?.departments?.length ?? 0}
            sub={overview?.departments?.slice(0, 2).join(", ") || "—"} color="bg-rose-600" />
        </div>

        {/* Attendance Trend Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Attendance Trend (Last 30 Days)</h2>
          {trend.length === 0 ? (
            <p className="text-white/30 text-sm">No attendance data yet.</p>
          ) : (
            <div className="flex items-end gap-1 h-32 overflow-x-auto">
              {trend.slice(-30).map((t) => (
                <div key={t.date} className="flex flex-col items-center gap-1 min-w-[20px]">
                  <div
                    className="bg-purple-500 rounded-sm w-4 transition-all duration-300"
                    style={{ height: `${(t.count / maxTrendCount) * 100}%`, minHeight: "4px" }}
                    title={`${t.date}: ${t.count}`}
                  />
                  <span className="text-[9px] text-white/20 rotate-90 mt-1 hidden sm:block">
                    {t.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Departments */}
        {overview && overview.departments.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Departments</h2>
            <div className="flex flex-wrap gap-2">
              {overview.departments.map(dep => (
                <span key={dep} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/70">
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

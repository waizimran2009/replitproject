import { useState } from "react";
import { Calendar, Bot, CheckCircle, XCircle, AlertCircle, Loader2, X } from "lucide-react";

interface LeaveRecord {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  ai_recommendation: string;
  ai_reason: string;
  unusual_pattern: boolean;
  employees?: { name: string; department: string };
}

export default function LeaveManagement() {
  const [tab, setTab] = useState<"apply" | "manage">("apply");
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ leave: any; aiDecision: any } | null>(null);
  const [error, setError] = useState("");
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleApply = async () => {
    if (!employeeId.trim() || !startDate || !endDate) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, leaveType, startDate, endDate, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaves = async () => {
    setLeavesLoading(true);
    try {
      const res = await fetch("/api/leave/all");
      const data = await res.json();
      setLeaves(Array.isArray(data) ? data : []);
    } catch {
      setLeaves([]);
    } finally {
      setLeavesLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id + action);
    try {
      await fetch(`/api/leave/${id}/${action}`, { method: "PATCH" });
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: action === "approve" ? "approved" : "rejected" } : l));
    } catch {}
    finally {
      setActionLoading(null);
    }
  };

  const recBadge = (rec: string) => ({
    approve: "bg-green-500/20 text-green-400 border-green-500/30",
    reject: "bg-red-500/20 text-red-400 border-red-500/30",
    review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  }[rec] || "bg-white/10 text-white/40 border-white/20");

  const statusBadge = (s: string) => ({
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
  }[s] || "bg-white/10 text-white/40");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="text-yellow-400" size={32} />
            Leave Management
          </h1>
          <p className="text-white/40 mt-1">AI analyzes leave patterns and recommends approve/reject decisions</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(["apply", "manage"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "manage") loadLeaves(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-yellow-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t === "apply" ? "Apply for Leave" : "Manage Leaves"}
            </button>
          ))}
        </div>

        {tab === "apply" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-sm text-white/60 block mb-1">Employee ID *</label>
              <input value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                placeholder="Your employee ID"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-500" />
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-1">Leave Type</label>
              <select value={leaveType} onChange={e => setLeaveType(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500">
                {["annual", "sick", "casual", "maternity", "paternity", "unpaid"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-white/60 block mb-1">Start Date *</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-sm text-white/60 block mb-1">End Date *</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-1">Reason</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                placeholder="Brief reason for leave..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-500 resize-none" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                <X size={16} /> {error}
              </div>
            )}

            <button onClick={handleApply} disabled={loading || !employeeId.trim() || !startDate || !endDate}
              className="flex items-center gap-2 px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-sm font-medium disabled:opacity-40 transition-all">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
              Submit Leave Request
            </button>

            {result && (
              <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Bot size={20} className="text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-white">AI Recommendation</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-0.5 ${recBadge(result.aiDecision.recommendation)}`}>
                      {result.aiDecision.recommendation === "approve" ? <CheckCircle size={10} /> :
                       result.aiDecision.recommendation === "reject" ? <XCircle size={10} /> :
                       <AlertCircle size={10} />}
                      {result.aiDecision.recommendation}
                    </span>
                  </div>
                </div>
                <p className="text-white/60 text-sm">{result.aiDecision.reason}</p>
                {result.aiDecision.unusualPattern && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                    <p className="text-orange-400 text-xs">⚠ Unusual leave pattern detected: {result.aiDecision.patternNote}</p>
                  </div>
                )}
                <p className="text-white/30 text-xs">Leave ID: {result.leave.id}</p>
              </div>
            )}
          </div>
        )}

        {tab === "manage" && (
          <div className="space-y-3">
            {leavesLoading ? (
              <div className="text-center py-12 text-white/30">Loading leave requests...</div>
            ) : leaves.length === 0 ? (
              <div className="text-center py-12 text-white/30">No leave requests found</div>
            ) : (
              leaves.map(leave => (
                <div key={leave.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-white">
                        {(leave.employees as any)?.name || `Employee ${leave.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-white/40">
                        {leave.leave_type} · {leave.start_date} to {leave.end_date}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(leave.status)}`}>
                      {leave.status}
                    </span>
                  </div>

                  {leave.reason && <p className="text-white/50 text-xs mb-2">{leave.reason}</p>}

                  <div className="flex items-center gap-2 mb-3">
                    <Bot size={12} className="text-yellow-400" />
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${recBadge(leave.ai_recommendation)}`}>
                      AI: {leave.ai_recommendation}
                    </span>
                    <span className="text-white/30 text-xs">{leave.ai_reason}</span>
                  </div>

                  {leave.unusual_pattern && (
                    <p className="text-orange-400 text-xs mb-2">⚠ Unusual pattern detected</p>
                  )}

                  {leave.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(leave.id, "approve")}
                        disabled={actionLoading === leave.id + "approve"}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg text-xs transition-all disabled:opacity-40"
                      >
                        {actionLoading === leave.id + "approve" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(leave.id, "reject")}
                        disabled={actionLoading === leave.id + "reject"}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs transition-all disabled:opacity-40"
                      >
                        {actionLoading === leave.id + "reject" ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

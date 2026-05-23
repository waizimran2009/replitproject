import { useState } from "react";
import { FileText, Upload, Loader2, CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

interface ResumeResult {
  id?: string;
  score: number;
  verdict: "shortlisted" | "rejected" | "review";
  matchedSkills: string[];
  missingSkills: string[];
  experienceYears: number;
  summary: string;
  candidateName: string;
  candidateEmail?: string;
}

interface ResumeRecord {
  id: string;
  filename: string;
  job_role: string;
  ats_score: number;
  verdict: string;
  candidate_name: string;
  candidate_email: string;
  experience_years: number;
  summary: string;
  created_at: string;
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles = {
    shortlisted: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  const icons = {
    shortlisted: <CheckCircle size={12} />,
    rejected: <XCircle size={12} />,
    review: <AlertCircle size={12} />,
  };
  const key = verdict as keyof typeof styles;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${styles[key] || styles.review}`}>
      {icons[key] || icons.review}
      {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
    </span>
  );
}

export default function ATSFiltering() {
  const [tab, setTab] = useState<"upload" | "list">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [requirements, setRequirements] = useState("");
  const [minExperience, setMinExperience] = useState("0");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [error, setError] = useState("");
  const [listData, setListData] = useState<ResumeRecord[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [filterVerdict, setFilterVerdict] = useState("");

  const handleUpload = async () => {
    if (!file || !jobRole.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobRole", jobRole);
      formData.append("requirements", requirements);
      formData.append("minExperience", minExperience);

      const res = await fetch("/api/ats/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadList = async () => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterVerdict) params.set("verdict", filterVerdict);
      const res = await fetch(`/api/ats/resumes?${params}`);
      const data = await res.json();
      setListData(Array.isArray(data) ? data : []);
    } catch {
      setListData([]);
    } finally {
      setListLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="text-indigo-400" size={32} />
            CV & Resume ATS
          </h1>
          <p className="text-white/40 mt-1">AI-powered applicant tracking — upload resumes for instant scoring</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(["upload", "list"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "list") loadList(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-indigo-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t === "upload" ? "Upload Resume" : "All Resumes"}
            </button>
          ))}
        </div>

        {tab === "upload" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-sm text-white/60 block mb-1">Job Role *</label>
              <input
                value={jobRole}
                onChange={e => setJobRole(e.target.value)}
                placeholder="e.g. Senior React Developer"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-1">Job Requirements (optional)</label>
              <textarea
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                rows={3}
                placeholder="e.g. React, TypeScript, Node.js, 3+ years experience, team leadership..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-1">Minimum Experience (years)</label>
              <input
                type="number"
                value={minExperience}
                onChange={e => setMinExperience(e.target.value)}
                min="0"
                max="20"
                className="w-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-2">Upload Resume *</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-indigo-500/60 transition-all bg-white/5">
                <Upload size={24} className="text-white/30 mb-2" />
                <span className="text-white/40 text-sm">
                  {file ? file.name : "Click to upload PDF, DOC, DOCX, or TXT"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                <X size={16} /> {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || !file || !jobRole.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Analyze Resume
            </button>

            {result && (
              <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-white">{result.candidateName}</p>
                    {result.candidateEmail && (
                      <p className="text-white/40 text-sm">{result.candidateEmail}</p>
                    )}
                  </div>
                  <VerdictBadge verdict={result.verdict} />
                </div>

                {/* Score bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/60">ATS Score</span>
                    <span className="font-bold" style={{ color: result.score >= 70 ? "#4ade80" : result.score >= 50 ? "#facc15" : "#f87171" }}>
                      {result.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${result.score}%`,
                        backgroundColor: result.score >= 70 ? "#4ade80" : result.score >= 50 ? "#facc15" : "#f87171",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Matched Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {result.matchedSkills?.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Missing Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {result.missingSkills?.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-white/40 mb-1">Experience: {result.experienceYears} years</p>
                  <p className="text-white/70 text-sm">{result.summary}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "list" && (
          <div>
            <div className="flex gap-2 mb-4">
              {["", "shortlisted", "rejected", "review"].map(v => (
                <button
                  key={v || "all"}
                  onClick={() => { setFilterVerdict(v); setTimeout(loadList, 0); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterVerdict === v ? "bg-indigo-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                  }`}
                >
                  {v || "All"}
                </button>
              ))}
            </div>
            {listLoading ? (
              <div className="text-center py-12 text-white/30">Loading resumes...</div>
            ) : listData.length === 0 ? (
              <div className="text-center py-12 text-white/30">No resumes found</div>
            ) : (
              <div className="space-y-3">
                {listData.map(r => (
                  <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-white">{r.candidate_name}</p>
                        <p className="text-xs text-white/40">{r.job_role} · {r.experience_years}y exp</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: r.ats_score >= 70 ? "#4ade80" : r.ats_score >= 50 ? "#facc15" : "#f87171" }}>
                          {r.ats_score}%
                        </span>
                        <VerdictBadge verdict={r.verdict} />
                      </div>
                    </div>
                    <p className="text-white/50 text-xs line-clamp-2">{r.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

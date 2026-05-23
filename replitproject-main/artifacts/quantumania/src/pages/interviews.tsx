import { useEffect, useState, useCallback } from "react";
import { Mic, Brain, AlertTriangle, CheckCircle, XCircle, Loader2, X } from "lucide-react";

interface Question {
  question: string;
  type: "technical" | "behavioral";
  expectedKeywords: string[];
  difficulty: "easy" | "medium" | "hard";
}

interface ScoreResult {
  score: number;
  confidence: number;
  relevance: number;
  feedback: string;
  keywordsFound: string[];
  verdict: "excellent" | "good" | "average" | "poor";
}

type Stage = "setup" | "active" | "disqualified" | "completed";

export default function Interviews() {
  const [tab, setTab] = useState<"interview" | "sessions">("interview");
  const [stage, setStage] = useState<Stage>("setup");
  const [role, setRole] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [expLevel, setExpLevel] = useState("mid");
  const [language, setLanguage] = useState("English");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scores, setScores] = useState<ScoreResult[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState("");

  // Tab-switch / focus-loss detection
  const handleVisibilityChange = useCallback(() => {
    if (stage === "active" && document.hidden) {
      setStage("disqualified");
      setDisqualifyReason("Tab switch or window minimized detected");
      if (sessionId) {
        fetch(`/api/interviews/session/${sessionId}/disqualify`, { method: "PATCH" }).catch(() => {});
      }
    }
  }, [stage, sessionId]);

  const handleBlur = useCallback(() => {
    if (stage === "active") {
      setStage("disqualified");
      setDisqualifyReason("Focus loss detected (browser window switched)");
      if (sessionId) {
        fetch(`/api/interviews/session/${sessionId}/disqualify`, { method: "PATCH" }).catch(() => {});
      }
    }
  }, [stage, sessionId]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [handleVisibilityChange, handleBlur]);

  const startInterview = async () => {
    if (!role.trim() || !candidateName.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/interviews/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, experienceLevel: expLevel, count: 8, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions);

      const sessionRes = await fetch("/api/interviews/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateName, role, questions: data.questions }),
      });
      const sessionData = await sessionRes.json();
      setSessionId(sessionData.id);
      setCurrentQ(0);
      setScores([]);
      setStage("active");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setScoring(true);
    try {
      const q = questions[currentQ];
      const res = await fetch("/api/interviews/score-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.question, answer, expectedKeywords: q.expectedKeywords }),
      });
      const scoreData = await res.json();
      const newScores = [...scores, scoreData];
      setScores(newScores);
      setAnswer("");

      if (currentQ + 1 >= questions.length) {
        const totalScore = newScores.reduce((s, r) => s + r.score, 0) / newScores.length;
        if (sessionId) {
          await fetch(`/api/interviews/session/${sessionId}/complete`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalScore, answers: newScores }),
          });
        }
        setStage("completed");
      } else {
        setCurrentQ(prev => prev + 1);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setScoring(false);
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/interviews/sessions");
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const verdictColor = (v: string) => ({
    excellent: "text-green-400", good: "text-blue-400", average: "text-yellow-400", poor: "text-red-400"
  }[v] || "text-white/60");

  const diffColor = (d: string) => ({
    easy: "bg-green-500/20 text-green-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    hard: "bg-red-500/20 text-red-400",
  }[d] || "");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="text-teal-400" size={32} />
            AI Interview Assistant
          </h1>
          <p className="text-white/40 mt-1">AI-generated questions, live scoring, and anti-cheat tab detection</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(["interview", "sessions"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "sessions") loadSessions(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-teal-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t === "interview" ? "Start Interview" : "Past Sessions"}
            </button>
          ))}
        </div>

        {tab === "interview" && (
          <>
            {stage === "setup" && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-400 text-xs">
                    <strong>Anti-Cheat Active:</strong> Switching tabs or minimizing the window will immediately disqualify the candidate.
                  </p>
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-1">Candidate Name *</label>
                  <input value={candidateName} onChange={e => setCandidateName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-teal-500" />
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-1">Job Role *</label>
                  <input value={role} onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Senior React Developer"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-teal-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white/60 block mb-1">Experience Level</label>
                    <select value={expLevel} onChange={e => setExpLevel(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500">
                      {["junior", "mid", "senior", "lead"].map(l => (
                        <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 block mb-1">Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500">
                      {["English", "Urdu", "Arabic", "French", "Spanish"].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                    <X size={16} /> {error}
                  </div>
                )}

                <button onClick={startInterview} disabled={loading || !role.trim() || !candidateName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium disabled:opacity-40 transition-all">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
                  Start Interview
                </button>
              </div>
            )}

            {stage === "active" && questions.length > 0 && (
              <div className="space-y-4">
                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/10 rounded-full h-1.5">
                    <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${((currentQ) / questions.length) * 100}%` }} />
                  </div>
                  <span className="text-white/40 text-sm">{currentQ + 1} / {questions.length}</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor(questions[currentQ].difficulty)}`}>
                      {questions[currentQ].difficulty}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-white/10 text-white/50 rounded-full">
                      {questions[currentQ].type}
                    </span>
                  </div>
                  <p className="text-white text-lg font-medium mb-6">{questions[currentQ].question}</p>

                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    rows={5}
                    placeholder="Type your answer here..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-teal-500 resize-none"
                  />

                  {scores[currentQ - 1] && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs text-white/40 mb-1">Previous answer score</p>
                      <p className={`text-sm font-medium ${verdictColor(scores[currentQ - 1].verdict)}`}>
                        {scores[currentQ - 1].verdict} — {scores[currentQ - 1].score}/10
                      </p>
                      <p className="text-white/50 text-xs mt-1">{scores[currentQ - 1].feedback}</p>
                    </div>
                  )}

                  <button onClick={submitAnswer} disabled={scoring || !answer.trim()}
                    className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium disabled:opacity-40 transition-all">
                    {scoring ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Submit Answer
                  </button>
                </div>
              </div>
            )}

            {stage === "disqualified" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-400 mb-2">Disqualified</h2>
                <p className="text-white/60">{disqualifyReason}</p>
                <button onClick={() => { setStage("setup"); setQuestions([]); setScores([]); setSessionId(null); }}
                  className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all">
                  New Interview
                </button>
              </div>
            )}

            {stage === "completed" && (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                  <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-green-400 mb-1">Interview Complete!</h2>
                  <p className="text-white/60">
                    Avg Score: {scores.length ? (scores.reduce((s, r) => s + r.score, 0) / scores.length).toFixed(1) : 0} / 10
                  </p>
                </div>

                <div className="space-y-3">
                  {scores.map((s, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-white/80 text-sm font-medium line-clamp-1">{questions[i]?.question}</p>
                        <span className={`text-sm font-bold ml-2 ${verdictColor(s.verdict)}`}>{s.score}/10</span>
                      </div>
                      <p className="text-white/50 text-xs">{s.feedback}</p>
                    </div>
                  ))}
                </div>

                <button onClick={() => { setStage("setup"); setQuestions([]); setScores([]); setSessionId(null); }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm transition-all">
                  New Interview
                </button>
              </div>
            )}
          </>
        )}

        {tab === "sessions" && (
          <div className="space-y-3">
            {sessionsLoading ? (
              <div className="text-center py-12 text-white/30">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-white/30">No interview sessions yet</div>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="font-medium text-white">{s.candidate_name}</p>
                      <p className="text-xs text-white/40">{s.role}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        s.status === "completed" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                        s.status === "disqualified" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }`}>
                        {s.status}
                      </span>
                      {s.total_score && (
                        <p className="text-white/40 text-xs mt-0.5">Score: {s.total_score.toFixed(1)}/10</p>
                      )}
                    </div>
                  </div>
                  {s.disqualify_reason && (
                    <p className="text-red-400/70 text-xs mt-1">{s.disqualify_reason}</p>
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

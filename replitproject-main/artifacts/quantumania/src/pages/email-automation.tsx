import { useState } from "react";
import { Mail, Send, FileText, Loader2, CheckCircle, History, X } from "lucide-react";

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
}

export default function EmailAutomation() {
  const [tab, setTab] = useState<"compose" | "draft" | "history">("compose");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ body: string; subject: string } | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<EmailLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleDraft = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(""); setResult(null); setSent(false);
    try {
      const res = await fetch("/api/email/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      if (data.subject) setSubject(data.subject);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!to.trim() || !prompt.trim()) return;
    setLoading(true); setError(""); setSent(false);
    try {
      const res = await fetch("/api/email/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, prompt, tone, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/email/history");
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="text-pink-400" size={32} />
            Email Automation
          </h1>
          <p className="text-white/40 mt-1">AI writes and sends professional emails for your company</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["compose", "draft", "history"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "history") loadHistory(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-pink-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab !== "history" && (
          <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
            {tab === "compose" && (
              <div>
                <label className="text-sm text-white/60 block mb-1">To (email address)</label>
                <input
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-white/60 block mb-1">Subject (optional — AI will generate)</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Leave blank for AI-generated subject"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-1">What should the email be about?</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. Write a follow-up email to a client about their pending invoice #1234..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500 resize-none"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm text-white/60 block mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                >
                  {["professional", "friendly", "formal", "casual", "persuasive"].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm text-white/60 block mb-1">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                >
                  {["English", "Urdu", "Arabic", "French", "Spanish", "German", "Chinese", "Hindi"].map(l => (
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

            {sent && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                <CheckCircle size={16} /> Email sent successfully!
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDraft}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
              >
                {loading && tab === "draft" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Generate Draft
              </button>
              {tab === "compose" && (
                <button
                  onClick={handleSend}
                  disabled={loading || !prompt.trim() || !to.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Email
                </button>
              )}
            </div>

            {result && (
              <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <div>
                  <span className="text-xs text-white/40">Subject</span>
                  <p className="text-white font-medium">{result.subject}</p>
                </div>
                <div>
                  <span className="text-xs text-white/40">Email Body</span>
                  <p className="text-white/80 text-sm whitespace-pre-wrap mt-1">{result.body}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="text-center py-12 text-white/30">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-white/30">No emails sent yet</div>
            ) : (
              history.map(email => (
                <div key={email.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-white text-sm">{email.subject}</p>
                      <p className="text-xs text-white/40">To: {email.to_email}</p>
                    </div>
                    <span className="text-[10px] text-white/30">
                      {new Date(email.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs line-clamp-2">{email.body}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

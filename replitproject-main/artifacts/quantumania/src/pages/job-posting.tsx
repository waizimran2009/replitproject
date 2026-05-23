import { useState } from "react";
import { Briefcase, Sparkles, Image, Save, History, Loader2, X, CheckCircle } from "lucide-react";

interface PostLog {
  id: string;
  post_text: string;
  image_url: string | null;
  platform: string;
  status: string;
  created_at: string;
}

export default function JobPosting() {
  const [tab, setTab] = useState<"generate" | "history">("generate");
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("linkedin");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ postText: string; imageUrl: string | null; imagePrompt: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<PostLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(""); setResult(null); setSaved(false);
    try {
      const res = await fetch("/api/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, platform, tone, language }),
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

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await fetch("/api/posts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postText: result.postText, imageUrl: result.imageUrl, platform }),
      });
      setSaved(true);
    } catch {
      setError("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/posts/history");
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
            <Briefcase className="text-orange-400" size={32} />
            Post Automation
          </h1>
          <p className="text-white/40 mt-1">AI creates stunning posts with images for LinkedIn and other platforms</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(["generate", "history"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "history") loadHistory(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-orange-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t === "generate" ? "Generate Post" : "Post History"}
            </button>
          ))}
        </div>

        {tab === "generate" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-sm text-white/60 block mb-1">What is this post about?</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. We are hiring a Senior React Developer with 3+ years of experience. Remote position. Competitive salary..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-white/60 block mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  {["linkedin", "twitter", "instagram", "facebook"].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 block mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  {["professional", "excited", "formal", "casual", "inspiring"].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 block mb-1">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  {["English", "Urdu", "Arabic", "French", "Spanish", "German"].map(l => (
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

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate Post + Image
            </button>

            {result && (
              <div className="mt-2 space-y-4">
                {result.imageUrl && (
                  <div>
                    <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
                      <Image size={12} /> AI-Generated Image
                    </p>
                    <img
                      src={result.imageUrl}
                      alt="AI generated post visual"
                      className="w-full rounded-xl border border-white/10 object-cover"
                    />
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-white/40 mb-2">Post Text</p>
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{result.postText}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save to History
                  </button>
                  {saved && (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <CheckCircle size={14} /> Saved!
                    </span>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-blue-400 text-xs font-medium mb-1">How to publish on LinkedIn</p>
                  <p className="text-blue-300/60 text-xs">
                    Copy the post text above, go to your LinkedIn profile, create a new post, paste the text and upload the image.
                    LinkedIn's API requires OAuth approval — direct publishing is available with LinkedIn Partner API access.
                  </p>
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
              <div className="text-center py-12 text-white/30">No posts created yet</div>
            ) : (
              history.map(post => (
                <div key={post.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4">
                  {post.image_url && (
                    <img src={post.image_url} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-orange-600/20 text-orange-400 rounded-full">{post.platform}</span>
                      <span className="text-xs px-2 py-0.5 bg-white/10 text-white/40 rounded-full">{post.status}</span>
                      <span className="text-[10px] text-white/20 ml-auto">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs line-clamp-3">{post.post_text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

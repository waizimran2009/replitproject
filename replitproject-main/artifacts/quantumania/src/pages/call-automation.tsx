import { useEffect, useState } from "react";
import { Phone, PhoneCall, Info, History, Loader2 } from "lucide-react";

interface CallLog {
  id: string;
  caller_number: string;
  transcript: string;
  ai_summary: string;
  created_at: string;
}

export default function CallAutomation() {
  const [tab, setTab] = useState<"setup" | "logs">("setup");
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [numLoading, setNumLoading] = useState(true);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/calls/number")
      .then(r => r.json())
      .then(data => setPhoneNumber(data.phoneNumber || null))
      .catch(() => setPhoneNumber(null))
      .finally(() => setNumLoading(false));
  }, []);

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/calls/logs");
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Phone className="text-cyan-400" size={32} />
            Call Automation
          </h1>
          <p className="text-white/40 mt-1">AI answers calls and talks to clients like a human receptionist</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(["setup", "logs"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "logs") loadLogs(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-cyan-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t === "setup" ? "Setup" : "Call Logs"}
            </button>
          ))}
        </div>

        {tab === "setup" && (
          <div className="space-y-6">
            {/* Company Phone Number Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PhoneCall size={20} className="text-cyan-400" />
                Your Company AI Phone Number
              </h2>
              {numLoading ? (
                <div className="flex items-center gap-2 text-white/40">
                  <Loader2 size={16} className="animate-spin" /> Loading...
                </div>
              ) : phoneNumber ? (
                <div className="text-center py-6">
                  <p className="text-4xl font-mono font-bold text-cyan-400 tracking-widest">
                    {phoneNumber}
                  </p>
                  <p className="text-white/40 text-sm mt-2">Share this number with your clients</p>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-400 text-sm font-medium">No Twilio number found</p>
                  <p className="text-yellow-400/60 text-xs mt-1">
                    Add a Twilio number in your Twilio console, then set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars.
                  </p>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info size={20} className="text-cyan-400" />
                How Call Automation Works
              </h2>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Client calls the company number above" },
                  { step: "2", text: "Twilio receives the call and forwards to our AI webhook" },
                  { step: "3", text: "AI greets the caller using the company name" },
                  { step: "4", text: "Caller speaks — AI transcribes speech and generates a helpful response using Gemini" },
                  { step: "5", text: "AI responds in natural voice (Polly.Joanna), recommends services" },
                  { step: "6", text: "Conversation is logged in the Call Logs tab" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-600/30 text-cyan-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {step}
                    </div>
                    <p className="text-white/60 text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Config */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Required Environment Variables</h2>
              <div className="space-y-2 font-mono text-sm">
                {[
                  { key: "TWILIO_ACCOUNT_SID", desc: "From Twilio console" },
                  { key: "TWILIO_AUTH_TOKEN", desc: "From Twilio console" },
                  { key: "COMPANY_NAME", desc: "e.g. TechCorp Solutions" },
                  { key: "COMPANY_SERVICES", desc: "e.g. software development, AI consulting" },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-cyan-400 w-56">{key}</span>
                    <span className="text-white/30 text-xs"># {desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-white/30 text-xs mt-4">
                Set webhook URL in Twilio console to: <span className="text-cyan-400">https://your-domain/api/calls/webhook</span>
              </p>
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div className="space-y-3">
            {logsLoading ? (
              <div className="text-center py-12 text-white/30">Loading call logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-white/30">No calls received yet</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-cyan-400 text-sm">{log.caller_number || "Unknown"}</span>
                    <span className="text-[10px] text-white/30">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  {log.transcript && (
                    <p className="text-white/50 text-xs mb-1">
                      <span className="text-white/30">Caller: </span>{log.transcript}
                    </p>
                  )}
                  {log.ai_summary && (
                    <p className="text-white/50 text-xs">
                      <span className="text-white/30">AI: </span>{log.ai_summary}
                    </p>
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

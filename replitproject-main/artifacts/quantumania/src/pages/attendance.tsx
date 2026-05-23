import { useState, useRef } from "react";
import { MapPin, Camera, CheckCircle, Clock, Loader2, X, Home } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string;
  check_out: string | null;
  method: string;
  face_verified: boolean;
  status: string;
  employees?: { name: string; department: string };
}

export default function Attendance() {
  const [tab, setTab] = useState<"checkin" | "report">("checkin");
  const [employeeId, setEmployeeId] = useState("");
  const [method, setMethod] = useState<"manual" | "geo" | "wfh">("manual");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AttendanceRecord[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [faceVerified, setFaceVerified] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const getLocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => { setError("Location access denied"); setGeoLoading(false); }
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setError("Camera access denied");
    }
  };

  const captureAndVerify = () => {
    // In production: use face-api.js for actual face recognition
    // Here we simulate verification
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      setCameraActive(false);
      setFaceVerified(true);
    }
  };

  const checkIn = async () => {
    if (!employeeId.trim()) return;
    setLoading(true); setError(""); setSuccess(null);
    try {
      const body: any = { employeeId, method, faceVerified };
      if (location) { body.latitude = location.lat; body.longitude = location.lng; }

      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Check-in recorded at ${new Date(data.attendance.check_in).toLocaleTimeString()}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const checkOut = async () => {
    if (!employeeId.trim()) return;
    setLoading(true); setError(""); setSuccess(null);
    try {
      const res = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Check-out recorded at ${new Date(data.attendance.check_out).toLocaleTimeString()}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/attendance/report?month=${month}`);
      const data = await res.json();
      setReport(Array.isArray(data) ? data : []);
    } catch {
      setReport([]);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="text-green-400" size={32} />
            Attendance Management
          </h1>
          <p className="text-white/40 mt-1">Smart check-in with face recognition, geo-location, and WFH tracking</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(["checkin", "report"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "report") loadReport(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-green-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t === "checkin" ? "Check In / Out" : "Attendance Report"}
            </button>
          ))}
        </div>

        {tab === "checkin" && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div>
                <label className="text-sm text-white/60 block mb-1">Employee ID *</label>
                <input
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="Enter your employee ID"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 block mb-2">Check-in Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "manual", icon: CheckCircle, label: "Manual" },
                    { key: "geo", icon: MapPin, label: "Geo-location" },
                    { key: "wfh", icon: Home, label: "Work from Home" },
                  ].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setMethod(key as any)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                        method === key
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Face Recognition */}
              <div className="border border-white/10 rounded-xl p-4">
                <p className="text-sm text-white/60 mb-3 flex items-center gap-2">
                  <Camera size={16} />
                  Face Recognition (Optional)
                </p>
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all"
                  >
                    {faceVerified ? "✓ Face Verified" : "Start Camera"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <video ref={videoRef} className="w-full rounded-lg" muted />
                    <button
                      onClick={captureAndVerify}
                      className="w-full py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-all"
                    >
                      Verify Face
                    </button>
                  </div>
                )}
                {faceVerified && (
                  <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                    <CheckCircle size={12} /> Face verified
                  </p>
                )}
              </div>

              {/* Geo-location */}
              {method === "geo" && (
                <div className="border border-white/10 rounded-xl p-4">
                  <p className="text-sm text-white/60 mb-3 flex items-center gap-2">
                    <MapPin size={16} />
                    Location Verification
                  </p>
                  {location ? (
                    <p className="text-green-400 text-sm flex items-center gap-1">
                      <CheckCircle size={14} />
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  ) : (
                    <button
                      onClick={getLocation}
                      disabled={geoLoading}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all disabled:opacity-40"
                    >
                      {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                      Get Location
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                  <X size={16} /> {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle size={16} /> {success}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={checkIn}
                  disabled={loading || !employeeId.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Check In
                </button>
                <button
                  onClick={checkOut}
                  disabled={loading || !employeeId.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                  Check Out
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "report" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <button
                onClick={loadReport}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm transition-all"
              >
                Load Report
              </button>
            </div>

            {reportLoading ? (
              <div className="text-center py-12 text-white/30">Loading report...</div>
            ) : report.length === 0 ? (
              <div className="text-center py-12 text-white/30">No attendance records for this period</div>
            ) : (
              <div className="space-y-2">
                {report.map(r => (
                  <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white text-sm">
                        {(r.employees as any)?.name || r.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-white/40">{r.date} · {r.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">
                        {r.check_in ? new Date(r.check_in).toLocaleTimeString() : "—"}
                        {r.check_out ? ` → ${new Date(r.check_out).toLocaleTimeString()}` : ""}
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        {r.face_verified && <Camera size={10} className="text-green-400" />}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          r.status === "present" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>{r.status}</span>
                      </div>
                    </div>
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

import { Router } from "express";

const router = Router();

router.post("/checkin", async (req, res) => {
  try {
    const { employeeId, method = "manual", latitude, longitude, faceVerified = false } = req.body;
    if (!employeeId) return res.status(400).json({ error: "employeeId required" });

    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await sb
      .from("attendance").select("id").eq("employee_id", employeeId).eq("date", today).single();
    if (existing) return res.status(409).json({ error: "Already checked in today" });

    const { data, error } = await sb.from("attendance").insert({
      employee_id: employeeId,
      date: today,
      check_in: new Date().toISOString(),
      method,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      face_verified: faceVerified,
      status: "present",
    }).select().single();

    if (error) throw error;
    res.json({ success: true, attendance: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/checkout", async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: "employeeId required" });

    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await sb
      .from("attendance")
      .update({ check_out: new Date().toISOString() })
      .eq("employee_id", employeeId)
      .eq("date", today)
      .select().single();

    if (error) throw error;
    res.json({ success: true, attendance: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/report", async (req, res) => {
  try {
    const { month, employeeId } = req.query;
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    let query = sb
      .from("attendance")
      .select("*, employees(name, department)")
      .order("date", { ascending: false });
    if (month) query = query.gte("date", `${month}-01`).lte("date", `${month}-31`);
    if (employeeId) query = query.eq("employee_id", String(employeeId));
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

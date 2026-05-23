import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

router.post("/apply", async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({ error: "employeeId, startDate, endDate required" });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

    const { data: pastLeaves } = await sb
      .from("leave_requests")
      .select("leave_type, start_date, status")
      .eq("employee_id", employeeId)
      .limit(10);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const aiResult = await model.generateContent(
      `Analyze this leave request.\nType: ${leaveType}\nDates: ${startDate} to ${endDate}\nReason: ${reason}\nHistory: ${JSON.stringify(pastLeaves?.slice(0, 5))}\n\nReturn ONLY JSON:\n{"recommendation":"approve"|"reject"|"review","reason":"<1-2 sentences>","unusualPattern":true|false,"patternNote":"<note if unusual>"}`
    );
    const rawText = aiResult.response.text();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const aiDecision = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { recommendation: "review", reason: "Manual review needed", unusualPattern: false };

    const { data, error } = await sb.from("leave_requests").insert({
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      ai_recommendation: aiDecision.recommendation,
      ai_reason: aiDecision.reason,
      unusual_pattern: aiDecision.unusualPattern,
      status: "pending",
    }).select().single();

    if (error) throw error;
    res.json({ leave: data, aiDecision });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/approve", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("leave_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/reject", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("leave_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("leave_requests")
      .select("*, employees(name, department)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router } from "express";

const router = Router();

router.get("/overview", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const since30Date = since30.split("T")[0];

    const [employees, attendance, leaves, resumes, calls, emails, posts, interviews] = await Promise.all([
      sb.from("employees").select("id, status, department"),
      sb.from("attendance").select("id, date, status").gte("date", since30Date),
      sb.from("leave_requests").select("id, status"),
      sb.from("resumes").select("id, verdict, ats_score"),
      sb.from("call_logs").select("id").gte("created_at", since30),
      sb.from("email_logs").select("id").gte("created_at", since30),
      sb.from("post_logs").select("id, status, platform"),
      sb.from("interview_sessions").select("id, status"),
    ]);

    const resumeData = resumes.data || [];
    const leaveData = leaves.data || [];
    const interviewData = interviews.data || [];

    res.json({
      totalEmployees: employees.data?.length || 0,
      activeEmployees: employees.data?.filter(e => e.status === "active").length || 0,
      departments: [...new Set(employees.data?.map(e => e.department))].filter(Boolean),
      attendanceLast30Days: attendance.data?.length || 0,
      pendingLeaves: leaveData.filter(l => l.status === "pending").length,
      approvedLeaves: leaveData.filter(l => l.status === "approved").length,
      totalResumes: resumeData.length,
      shortlistedResumes: resumeData.filter(r => r.verdict === "shortlisted").length,
      avgAtsScore: resumeData.length
        ? Math.round(resumeData.reduce((s, r) => s + (r.ats_score || 0), 0) / resumeData.length)
        : 0,
      callsLast30Days: calls.data?.length || 0,
      emailsLast30Days: emails.data?.length || 0,
      totalPosts: posts.data?.length || 0,
      totalInterviews: interviewData.length,
      disqualifiedInterviews: interviewData.filter(i => i.status === "disqualified").length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/attendance-trend", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const since = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const { data, error } = await sb
      .from("attendance").select("date").gte("date", since).order("date");
    if (error) throw error;
    const grouped: Record<string, number> = {};
    for (const row of data || []) grouped[row.date] = (grouped[row.date] || 0) + 1;
    res.json(Object.entries(grouped).map(([date, count]) => ({ date, count })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

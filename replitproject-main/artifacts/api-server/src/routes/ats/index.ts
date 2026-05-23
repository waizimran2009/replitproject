import { Router } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const upload = multer({
  dest: "uploads/resumes/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// Upload & AI-analyze resume
router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { jobRole, requirements, minExperience = 0 } = req.body;
    if (!jobRole) return res.status(400).json({ error: "jobRole is required" });

    const fileContent = fs.readFileSync(req.file.path, "utf-8").slice(0, 8000);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(
      `You are an expert ATS for a ${jobRole} role.\nRequirements: ${requirements || "Standard professional"}\nMin Experience: ${minExperience} years\nResume:\n${fileContent}\n\nReturn ONLY this JSON:\n{"score":<0-100>,"verdict":"shortlisted"|"rejected"|"review","matchedSkills":[],"missingSkills":[],"experienceYears":<number>,"summary":"<2-3 sentences>","candidateName":"<name>","candidateEmail":"<email or null>"}`
    );

    const rawText = result.response.text();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, verdict: "review", summary: rawText };

    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data: saved } = await sb.from("resumes").insert({
      filename: req.file.originalname,
      job_role: jobRole,
      ats_score: analysis.score,
      verdict: analysis.verdict,
      matched_skills: analysis.matchedSkills,
      missing_skills: analysis.missingSkills,
      experience_years: analysis.experienceYears,
      summary: analysis.summary,
      candidate_name: analysis.candidateName,
      candidate_email: analysis.candidateEmail,
    }).select().single();

    fs.unlinkSync(req.file.path);
    res.json({ ...analysis, id: saved?.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List all resumes with optional filters
router.get("/resumes", async (req, res) => {
  try {
    const { verdict, jobRole } = req.query;
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    let query = sb.from("resumes").select("*").order("ats_score", { ascending: false });
    if (verdict) query = query.eq("verdict", String(verdict));
    if (jobRole) query = query.eq("job_role", String(jobRole));
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

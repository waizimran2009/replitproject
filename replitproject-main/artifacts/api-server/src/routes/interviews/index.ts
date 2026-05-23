import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Generate interview questions based on role
router.post("/generate-questions", async (req, res) => {
  try {
    const { role, experienceLevel = "mid", count = 10, language = "English" } = req.body;
    if (!role) return res.status(400).json({ error: "role is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Generate ${count} interview questions in ${language} for a ${experienceLevel}-level ${role} position.\nMix technical and behavioral questions.\nReturn ONLY a JSON array:\n[{"question":"...","type":"technical"|"behavioral","expectedKeywords":[],"difficulty":"easy"|"medium"|"hard"}]`
    );
    const rawText = result.response.text();
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json({ questions, role, experienceLevel });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Score a candidate answer with AI
router.post("/score-answer", async (req, res) => {
  try {
    const { question, answer, expectedKeywords = [] } = req.body;
    if (!question || !answer) return res.status(400).json({ error: "question and answer required" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Score this interview answer.\nQuestion: ${question}\nExpected Keywords: ${expectedKeywords.join(", ")}\nAnswer: ${answer}\n\nReturn ONLY JSON:\n{"score":<0-10>,"confidence":<0-100>,"relevance":<0-100>,"feedback":"<constructive feedback>","keywordsFound":[],"verdict":"excellent"|"good"|"average"|"poor"}`
    );
    const rawText = result.response.text();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const scoring = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 5, verdict: "average" };
    res.json(scoring);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create interview session
router.post("/session", async (req, res) => {
  try {
    const { candidateName, role, questions } = req.body;
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("interview_sessions")
      .insert({ candidate_name: candidateName, role, questions: JSON.stringify(questions), status: "active" })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Disqualify — triggered when tab switch is detected
router.patch("/session/:id/disqualify", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("interview_sessions")
      .update({ status: "disqualified", disqualify_reason: "Tab switch / focus loss detected" })
      .eq("id", req.params.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Complete session with final score
router.patch("/session/:id/complete", async (req, res) => {
  try {
    const { totalScore, answers } = req.body;
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("interview_sessions")
      .update({ status: "completed", total_score: totalScore, answers: JSON.stringify(answers) })
      .eq("id", req.params.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sessions
router.get("/sessions", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("interview_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

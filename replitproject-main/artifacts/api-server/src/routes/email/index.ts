import { Router } from "express";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// AI writes & sends email
router.post("/compose", async (req, res) => {
  try {
    const { to, subject, prompt, language = "English", tone = "professional" } = req.body;
    if (!to || !prompt) return res.status(400).json({ error: "to and prompt are required" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const [bodyResult, subjectResult] = await Promise.all([
      model.generateContent(`Write a ${tone} email in ${language} language for:\n${prompt}\nReturn ONLY the email body, no subject, no commentary.`),
      subject
        ? Promise.resolve({ response: { text: () => subject } })
        : model.generateContent(`Write a short professional email subject (max 10 words) for: ${prompt}. Return ONLY the subject.`),
    ]);

    const body = bodyResult.response.text();
    const finalSubject = subjectResult.response.text().trim();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: finalSubject,
      text: body,
      html: body.replace(/\n/g, "<br/>"),
    });

    // Log to Supabase
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
      await sb.from("email_logs").insert({ to_email: to, subject: finalSubject, body, status: "sent" });
    } catch {}

    res.json({ success: true, body, to, subject: finalSubject });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI writes email but does NOT send
router.post("/draft", async (req, res) => {
  try {
    const { prompt, language = "English", tone = "professional" } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const [bodyResult, subjectResult] = await Promise.all([
      model.generateContent(`Write a ${tone} email in ${language} for:\n${prompt}\nReturn ONLY the email body.`),
      model.generateContent(`Write a professional email subject (max 10 words) for: ${prompt}. Return ONLY the subject.`),
    ]);

    res.json({ body: bodyResult.response.text(), subject: subjectResult.response.text().trim() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch sent email history
router.get("/history", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

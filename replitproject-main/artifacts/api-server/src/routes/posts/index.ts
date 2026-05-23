import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate AI post text + AI image
router.post("/generate", async (req, res) => {
  try {
    const { prompt, platform = "linkedin", tone = "professional", language = "English" } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const [textResult, imgPromptResult] = await Promise.all([
      model.generateContent(
        `Create a compelling ${platform} post in ${language} with ${tone} tone for:\n${prompt}\nInclude relevant emojis, hashtags, and a call-to-action. Return ONLY the post text.`
      ),
      model.generateContent(
        `Write a DALL-E image prompt (max 50 words) for a professional ${platform} post about: ${prompt}. Describe visuals only, no text overlay.`
      ),
    ]);

    const postText = textResult.response.text();
    const imagePrompt = imgPromptResult.response.text().trim();

    let imageUrl: string | null = null;
    try {
      const imgResult = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Professional corporate visual: ${imagePrompt}`,
        n: 1,
        size: "1024x1024",
      });
      imageUrl = imgResult.data[0]?.url ?? null;
    } catch {
      // Image generation is optional — continue without it
    }

    res.json({ postText, imageUrl, imagePrompt, platform });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save post to Supabase
router.post("/save", async (req, res) => {
  try {
    const { postText, imageUrl, platform, scheduledAt } = req.body;
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("post_logs")
      .insert({ post_text: postText, image_url: imageUrl, platform, scheduled_at: scheduledAt || null, status: "draft" })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, post: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get post history
router.get("/history", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("post_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

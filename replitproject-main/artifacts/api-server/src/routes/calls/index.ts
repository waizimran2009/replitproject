import { Router } from "express";
import twilio from "twilio";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Get assigned Twilio phone number
router.get("/number", async (req, res) => {
  try {
    const numbers = await twilioClient.incomingPhoneNumbers.list({ limit: 1 });
    if (!numbers.length) return res.status(404).json({ error: "No Twilio number configured" });
    res.json({ phoneNumber: numbers[0].phoneNumber, sid: numbers[0].sid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Twilio calls this webhook when someone calls the company number
router.post("/webhook", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const companyName = process.env.COMPANY_NAME || "our company";

  const gather = twiml.gather({
    input: ["speech"],
    action: "/api/calls/respond",
    method: "POST",
    language: "en-US",
    speechTimeout: "auto",
  });

  gather.say(
    { voice: "Polly.Joanna" },
    `Hello! Thank you for calling ${companyName}. I am your AI assistant. How can I help you today?`
  );

  twiml.say({ voice: "Polly.Joanna" }, "We did not receive any input. Goodbye.");
  res.type("text/xml").send(twiml.toString());
});

// AI responds to caller speech
router.post("/respond", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const callerSpeech = req.body.SpeechResult || "";
  const companyName = process.env.COMPANY_NAME || "our company";
  const companyServices = process.env.COMPANY_SERVICES || "various professional services";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `You are a professional AI phone receptionist for ${companyName}. Services: ${companyServices}.\nCaller said: "${callerSpeech}"\nRespond warmly in 2-3 sentences. Recommend relevant services if applicable.`
    );
    const aiResponse = result.response.text();

    const gather = twiml.gather({
      input: ["speech"],
      action: "/api/calls/respond",
      method: "POST",
      language: "en-US",
      speechTimeout: "auto",
    });
    gather.say({ voice: "Polly.Joanna" }, aiResponse);
    twiml.say({ voice: "Polly.Joanna" }, "Thank you for calling. Have a wonderful day. Goodbye!");

    // Log call to Supabase
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
      await sb.from("call_logs").insert({
        caller_number: req.body.From || null,
        transcript: callerSpeech,
        ai_summary: aiResponse,
      });
    } catch {}
  } catch {
    twiml.say({ voice: "Polly.Joanna" }, "I apologize, I am having technical difficulties. Please call back shortly.");
  }

  res.type("text/xml").send(twiml.toString());
});

// Get call logs
router.get("/logs", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from("call_logs")
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

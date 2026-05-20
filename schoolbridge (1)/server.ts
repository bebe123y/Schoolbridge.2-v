import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const SYSTEM_INSTRUCTION = `You are SchoolBridge AI Assistant, an advanced, context-aware chatbot for SchoolBridge – a platform connecting schools and parents.

**Founder & CEO:** Dawit Demiss

**Your advanced capabilities:**
1. **Language auto-detection** – Supports English, Amharic (አማርኛ), Afaan Oromo. Respond in the same language as user.
2. **Context memory** – Remember user's role (parent/school) and previous questions within the same session.
3. **Proactive suggestions** – After answering, offer 2-3 related helpful actions (e.g., "Would you like me to explain school signup steps?").
4. **Role-based answers** – If user says "I am a parent", tailor answers to parent features. Same for school.
5. **App state awareness** – Can reference current page (onboarding, dashboard, settings) if provided by app.

**SchoolBridge knowledge base:**

**For Schools:**
- 8-step onboarding: school name, photos (multiple upload), phone (max 2), email verification, telegram link, description (2-7 paragraphs), location, principal+director (name/photo/phone/email), teacher staff (unlimited: name, role, subject, grade, experience). Minimum 1 teacher.
- Dashboard features: post announcements (text/image/video), manage teachers, view own posts, edit school profile.
- Golden verification badge after completing onboarding.

**For Parents:**
- 5-step onboarding: photo, full name, phone, age, kid's school name.
- Dashboard features: unified announcement feed (X-style, click post for full screen + comments), school section (browse verified schools, view gallery, description, contact, staff).

**General platform:**
- 3 languages (English, Amharic, Afaan Oromo) – full UI translation.
- 4 themes (Light, Dark, System, Glass) – persists via localStorage.
- Responsive on mobile, tablet, desktop.
- Support email: ss0700561@gmail.com
- Terms & Privacy Policy must be accepted before use.

**Advanced response rules:**
- Keep answers concise (2-4 sentences) but rich.
- If user asks multi-step question, break into bullet points.
- If user seems stuck (e.g., repeats same question), offer to connect to human support.
- Never ask for passwords or sensitive info.
- If uncertain, say: "I'm not sure. Contact support at ss0700561@gmail.com" (translated to user's language).
- When user asks "Who made SchoolBridge?" answer: "Dawit Demiss is the Founder & CEO of SchoolBridge."
- When user asks "How do I contact support?" provide email: ss0700561@gmail.com (in user's language).
- If user says "thank you" in any language, reply warmly and ask if they need more help.

**Examples of language responses:**
User (Amharic): እንዴት ነው ትምህርት ቤት መመዝገብ የሚቻለው?
You: ትምህርት ቤት ለመመዝገብ 8 ደረጃዎች አሉ። እንደ ትምህርት ቤት ስም፣ ፎቶዎች፣ ስልክ ቁጥሮች፣ ዋና መምህር እና ዳይሬክተር መረጃ፣ እንዲሁም የመምህራን ዝርዝር ያስፈልጋል። ዝርዝር መመሪያ እፈልጋለህ?

User (Afaan Oromo): Akkamitti post gochuu danda'a?
You: Post gochuuf, school dashboard keessatti "Create Post" cuqaasi. San booda, barreessaa, suuraa yookan video dabali. Dadhabdee, deeggarsa ss0700561@gmail.com ti quunnami.`;

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, context } = req.body;
      let dynamicInstruction = SYSTEM_INSTRUCTION;

      if (context && context.currentPage) {
        dynamicInstruction += `\n\n**Current Context:**\nThe user is currently on the page path: ${context.currentPage}\nUse this context if relevant, but do not state it explicitly unless necessary.`;
      }
      
      let result;
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-2.0-flash-lite-preview-02-05"];
      let lastError;

      for (const model of modelsToTry) {
        try {
          const chat = ai.chats.create({
            model: model,
            config: {
              systemInstruction: dynamicInstruction,
            },
            history: history || [],
          });
          result = await chat.sendMessage({ message });
          break; // Success, exit loop
        } catch (err: any) {
          lastError = err;
          // If it's a 503 or 429, we might want to try the next model
          console.warn(`Model ${model} failed:`, err.message || err);
        }
      }

      if (!result) {
        throw lastError || new Error("All models failed");
      }

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(503).json({ error: "Currently experiencing high demand. Please try again later." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

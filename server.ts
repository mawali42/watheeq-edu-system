import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const PORT = 3000;

app.post("/api/analyze", upload.array("files"), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const files = req.files as Express.Multer.File[];

    const fileParts = files.map((file) => ({
      inlineData: {
        mimeType: file.mimetype || "application/octet-stream",
        data: file.buffer.toString("base64"),
      },
    }));

    const prompt = `
أنت مساعد تربوي متخصص في تحليل الوثائق التعليمية.

حلّل الملفات المرفوعة، ثم أعد النتيجة بصيغة JSON فقط دون أي شرح خارج JSON.

استخدم هذا الشكل بالضبط:
{
  "summary": "ملخص عام للتحليل",
  "strengths": ["نقطة قوة أولى", "نقطة قوة ثانية"],
  "weaknesses": ["نقطة تحتاج إلى تحسين", "نقطة أخرى"],
  "recommendations": ["توصية عملية أولى", "توصية عملية ثانية"]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, ...fileParts],
        },
      ],
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanText);

    res.json(data);
  } catch (e: any) {
    console.error("Gemini API Error:", e);
    res.status(500).json({
      error: e.message || "Failed to analyze",
    });
  }
});

async function startServer() {
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

  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
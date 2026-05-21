import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const upload = multer({
  storage: multer.memoryStorage(),
});

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    await runMiddleware(req, res, upload.array("files"));

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Missing GEMINI_API_KEY",
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const files = (req as any).files || [];

    const fileParts = files.map((file: any) => ({
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString("base64"),
      },
    }));

    const prompt = `
أنت خبير تربوي متخصص في تحليل البيانات التعليمية.

قم بتحليل الملفات المرفوعة وأعد JSON فقط.

{
  "summary": "ملخص التحليل",
  "strengths": [],
  "weaknesses": [],
  "recommendations": []
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

    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(cleanText);

    return res.status(200).json(data);
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Analysis failed",
    });
  }
}

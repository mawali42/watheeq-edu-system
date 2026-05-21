import multer from "multer";
import { GoogleGenAI } from "@google/genai";

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

export default async function handler(req: any, res: any) {
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

    const files = req.files || [];

    const fileParts = files.map((file: any) => ({
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString("base64"),
      },
    }));

    const prompt = `
أنت خبير تربوي ومحلل بيانات تعليمية متخصص في اللغة العربية والصفوف 8-10.
حلّل الملفات المرفوعة تحليلاً تربوياً واستراتيجياً دقيقاً.

تعليمات مهمة:
- إذا كانت الملفات Excel أو CSV فاستخرج الأرقام قدر الإمكان: عدد الطلبة، المتوسط، نسبة الإتقان/النجاح، وأي توزيع للمستويات أو الدرجات.
- إذا كانت الملفات PDF أو صوراً فاستخرج المؤشرات الظاهرة ثم حلّلها.
- اكتب بلغة عربية فصيحة وواضحة ومناسبة لمدير مدرسة/معلم أول.
- اجعل التوصيات عملية قابلة للتنفيذ داخل المدرسة.
- لا تكتب Markdown ولا أي شرح خارج JSON.
- إن لم تجد رقماً واضحاً ضع 0 أو مصفوفة فارغة بدل التخمين.

أعد JSON فقط بهذا الشكل:
{
  "statistics": {
    "subjectName": "",
    "studentCount": 0,
    "mean": 0,
    "masteryRate": 0
  },
  "charts": {
    "gradeDistribution": [
      { "label": "مستوى أ", "value": 0 },
      { "label": "مستوى ب", "value": 0 },
      { "label": "مستوى ج", "value": 0 },
      { "label": "مستوى د", "value": 0 },
      { "label": "مستوى هـ", "value": 0 }
    ]
  },
  "qualitative": {
    "strengths": [],
    "gaps": []
  },
  "dataStory": {
    "analysis": "",
    "interpretation": "",
    "evaluation": "",
    "procedure": ""
  },
  "swot": {
    "strengths": [],
    "weaknesses": [],
    "opportunities": [],
    "threats": []
  },
  "ishikawa": {
    "mainProblem": "",
    "teacher": "",
    "student": "",
    "curriculum": "",
    "environment": ""
  },
  "problemTree": {
    "branches": [],
    "trunk": "",
    "roots": []
  },
  "pareto": {
    "vitalFew": []
  },
  "interventionPlan": [
    { "title": "", "action": "" }
  ],
  "recommendations": [],
  "strategicAdvice": ""
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
    console.error("Analyze API Error:", error);

    return res.status(500).json({
      error: error.message || "Analysis failed",
    });
  }
}

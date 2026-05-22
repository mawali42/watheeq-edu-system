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

function cleanJsonText(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

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

    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        error: "لم يتم رفع أي ملف للتحليل",
      });
    }

    // حدود حماية لتقليل استهلاك الرصيد
    if (files.length > 3) {
      return res.status(400).json({
        error: "الحد الأقصى 3 ملفات في كل عملية تحليل حفاظًا على سرعة التحليل واستهلاك الرصيد",
      });
    }

    const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          error: `حجم الملف "${file.originalname}" كبير جدًا. الحد الأقصى 6MB لكل ملف.`,
        });
      }
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const fileParts = files.flatMap((file: any, index: number) => [
      {
        text: `
[الملف ${index + 1}]
اسم الملف: ${file.originalname}
نوع الملف: ${file.mimetype}
المطلوب: اقرأ هذا الملف باعتباره ${files.length === 2 ? `طرفًا في المقارنة` : `مصدرًا من مصادر التحليل`}.
`,
      },
      {
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString("base64"),
        },
      },
    ]);

    const baseJsonShape = `
أعد JSON فقط دون Markdown ودون أي شرح خارج JSON، وبنفس هذا الشكل:

{
  "analysisMode": "single_or_merged_or_comparison",
  "statistics": {
    "subjectName": "",
    "studentCount": 0,
    "mean": 0,
    "masteryRate": 0
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
  "comparison": {
    "fileOneTitle": "",
    "fileTwoTitle": "",
    "executiveSummary": "",
    "keySimilarities": [],
    "keyDifferences": [],
    "improvements": [],
    "declines": [],
    "strategicReading": "",
    "comparisonTable": [
      {
        "criterion": "",
        "fileOne": "",
        "fileTwo": "",
        "judgment": ""
      }
    ],
    "finalJudgment": ""
  },
  "recommendations": [],
  "strategicAdvice": "",
  "interventionPlan": [
    {
      "title": "",
      "action": ""
    }
  ],
  "charts": {
    "gradeDistribution": []
  }
}
`;

    const comparisonPrompt = `
أنت خبير تربوي ومحلل بيانات تعليمية متخصص في المقارنة بين الوثائق المدرسية.

تم رفع ملفين فقط، لذلك يجب تفعيل "وضع المقارنة الاستراتيجية".

المطلوب:
1. حلّل الملف الأول مستقلًا.
2. حلّل الملف الثاني مستقلًا.
3. قارن بينهما مقارنة تربوية دقيقة.
4. استخرج أوجه التشابه والاختلاف.
5. حدّد مؤشرات التحسن والتراجع إن وجدت.
6. إذا كان الملفان يمثلان عامين دراسيين أو صفين أو زيارتين أو نتيجتين، فاقرأ العلاقة بينهما بوضوح.
7. لا تدمج الملفين كملف واحد فقط؛ بل اجعل المقارنة محور التقرير.
8. اجعل حقل comparison غنيًا ومفيدًا جدًا.
9. في dataStory اجعل السرد التربوي مبنيًا على المقارنة بين الملفين.
10. في recommendations قدّم توصيات مبنية على الفجوات والفروقات بين الملفين.

${baseJsonShape}

ملاحظات مهمة:
- analysisMode يجب أن تكون "comparison".
- fileOneTitle و fileTwoTitle يجب أن يكونا واضحين من أسماء الملفات أو محتواها.
- إذا لم تجد أرقامًا دقيقة، لا تخترع أرقامًا، واكتب قراءة وصفية.
- اجعل اللغة عربية فصحى تربوية واضحة.
`;

    const mergedPrompt = `
أنت خبير تربوي ومحلل بيانات تعليمية.

تم رفع ${files.length} ملف/ملفات. 
إذا كان ملفًا واحدًا فحلله تحليلًا تربويًا شاملًا.
إذا كانت أكثر من ملفين فادمجها في قراءة استراتيجية موحدة، ولا تجعلها مقارنة تفصيلية ثنائية.

المطلوب:
1. استخراج أهم المؤشرات الكمية والكيفية.
2. بناء سرد تربوي واضح.
3. تحديد نقاط القوة والفجوات.
4. إنتاج SWOT وإيشيكاوا وشجرة المشكلات وباريتو.
5. تقديم توصيات وخطة علاجية عملية.

${baseJsonShape}

ملاحظات مهمة:
- إذا كان ملفًا واحدًا: analysisMode = "single".
- إذا كانت أكثر من ملفين: analysisMode = "merged".
- اجعل حقل comparison فارغًا أو مختصرًا في غير حالة الملفين.
- لا تخترع أرقامًا غير موجودة.
- اجعل اللغة عربية فصحى تربوية واضحة.
`;

    const prompt = files.length === 2 ? comparisonPrompt : mergedPrompt;

    const response = await ai.models.generateContent({
      // إن ظهر أن هذا الموديل غير متاح في حسابك، استبدله بـ gemini-2.5-flash
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, ...fileParts],
        },
      ],
    });

    const text = response.text || "{}";
    const cleanText = cleanJsonText(text);

    let data: any;
    try {
      data = JSON.parse(cleanText);
    } catch {
      return res.status(500).json({
        error: "تعذر تحويل استجابة الذكاء الاصطناعي إلى JSON صالح",
        raw: cleanText.slice(0, 1500),
      });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Analyze API Error:", error);

    return res.status(500).json({
      error: error.message || "Analysis failed",
    });
  }
}

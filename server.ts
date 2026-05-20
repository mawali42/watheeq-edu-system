import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// Initialize multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add the API route FIRST
  app.post("/api/analyze", upload.array("files"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "لم يتم العثور على ملفات" });
      }

      if (!process.env.GEMINI_API_KEY) {
         return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
            headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      // Prepare parts for the prompt
      const parts: any[] = [];
      const prompt = `أنت الخبير والمحلل في نظام "وثيق للتحليل التربوي الاستراتيجي".
الرجاء تحليل الملفات المرفقة (سواء كانت استمارة زيارة إشرافية، نتائج طلبة، أو تقارير إدارية)، مع الالتزام الصارم بالقواعد التالية:

# قواعد صارمة لمنع التناقض والهلوسة الإحصائية (حاسمة جداً):
1. الالتزام المطلق بالبيانات الفعلية في المستند: يمنع منعاً باتاً اختراع أو استنتاج بيانات كمية غير موجودة صراحةً.
2. نوع المستند:
   - إذا كان المستند "استمارة زيارة إشرافية" وليس به أرقام للطلبة: ضع "0" في (studentCount) و (masteryRate) و (mean). لا تقم بتخمين هذه الأرقام أبداً. حلل الأداء للمعلم أو سير الحصة دراسياً بشكل نوعي.
   - إذا كان المستند "درجات أو نتائج طلبة": استخدم الأرقام الفعلية المذكورة لحساب نسب النجاح، الإتقان، وعددهم الفعلي.
3. المخططات الاستراتيجية: 
   - SWOT: تحليل نقاط القوة، الضعف، الفرص، والتهديدات.
   - Ishikawa (عظمة السمكة): الأسباب الجذرية (المعلم، الطالب، المنهج، البيئة).
   - Problem Tree (شجرة المشكلات): جذور المشكلة (الأسباب)، جذع المشكلة، وأغصانها (الآثار الميدانية).
   - Pareto (باريتو التربوي 80/20): استخرج 20% من الفجوات أو الأسباب التي تسبب 80% من المشاكل.

استخرج البيانات وضعها في الهيكل المطلوب. إذا لم تتوفر بيانات لعنصر كمي، اجعل قيمته 0.`;

      parts.push({ text: prompt });

      for (const file of files) {
          parts.push({
             inlineData: {
                data: file.buffer.toString("base64"),
                mimeType: file.mimetype
             }
          });
      }

      const schema = {
        type: Type.OBJECT,
        properties: {
          statistics: {
             type: Type.OBJECT,
             properties: {
                studentCount: { type: Type.NUMBER, description: "حجم العينة أو المستهدفين. 0 إذا لم يوجد" },
                masteryRate: { type: Type.NUMBER, description: "نسبة النجاح أو الإتقان إن وجدت. 0 إذا لم توجد" },
                mean: { type: Type.NUMBER },
                subjectName: { type: Type.STRING, description: "السياق أو المادة" }
             }
          },
          qualitative: {
             type: Type.OBJECT,
             properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "نقاط القوة المستخرجة" },
                gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "الفجوات التعليمية" }
             }
          },
          dataStory: {
             type: Type.OBJECT,
             properties: {
                analysis: { type: Type.STRING },
                interpretation: { type: Type.STRING },
                evaluation: { type: Type.STRING },
                procedure: { type: Type.STRING }
             }
          },
          ishikawa: {
             type: Type.OBJECT,
             properties: {
                mainProblem: { type: Type.STRING },
                teacher: { type: Type.STRING },
                student: { type: Type.STRING },
                curriculum: { type: Type.STRING },
                environment: { type: Type.STRING }
             }
          },
          problemTree: {
             type: Type.OBJECT,
             properties: {
                trunk: { type: Type.STRING, description: "الجذع: المشكلة الرئيسية" },
                roots: { type: Type.ARRAY, items: { type: Type.STRING }, description: "الجذور: الأسباب" },
                branches: { type: Type.ARRAY, items: { type: Type.STRING }, description: "الأغصان: الآثار الميدانية والنتائج" }
             }
          },
          pareto: {
             type: Type.OBJECT,
             properties: {
                vitalFew: { type: Type.ARRAY, items: { type: Type.STRING }, description: "20% من الفجوات/الأسباب التي تسبب 80% من المشكلة (القلة الحيوية)" }
             }
          },
          swot: {
             type: Type.OBJECT,
             properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } }
             }
          },
          recommendations: {
             type: Type.ARRAY, items: { type: Type.STRING }, description: "التوصيات الذكية"
          },
          strategicAdvice: {
             type: Type.STRING, description: "نصيحة استراتيجية"
          }
        }
      };

      let response;
      let retries = 5;
      let delay = 3000;
      let modelName = "gemini-3.5-flash";
      
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
               responseMimeType: "application/json",
               responseSchema: schema,
               temperature: 0.1
            }
          });
          break; // Success
        } catch (err: any) {
          retries--;
          const errorMessage = err.message || "";
          console.warn(`Attempt failed with ${modelName}. Retries left: ${retries}`, errorMessage);
          
          if (retries === 0) {
            throw err;
          }
          
          if (errorMessage.includes("429") || errorMessage.includes("Quota") || errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("fetch failed") || errorMessage.includes("overloaded")) {
             if (retries === 4) modelName = "gemini-2.5-flash";
             else if (retries === 3) modelName = "gemini-3.1-flash-lite";
             
             await new Promise(resolve => setTimeout(resolve, delay));
             delay += 2000;
          } else {
             throw err; // Don't retry on other errors
          }
        }
      }

      const text = response.text || "{}";
      const data = JSON.parse(text);
      res.json(data);

    } catch (e: any) {
      console.error("Gemini API Error:", e.message);
      
      const errorMessage = e.message || "";
      const isQuota = errorMessage.includes("429") || errorMessage.includes("Quota");
      const isUnavailable = errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE");
      
      if (isQuota) {
         return res.status(429).json({ error: "عذراً، تم تجاوز الحد المسموح للاستخدام (Quota). يرجى المحاولة بعد قليل." });
      } else if (isUnavailable) {
         return res.status(503).json({ error: "نظام التحليل يواجه ضغطاً عالياً حالياً. يرجى إعادة المحاولة بعد دقيقة." });
      }
      
      res.status(500).json({ error: e.message || "Failed to analyze" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// 1️⃣ تعريف المتغيرات في النطاق الخارجي العام (حاسم جداً لـ Vercel)
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = 3000;

// 2️⃣ مسار الـ API نخرجه هنا في النطاق العام لكي يقرأه Vercel مباشرة
app.post("/api/analyze", upload.array("files"), async (req, res) => {
    try {
      // ... (ضع كل كود التحليل الداخلي المكتوب عندك هنا بالكامل دون تعديل حرصاً على منطقك التربوي) ...
      
      const text = response.text || "{}";
      const data = JSON.parse(text);
      res.json(data);

    } catch (e: any) {
      console.error("Gemini API Error:", e.message);
      res.status(500).json({ error: e.message || "Failed to analyze" });
    }
});

// 3️⃣ دالة تشغيل السيرفر المحلي والواجهة (Vite Middleware)
async function startServer() {
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

  // لا نجعل السيرفر يستمع للمنفذ إلا في البيئة المحلية فقط
  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// تشغيل الدالة للبيئة المحلية
startServer();

// 4️⃣ التصدير القياسي لـ Vercel (مهم جداً)
export default app;
import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// 1. تعريف الـ app والـ upload في النطاق الخارجي العام (حاسم لـ Vercel)
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = 3000;

// 2. مسار الـ API مباشرة في الخارج لكي يراه Vercel فوراً
app.post("/api/analyze", upload.array("files"), async (req, res) => {
    // ... (اترك كل كود التحليل الداخلي المكتوب عندك هنا كما هو دون تغيير) ...
});

// 3. دالة التشغيل الفرعية للواجهة والنظام المحلي
async function startServer() {
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

  // تشغيل الاستماع المحلي فقط إذا لم نكن في بيئة Vercel
  if (process.env.NODE_ENV !== "production") {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
  }
}

// تشغيل الدالة
startServer();

// التصدير الرسمي لـ Vercel
export default app;
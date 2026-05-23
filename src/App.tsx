import React, { useState, useRef } from 'react';import { UploadCloud, FileText, FileSpreadsheet, Image as ImageIcon, Loader2, ArrowRight, BrainCircuit, Target, TrendingUp, AlertTriangle, RefreshCw, X, Play, BarChart3, TreePine, Download, PieChart } from 'lucide-react';import { motion, AnimatePresence } from 'motion/react';

export default function App() {const [isAnalyzing, setIsAnalyzing] = useState(false);const [showResults, setShowResults] = useState(false);const [analysisData, setAnalysisData] = useState<any>(null);const [selectedFiles, setSelectedFiles] = useState<File[]>([]);const [isDragging, setIsDragging] = useState(false);const [errorData, setErrorData] = useState<string | null>(null);const [isExporting, setIsExporting] = useState(false);const fileInputRef = useRef<HTMLInputElement>(null);
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [password, setPassword] = useState("");
const [activeSection, setActiveSection] = useState<string>("dashboard");
const [openSectionTitle, setOpenSectionTitle] = useState<string>("لوحة وثيق");

const APP_PASSWORD = "saud2026"; // 
// Handle File Upload interaction
const handleUploadClick = () => {fileInputRef.current?.click();};

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {if (e.target.files && e.target.files.length > 0) {setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);setErrorData(null);}};

const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {e.preventDefault();setIsDragging(false);if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);setErrorData(null);}};

const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {e.preventDefault();setIsDragging(true);};

const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {e.preventDefault();setIsDragging(false);};

const removeFile = (index: number) => {setSelectedFiles(prev => prev.filter((_, i) => i !== index));if (selectedFiles.length <= 1) {setErrorData(null);}};

const startAnalysis = async () => {
  if (selectedFiles.length === 0) return;

  setIsAnalyzing(true);
  setErrorData(null);

  const formData = new FormData();

  selectedFiles.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || "حدث خطأ أثناء تحليل الملفات"
      );
    }

    setAnalysisData(data);
    setShowResults(true);
  } catch (err: any) {
    console.error("Analysis Error:", err);

    setErrorData(
      err?.message || "تعذر الاتصال بخدمة التحليل"
    );
  } finally {
    setIsAnalyzing(false);
  }
};

// Reset for a new analysis
const resetAnalysis = (e?: React.MouseEvent<HTMLButtonElement>) => {
  e?.preventDefault();
  e?.stopPropagation();

  // إعادة تشغيل الصفحة هي الأضمن لإفراغ الملفات والنتائج وحالة التصدير بالكامل
  window.location.href = window.location.origin + window.location.pathname;
};

const exportReportPDF = (e?: React.MouseEvent<HTMLButtonElement>) => {
  e?.preventDefault();
  e?.stopPropagation();

  try {
    setErrorData(null);
    setIsExporting(true);

    const data = analysisData || {};
    const today = new Date().toLocaleDateString("ar-OM", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const esc = (value: any) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const list = (items: any[] = []) => {
      if (!items || items.length === 0) return `<p class="muted">لا توجد بيانات متاحة.</p>`;
      return `<ul>${items.map((item) => {
        const value = typeof item === "string" ? item : item?.title || item?.action || item?.description || JSON.stringify(item);
        return `<li>${esc(value)}</li>`;
      }).join("")}</ul>`;
    };

    const plan = (items: any[] = []) => {
      if (!items || items.length === 0) {
        return `<tr><td colspan="5" class="muted">لا توجد خطة علاجية متاحة.</td></tr>`;
      }

      return items.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${esc(item?.title || `إجراء ${i + 1}`)}</td>
          <td>${esc(item?.action || item?.description || item)}</td>
          <td>حسب الخطة التنفيذية</td>
          <td>مؤشر تحقق قابل للقياس</td>
        </tr>
      `).join("");
    };


    const chartBars = (items: any[] = []) => {
      if (!items || items.length === 0) return `<p class="muted">لا توجد بيانات لمخطط توزيع مستويات الأداء.</p>`;

      return `<div class="bar-chart">
        ${items.map((item: any, i: number) => {
          const label = esc(item.label || item.level || `مستوى ${i + 1}`);
          const value = Number(item.value || item.percentage || 0);
          const safeValue = Math.max(0, Math.min(100, value));
          return `
            <div class="bar-row">
              <div class="bar-label">${label}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${safeValue}%"></div>
              </div>
              <div class="bar-value">${safeValue}%</div>
            </div>
          `;
        }).join("")}
      </div>`;
    };

    const comparisonTable = (items: any[] = []) => {
      if (!items || items.length === 0) return "";
      return `
        <section class="page-section avoid">
          <h2>المقارنة الاستراتيجية بين الملفين</h2>
          <table>
            <thead>
              <tr>
                <th>المعيار</th>
                <th>${esc(data?.comparison?.fileOneTitle || "الملف الأول")}</th>
                <th>${esc(data?.comparison?.fileTwoTitle || "الملف الثاني")}</th>
                <th>الحكم التحليلي</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((row: any) => `
                <tr>
                  <td>${esc(row.criterion)}</td>
                  <td>${esc(row.fileOne)}</td>
                  <td>${esc(row.fileTwo)}</td>
                  <td>${esc(row.judgment)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </section>
      `;
    };

    const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>تقرير وثيق - ${esc(data?.statistics?.subjectName || "تحليل تربوي")}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: #ffffff;
    color: #111827;
    font-family: Tahoma, Arial, sans-serif;
    line-height: 1.75;
    font-size: 12.5px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 100%;
    min-height: 270mm;
    page-break-after: always;
  }

  .page:last-child { page-break-after: auto; }

  .cover {
    min-height: 270mm;
    padding: 34mm 18mm 20mm;
    border: 1px solid #dbeafe;
    border-radius: 18px;
    background:
      radial-gradient(circle at top right, rgba(37,99,235,.18), transparent 38%),
      radial-gradient(circle at bottom left, rgba(16,185,129,.16), transparent 34%),
      linear-gradient(135deg, #f8fafc 0%, #ffffff 55%, #ecfeff 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .logo {
    width: 88px;
    height: 88px;
    margin: 0 auto 20px;
    border-radius: 26px;
    background: linear-gradient(135deg, #2563eb, #10b981);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 900;
    box-shadow: 0 20px 40px rgba(37,99,235,.22);
  }

  .cover h1 {
    text-align: center;
    font-size: 34px;
    margin: 0 0 10px;
    color: #1e3a8a;
    font-weight: 900;
  }

  .subtitle {
    text-align: center;
    font-size: 15px;
    color: #475569;
    margin: 0 auto 30px;
    max-width: 640px;
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 25px 0 32px;
  }

  .meta div {
    border: 1px solid #dbeafe;
    background: rgba(255,255,255,.9);
    border-radius: 14px;
    padding: 13px 10px;
    text-align: center;
  }

  .meta span {
    display: block;
    color: #64748b;
    font-size: 10.5px;
    margin-bottom: 7px;
  }

  .meta strong {
    display: block;
    color: #0f172a;
    font-size: 15px;
  }

  .cover-footer {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #dbeafe;
    padding-top: 16px;
    color: #334155;
    margin-top: 26px;
  }

  .cover-footer strong { color: #1e3a8a; }
  .cover-footer p { margin: 4px 0 0; }

  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 7px;
    margin-bottom: 12px;
    font-size: 10px;
  }

  .doc-footer {
    display: flex;
    justify-content: space-between;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 7px;
    margin-top: 12px;
    font-size: 9.5px;
  }

  h2 {
    color: #1e40af;
    font-size: 17px;
    margin: 0 0 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid #dbeafe;
    font-weight: 900;
  }

  h3 {
    color: #0f766e;
    font-size: 13px;
    margin: 0 0 7px;
    font-weight: 900;
  }

  .page-section {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 15px;
    padding: 14px 16px;
    margin-bottom: 11px;
    box-shadow: 0 6px 16px rgba(15,23,42,.045);
  }

  .avoid { break-inside: avoid; page-break-inside: avoid; }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .four-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .mini-card {
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    border-radius: 13px;
    padding: 10px 12px;
  }

  ul {
    margin: 0;
    padding: 0 18px 0 0;
  }

  li { margin-bottom: 4px; }
  p { margin: 0 0 7px; }
  .muted { color: #64748b; }

  .story p {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 9px 11px;
    margin-bottom: 8px;
  }

  .highlight {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 13px;
    padding: 10px 12px;
    margin-bottom: 10px;
  }

  .warning {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 13px;
    padding: 10px 12px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr;
    gap: 10px;
  }

  .stat-card {
    background: linear-gradient(135deg, #eff6ff, #ffffff);
    border: 1px solid #bfdbfe;
    border-radius: 14px;
    padding: 13px 14px;
    min-height: 82px;
  }

  .stat-card span {
    display: block;
    color: #64748b;
    font-size: 10.5px;
    margin-bottom: 6px;
  }

  .stat-card strong {
    display: block;
    color: #1e40af;
    font-size: 24px;
    line-height: 1.2;
    font-weight: 900;
  }

  .stat-card small {
    display: block;
    color: #64748b;
    margin-top: 4px;
  }

  .bar-chart {
    display: grid;
    gap: 8px;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 92px 1fr 42px;
    gap: 8px;
    align-items: center;
  }

  .bar-label {
    color: #334155;
    font-weight: 700;
    font-size: 11px;
  }

  .bar-track {
    height: 12px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #2563eb, #06b6d4);
    border-radius: 999px;
  }

  .bar-value {
    color: #0f172a;
    font-weight: 800;
    font-size: 11px;
    text-align: left;
  }


  table {
    width: 100%;
    border-collapse: collapse;
    overflow: hidden;
    border-radius: 12px;
    font-size: 11.5px;
  }

  th {
    background: #1e40af;
    color: #fff;
    padding: 8px;
    text-align: right;
  }

  td {
    border: 1px solid #e5e7eb;
    padding: 8px;
    vertical-align: top;
  }

  tr:nth-child(even) td { background: #f8fafc; }

  .print-actions {
    position: fixed;
    top: 12px;
    left: 12px;
    display: flex;
    gap: 8px;
    z-index: 9999;
  }

  .print-actions button {
    border: 0;
    border-radius: 10px;
    padding: 10px 14px;
    background: #2563eb;
    color: #fff;
    cursor: pointer;
    font-weight: 700;
  }

  .print-actions button.secondary { background: #0f172a; }

  @media print {
    .print-actions { display: none; }
    body { font-size: 12.2px; }
  }
</style>
</head>
<body>
  <div class="print-actions">
    <button onclick="window.print()">حفظ PDF / طباعة</button>
    <button class="secondary" onclick="window.close()">إغلاق</button>
  </div>

  <section class="page cover">
    <div class="logo">وثيق</div>
    <h1>التقرير التحليلي الاستراتيجي</h1>
    <p class="subtitle">تقرير تربوي ذكي مبني على تحليل الوثائق والاستمارات التعليمية، ومصمم بصيغة تنفيذية جاهزة للعرض والطباعة.</p>

    <div class="meta">
      <div><span>المجال</span><strong>${esc(data?.statistics?.subjectName || "تحليل تربوي")}</strong></div>
      <div><span>عدد المستهدفين / العينة</span><strong>${esc(data?.statistics?.studentCount || "—")}</strong></div>
      <div><span>المتوسط الحسابي</span><strong>${esc(data?.statistics?.mean || "—")}</strong></div>
      <div><span>نسبة الإتقان</span><strong>${data?.statistics?.masteryRate ? esc(data.statistics.masteryRate) + "%" : "—"}</strong></div>
    </div>

    <div class="cover-footer">
      <div><strong>إعداد وتطوير</strong><p>أ. سعود المعولي</p></div>
      <div><strong>تاريخ التقرير</strong><p>${esc(today)}</p></div>
    </div>
  </section>

  <main class="page">
    <div class="doc-header">
      <span>نظام وثيق للتحليل الاستراتيجي التربوي</span>
      <span>${esc(today)}</span>
    </div>

    <section class="page-section avoid">
      <h2>لوحة المؤشرات الإحصائية</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <span>نسبة النجاح / الإتقان العام</span>
          <strong>${data?.statistics?.masteryRate ? esc(data.statistics.masteryRate) + "%" : "—"}</strong>
          <small>مؤشر عام لمدى تحقق النتائج المستهدفة.</small>
        </div>
        <div class="stat-card">
          <span>المستهدفون / العينة</span>
          <strong>${esc(data?.statistics?.studentCount || "—")}</strong>
          <small>عدد الطلبة أو السجلات محل التحليل.</small>
        </div>
        <div class="stat-card">
          <span>المتوسط الحسابي</span>
          <strong>${esc(data?.statistics?.mean || "—")}</strong>
          <small>متوسط الأداء العام حسب البيانات.</small>
        </div>
      </div>
    </section>

    <section class="page-section avoid">
      <h2>مخطط توزيع مستويات الأداء</h2>
      ${chartBars(data?.charts?.gradeDistribution)}
    </section>


    ${data?.analysisMode === "comparison" ? `
      <section class="page-section avoid">
        <h2>الملخص التنفيذي للمقارنة</h2>
        <div class="highlight">${esc(data?.comparison?.executiveSummary || "لا يوجد ملخص مقارنة متاح.")}</div>
        <div class="two-col">
          <div class="mini-card"><h3>الملف الأول</h3><p>${esc(data?.comparison?.fileOneTitle || "الملف الأول")}</p></div>
          <div class="mini-card"><h3>الملف الثاني</h3><p>${esc(data?.comparison?.fileTwoTitle || "الملف الثاني")}</p></div>
        </div>
      </section>

      <div class="two-col">
        <section class="page-section avoid"><h2>أوجه التشابه</h2>${list(data?.comparison?.keySimilarities)}</section>
        <section class="page-section avoid"><h2>أوجه الاختلاف</h2>${list(data?.comparison?.keyDifferences)}</section>
      </div>

      <div class="two-col">
        <section class="page-section avoid"><h2>مؤشرات التحسن</h2>${list(data?.comparison?.improvements)}</section>
        <section class="page-section avoid"><h2>مؤشرات التراجع</h2>${list(data?.comparison?.declines)}</section>
      </div>

      <section class="page-section avoid">
        <h2>القراءة الاستراتيجية</h2>
        <p>${esc(data?.comparison?.strategicReading || "لا توجد قراءة استراتيجية متاحة.")}</p>
      </section>

      ${comparisonTable(data?.comparison?.comparisonTable)}

      <section class="page-section avoid">
        <h2>الحكم النهائي للمقارنة</h2>
        <div class="warning">${esc(data?.comparison?.finalJudgment || "لا يوجد حكم نهائي متاح.")}</div>
      </section>
    ` : ""}

    <section class="page-section avoid">
      <h2>أولًا: الملخص والسرد التربوي</h2>
      <div class="story">
        ${data?.dataStory?.analysis ? `<p><strong>التحليل:</strong> ${esc(data.dataStory.analysis)}</p>` : ""}
        ${data?.dataStory?.interpretation ? `<p><strong>التفسير:</strong> ${esc(data.dataStory.interpretation)}</p>` : ""}
        ${data?.dataStory?.evaluation ? `<p><strong>التقييم:</strong> ${esc(data.dataStory.evaluation)}</p>` : ""}
        ${data?.dataStory?.procedure ? `<p><strong>الإجراء:</strong> ${esc(data.dataStory.procedure)}</p>` : ""}
      </div>
    </section>

    <div class="two-col">
      <section class="page-section avoid"><h2>نقاط القوة</h2>${list(data?.qualitative?.strengths)}</section>
      <section class="page-section avoid"><h2>الفجوات التعليمية</h2>${list(data?.qualitative?.gaps)}</section>
    </div>

    <section class="page-section avoid">
      <h2>ثانيًا: مصفوفة SWOT</h2>
      <div class="four-grid">
        <div class="mini-card"><h3>نقاط القوة</h3>${list(data?.swot?.strengths)}</div>
        <div class="mini-card"><h3>نقاط الضعف</h3>${list(data?.swot?.weaknesses)}</div>
        <div class="mini-card"><h3>الفرص</h3>${list(data?.swot?.opportunities)}</div>
        <div class="mini-card"><h3>التهديدات</h3>${list(data?.swot?.threats)}</div>
      </div>
    </section>

    <section class="page-section avoid">
      <h2>ثالثًا: باريتو التربوي 80/20</h2>
      <p class="warning">الفجوات الآتية تمثل الأولويات الأعلى أثرًا في تحسين الأداء:</p>
      ${list(data?.pareto?.vitalFew)}
    </section>

    <section class="page-section avoid">
      <h2>رابعًا: هيكلة إيشيكاوا (عظمة السمكة)</h2>
      <div class="highlight"><strong>المشكلة الرئيسة:</strong> ${esc(data?.ishikawa?.mainProblem || "تم رصد فجوة في البيانات المرفقة")}</div>
      <div class="four-grid">
        <div class="mini-card"><h3>المعلم</h3><p>${esc(data?.ishikawa?.teacher || "—")}</p></div>
        <div class="mini-card"><h3>الطالب</h3><p>${esc(data?.ishikawa?.student || "—")}</p></div>
        <div class="mini-card"><h3>المنهج / السياسات</h3><p>${esc(data?.ishikawa?.curriculum || "—")}</p></div>
        <div class="mini-card"><h3>البيئة التربوية</h3><p>${esc(data?.ishikawa?.environment || "—")}</p></div>
      </div>
    </section>

    <section class="page-section avoid">
      <h2>خامسًا: شجرة المشكلات</h2>
      <div class="mini-card"><h3>الأغصان: الآثار الميدانية</h3>${list(data?.problemTree?.branches)}</div>
      <div class="mini-card"><h3>الجذع: المشكلة</h3><p>${esc(data?.problemTree?.trunk || "—")}</p></div>
      <div class="mini-card"><h3>الجذور: الأسباب</h3>${list(data?.problemTree?.roots)}</div>
    </section>

    <section class="page-section avoid">
      <h2>سادسًا: التوصيات الذكية</h2>
      ${list(data?.recommendations)}
      ${data?.strategicAdvice ? `<div class="highlight"><strong>نصيحة استراتيجية:</strong><p>${esc(data.strategicAdvice)}</p></div>` : ""}
    </section>

    <section class="page-section avoid">
      <h2>سابعًا: الخطة العلاجية المقترحة</h2>
      <table>
        <thead>
          <tr>
            <th>م</th>
            <th>الإجراء</th>
            <th>الوصف التنفيذي</th>
            <th>المدة</th>
            <th>مؤشر النجاح</th>
          </tr>
        </thead>
        <tbody>${plan(data?.interventionPlan)}</tbody>
      </table>
    </section>

    <div class="doc-footer">
      <span>تم إنشاء هذا التقرير عبر نظام وثيق للتحليل الاستراتيجي التربوي</span>
      <span>تصميم وتطوير أ. سعود المعولي</span>
    </div>
  </main>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    }
  </script>
</body>
</html>`;

    const reportWindow = window.open("", "_blank", "width=1100,height=800");
    if (!reportWindow) {
      throw new Error("المتصفح منع فتح نافذة التقرير. اسمح بالنوافذ المنبثقة لهذا الموقع.");
    }

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();

    setTimeout(() => {
      setIsExporting(false);
    }, 1200);
  } catch (err: any) {
    console.error("PDF Export Error:", err);
    setIsExporting(false);
    setErrorData(err?.message || "تعذر إنشاء تقرير PDF الاحترافي");
  }
};

const sectionCards = [
  {
    id: "story",
    title: "قصة البيانات",
    icon: "📖",
    description: "السرد التربوي والتحليل والتفسير والتقييم والإجراء.",
    color: "from-blue-500/20 to-cyan-500/10",
  },
  {
    id: "stats",
    title: "الإحصائيات والمستويات",
    icon: "📊",
    description: "لوحة المؤشرات، الإتقان، المتوسط، وتوزيع مستويات الأداء.",
    color: "from-emerald-500/20 to-blue-500/10",
  },
  {
    id: "visuals",
    title: "التصورات البيانية",
    icon: "📈",
    description: "رسم أعمدة احترافي للمؤشرات وتوزيع مستويات الأداء.",
    color: "from-cyan-500/20 to-blue-500/10",
  },
  {
    id: "qualitative",
    title: "التحليل النوعي والكمي",
    icon: "🎯",
    description: "نقاط القوة والفجوات التعليمية والمؤشرات النوعية.",
    color: "from-purple-500/20 to-blue-500/10",
  },
  {
    id: "ishikawa",
    title: "هيكلة إيشيكاوا",
    icon: "🐟",
    description: "تحليل السبب الجذري وفق عظمة السمكة.",
    color: "from-sky-500/20 to-slate-500/10",
  },
  {
    id: "tree",
    title: "شجرة المشكلات",
    icon: "🌳",
    description: "الأغصان والآثار، الجذع، والجذور المسببة.",
    color: "from-emerald-500/20 to-green-500/10",
  },
  {
    id: "swot",
    title: "مصفوفة SWOT",
    icon: "📉",
    description: "نقاط القوة والضعف والفرص والتهديدات.",
    color: "from-amber-500/20 to-blue-500/10",
  },
  {
    id: "pareto",
    title: "باريتو 80/20",
    icon: "📌",
    description: "أعلى الفجوات أثرًا في تحسين الأداء.",
    color: "from-yellow-500/20 to-orange-500/10",
  },
  {
    id: "recommendations",
    title: "التوصيات والخطة",
    icon: "🧭",
    description: "توصيات تنفيذية وخطة علاجية مقترحة.",
    color: "from-rose-500/20 to-indigo-500/10",
  },
];

const scrollToSection = (id: string, title: string) => {
  setActiveSection(id);
  setOpenSectionTitle(title);
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 50);
};

const backToDashboard = () => {
  setActiveSection("dashboard");
  setOpenSectionTitle("لوحة وثيق");
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 50);
};

const isSectionOpen = (id: string) => activeSection === id;

const getChartDistribution = () => {
  const rawDistribution = analysisData?.charts?.gradeDistribution || [];

  const normalized = rawDistribution
    .map((item: any, index: number) => {
      const label =
        item.label ||
        item.level ||
        item.name ||
        item.category ||
        item.grade ||
        `مستوى ${index + 1}`;

      const rawValue =
        item.value ??
        item.percentage ??
        item.percent ??
        item.rate ??
        item.count ??
        0;

      const numericValue =
        typeof rawValue === "string"
          ? Number(rawValue.replace("%", "").trim())
          : Number(rawValue);

      return {
        label,
        value: Number.isFinite(numericValue) ? numericValue : 0,
      };
    })
    .filter((item: any) => item.value > 0);

  if (normalized.length > 0) {
    return normalized;
  }

  const masteryRate = Number(analysisData?.statistics?.masteryRate || 0);
  if (masteryRate > 0 && masteryRate <= 100) {
    return [
      { label: "الإتقان", value: masteryRate },
      { label: "بحاجة دعم", value: Math.max(0, 100 - masteryRate) },
    ].filter((item) => item.value > 0);
  }

  return [];
};

const hasChartData = () => getChartDistribution().length > 0;

const getDominantLevel = () => {
  const data = getChartDistribution();
  if (!data.length) return "—";

  return data.reduce((max: any, item: any) =>
    Number(item.value) > Number(max.value) ? item : max
  ).label;
};

const exportChartPNG = () => {
  const chart = document.getElementById("visual-chart-area");
  if (!hasChartData()) {
    setErrorData("لا توجد بيانات رقمية كافية لتصدير رسم بياني");
    return;
  }

  if (!chart) {
    setErrorData("لم يتم العثور على الرسم البياني للتصدير");
    return;
  }

  import("dom-to-image-more")
    .then((module: any) => {
      const domtoimage = module.default || module;
      return domtoimage.toPng(chart, {
        bgcolor: "#0f172a",
        quality: 1,
        cacheBust: true,
      });
    })
    .then((dataUrl: string) => {
      const link = document.createElement("a");
      link.download = "watheeq-chart.png";
      link.href = dataUrl;
      link.click();
    })
    .catch((err: any) => {
      console.error("Chart PNG Export Error:", err);
      setErrorData("تعذر تصدير الرسم البياني كصورة");
    });
};

const exportSectionPDF = (id: string, title: string) => {
  try {
    setActiveSection(id);
    setOpenSectionTitle(title);

    setTimeout(() => {
      const section = document.getElementById(`section-${id}`);
      if (!section) {
        setErrorData("لم يتم العثور على القسم المطلوب للتصدير");
        return;
      }

      const cloned = section.cloneNode(true) as HTMLElement;
    const reportWindow = window.open("", "_blank", "width=1000,height=780");
    if (!reportWindow) {
      setErrorData("المتصفح منع فتح نافذة التصدير. اسمح بالنوافذ المنبثقة لهذا الموقع.");
      return;
    }

    const today = new Date().toLocaleDateString("ar-OM", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    reportWindow.document.open();
    reportWindow.document.write(`
      <!doctype html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>وثيق - ${title}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #fff;
            color: #111827;
            font-family: Tahoma, Arial, sans-serif;
            line-height: 1.85;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cover {
            border: 1px solid #dbeafe;
            border-radius: 18px;
            padding: 22px;
            margin-bottom: 16px;
            background:
              radial-gradient(circle at top right, rgba(37,99,235,.16), transparent 32%),
              linear-gradient(135deg, #f8fafc, #ffffff 55%, #ecfeff);
          }
          .brand {
            width: 58px;
            height: 58px;
            border-radius: 18px;
            background: linear-gradient(135deg, #2563eb, #10b981);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 18px;
            margin-bottom: 10px;
          }
          h1 {
            color: #1e3a8a;
            font-size: 24px;
            margin: 0 0 6px;
          }
          .meta {
            color: #64748b;
            font-size: 12px;
          }
          .content {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 18px;
            box-shadow: 0 8px 20px rgba(15,23,42,.06);
          }
          .content * {
            color: #111827 !important;
            background-color: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          .content h2, .content h3, .content p, .content li, .content span {
            color: #111827 !important;
          }
          .content h2 {
            color: #1e40af !important;
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 8px;
          }
          .content .bg-white\\/5,
          .content .bg-slate-950\\/40,
          .content .bg-slate-900\\/50,
          .content .bg-blue-500\\/10,
          .content .bg-emerald-500\\/10,
          .content .bg-purple-500\\/10,
          .content .bg-rose-500\\/5,
          .content .bg-emerald-500\\/5 {
            background: #f8fafc !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 14px !important;
          }
          .footer {
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 11px;
            display: flex;
            justify-content: space-between;
          }
          .print-actions {
            position: fixed;
            top: 12px;
            left: 12px;
            display: flex;
            gap: 8px;
          }
          .print-actions button {
            border: 0;
            border-radius: 10px;
            padding: 10px 14px;
            background: #2563eb;
            color: #fff;
            font-weight: 700;
            cursor: pointer;
          }
          .print-actions button.secondary { background: #0f172a; }
          @media print {
            .print-actions { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-actions">
          <button onclick="window.print()">حفظ PDF / طباعة</button>
          <button class="secondary" onclick="window.close()">إغلاق</button>
        </div>
        <section class="cover">
          <div class="brand">وثيق</div>
          <h1>${title}</h1>
          <div class="meta">تقرير قسم مستقل من نظام وثيق للتحليل الاستراتيجي التربوي • ${today}</div>
        </section>
        <section class="content">${cloned.innerHTML}</section>
        <div class="footer">
          <span>نظام وثيق للتحليل الاستراتيجي التربوي</span>
          <span>تصميم وتطوير أ. سعود المعولي</span>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function(){ window.print(); }, 450);
          }
        </script>
      </body>
      </html>
    `);
    reportWindow.document.close();
    }, 150);
  } catch (err: any) {
    console.error("Section Export Error:", err);
    setErrorData(err?.message || "تعذر تصدير القسم");
  }
};


if (!isAuthenticated) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6"
      style={{
        background:
          "radial-gradient(circle at top right, #1e293b, #0f172a)",
      }}
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 mx-auto bg-blue-500 rounded-3xl flex items-center justify-center mb-5 shadow-lg">
            <BrainCircuit className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-blue-400 mb-2">
            نظام <span className="text-emerald-400">وثيق</span>
          </h1>

          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            منصة خاصة للتحليل التربوي الذكي
            <br />
            بإشراف أ. سعود المعولي
          </p>

          <input
            type="password"
            placeholder="أدخل كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (password === APP_PASSWORD) {
                  setIsAuthenticated(true);
                } else {
                  alert("كلمة المرور غير صحيحة");
                }
              }
            }}
            className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-600 text-white text-center outline-none focus:border-blue-400 transition-all mb-5"
          />

          <button
            type="button"
            onClick={() => {
              if (password === APP_PASSWORD) {
                setIsAuthenticated(true);
              } else {
                alert("كلمة المرور غير صحيحة");
              }
            }}
            className="w-full bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25"
          >
            دخول إلى وثيق
          </button>

          <p className="text-xs text-slate-500 mt-6">
            إصدار خاص • وثيق للتحليل الاستراتيجي التربوي
          </p>
        </div>
      </div>
    </div>
  );
}

return (<div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col overflow-x-hidden font-sans relative"style={{ background: 'radial-gradient(circle at top right, #1e293b, #0f172a)' }}dir="rtl">

  {/* Background Dots */}
  <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
       style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
  </div>

  <div id="app-content-to-export" className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10 flex flex-col min-h-screen">
    
    {/* Header */}
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 mb-6 sm:mb-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-400">نظام <span className="text-emerald-400">"وثيق"</span> للتحليل الاستراتيجي</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">نظام <span className="text-emerald-400 font-medium">وثيق</span> الذكي لاستخراج البيانات وتحليلها بعمق من مختلف الوثائق والاستمارات التربوية؛ سواءً كانت نتائج وتحصيل الطلبة، أو استمارات الزيارات الإشرافية، والتقارير الإدارية، لتحويلها إلى رؤى استراتيجية فورية.</p>
        </div>
      </div>
      {showResults && (
        <div className="flex items-center gap-4 text-right sm:text-left mr-auto sm:mr-0">
           <div>
              <p className="text-sm font-medium">التقرير التحليلي {analysisData?.statistics?.subjectName ? ` - ${analysisData.statistics.subjectName}` : ""}</p>
              <p className="text-[10px] text-slate-500 opacity-80 uppercase tracking-widest mt-1">Strategic Educational Analysis v4.2</p>
           </div>
           <div className="flex items-center gap-2 print:hidden pdf-ignore relative z-50 pointer-events-auto">
             <button
                type="button"
                onClick={(e) => exportReportPDF(e)}
                disabled={isExporting}
                className="bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500 hover:text-white text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 sm:px-4 sm:py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                title="تصدير التقرير PDF"
             >
                {isExporting ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Download className="w-4 h-4 sm:w-5 sm:h-5" />}
                <span className="hidden sm:inline font-medium text-sm">{isExporting ? "جاري إنشاء التقرير..." : "تصدير PDF"}</span>
             </button>
             <button
                type="button"
                onClick={(e) => resetAnalysis(e)}
                className="bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500 hover:text-white text-blue-400 p-2 sm:px-4 sm:py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                title="تحليل جديد"
             >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline font-medium text-sm">تحليل جديد</span>
             </button>
           </div>
        </div>
      )}
    </header>

    {/* Main Content Area */}
    <div className="flex-1 flex flex-col">
      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center min-h-[500px]"
          >
            <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
              
              {/* Decorative corner glows */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">ارفع وثيقتك أو استمارتك التربوية الآن..</h2>
                <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
                  ودع <span className="text-emerald-400 font-medium">وثيق</span> يتولى صياغة قصة البيانات، وبناء المخططات، والخطط التطويرية.
                </p>
                
                {/* Capabilities Badges */}
                <div className="flex flex-col gap-3 mb-10 max-w-2xl mx-auto">
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs sm:text-sm rounded-full flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" />
                      التحليل الإحصائي (الكمي والوصفي)
                    </span>
                    <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs sm:text-sm rounded-full flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      التحليل النوعي للمهارات والفجوات
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-full flex items-center gap-1.5">
                      <span>🦴</span> عظمة السمكة / إيشيكاوا
                    </span>
                    <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-full flex items-center gap-1.5">
                      <span>🌳</span> شجرة المشكلات
                    </span>
                    <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-full flex items-center gap-1.5">
                      <span>📊</span> باريتو التربوي
                    </span>
                    <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-full flex items-center gap-1.5">
                      <span>🧭</span> رباعية SWOT
                    </span>
                  </div>
                </div>
                
                {/* Supported File Types */}
                <div className="flex justify-center gap-6 mb-10">
                  <div className="flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">PDF</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Excel</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Images</span>
                  </div>
                </div>

                {/* Upload Zone */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.xls,.xlsx,.csv,image/*,.txt"
                  multiple
                />
                
                {/* Upload Zone & Selected Files */}
                <div className="w-full flex flex-col gap-6">
                  {errorData && (
                    <div className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-2xl text-sm font-medium">
                      {errorData}
                    </div>
                  )}
                  
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {selectedFiles.map((file, idx) => (
                         <div key={idx} className={`relative flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl transition-colors group ${isAnalyzing ? 'opacity-50' : 'hover:bg-white/10'}`}>
                            {!isAnalyzing && (
                              <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="absolute top-2 left-2 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100" title="إزالة الملف">
                                 <X className="w-4 h-4" />
                              </button>
                            )}
                            <div className="mb-3 p-3 bg-blue-500/10 rounded-xl">
                              <FileText className="w-8 h-8 text-blue-400" />
                            </div>
                            <span className="text-xs text-slate-300 text-center w-full truncate px-2" dir="ltr">{file.name}</span>
                         </div>
                      ))}
                    </div>
                  )}

                  {!isAnalyzing ? (
                    <>
                      <div 
                        className={`border-2 border-dashed w-full ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600 hover:border-blue-400/50 hover:bg-white/5'} rounded-2xl p-8 sm:p-10 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center group`}
                        onClick={handleUploadClick}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-base font-semibold text-slate-300 mb-1">
                          {selectedFiles.length > 0 ? 'إضافة ملفات أخرى' : 'اسحب وأفلت الملفات هنا'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 text-center leading-relaxed">
                          أو انقر لتصفح جهازك<br/>
                          <span className="text-blue-400/70">(يمكنك رفع وتحديد أكثر من ملف معاً)</span>
                        </p>
                      </div>
                      
                      {selectedFiles.length > 0 && (
                        <div className="flex justify-center mt-2">
                          <button onClick={startAnalysis} className="w-full sm:w-auto sm:min-w-[250px] bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all text-base sm:text-lg">
                             <Play className="w-5 h-5 fill-current" />
                             بدء التحليل الشامل
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                     <div className="border-2 border-dashed border-blue-400/50 bg-blue-500/5 rounded-2xl p-10 flex flex-col items-center justify-center gap-4">
                       <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                       <p className="text-sm font-medium text-blue-300 animate-pulse text-center w-full">جاري تحليل {selectedFiles.length} ملفات واستخراج الفجوات...</p>
                     </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex-1 space-y-6"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <span>🧠</span> لوحة أقسام التحليل
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    اختر القسم الذي تريد عرضه أو صدّره مستقلاً بصيغة PDF.
                  </p>
                </div>
                <div className="text-xs text-slate-400 bg-slate-900/40 border border-white/10 rounded-2xl px-4 py-3">
                  القسم النشط: <span className="text-blue-300 font-bold">{openSectionTitle}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {sectionCards.map((card) => (
                  <div
                    key={card.id}
                    className={`group rounded-2xl border ${activeSection === card.id ? "border-blue-400/70 ring-2 ring-blue-500/20" : "border-white/10"} bg-gradient-to-br ${card.color} p-4 hover:scale-[1.015] transition-all shadow-lg`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-2xl">
                        {card.icon}
                      </div>
                      <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                        جاهز
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base mb-2">{card.title}</h3>
                    <p className="text-xs leading-relaxed text-slate-300 min-h-[48px]">{card.description}</p>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => scrollToSection(card.id, card.title)}
                        className="bg-blue-500/20 hover:bg-blue-500 border border-blue-500/30 text-blue-200 hover:text-white rounded-xl py-2 text-xs font-bold transition-all"
                      >
                        عرض القسم
                      </button>
                      <button
                        type="button"
                        onClick={() => exportSectionPDF(card.id, card.title)}
                        className="bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/30 text-emerald-200 hover:text-white rounded-xl py-2 text-xs font-bold transition-all"
                      >
                        تصدير PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {activeSection !== "dashboard" && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">أنت الآن في قسم</p>
                  <h2 className="text-xl font-bold text-blue-300">{openSectionTitle}</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => exportSectionPDF(activeSection, openSectionTitle)}
                    className="bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white text-emerald-300 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  >
                    تصدير هذا القسم PDF
                  </button>
                  <button
                    type="button"
                    onClick={backToDashboard}
                    className="bg-blue-500/20 border border-blue-500/40 hover:bg-blue-500 hover:text-white text-blue-300 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  >
                    رجوع للوحة الأقسام
                  </button>
                </div>
              </div>
            )}

            {activeSection !== "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Column Right (or Left in RTL, spans 3/12 in wide, full in mobile) */}
            <div className={`flex flex-col gap-4 sm:gap-6 ${["stats","qualitative"].includes(activeSection) ? "lg:col-span-12" : "hidden"}`}>
              {/* Stats Panel */}
              {((analysisData?.statistics?.masteryRate !== undefined && analysisData.statistics.masteryRate !== 0) ||
                (analysisData?.statistics?.studentCount !== undefined && analysisData.statistics.studentCount !== 0) ||
                (analysisData?.statistics?.mean !== undefined && analysisData.statistics.mean !== 0)) && (
                <div id="section-stats" className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden ${!isSectionOpen("stats") ? "hidden" : ""}`}>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full -mr-16 -mt-16"></div>
                  <h2 className="text-base sm:text-sm font-bold mb-4 border-b border-white/10 pb-3 text-blue-300 flex items-center gap-2">
                     <Target className="w-4 h-4" /> لوحة التحليل الإحصائي
                  </h2>
                  <div className="space-y-5">
                    {analysisData?.statistics?.masteryRate !== undefined && analysisData.statistics.masteryRate !== 0 && (
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs text-slate-400 font-medium">نسبة النجاح/الإتقان العام</span>
                          <span className="text-2xl font-bold text-green-400">{analysisData.statistics.masteryRate}٪</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${analysisData.statistics.masteryRate}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full" 
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {analysisData?.statistics?.studentCount !== undefined && analysisData.statistics.studentCount !== 0 && (
                        <div className="bg-blue-500/10 border border-blue-500/10 p-3 rounded-xl col-span-2 sm:col-span-1">
                          <p className="text-[10px] sm:text-xs text-slate-400 mb-1">المستهدفون / العينة</p>
                          <p className="text-base sm:text-lg font-bold text-slate-100">{analysisData.statistics.studentCount}</p>
                        </div>
                      )}
                      {analysisData?.statistics?.mean !== undefined && analysisData.statistics.mean !== 0 && (
                        <div className="bg-purple-500/10 border border-purple-500/10 p-3 rounded-xl col-span-2 sm:col-span-1">
                          <p className="text-[10px] sm:text-xs text-slate-400 mb-1">المتوسط الحسابي</p>
                          <p className="text-base sm:text-lg font-bold text-slate-100">{analysisData.statistics.mean}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {analysisData?.charts?.gradeDistribution?.length > 0 && (
                <div className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg ${!isSectionOpen("stats") ? "hidden" : ""}`}>
                  <h2 className="text-base sm:text-sm font-bold mb-4 border-b border-white/10 pb-3 text-cyan-300 flex items-center gap-2">
                    <PieChart className="w-4 h-4" /> مخطط توزيع مستويات الأداء
                  </h2>
                  <div className="space-y-3">
                    {analysisData.charts.gradeDistribution.map((item: any, i: number) => {
                      const value = Number(item.value || item.percentage || 0);
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1 text-slate-300">
                            <span>{item.label || item.level || `مستوى ${i + 1}`}</span>
                            <span>{value}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(value, 100)}%` }}
                              transition={{ duration: 0.8, delay: i * 0.08 }}
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Qualitative Analysis */}
              <div id="section-qualitative" className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg ${!isSectionOpen("qualitative") ? "hidden" : ""}`}>
                <h2 className="text-base sm:text-sm font-bold mb-4 border-b border-white/10 pb-3 text-blue-300 flex items-center gap-2">
                   <TrendingUp className="w-4 h-4" /> التحليل النوعي
                </h2>
                <div className="space-y-3">
                  {(analysisData?.qualitative?.strengths || []).length > 0 && (
                    <div className="p-3 sm:p-4 bg-emerald-500/5 border-r-2 border-emerald-500 rounded-l-xl">
                      <p className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase mb-2">نقاط القوة</p>
                      <ul className="text-sm leading-relaxed text-slate-300 list-disc list-inside">
                         {analysisData.qualitative.strengths.map((str: string, i: number) => (
                           <li key={i}>{str}</li>
                         ))}
                      </ul>
                    </div>
                  )}
                  {(analysisData?.qualitative?.gaps || []).length > 0 && (
                    <div className="p-3 sm:p-4 bg-rose-500/5 border-r-2 border-rose-500 rounded-l-xl">
                      <p className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase mb-2">الفجوات التعليمية</p>
                      <ul className="text-sm leading-relaxed text-slate-300 list-disc list-inside">
                         {analysisData.qualitative.gaps.map((gap: string, i: number) => (
                            <li key={i}>{gap}</li>
                         ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center / Wide Column */}
            <div className={`flex flex-col gap-4 sm:gap-6 ${["story","visuals","swot","pareto"].includes(activeSection) ? "lg:col-span-12" : "hidden"}`}>
              {/* Data Story */}
              <div id="section-story" className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-7 flex-1 shadow-lg ${!isSectionOpen("story") ? "hidden" : ""}`}>
                <h2 className="text-base sm:text-lg font-bold mb-5 flex items-center gap-2 text-white">
                  <span className="text-xl sm:text-2xl">📖</span> قصة البيانات: السرد التربوي
                </h2>
                
                <div className="flex flex-wrap gap-2 lg:grid lg:grid-cols-4 lg:gap-3 mb-6">
                  <div className="flex-1 bg-blue-500/20 p-2 sm:p-3 rounded-xl text-center border border-blue-500/30">
                    <p className="text-[10px] sm:text-xs font-bold text-blue-200">١. التحليل</p>
                  </div>
                  <div className="flex-1 bg-white/5 p-2 sm:p-3 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400">٢. التفسير</p>
                  </div>
                  <div className="flex-1 bg-white/5 p-2 sm:p-3 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400">٣. التقييم</p>
                  </div>
                  <div className="flex-1 bg-white/5 p-2 sm:p-3 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400">٤. الإجراء</p>
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed sm:leading-loose text-slate-300 space-y-4">
                  {analysisData?.dataStory?.analysis && <p>{analysisData.dataStory.analysis}</p>}
                  {analysisData?.dataStory?.interpretation && <p>{analysisData.dataStory.interpretation}</p>}
                  {analysisData?.dataStory?.evaluation && <p>{analysisData.dataStory.evaluation}</p>}
                  {analysisData?.dataStory?.procedure && <p>{analysisData.dataStory.procedure}</p>}
                  
                  {!analysisData?.dataStory && (
                    <p>لا يوجد سرد قصصي متاح لهذه البيانات.</p>
                  )}
                </div>
              </div>


              {/* Visual Charts */}
              <div id="section-visuals" className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-7 shadow-lg ${!isSectionOpen("visuals") ? "hidden" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
                      <span className="text-xl sm:text-2xl">📈</span> التصورات البيانية
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">رسم أعمدة احترافي يوضح المؤشرات وتوزيع مستويات الأداء.</p>
                  </div>
                  <button
                    type="button"
                    onClick={exportChartPNG}
                    className="bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500 hover:text-white text-cyan-300 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    تصدير الرسم PNG
                  </button>
                </div>

                <div id="visual-chart-area" className="bg-slate-950/40 border border-white/10 rounded-3xl p-5 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs text-cyan-300 font-bold mb-1">مؤشرات وثيق المرئية</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">
                        توزيع مستويات الأداء والمؤشرات
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
                        <p className="text-[10px] text-slate-400 mb-1">الإتقان</p>
                        <p className="text-lg font-bold text-blue-300">{analysisData?.statistics?.masteryRate || "—"}%</p>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
                        <p className="text-[10px] text-slate-400 mb-1">العينة</p>
                        <p className="text-lg font-bold text-emerald-300">{analysisData?.statistics?.studentCount || "—"}</p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3">
                        <p className="text-[10px] text-slate-400 mb-1">المتوسط</p>
                        <p className="text-lg font-bold text-purple-300">{analysisData?.statistics?.mean || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {hasChartData() ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-3">
                          <p className="text-[10px] text-slate-400 mb-1">عدد المؤشرات</p>
                          <p className="text-lg font-bold text-cyan-300">{getChartDistribution().length}</p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
                          <p className="text-[10px] text-slate-400 mb-1">المستوى الغالب</p>
                          <p className="text-lg font-bold text-emerald-300">{getDominantLevel()}</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
                          <p className="text-[10px] text-slate-400 mb-1">الإتقان</p>
                          <p className="text-lg font-bold text-blue-300">{analysisData?.statistics?.masteryRate || "—"}%</p>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3">
                          <p className="text-[10px] text-slate-400 mb-1">المتوسط</p>
                          <p className="text-lg font-bold text-purple-300">{analysisData?.statistics?.mean || "—"}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {getChartDistribution().map((item: any, i: number) => {
                          const safeValue = Math.max(0, Math.min(100, Number(item.value || 0)));
                          return (
                            <div key={i} className="grid grid-cols-[90px_1fr_52px] gap-3 items-center">
                              <div className="text-sm font-bold text-slate-300 truncate">{item.label}</div>
                              <div className="h-8 bg-slate-800 rounded-full overflow-hidden border border-white/10 relative">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${safeValue}%` }}
                                  transition={{ duration: 0.9, delay: i * 0.08 }}
                                  className="h-full bg-gradient-to-l from-cyan-400 to-blue-500 rounded-full"
                                />
                              </div>
                              <div className="text-left text-sm font-bold text-cyan-300">{safeValue}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl bg-white/5">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-3xl">
                        📊
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">لا تتوفر بيانات رقمية كافية للرسم البياني</h3>
                      <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                        يبدو أن هذا التحليل يعتمد على بيانات وصفية أو تقرير إشرافي لا يحتوي على نسب ومستويات رقمية واضحة.
                        يمكنك الاعتماد على أقسام السرد التربوي، التحليل النوعي، SWOT، وإيشيكاوا لهذا النوع من التقارير.
                      </p>
                    </div>
                  )}

                  {analysisData?.comparison?.comparisonTable?.length > 0 && (
                    <div className="mt-8 pt-5 border-t border-white/10">
                      <h3 className="text-base font-bold text-white mb-4">ملخص مقارنة بصري</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(analysisData.comparison.improvements || []).slice(0, 4).map((item: string, i: number) => (
                          <div key={`imp-${i}`} className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                            <p className="text-xs text-emerald-300 font-bold mb-1">مؤشر تحسن</p>
                            <p className="text-sm text-slate-200 leading-relaxed">{item}</p>
                          </div>
                        ))}
                        {(analysisData.comparison.declines || []).slice(0, 4).map((item: string, i: number) => (
                          <div key={`dec-${i}`} className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                            <p className="text-xs text-rose-300 font-bold mb-1">مؤشر تراجع</p>
                            <p className="text-sm text-slate-200 leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>


              {/* SWOT Matrix */}
              <div id="section-swot" className={`bg-blue-600/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-5 shadow-lg bg-gradient-to-br from-blue-900/20 to-slate-900/50 ${!isSectionOpen("swot") ? "hidden" : ""}`}>
                <h2 className="text-base sm:text-sm font-bold mb-4 text-blue-300">📉 مصفوفة SWOT للوضع الراهن</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  
                  {/* Strengths */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-colors">
                    <p className="text-xs sm:text-[11px] font-bold text-green-400 mb-2 uppercase tracking-xwide">نقاط القوة (Strengths)</p>
                    <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-disc list-inside">
                      {(analysisData?.swot?.strengths || []).map((s: string, i: number) => (
                         <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Weaknesses */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-colors">
                    <p className="text-xs sm:text-[11px] font-bold text-rose-400 mb-2 uppercase tracking-xwide">نقاط الضعف (Weaknesses)</p>
                    <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-disc list-inside">
                      {(analysisData?.swot?.weaknesses || []).map((w: string, i: number) => (
                         <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Opportunities */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                    <p className="text-xs sm:text-[11px] font-bold text-blue-400 mb-2 uppercase tracking-xwide">الفرص المتاحة (Opportunities)</p>
                    <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-disc list-inside">
                      {(analysisData?.swot?.opportunities || []).map((o: string, i: number) => (
                         <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Threats */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                    <p className="text-xs sm:text-[11px] font-bold text-amber-400 mb-2 uppercase tracking-xwide">التهديدات (Threats)</p>
                    <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-disc list-inside">
                      {(analysisData?.swot?.threats || []).map((t: string, i: number) => (
                         <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  
                </div>
              </div>

              {/* Pareto Diagram */}
              {analysisData?.pareto?.vitalFew && analysisData.pareto.vitalFew.length > 0 && (
                <div id="section-pareto" className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden ${!isSectionOpen("pareto") ? "hidden" : ""}`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-xl rounded-full -mr-10 -mt-10"></div>
                  <h2 className="text-base sm:text-sm font-bold mb-4 border-b border-white/10 pb-3 text-amber-300 flex items-center gap-2">
                     <BarChart3 className="w-4 h-4" /> باريتو التربوي (80/20)
                  </h2>
                  <div className="relative z-10">
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      هذه الفجوات تمثل الـ <span className="text-amber-400 font-bold border-b border-amber-400/30">20%</span> التي تتسبب في الجزء الأكبر (80%) من القصور:
                    </p>
                    <div className="space-y-2">
                      {analysisData.pareto.vitalFew.map((cause: string, i: number) => (
                        <div key={i} className="bg-slate-900/50 p-3 rounded-lg border border-white/5 relative overflow-hidden w-full group">
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500/60 rounded-r-lg group-hover:w-1.5 transition-all"></div>
                          <p className="text-sm text-slate-200 pr-3">{cause}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Column Left (or Right in RTL, spans 3/12 in wide, full in mobile) */}
            <div className={`flex flex-col gap-4 sm:gap-6 ${["ishikawa","tree","recommendations"].includes(activeSection) ? "lg:col-span-12" : "hidden"}`}>
              {/* Ishikawa Fishbone Diagram Concept */}
              <div id="section-ishikawa" className={`lg:flex-1 xl:flex-none bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg ${!isSectionOpen("ishikawa") ? "hidden" : ""}`}>
                <h2 className="text-base sm:text-sm font-bold mb-4 text-blue-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> هيكلة إيشيكاوا (عظمة السمكة)
                </h2>
                <div className="py-4 border-y border-white/5 relative">
                  <div className="flex flex-col items-center gap-4">
                      <div className="bg-slate-800 shadow-inner px-4 py-3 rounded-xl w-full text-sm font-medium text-center border border-white/10 text-white">
                        المشكلة: {analysisData?.ishikawa?.mainProblem || "تم رصد فجوة في البيانات المرفقة"}
                      </div>
                      
                      {/* Connecting Line */}
                      <div className="h-4 w-px bg-white/20"></div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
                        <div className="bg-white/5 p-3 text-xs text-center rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                          <span className="block text-slate-500 mb-1">المعلم</span>
                          <span className="font-semibold text-slate-200">{analysisData?.ishikawa?.teacher || "-"}</span>
                        </div>
                        <div className="bg-white/5 p-3 text-xs text-center rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                           <span className="block text-slate-500 mb-1">الطالب</span>
                          <span className="font-semibold text-slate-200">{analysisData?.ishikawa?.student || "-"}</span>
                        </div>
                        <div className="bg-white/5 p-3 text-xs text-center rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                           <span className="block text-slate-500 mb-1">المنهج/السياسات</span>
                          <span className="font-semibold text-slate-200">{analysisData?.ishikawa?.curriculum || "-"}</span>
                        </div>
                        <div className="bg-white/5 p-3 text-xs text-center rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                           <span className="block text-slate-500 mb-1">البيئة التربوية</span>
                          <span className="font-semibold text-slate-200">{analysisData?.ishikawa?.environment || "-"}</span>
                        </div>
                      </div>
                  </div>
                </div>
              </div>

              {/* Problem Tree Diagram */}
              {analysisData?.problemTree && (
              <div id="section-tree" className={`lg:flex-1 xl:flex-none bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg relative flex-col h-full ${!isSectionOpen("tree") ? "hidden" : "flex"}`}>
                <h2 className="text-base sm:text-sm font-bold mb-4 border-b border-white/10 pb-3 text-emerald-300 flex items-center gap-2">
                   <TreePine className="w-4 h-4" /> شجرة المشكلات
                </h2>
                <div className="flex-1 flex flex-col items-center pt-2">
                   {/* Branches */}
                   <div className="w-full bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/20 mb-2 relative">
                     <p className="text-[10px] text-emerald-400 mb-2 text-center uppercase tracking-wider font-bold">الأغصان (الآثار الميدانية)</p>
                     <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                       {(analysisData.problemTree.branches || []).map((b: string, i: number) => <li key={i} className="line-clamp-2">{b}</li>)}
                     </ul>
                     <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-3 flex flex-col gap-0.5"><div className="w-1 h-0.5 bg-emerald-500/40"></div><div className="w-1 h-0.5 bg-emerald-500/40"></div></div>
                   </div>
                   
                   {/* Trunk */}
                   <div className="w-4/5 bg-slate-800 p-3 rounded-lg border border-white/10 text-center mb-2 z-10 relative shadow-md">
                     <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold">الجذع (المشكلة)</p>
                     <p className="text-sm font-bold text-white leading-tight">{analysisData.problemTree.trunk}</p>
                     <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-3 flex flex-col gap-0.5"><div className="w-1 h-0.5 bg-rose-500/40"></div><div className="w-1 h-0.5 bg-rose-500/40"></div></div>
                   </div>
                   
                   {/* Roots */}
                   <div className="w-full bg-rose-900/20 p-3 rounded-xl border border-rose-500/20 relative">
                     <p className="text-[10px] text-rose-400 mb-2 text-center uppercase tracking-wider font-bold">الجذور (الأسباب)</p>
                     <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                       {(analysisData.problemTree.roots || []).map((r: string, i: number) => <li key={i} className="line-clamp-2">{r}</li>)}
                     </ul>
                   </div>
                </div>
              </div>
              )}

              {/* Recommendations */}
              <div id="section-recommendations" className={`lg:flex-1 xl:flex-none bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg flex-col h-full ${!isSectionOpen("recommendations") ? "hidden" : "flex"}`}>
                <h2 className="text-base sm:text-sm font-bold mb-4 text-blue-300 uppercase tracking-widest">🚀 التوصيات الذكية</h2>
                <div className="space-y-4 text-sm leading-relaxed text-slate-300 flex-1">
                  {(analysisData?.recommendations || []).map((rec: string, i: number) => (
                    <div key={i} className="flex gap-3 items-start">
                      <ArrowRight className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 transform rotate-180" />
                      <p>{rec}</p>
                    </div>
                  ))}
                  
                  {analysisData?.strategicAdvice && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <div className="flex gap-3 items-start text-amber-300/90 bg-amber-400/10 p-4 rounded-xl border border-amber-400/20">
                        <span className="text-2xl shrink-0">💡</span>
                        <div>
                          <p className="font-bold mb-1">نصيحة استراتيجية</p>
                          <p className="text-xs">{analysisData.strategicAdvice}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {analysisData?.interventionPlan?.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <p className="text-sm font-bold text-emerald-300 mb-3">خطة علاجية مقترحة</p>
                      <div className="space-y-2">
                        {analysisData.interventionPlan.map((step: any, i: number) => (
                          <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                            <p className="text-xs font-bold text-emerald-300 mb-1">{step.title || `إجراء ${i + 1}`}</p>
                            <p className="text-xs text-slate-300 leading-relaxed">{step.action || step.description || step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Footer */}
    <footer className="relative z-10 mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 sm:gap-4 pb-4">
      <div className="flex gap-4 opacity-40 text-xs font-mono uppercase">
        <span>PDF Supported</span>
        <span>Excel Ready</span>
        <span>AI Analysis Active</span>
      </div>
      <div className="text-center sm:text-left rtl:sm:text-right">
        <p className="text-sm font-bold text-blue-300 whitespace-nowrap">تصميم وتطوير أ. سعود المعولي</p>
        <p className="text-xs text-slate-500 mt-1">saud22@moe.om</p>
      </div>
    </footer>

  </div>
</div>

);}

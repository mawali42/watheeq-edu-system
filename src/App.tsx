import React, { useState, useRef } from 'react';import { UploadCloud, FileText, FileSpreadsheet, Image as ImageIcon, Loader2, ArrowRight, BrainCircuit, Target, TrendingUp, AlertTriangle, RefreshCw, X, Play, BarChart3, TreePine, Download, PieChart } from 'lucide-react';import { motion, AnimatePresence } from 'motion/react';

export default function App() {const [isAnalyzing, setIsAnalyzing] = useState(false);const [showResults, setShowResults] = useState(false);const [analysisData, setAnalysisData] = useState<any>(null);const [selectedFiles, setSelectedFiles] = useState<File[]>([]);const [isDragging, setIsDragging] = useState(false);const [errorData, setErrorData] = useState<string | null>(null);const [isExporting, setIsExporting] = useState(false);const fileInputRef = useRef<HTMLInputElement>(null);

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
const resetAnalysis = () => {
  setShowResults(false);
  setIsAnalyzing(false);
  setAnalysisData(null);
  setErrorData(null);
  setSelectedFiles([]);
  setIsDragging(false);

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }

  // إعادة تحميل الصفحة هي الطريقة الأضمن لتنظيف حالة التطبيق بالكامل
  window.location.reload();
};

const exportReportPDF = async () => {
  setIsExporting(true);
  setErrorData(null);

  const buttons = document.querySelectorAll(".pdf-ignore");
  try {
    const element = document.getElementById("app-content-to-export");
    if (!element) {
      throw new Error("لم يتم العثور على محتوى التقرير للتصدير");
    }

    buttons.forEach((btn: any) => {
      btn.style.visibility = "hidden";
    });

    await new Promise((resolve) => setTimeout(resolve, 250));

    try {
      const html2pdfModule: any = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const subject = analysisData?.statistics?.subjectName || "تقرير-وثيق";
      const safeFileName = String(subject).replace(/[\/:*?"<>|]/g, "-");

      await html2pdf()
        .set({
          margin: 0.25,
          filename: `${safeFileName}-تحليل-وثيق.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#0f172a",
            scrollX: 0,
            scrollY: 0,
          },
          jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "landscape",
          },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(element)
        .save();
    } catch (pdfError) {
      console.warn("html2pdf failed, using browser print instead:", pdfError);
      window.print();
    }
  } catch (err: any) {
    console.error("PDF Export Error:", err);
    setErrorData(err?.message || "تعذر تصدير التقرير بصيغة PDF");
  } finally {
    buttons.forEach((btn: any) => {
      btn.style.visibility = "";
    });
    setIsExporting(false);
  }
};

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
                onClick={exportReportPDF}
                onPointerUp={(e) => e.stopPropagation()}
                disabled={isExporting}
                className="bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500 hover:text-white text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 sm:px-4 sm:py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                title="تصدير التقرير PDF"
             >
                {isExporting ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Download className="w-4 h-4 sm:w-5 sm:h-5" />}
                <span className="hidden sm:inline font-medium text-sm">{isExporting ? "جاري التصدير..." : "تصدير PDF"}</span>
             </button>
             <button
                type="button"
                onClick={resetAnalysis}
                onPointerUp={(e) => e.stopPropagation()}
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
            className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6"
          >
            {/* Column Right (or Left in RTL, spans 3/12 in wide, full in mobile) */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 sm:gap-6">
              {/* Stats Panel */}
              {((analysisData?.statistics?.masteryRate !== undefined && analysisData.statistics.masteryRate !== 0) ||
                (analysisData?.statistics?.studentCount !== undefined && analysisData.statistics.studentCount !== 0) ||
                (analysisData?.statistics?.mean !== undefined && analysisData.statistics.mean !== 0)) && (
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
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
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg">
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
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg">
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
            <div className="lg:col-span-8 xl:col-span-6 flex flex-col gap-4 sm:gap-6">
              {/* Data Story */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-7 flex-1 shadow-lg">
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

              {/* SWOT Matrix */}
              <div className="bg-blue-600/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-5 shadow-lg bg-gradient-to-br from-blue-900/20 to-slate-900/50">
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
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
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
            <div className="lg:col-span-12 xl:col-span-3 flex flex-col gap-4 sm:gap-6 xl:flex-col lg:flex-row lg:gap-4">
              {/* Ishikawa Fishbone Diagram Concept */}
              <div className="lg:flex-1 xl:flex-none bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg">
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
              <div className="lg:flex-1 xl:flex-none bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg relative flex-col flex h-full">
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
              <div className="lg:flex-1 xl:flex-none bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg flex-col flex h-full">
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

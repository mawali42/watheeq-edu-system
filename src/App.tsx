// ابحث عن هذا الجزء في App.tsx واستبدله فقط

const startAnalysis = async () => {
  if (selectedFiles.length === 0) return;

  setIsAnalyzing(true);
  setErrorData(null);

  const formData = new FormData();
  selectedFiles.forEach(file => {
    formData.append("files", file);
  });

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "حدثت مشكلة أثناء التحليل"
      );
    }

    setAnalysisData(data);
    setShowResults(true);

  } catch (err: any) {
    console.error(err);

    setErrorData(
      err.message ||
      "تعذر الاتصال بخدمة التحليل"
    );
  } finally {
    setIsAnalyzing(false);
  }
};

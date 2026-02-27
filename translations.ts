export type Language = 'en' | 'zh';

export const translations = {
  en: {
    appTitle: "ZenPulse AI",
    newScan: "New Scan",
    chooseMode: "Choose your preferred privacy level and input method.",
    modes: {
      faceHand: {
        title: "Face + Hand Scan",
        desc: "Highest accuracy. AI detects visual chronic signs."
      },
      handOnly: {
        title: "Hand Only",
        desc: "Good accuracy. Detects metabolism & circulation signs."
      },
      dataOnly: {
        title: "Data Only",
        desc: "Fastest. Pure algorithmic analysis based on history."
      },
      medicalReport: {
        title: "Medical Report Analysis",
        desc: "Upload medical reports (Image/PDF) for deep analysis."
      }
    },
    edition: "2026 Edition v2.2",
    analyzing: {
      title: "Analyzing Bio-Markers",
      desc: "Extracting features & matching chronic patterns..."
    },
    input: {
      takePhotos: "Take multiple photos (Face/Hands)",
      takeHandPhotos: "Take hand photos",
      uploadReport: "Upload Medical Report (Image/PDF)",
      batchUpload: "Batch Upload Supported",
      addPhotos: "Add More Photos",
      uploadPhotos: "Upload Photos (Multiple)",
      pdfDocument: "PDF Document",
      userProfile: "User Profile",
      gender: "Gender",
      age: "Age",
      enterAge: "Enter your age",
      symptoms: "Describe your symptoms (Optional)",
      symptomsPlaceholder: "E.g., 'I feel tired after lunch', 'Left shoulder pain', or 'History of diabetes in family'...",
      aiPersonalize: "AI will use this to personalize your diet & exercise plan.",
      hideTags: "Hide Quick Tags",
      selectTags: "Select Common Conditions",
      conditions: {
        Hypertension: "Hypertension",
        Hyperglycemia: "Hyperglycemia",
        Hyperlipidemia: "Hyperlipidemia",
        Gout: "Gout",
        Diabetes: "Diabetes",
        Asthma: "Asthma",
        Arthritis: "Arthritis",
        "Heart Disease": "Heart Disease",
        Insomnia: "Insomnia",
        Anxiety: "Anxiety"
      },
      startAnalysis: "Start Analysis",
      analyzingBtn: "AI Analyzing...",
      agreement: "By continuing, you agree to our Minimal Data Policy.\nAnalysis is performed locally where possible."
    },
    dashboard: {
      healthScore: "Health Score",
      risk: "Risk",
      tcmBodyType: "TCM Body Type",
      visualInsights: "AI Visual Insights",
      healthProjection: "Health Projection",
      dietPlan: "Chronic-Adapted Diet",
      microWorkout: "Micro-Workout",
      optimizationTip: "Optimization Tip",
      fallbackAdvice: "Keep moving and stay hydrated!",
      disclaimer: "*Plan automatically adjusted based on your completion rate.",
      exportPdf: "Export PDF Report",
      generatingPdf: "Generating PDF...",
      newScan: "Start New Scan",
      tabs: {
        overview: "Analysis & Trends",
        plan: "Daily Plan (Adaptive)"
      },
      symptomsAnalyzed: "Symptoms Analyzed",
      safe: "Safe",
      done: "Done",
      noExercise: "No exercise plan available.",
      ingredients: "Ingredients",
      recipe: "Preparation",
      instructions: "Instructions",
      nextScan: "Next Scan Recommended",
      history: "History",
      viewReport: "View Report",
      viewHistory: "View History",
      share: "Share Report",
      clearAll: "Clear All",
      reportId: "Report ID",
      score: "Score",
      date: "Date",
      summary: "Health Summary"
    },
    privacy: {
      encryption: "Bank-Grade Encryption",
      minimalData: "Minimal Data Mode"
    }
  },
  zh: {
    appTitle: "ZenPulse AI",
    newScan: "开始新扫描",
    chooseMode: "选择您偏好的隐私级别和输入方式。",
    modes: {
      faceHand: {
        title: "面部 + 手部扫描",
        desc: "最高准确度。AI 检测视觉慢性病征兆。"
      },
      handOnly: {
        title: "仅手部扫描",
        desc: "良好准确度。检测代谢和循环征兆。"
      },
      dataOnly: {
        title: "仅数据模式",
        desc: "最快速度。基于历史数据的纯算法分析。"
      },
      medicalReport: {
        title: "体检报告分析",
        desc: "上传体检报告（图片/PDF）进行深度分析。"
      }
    },
    edition: "2026 版 v2.2",
    analyzing: {
      title: "正在分析生物标记",
      desc: "正在提取特征并匹配慢性病模式..."
    },
    input: {
      takePhotos: "拍摄多张照片（面部/手部）",
      takeHandPhotos: "拍摄手部照片",
      uploadReport: "上传体检报告（图片/PDF）",
      batchUpload: "支持批量上传",
      addPhotos: "添加更多照片",
      uploadPhotos: "上传照片（多张）",
      pdfDocument: "PDF 文档",
      userProfile: "用户资料",
      gender: "性别",
      age: "年龄",
      enterAge: "输入您的年龄",
      symptoms: "描述您的症状（可选）",
      symptomsPlaceholder: "例如：'午饭后感到疲倦'，'左肩疼痛'，或'家族有糖尿病史'...",
      aiPersonalize: "AI 将利用这些信息为您个性化定制饮食和运动计划。",
      hideTags: "隐藏快速标签",
      selectTags: "选择常见状况",
      conditions: {
        Hypertension: "高血压",
        Hyperglycemia: "高血糖",
        Hyperlipidemia: "高血脂",
        Gout: "痛风",
        Diabetes: "糖尿病",
        Asthma: "哮喘",
        Arthritis: "关节炎",
        "Heart Disease": "心脏病",
        Insomnia: "失眠",
        Anxiety: "焦虑"
      },
      startAnalysis: "开始分析",
      analyzingBtn: "AI 正在分析...",
      agreement: "继续即表示您同意我们的最小数据政策。\n分析尽可能在本地进行。"
    },
    dashboard: {
      healthScore: "健康评分",
      risk: "风险",
      tcmBodyType: "中医体质",
      visualInsights: "AI 视觉洞察",
      healthProjection: "健康预测",
      dietPlan: "慢性病适应饮食",
      microWorkout: "微运动",
      optimizationTip: "优化建议",
      fallbackAdvice: "保持运动，多喝水！",
      disclaimer: "*计划会根据您的完成率自动调整。",
      exportPdf: "导出 PDF 报告",
      generatingPdf: "正在生成 PDF...",
      newScan: "开始新扫描",
      tabs: {
        overview: "分析与趋势",
        plan: "每日计划（自适应）"
      },
      symptomsAnalyzed: "已分析症状",
      safe: "安全",
      done: "完成",
      noExercise: "暂无运动计划。",
      ingredients: "所需食材",
      recipe: "制作方法",
      instructions: "动作要领",
      nextScan: "建议下次扫描",
      history: "历史记录",
      viewReport: "查看报告",
      viewHistory: "查看历史",
      share: "分享报告",
      clearAll: "清空所有",
      reportId: "报告ID",
      score: "分数",
      date: "日期",
      summary: "健康总结"
    },
    privacy: {
      encryption: "银行级加密",
      minimalData: "最小数据模式"
    }
  }
};

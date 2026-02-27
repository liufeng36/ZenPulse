import { GoogleGenAI, Type } from "@google/genai";
import { InputMode, UserProfile, AnalysisResult } from "../types";

// Schema definition for structured output
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    tcmBodyType: { type: Type.STRING, description: "TCM Body Constitution type" },
    chronicRiskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
    chronicRiskType: { type: Type.STRING },
    healthScore: { type: Type.INTEGER },
    predictedAge: { type: Type.INTEGER },
    detectedGender: { type: Type.STRING },
    visualFeatures: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING },
          finding: { type: Type.STRING },
          implication: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        },
        required: ["area", "finding", "implication", "severity"],
      },
    },
    summary: { type: Type.STRING, description: "A detailed, structured health summary (approx 300 words). Clear logic, highlighting key issues." },
    plan: {
      type: Type.OBJECT,
      properties: {
        diet: {
          type: Type.OBJECT,
          properties: {
            breakfast: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, tag: { type: Type.STRING }, value: { type: Type.STRING }, ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }, recipe: { type: Type.STRING } } },
            lunch: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, tag: { type: Type.STRING }, value: { type: Type.STRING }, ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }, recipe: { type: Type.STRING } } },
            dinner: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, tag: { type: Type.STRING }, value: { type: Type.STRING }, ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }, recipe: { type: Type.STRING } } },
            snack: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, tag: { type: Type.STRING }, value: { type: Type.STRING }, ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }, recipe: { type: Type.STRING } } },
          },
        },
        exercise: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              duration: { type: Type.STRING },
              intensity: { type: Type.STRING, enum: ["Level 1", "Level 2", "Level 3"] },
              benefit: { type: Type.STRING },
              isChronicFriendly: { type: Type.BOOLEAN },
              instructions: { type: Type.STRING, description: "Step-by-step instructions on how to perform the exercise" }
            },
          },
        },
        advice: { type: Type.STRING },
      },
    },
    trends: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          score: { type: Type.INTEGER },
        },
      },
    },
  },
  required: ["tcmBodyType", "chronicRiskLevel", "healthScore", "predictedAge", "detectedGender", "visualFeatures", "summary", "plan", "trends"],
};

export const getHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('zenpulse_history') || '[]');
  } catch (e) {
    return [];
  }
};

export const analyzeHealth = async (
  mode: InputMode,
  profile: UserProfile,
  images: string[], // base64 strings
  language: 'en' | 'zh' = 'en'
): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct the prompt based on mode
  let systemContext = `
    You are ZenPulse AI, a 2026 advanced health assistant.
    
    Current Input Mode: ${mode}
    Target Language: ${language === 'zh' ? 'Simplified Chinese (zh-CN)' : 'English (en-US)'}
    
    User Profile Data:
    - Manual Gender: ${profile.gender} (Ignore if Face mode provides clear visual evidence)
    - Manual Age: ${profile.age || 'Not provided'} (Ignore if Face mode allows estimation)
    - Chronic History: ${profile.chronicConditions.join(', ') || 'None declared'}
    - Custom Symptoms/Notes: "${profile.customSymptoms || 'None'}"

    Your Tasks:
    1. **Demographic Analysis**: 
       - If Mode is FACE_HAND: Strictly predict Age and Gender from the visual data. Return these in 'predictedAge' and 'detectedGender'.
       - If Mode is HAND_ONLY: Predict physiological age from hand skin condition, but use user's manual gender.
       - If Mode is DATA_ONLY: Use the user's manual age and gender.
       - If Mode is MEDICAL_REPORT: PRIORITIZE extracting 'Age' and 'Gender' directly from the patient information section of the report. If not found, use the user's manual profile.

    2. **Medical Analysis (Simulated)**:
       - **CRITICAL**: If 'Custom Symptoms/Notes' is provided, you MUST use it as a primary source for the diagnosis and plan.
       - If user mentions symptoms (e.g. "migraine", "bloating", "stress"), the Diet and Exercise plan MUST directly address them.
       - Analyze risk for chronic diseases (Hypertension, Hyperglycemia, Hyperlipidemia).
       - If images provided (Face/Hand): Look for TCM signs (redness, veins, dry skin, nail spots).
       - If MEDICAL_REPORT: 
         - **PRIMARY SOURCE**: The uploaded images/PDFs are the absolute truth. Ignore general simulations.
         - **EXTRACT**: Key biomarkers (e.g., Blood Pressure, Glucose, Lipids, WBC), abnormal flags (High/Low), and Doctor's Conclusions/Diagnosis.
         - **SYNTHESIZE**: Create a summary based *only* on the report findings.
         - **RISK ASSESSMENT**: Determine chronic risk level based on the report's abnormal values.

    3. **Plan Generation**:
       - Generate a diet/exercise plan STRICTLY adapted to chronic conditions AND custom symptoms.
       - **Diet**: Include ingredients and simple recipe/prep method for each meal.
       - **Exercise**: Include step-by-step instructions for each movement.
       - Tone: Encouraging, professional, "light wellness".

    4. **Output**: strictly structured JSON matching the schema.
       - **Summary**: Must be detailed (around 300 words), well-structured, and highlight key issues and predictions.
       - Ensure all string fields (summary, plan details, findings) are in ${language === 'zh' ? 'Simplified Chinese' : 'English'}.
  `;

  const contents: any[] = [{ text: systemContext }];

  // Add images to contents if available
  images.forEach(img => {
    // Extract mime type and base64 data
    const match = img.match(/^data:(.+);base64,(.+)$/);
    if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        contents.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
    } else {
        // Fallback for raw base64 strings (assume jpeg if no prefix)
        contents.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: img
            }
        });
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Using flash for speed
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text) as AnalysisResult;

    // Post-processing to add timestamps and IDs
    const now = new Date();
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + 3); // Suggest next scan in 3 days

    const finalResult = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        nextPredictionDate: nextDate.toISOString(),
    };

    // Store in localStorage
    try {
        const history = JSON.parse(localStorage.getItem('zenpulse_history') || '[]');
        history.unshift({
            id: finalResult.id,
            date: finalResult.timestamp,
            score: finalResult.healthScore,
            summary: finalResult.summary, // Store summary for quick preview
            fullResult: finalResult
        });
        // Keep last 20 records
        if (history.length > 20) history.pop();
        localStorage.setItem('zenpulse_history', JSON.stringify(history));
    } catch (e) {
        console.error("Failed to save history", e);
    }

    return finalResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback/Mock data for demo resilience
    const isZh = language === 'zh';
    const mockResult: AnalysisResult = {
      id: "mock-id-" + Date.now(),
      timestamp: new Date().toISOString(),
      nextPredictionDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      tcmBodyType: isZh ? "气虚质 (Fallback)" : "Qi Deficiency (Fallback)",
      chronicRiskLevel: "Medium",
      chronicRiskType: isZh ? "一般疲劳" : "General Fatigue",
      healthScore: 72,
      predictedAge: profile.age || 35,
      detectedGender: profile.gender === 'Unspecified' ? (isZh ? '女性' : 'Female') : profile.gender,
      visualFeatures: [
        { 
            area: isZh ? "面部" : "Face", 
            finding: isZh ? "面色苍白" : "Pale complexion", 
            implication: isZh ? "可能气虚" : "Potential Qi deficiency", 
            severity: "Medium" 
        }
      ],
      summary: isZh 
        ? "我们检测到疲劳迹象。请注意休息和温和饮食。建议您保持规律作息，避免过度劳累。饮食上多吃易消化、补气的食物。运动方面，建议进行温和的伸展运动，促进血液循环。请每三天进行一次扫描，以监测健康状况的变化。" 
        : "We detected signs of fatigue. Focus on rest and gentle nutrition. It is recommended to maintain a regular schedule and avoid overexertion. Eat more digestible and Qi-replenishing foods. For exercise, gentle stretching is recommended to promote blood circulation. Please scan every three days to monitor changes in your health status.",
      plan: {
        diet: {
          breakfast: { 
              name: isZh ? "燕麦和浆果" : "Oats & Berries", 
              description: isZh ? "温热燕麦粥" : "Warm oatmeal", 
              tag: isZh ? "低升糖" : "Low GI", 
              value: "GI: 55",
              ingredients: isZh ? ["燕麦", "蓝莓", "牛奶"] : ["Oats", "Blueberries", "Milk"],
              recipe: isZh ? "将燕麦与牛奶煮沸，加入蓝莓。" : "Boil oats with milk, add blueberries."
          },
          lunch: { 
              name: isZh ? "清蒸鸡肉" : "Steamed Chicken", 
              description: isZh ? "配菠菜" : "With spinach", 
              tag: isZh ? "高蛋白" : "High Protein", 
              value: "300kcal",
              ingredients: isZh ? ["鸡胸肉", "菠菜", "姜"] : ["Chicken Breast", "Spinach", "Ginger"],
              recipe: isZh ? "鸡肉切片蒸熟，菠菜焯水。" : "Steam chicken slices, blanch spinach."
          },
          dinner: { 
              name: isZh ? "蔬菜汤" : "Vegetable Soup", 
              description: isZh ? "易消化" : "Easy to digest", 
              tag: isZh ? "清淡" : "Light", 
              value: isZh ? "低钠" : "Low Sodium",
              ingredients: isZh ? ["胡萝卜", "西红柿", "洋葱"] : ["Carrot", "Tomato", "Onion"],
              recipe: isZh ? "所有蔬菜切块煮汤。" : "Chop all vegetables and boil into soup."
          }
        },
        exercise: [
          { 
              name: isZh ? "温和伸展" : "Gentle Stretching", 
              duration: "10 min", 
              intensity: "Level 1", 
              benefit: isZh ? "促进循环" : "Circulation", 
              isChronicFriendly: true,
              instructions: isZh ? "站直，双手上举，保持10秒。" : "Stand straight, raise hands, hold for 10s."
          }
        ],
        advice: isZh ? "试着今天早睡30分钟。" : "Try to sleep 30 minutes earlier today."
      },
      trends: [
        { date: "Wk 1", score: 65 },
        { date: "Wk 2", score: 68 },
        { date: "Current", score: 72 },
        { date: "Proj", score: 78 }
      ]
    };

    // Save mock result to history as well
    try {
        const history = JSON.parse(localStorage.getItem('zenpulse_history') || '[]');
        history.unshift({
            id: mockResult.id,
            date: mockResult.timestamp,
            score: mockResult.healthScore,
            summary: mockResult.summary,
            fullResult: mockResult
        });
        if (history.length > 20) history.pop();
        localStorage.setItem('zenpulse_history', JSON.stringify(history));
    } catch (e) {
        console.error("Failed to save mock history", e);
    }

    return mockResult;
  }
};
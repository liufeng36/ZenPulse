import React, { useState } from 'react';
import { InputMode, UserProfile, AnalysisResult } from './types';
import { analyzeHealth } from './services/geminiService';
import { InputSection } from './components/InputSection';
import { Dashboard } from './components/Dashboard';
import { PrivacyBadge } from './components/PrivacyBadge';
import { ScanFace, Hand, FileText, FileUp, Globe } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [step, setStep] = useState<'mode-select' | 'input' | 'analyzing' | 'result'>('mode-select');
  const [selectedMode, setSelectedMode] = useState<InputMode>(InputMode.FACE_HAND);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzedProfile, setAnalyzedProfile] = useState<UserProfile | null>(null);

  const handleModeSelect = (mode: InputMode) => {
    setSelectedMode(mode);
    setStep('input');
  };

  const handleAnalyze = async (profile: UserProfile, images: string[]) => {
    setAnalyzedProfile(profile);
    setStep('analyzing');
    // Minimal artificial delay for UX if API is too fast
    const minTime = new Promise(resolve => setTimeout(resolve, 2000));
    const analysisPromise = analyzeHealth(selectedMode, profile, images, language);
    
    try {
        const [result] = await Promise.all([analysisPromise, minTime]);
        setAnalysisResult(result);
        setStep('result');
    } catch (e) {
        console.error(e);
        setStep('input'); // Should have error handling UI in real app
        alert("Analysis failed. Please try again.");
    }
  };

  const handleLoadHistory = (historyResult: AnalysisResult) => {
    setAnalysisResult(historyResult);
    setStep('result');
  };

  const reset = () => {
    setAnalysisResult(null);
    setAnalyzedProfile(null);
    setStep('mode-select');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* Top Navigation / Brand */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
          {t.appTitle}
        </h1>
        <div className="flex items-center gap-3">
            <button 
                onClick={toggleLanguage}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1 text-xs font-medium"
            >
                <Globe size={16} />
                {language === 'en' ? 'EN' : '中文'}
            </button>
            <PrivacyBadge />
        </div>
      </div>

      <main className="container mx-auto">
        {step === 'mode-select' && (
          <div className="p-6 max-w-md mx-auto fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 mt-4">{t.newScan}</h2>
            <p className="text-slate-500 mb-8">{t.chooseMode}</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => handleModeSelect(InputMode.FACE_HAND)}
                className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all flex items-center gap-4 text-left group"
              >
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <ScanFace size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">{t.modes.faceHand.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{t.modes.faceHand.desc}</p>
                </div>
              </button>

              <button 
                onClick={() => handleModeSelect(InputMode.HAND_ONLY)}
                className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all flex items-center gap-4 text-left group"
              >
                <div className="bg-teal-50 text-teal-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <Hand size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">{t.modes.handOnly.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{t.modes.handOnly.desc}</p>
                </div>
              </button>

              <button 
                onClick={() => handleModeSelect(InputMode.DATA_ONLY)}
                className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all flex items-center gap-4 text-left group"
              >
                <div className="bg-slate-50 text-slate-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">{t.modes.dataOnly.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{t.modes.dataOnly.desc}</p>
                </div>
              </button>

              <button 
                onClick={() => handleModeSelect(InputMode.MEDICAL_REPORT)}
                className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all flex items-center gap-4 text-left group"
              >
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <FileUp size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">{t.modes.medicalReport.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{t.modes.medicalReport.desc}</p>
                </div>
              </button>
            </div>

            <div className="mt-10 text-center">
                 <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{t.edition}</p>
            </div>
          </div>
        )}

        {step === 'input' && (
          <InputSection 
            mode={selectedMode} 
            onAnalyze={handleAnalyze} 
            isAnalyzing={false} 
            onBack={() => setStep('mode-select')}
          />
        )}

        {step === 'analyzing' && (
           <div className="flex flex-col items-center justify-center h-[70vh] fade-in">
              <div className="relative w-24 h-24">
                 <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <ScanFace size={32} className="text-indigo-600 animate-pulse" />
                 </div>
              </div>
              <h3 className="mt-8 text-xl font-bold text-slate-800">{t.analyzing.title}</h3>
              <p className="text-slate-500 mt-2 text-sm">{t.analyzing.desc}</p>
           </div>
        )}

        {step === 'result' && analysisResult && (
          <Dashboard 
            result={analysisResult} 
            profile={analyzedProfile} 
            onRetake={reset} 
            onLoadHistory={handleLoadHistory}
          />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
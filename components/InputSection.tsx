import React, { useState } from 'react';
import { InputMode, UserProfile, Gender } from '../types';
import { Camera, Upload, User, Info, X, FileText, Sparkles, FileUp, Trash2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  mode: InputMode;
  onAnalyze: (profile: UserProfile, images: string[]) => void;
  isAnalyzing: boolean;
  onBack: () => void;
}

export const InputSection: React.FC<Props> = ({ mode, onAnalyze, isAnalyzing, onBack }) => {
  const { t } = useLanguage();
  const [images, setImages] = useState<string[]>([]);
  const [gender, setGender] = useState<Gender>(Gender.UNSPECIFIED);
  const [age, setAge] = useState<string>(''); // Controlled as string for input
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleClearAll = () => {
    setImages([]);
    setGender(Gender.UNSPECIFIED);
    setAge('');
    setChronicConditions([]);
    setCustomSymptoms('');
    setShowAdvanced(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      const filePromises = files.map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              resolve(ev.target.result as string);
            } else {
              resolve('');
            }
          };
          reader.readAsDataURL(file);
        });
      });

      const newImages = await Promise.all(filePromises);
      const validImages = newImages.filter(img => img !== '');
      
      setImages(prev => [...prev, ...validImages]);
      
      // Reset input value to allow selecting the same file again if needed
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleCondition = (condition: string) => {
    setChronicConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSubmit = () => {
    const profile: UserProfile = {
      gender,
      age: age ? parseInt(age) : undefined,
      chronicConditions,
      customSymptoms,
      hasWellnessNeeds: true,
    };
    onAnalyze(profile, images);
  };

  const canSubmit = () => {
    switch (mode) {
      case InputMode.FACE_HAND:
        return images.length > 0;
      case InputMode.HAND_ONLY:
        return images.length > 0 && gender !== Gender.UNSPECIFIED;
      case InputMode.DATA_ONLY:
        return gender !== Gender.UNSPECIFIED && age.trim() !== '';
      case InputMode.MEDICAL_REPORT:
        return images.length > 0;
      default:
        return false;
    }
  };

  const getUploadLabel = () => {
    if (mode === InputMode.MEDICAL_REPORT) return t.input.uploadReport;
    if (mode === InputMode.FACE_HAND) return t.input.takePhotos;
    return t.input.takeHandPhotos;
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6 fade-in">
      {/* Back Button */}
      <div className="flex items-center">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors flex items-center gap-1"
            title="Go Back"
          >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
          </button>
      </div>

      {/* Visual Input Area (Batch Upload) */}
      {mode !== InputMode.DATA_ONLY && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    {img.startsWith('data:application/pdf') ? (
                        <div className="w-full h-32 bg-red-50 rounded-xl flex items-center justify-center text-red-500 flex-col">
                            <FileText size={32} />
                            <span className="text-xs mt-1">{t.input.pdfDocument}</span>
                        </div>
                    ) : (
                        <img src={img} alt="Input" className="w-full h-32 object-cover rounded-xl" />
                    )}
                    <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                    >
                        <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                {mode === InputMode.MEDICAL_REPORT ? (
                    <FileUp size={48} className="mb-2 text-indigo-400" />
                ) : (
                    <Camera size={48} className="mb-2 text-indigo-400" />
                )}
                <p className="text-sm">
                  {getUploadLabel()}
                </p>
                <p className="text-xs mt-1 text-slate-300">{t.input.batchUpload}</p>
              </div>
            )}
            
            <div className="flex justify-center">
              <label className="bg-indigo-600 active:bg-indigo-700 text-white px-6 py-3 rounded-full font-medium cursor-pointer transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
                <Upload size={18} />
                <span>{images.length > 0 ? t.input.addPhotos : (mode === InputMode.MEDICAL_REPORT ? t.input.uploadFiles : t.input.uploadPhotos)}</span>
                <input 
                    type="file" 
                    accept={mode === InputMode.MEDICAL_REPORT ? "image/*,application/pdf" : "image/*"}
                    multiple 
                    className="hidden" 
                    onChange={handleFileChange} 
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Form Data */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <User size={18} />
                {t.input.userProfile}
            </h3>
            <button 
                onClick={handleClearAll}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
            >
                <Trash2 size={12} />
                {t.dashboard.clearAll}
            </button>
        </div>
        
        {/* Gender Selection */}
        {/* Logic: Hidden for Face Mode (Auto-detect). Required for Hand/Data Mode. Optional for Medical Report (can extract). */}
        {mode !== InputMode.FACE_HAND && mode !== InputMode.MEDICAL_REPORT && (
            <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-slate-500 mb-2">{t.input.gender} <span className="text-red-400">*</span></label>
                <div className="flex gap-3">
                    {[Gender.FEMALE, Gender.MALE].map(g => (
                        <button
                            key={g}
                            onClick={() => setGender(g)}
                            className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                                gender === g 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                : 'border-slate-200 text-slate-600'
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Age Input */}
        {/* Logic: Required for Data Mode. Hidden for Image modes (Auto-detect). */}
        {mode === InputMode.DATA_ONLY && (
             <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-slate-500 mb-2">{t.input.age} <span className="text-red-400">*</span></label>
                <input 
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t.input.enterAge}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
             </div>
        )}

        {/* Custom Symptoms / History (Optional for all modes) */}
        <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Sparkles size={14} className="text-purple-500" />
                {t.input.symptoms}
            </label>
            <textarea
                value={customSymptoms}
                onChange={(e) => setCustomSymptoms(e.target.value)}
                placeholder={t.input.symptomsPlaceholder}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none min-h-[100px] text-sm bg-slate-50/50"
            />
            <p className="text-xs text-slate-400 mt-1.5 ml-1">
                {t.input.aiPersonalize}
            </p>
        </div>

        {/* Chronic Conditions (Quick Tags) */}
        <div>
             <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-indigo-600 font-medium flex items-center gap-1 mb-3"
            >
                <Info size={14} />
                {showAdvanced ? t.input.hideTags : t.input.selectTags}
            </button>
            
            {showAdvanced && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                    {[
                        'Hypertension', 'Hyperglycemia', 'Hyperlipidemia', 'Gout', 
                        'Diabetes', 'Asthma', 'Arthritis', 'Heart Disease',
                        'Insomnia', 'Anxiety'
                    ].map(conditionKey => (
                        <button
                            key={conditionKey}
                            onClick={() => toggleCondition(conditionKey)} // We still store the key internally
                            className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                                chronicConditions.includes(conditionKey)
                                ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                                : 'bg-slate-50 border-slate-100 text-slate-500'
                            }`}
                        >
                            {/* @ts-ignore */}
                            {t.input.conditions[conditionKey] || conditionKey}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit() || isAnalyzing}
        className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all transform active:scale-95 ${
            !canSubmit() || isAnalyzing
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-200'
        }`}
      >
        {isAnalyzing ? t.input.analyzingBtn : t.input.startAnalysis}
      </button>
      
      <p className="text-center text-xs text-slate-400 whitespace-pre-line">
        {t.input.agreement}
      </p>
    </div>
  );
};
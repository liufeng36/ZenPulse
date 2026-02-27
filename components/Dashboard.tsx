import React, { useState } from 'react';
import { AnalysisResult, UserProfile, DietItem } from '../types';
import { Activity, Droplet, Zap, TrendingUp, ChevronRight, CheckCircle2, User, Download, Share2, Sparkles, Clock, Calendar, ChevronDown, ChevronUp, ChefHat, Dumbbell, FileText, History, X, ArrowLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../contexts/LanguageContext';
import { getHistory } from '../services/geminiService';

interface Props {
  result: AnalysisResult;
  profile?: UserProfile | null;
  onRetake: () => void;
  onLoadHistory?: (result: AnalysisResult) => void;
}

export const Dashboard: React.FC<Props> = ({ result, profile, onRetake, onLoadHistory }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'plan'>('overview');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [timeScale, setTimeScale] = useState<'day' | 'week' | 'month'>('week');
  const [chartData, setChartData] = useState<any[]>([]);

  // Generate chart data on mount or when dependencies change
  React.useEffect(() => {
    const history = getHistory().sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const currentScore = result.healthScore;
    const now = new Date();
    
    // 1. Process History (Past)
    const pastData = history.map((h: any) => ({
        date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: h.date, // For click handler
        score: h.score,
        type: 'history',
        payload: h // Store full history item
    }));

    // Add current result if not already in history (it might be added on save, but let's ensure it's the anchor)
    // If the last history item is "today", use it. Otherwise add "Now".
    // Actually, `result` is the current analysis.
    const currentPoint = {
        date: 'Now',
        fullDate: now.toISOString(),
        score: currentScore,
        type: 'current',
        payload: { fullResult: result } // Allow clicking "Now" to reload current? Or just visual anchor.
    };

    // 2. Generate Prediction (Future)
    const futureData: any[] = [];
    let points = 0;
    let interval = 0; // days
    let labelFormat: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

    if (timeScale === 'day') {
        points = 7;
        interval = 1;
        labelFormat = { weekday: 'short' };
    } else if (timeScale === 'week') {
        points = 4;
        interval = 7;
        labelFormat = { month: 'short', day: 'numeric' };
    } else if (timeScale === 'month') {
        points = 6;
        interval = 30;
        labelFormat = { month: 'short' };
    }

    // Simple prediction algorithm: asymptotic improvement towards 100 or 85 depending on current score
    // If score is low, improves faster. If high, maintains.
    let predictedScore = currentScore;
    const targetScore = Math.max(currentScore, 95); // Aim for 95
    const improvementRate = 0.15; // 15% of the gap per step

    for (let i = 1; i <= points; i++) {
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + (i * interval));
        
        // Calculate new score
        const gap = targetScore - predictedScore;
        predictedScore += gap * improvementRate;
        
        // Add some random fluctuation for realism (+/- 2)
        const noise = (Math.random() - 0.5) * 2;
        
        futureData.push({
            date: nextDate.toLocaleDateString(undefined, labelFormat),
            fullDate: nextDate.toISOString(),
            score: Math.min(100, Math.round(predictedScore + noise)),
            type: 'prediction'
        });
    }

    // Combine: History + Current + Future
    // Filter history to only show relevant recent history based on scale? 
    // For now, show last 5 history points to keep chart clean, or all if few.
    const recentHistory = pastData.slice(-5); 
    
    setChartData([...recentHistory, currentPoint, ...futureData]);

  }, [result, timeScale]);

  const toggleCheck = (id: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCheckedItems(newSet);
  };

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const handleViewHistory = () => {
    setShowHistory(true);
    setIsLoadingHistory(true);
    // Simulate network delay for UX
    setTimeout(() => {
        const history = getHistory();
        setHistoryList(history);
        setIsLoadingHistory(false);
    }, 600);
  };

  const handleLoadHistoryItem = (item: any) => {
    if (onLoadHistory) {
      onLoadHistory(item.fullResult);
      setShowHistory(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ZenPulse AI Health Report',
          text: `My Health Score: ${result.healthScore}. Risk Level: ${result.chronicRiskLevel}. ${result.summary}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      // Fallback for desktop/unsupported browsers
      alert("Sharing is not supported on this browser/device. You can use the PDF Export instead.");
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById('dashboard-content');
    if (!element) {
        setIsExporting(false);
        return;
    }

    // Store current state
    const originalTab = activeTab;
    const originalExpanded = expandedCard;
    
    // Switch to a "print mode" state where we show everything
    // For simplicity in this structure, we'll force render both sections by manipulating the DOM or state
    // But since the render logic depends on 'activeTab', we need to be clever.
    // A better approach for "all info" is to temporarily render a hidden container with ALL data, or just accept that we print the current view.
    // However, the user asked for "ALL report info".
    // Let's try to render a temporary "print view" if possible, or just expand everything.
    
    // Strategy: We will create a temporary clone of the element, append it to body, make it fully visible, and print that.
    // But React state won't reflect in a clone easily.
    // Instead, let's use a state flag `isPrinting` to render EVERYTHING in the main view, wait for render, print, then revert.
    
    setIsPrinting(true); // Trigger re-render with all sections visible
    
    // Wait for state update and render
    setTimeout(async () => {
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#f8fafc',
                ignoreElements: (element) => element.id === 'action-buttons' || element.id === 'header-export-btn' || element.id === 'header-back-btn'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Handle multi-page if height is too big
            if (pdfHeight > 297) {
                let heightLeft = pdfHeight;
                let position = 0;
                let pageHeight = 297;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;
                }
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }
            
            pdf.save(`ZenPulse_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Export failed", error);
            alert("Could not generate PDF. Please try again.");
        } finally {
            setIsPrinting(false); // Revert state
            setIsExporting(false);
        }
    }, 500); // Wait for render
  };

  const completedCount = checkedItems.size;
  const totalItems = 4; // Breakfast, Lunch, Dinner, Exercise
  const progress = (completedCount / totalItems) * 100;

  // Safe access for diet plan keys
  const dietKeys = ['breakfast', 'lunch', 'dinner'] as const;

  return (
    <div className="w-full max-w-md mx-auto pb-20 fade-in" id="dashboard-content">
      {/* Header Summary */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity size={120} />
        </div>
        
        {/* Header Back Button */}
        {!isPrinting && (
            <div className="absolute top-4 left-4 z-20" id="header-back-btn">
                <button 
                    onClick={onRetake}
                    className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all active:scale-95 shadow-lg border border-white/10"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>
        )}

        {/* Header Export Button */}
        {!isPrinting && (
            <div className="absolute top-4 right-4 z-20 flex gap-2" id="header-export-btn">
                 <button 
                    onClick={handleViewHistory}
                    className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all active:scale-95 shadow-lg border border-white/10"
                    title={t.dashboard.viewHistory}
                 >
                    <History size={20} />
                 </button>
                 <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all active:scale-95 shadow-lg border border-white/10"
                    title={t.dashboard.exportPdf}
                 >
                    {isExporting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> 
                    ) : (
                        <Download size={20} />
                    )}
                 </button>
            </div>
        )}

        <div className="relative z-10 pt-2">
          <div className="flex justify-between items-start mb-4">
            <div className="relative">
              {/* Gauge Chart */}
              <div className="w-24 h-24 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[{ value: result.healthScore }, { value: 100 - result.healthScore }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={45}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="score" fill={
                                result.healthScore >= 80 ? '#4ade80' : 
                                result.healthScore >= 60 ? '#facc15' : '#f87171'
                            } />
                            <Cell key="rest" fill="rgba(255,255,255,0.1)" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{result.healthScore}</span>
                </div>
              </div>
              <p className="text-indigo-200 text-xs text-center mt-1">{t.dashboard.healthScore}</p>
            </div>

            <div className="flex flex-col items-end gap-1 mr-2"> 
                 <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    result.chronicRiskLevel === 'Low' ? 'bg-green-500/20 border-green-400 text-green-100' :
                    result.chronicRiskLevel === 'Medium' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-100' :
                    'bg-red-500/20 border-red-400 text-red-100'
                }`}>
                    {t.dashboard.risk}: {result.chronicRiskLevel}
                </div>
                {/* Age & Gender Tag */}
                <div className="flex items-center gap-1 text-xs bg-indigo-700/50 px-2 py-1 rounded text-indigo-100 border border-indigo-600">
                    <User size={10} />
                    <span>{result.detectedGender}, {result.predictedAge}yo</span>
                </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium">{result.tcmBodyType}</p>
            
            {/* Expandable Summary */}
            <div 
                className="relative group cursor-pointer"
                onClick={() => setShowFullSummary(!showFullSummary)}
                title="Click to expand/collapse"
            >
                <p className={`text-sm text-indigo-200 opacity-90 transition-all duration-300 ${showFullSummary || isPrinting ? '' : 'line-clamp-3'}`}>
                    {result.summary}
                </p>
                {!showFullSummary && !isPrinting && (
                    <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-indigo-800 to-transparent pointer-events-none group-hover:from-indigo-900" />
                )}
                <div className="flex justify-center mt-1">
                    {showFullSummary || isPrinting ? <ChevronUp size={14} className="text-indigo-300" /> : <ChevronDown size={14} className="text-indigo-300" />}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {!isPrinting && (
          <div className="flex px-6 mt-6 gap-4">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'text-indigo-900 border-b-2 border-indigo-900' : 'text-slate-400'}`}
            >
                {t.dashboard.tabs.overview}
            </button>
            <button 
                onClick={() => setActiveTab('plan')}
                className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'plan' ? 'text-indigo-900 border-b-2 border-indigo-900' : 'text-slate-400'}`}
            >
                {t.dashboard.tabs.plan}
            </button>
          </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-6">
        {(activeTab === 'overview' || isPrinting) && (
          <>
            {/* Prediction Info */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2 text-xs text-slate-500">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-indigo-500" />
                        <span>{new Date(result.timestamp || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-green-500" />
                        <span>{t.dashboard.nextScan}: {new Date(result.nextPredictionDate || Date.now() + 3*86400000).toLocaleDateString()}</span>
                    </div>
                 </div>
                 {result.id && (
                    <div className="text-[10px] text-slate-300 font-mono text-center pt-1 border-t border-slate-50">
                        {t.dashboard.reportId}: {result.id.split('-')[0]}...
                    </div>
                 )}
            </div>

            {/* Context Section (New) */}
            {(profile?.customSymptoms || (profile?.chronicConditions && profile.chronicConditions.length > 0)) && (
                 <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-2 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Sparkles size={12} />
                        {t.dashboard.symptomsAnalyzed}
                    </h3>
                    
                    {/* Highlighted Chronic Conditions */}
                    {profile?.chronicConditions && profile.chronicConditions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {profile.chronicConditions.map((condition, idx) => (
                                <span key={idx} className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-1 rounded-md border border-red-200">
                                    {/* @ts-ignore */}
                                    {t.input.conditions[condition] || condition}
                                </span>
                            ))}
                        </div>
                    )}

                    {profile?.customSymptoms && (
                        <p className="text-slate-700 text-sm italic">"{profile.customSymptoms}"</p>
                    )}
                </div>
            )}

            {/* Visual Findings */}
            {result.visualFeatures.length > 0 && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Zap size={18} className="text-amber-500" />
                        {t.dashboard.visualInsights}
                    </h3>
                    <div className="space-y-3">
                        {result.visualFeatures.map((feat, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                <div>
                                    <span className="font-medium text-slate-700">{feat.area}:</span> 
                                    <span className="text-slate-500 ml-1">{feat.finding}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    feat.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {feat.implication}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trend Chart */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-80 relative flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" />
                        {t.dashboard.healthProjection}
                    </h3>
                    
                    {/* Time Scale Controls */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {(['day', 'week', 'month'] as const).map((scale) => (
                            <button
                                key={scale}
                                onClick={() => setTimeScale(scale)}
                                className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                                    timeScale === scale 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {scale.charAt(0).toUpperCase() + scale.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} onClick={(e) => {
                            if (e && e.activePayload && e.activePayload[0]) {
                                const payload = e.activePayload[0].payload;
                                if (payload.type === 'history') {
                                    handleLoadHistoryItem(payload.payload);
                                } else if (payload.type === 'prediction') {
                                    alert("Projected score based on plan adherence.");
                                }
                            }
                        }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} interval="preserveStartEnd" />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                labelStyle={{color: '#64748b', fontSize: '12px', marginBottom: '4px'}}
                                formatter={(value: any, name: any, props: any) => {
                                    const isPrediction = props.payload.type === 'prediction';
                                    return [value, isPrediction ? 'Projected' : 'Score'];
                                }}
                            />
                            {/* History Area */}
                            <Area 
                                type="monotone" 
                                dataKey="score" 
                                stroke="#4f46e5" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorScore)" 
                                connectNulls
                                activeDot={{r: 6, strokeWidth: 0}}
                            />
                            {/* We could use a separate Area for prediction to style it differently, 
                                but Recharts handles single series best. 
                                Instead, let's use a Custom Dot to differentiate points. 
                            */}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span>History</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span>Current</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-300"></div>
                        <span>Projected</span>
                    </div>
                </div>
            </div>
          </>
        )}
        
        {(activeTab === 'plan' || isPrinting) && (
          <>
            {/* Progress Bar */}
            {!isPrinting && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-sm font-bold text-slate-600">{Math.round(progress)}% {t.dashboard.done}</span>
                </div>
            )}

            {/* Diet Plan */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">{t.dashboard.dietPlan}</h3>
                {dietKeys.map((meal) => {
                    const item = result.plan?.diet?.[meal];
                    if (!item) return null;

                    const isChecked = checkedItems.has(meal);
                    const isExpanded = expandedCard === meal || isPrinting; // Always expand for printing

                    return (
                        <div key={meal} 
                             className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${
                                 isChecked && !isPrinting ? 'border-green-200 bg-green-50/50' : 'border-slate-100'
                             }`}>
                            <div 
                                onClick={() => toggleCheck(meal)}
                                className="p-4 flex justify-between items-start cursor-pointer"
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                                    }`}>
                                        {isChecked && <CheckCircle2 size={12} />}
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold capitalize ${isChecked && !isPrinting ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                            {item.name}
                                        </h4>
                                        <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{item.tag}</span>
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.value}</span>
                                        </div>
                                    </div>
                                </div>
                                {!isPrinting && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleCard(meal); }}
                                        className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                                    >
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                )}
                            </div>
                            
                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-1">
                                    <div className="mt-2 border-t border-slate-100 pt-3">
                                        {/* Dynamic Image */}
                                        <div className="w-full h-32 bg-slate-100 rounded-xl mb-3 overflow-hidden relative">
                                            <img 
                                                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(item.name)}%20minimalist%20food?width=600&height=400&nologo=true`} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback if image fails
                                                    (e.target as HTMLImageElement).src = `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(item.name)}`;
                                                }}
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                            <div>
                                                <h5 className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                                                    <ChefHat size={14} className="text-orange-500" />
                                                    {t.dashboard.ingredients}
                                                </h5>
                                                <p className="text-slate-600 pl-5">{item.ingredients?.join(', ') || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                                                    <FileText size={14} className="text-blue-500" />
                                                    {t.dashboard.recipe}
                                                </h5>
                                                <p className="text-slate-600 pl-5">{item.recipe || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Exercise */}
            <div className="space-y-3">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">{t.dashboard.microWorkout}</h3>
                 {result.plan?.exercise?.length > 0 ? result.plan.exercise.map((ex, i) => {
                     const id = `ex-${i}`;
                     const isChecked = checkedItems.has(id);
                     const isExpanded = expandedCard === id || isPrinting;

                     return (
                        <div key={i} 
                             className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${
                                 isChecked && !isPrinting ? 'border-green-200 bg-green-50/50' : 'border-slate-100'
                             }`}>
                             <div 
                                onClick={() => toggleCheck(id)}
                                className="p-4 flex justify-between items-start cursor-pointer"
                             >
                                 <div className="flex gap-3">
                                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                                    }`}>
                                        {isChecked && <CheckCircle2 size={12} />}
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold ${isChecked && !isPrinting ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                            {ex.name}
                                        </h4>
                                        <p className="text-sm text-slate-500 mt-1">{ex.benefit}</p>
                                        <div className="flex gap-2 mt-2 items-center">
                                            <span className="text-xs font-mono bg-slate-800 text-white px-2 py-0.5 rounded">{ex.duration}</span>
                                            <span className="text-xs text-orange-600 font-medium">{ex.intensity}</span>
                                            {ex.isChronicFriendly && <span className="text-[10px] text-green-600 border border-green-200 px-1 rounded">{t.dashboard.safe}</span>}
                                        </div>
                                    </div>
                                 </div>
                                 {!isPrinting && (
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); toggleCard(id); }}
                                        className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                                     >
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                 )}
                             </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-1">
                                    <div className="mt-2 border-t border-slate-100 pt-3">
                                        {/* Dynamic Image */}
                                        <div className="w-full h-32 bg-slate-100 rounded-xl mb-3 overflow-hidden relative">
                                            <img 
                                                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(ex.name)}%20fitness%20exercise?width=600&height=400&nologo=true`} 
                                                alt={ex.name} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(ex.name)}`;
                                                }}
                                            />
                                        </div>
                                        
                                        <div className="text-sm">
                                            <h5 className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                                                <Dumbbell size={14} className="text-purple-500" />
                                                {t.dashboard.instructions}
                                            </h5>
                                            <p className="text-slate-600 pl-5">{ex.instructions || 'Follow standard form.'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                     )
                 }) : (
                     <div className="text-sm text-slate-400 italic">{t.dashboard.noExercise}</div>
                 )}
            </div>

            {/* Feedback / Optimization */}
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-sm text-indigo-800">
                <strong>{t.dashboard.optimizationTip}:</strong> {result.plan?.advice || t.dashboard.fallbackAdvice}
                <div className="mt-2 text-xs text-indigo-600 opacity-75">
                    {t.dashboard.disclaimer}
                </div>
            </div>
          </>
        )}
        
        {/* Action Buttons */}
        {!isPrinting && (
            <div id="action-buttons" className="space-y-3 mt-6">
                 <div className="flex gap-3">
                     <button 
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isExporting ? (
                            <span>{t.dashboard.generatingPdf}</span>
                        ) : (
                            <>
                                <Download size={18} />
                                <span>{t.dashboard.exportPdf}</span>
                            </>
                        )}
                    </button>
                    <button 
                        onClick={handleShare}
                        className="flex-1 py-3 bg-indigo-50 text-indigo-600 font-medium rounded-xl transition-all hover:bg-indigo-100 active:scale-95 flex items-center justify-center gap-2 border border-indigo-100"
                    >
                        <Share2 size={18} />
                        <span>{t.dashboard.share}</span>
                    </button>
                 </div>
                <button 
                    onClick={onRetake}
                    className="w-full py-3 text-slate-500 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                    {t.dashboard.newScan}
                </button>
            </div>
        )}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-indigo-600" />
                        {t.dashboard.viewHistory}
                    </h3>
                    <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-200 rounded-full">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 min-h-[200px]">
                    {isLoadingHistory ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                            <p className="text-sm">Loading history...</p>
                        </div>
                    ) : historyList.length > 0 ? historyList.map((item, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleLoadHistoryItem(item)}
                            className="p-3 border border-slate-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-mono text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    item.score >= 80 ? 'bg-green-100 text-green-700' : 
                                    item.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {t.dashboard.score}: {item.score}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 group-hover:text-indigo-700">
                                {item.summary}
                            </p>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            No history found.
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
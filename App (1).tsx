
import React, { useState, useEffect, useCallback } from 'react';
import { Category, EmissionEntry, FootprintSummary, AIAdvice, EmissionFactor } from './types';
import { EMISSION_FACTORS, COLORS } from './constants';
import { getCarbonAdvice } from './services/geminiService';
import SummaryCard from './components/SummaryCard';
import CarbonChart from './components/CarbonChart';
import GoalProgress from './components/GoalProgress';

const App: React.FC = () => {
  const [entries, setEntries] = useState<EmissionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<Category>(Category.ELECTRICITY);
  const [amount, setAmount] = useState<string>('');
  const [subType, setSubType] = useState<string>(Object.keys(EMISSION_FACTORS[Category.ELECTRICITY])[0]);
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(350); // Default goal in kg CO2e

  // Initialize with some data
  useEffect(() => {
    const saved = localStorage.getItem('carbon_entries');
    const savedGoal = localStorage.getItem('carbon_goal');
    
    if (savedGoal) setMonthlyGoal(Number(savedGoal));
    
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      const initialEntries: EmissionEntry[] = [
        { id: '1', category: Category.ELECTRICITY, description: 'US Grid Average', amount: 300, co2e: 111.3, date: new Date().toISOString() },
        { id: '2', category: Category.TRANSPORTATION, description: 'Gasoline Car (Avg)', amount: 50, co2e: 17.05, date: new Date().toISOString() },
        { id: '3', category: Category.FOOD, description: 'Beef', amount: 2, co2e: 54.0, date: new Date().toISOString() },
      ];
      setEntries(initialEntries);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('carbon_entries', JSON.stringify(entries));
    localStorage.setItem('carbon_goal', monthlyGoal.toString());
  }, [entries, monthlyGoal]);

  const calculateSummary = useCallback((): FootprintSummary => {
    const summary: FootprintSummary = {
      total: 0,
      byCategory: {
        [Category.ELECTRICITY]: 0,
        [Category.TRANSPORTATION]: 0,
        [Category.FOOD]: 0,
      },
      goalPercentage: 0,
      isOverGoal: false,
    };

    entries.forEach(entry => {
      summary.total += entry.co2e;
      summary.byCategory[entry.category] += entry.co2e;
    });

    summary.goalPercentage = (summary.total / monthlyGoal) * 100;
    summary.isOverGoal = summary.total > monthlyGoal;

    return summary;
  }, [entries, monthlyGoal]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const factor = EMISSION_FACTORS[activeTab][subType] as EmissionFactor;
    const co2e = numAmount * factor.value;

    const newEntry: EmissionEntry = {
      id: Math.random().toString(36).substr(2, 9),
      category: activeTab,
      description: factor.label,
      amount: numAmount,
      co2e,
      date: new Date().toISOString(),
    };

    setEntries(prev => [newEntry, ...prev]);
    setAmount('');
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    const summary = calculateSummary();
    const result = await getCarbonAdvice(summary, entries);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-[#fcfcfd] selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <i className="fas fa-leaf text-xl"></i>
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">CarbonFootprint</span>
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={fetchAdvice}
              disabled={loadingAdvice}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all ${
                loadingAdvice 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : (summary.isOverGoal ? 'bg-rose-600 shadow-rose-100' : 'bg-emerald-600 shadow-emerald-100') + ' text-white hover:opacity-90 shadow-lg active:scale-95'
              }`}
            >
              {loadingAdvice ? (
                <i className="fas fa-circle-notch animate-spin"></i>
              ) : (
                <i className="fas fa-magic"></i>
              )}
              AI Analysis
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Welcome Section */}
        <section className="animate-in flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 mb-2">Impact Dashboard</h2>
            <p className="text-slate-500 font-medium">Monitoring your journey towards net-zero.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3">Set Target</span>
             <div className="flex gap-1">
                {[200, 350, 600].map(val => (
                  <button 
                    key={val}
                    onClick={() => setMonthlyGoal(val)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      monthlyGoal === val 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {val}kg
                  </button>
                ))}
             </div>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in" style={{ animationDelay: '0.1s' }}>
          <SummaryCard 
            title="Total Generated" 
            value={`${summary.total.toFixed(0)} kg`} 
            icon="fa-cloud-meatball" 
            colorClass={summary.isOverGoal ? "bg-rose-600" : "bg-slate-900"}
            subtitle={summary.total > 400 ? "Above Avg" : "Below Avg"}
          />
          <SummaryCard 
            title="Electricity" 
            value={`${summary.byCategory[Category.ELECTRICITY].toFixed(0)} kg`} 
            icon="fa-bolt" 
            colorClass="bg-amber-500"
          />
          <SummaryCard 
            title="Transportation" 
            value={`${summary.byCategory[Category.TRANSPORTATION].toFixed(0)} kg`} 
            icon="fa-car-side" 
            colorClass="bg-blue-600"
          />
          <SummaryCard 
            title="Food Consumption" 
            value={`${summary.byCategory[Category.FOOD].toFixed(0)} kg`} 
            icon="fa-utensils" 
            colorClass="bg-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in" style={{ animationDelay: '0.2s' }}>
          {/* Main Action Area */}
          <div className="lg:col-span-8 space-y-10">
            {/* Goal Progress Section */}
            <GoalProgress current={summary.total} goal={monthlyGoal} />

            {/* Input Form */}
            <div className="bg-white p-8 rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
               
               <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                    <i className="fas fa-plus"></i>
                </span>
                Log New Emission
               </h3>

               <div className="flex gap-2 mb-8 bg-slate-50 p-1.5 rounded-2xl w-fit">
                {Object.values(Category).map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveTab(cat);
                      setSubType(Object.keys(EMISSION_FACTORS[cat])[0]);
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === cat 
                        ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-100' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <div className="md:col-span-3 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtype Source</label>
                  <div className="relative">
                    <select 
                      value={subType}
                      onChange={(e) => setSubType(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    >
                      {(Object.entries(EMISSION_FACTORS[activeTab]) as [string, EmissionFactor][]).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Amount ({(EMISSION_FACTORS[activeTab][subType] as EmissionFactor).unit})
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <button className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-slate-100 transition-all active:scale-95">
                    Add Record
                  </button>
                </div>
              </form>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-50 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <h3 className="text-xl font-bold text-slate-800">History Log</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">{entries.length} Entries Total</span>
              </div>
              <div className="overflow-x-auto">
                {entries.length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 text-2xl mb-4">
                      <i className="fas fa-inbox"></i>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Your carbon log is empty</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-8 py-4 text-left">Category</th>
                        <th className="px-8 py-4 text-left">Detail</th>
                        <th className="px-8 py-4 text-right">Emissions</th>
                        <th className="px-8 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {entries.map(entry => (
                        <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <span className="flex items-center gap-3">
                              <span 
                                className="w-3 h-3 rounded-full shadow-sm" 
                                style={{ backgroundColor: COLORS[entry.category] }}
                              ></span>
                              <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">{entry.category}</span>
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-slate-900 font-bold">{entry.description}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              {entry.amount} {(Object.values(EMISSION_FACTORS[entry.category]) as EmissionFactor[]).find(f => f.label === entry.description)?.unit || ''}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className="text-sm font-black text-slate-900">{entry.co2e.toFixed(1)}</span>
                            <span className="text-[10px] font-bold text-slate-400 ml-1">kg</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => removeEntry(entry.id)}
                              className="w-8 h-8 rounded-xl bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Area */}
          <div className="lg:col-span-4 space-y-10">
            {/* Visual Breakdown */}
            <div className="bg-white p-8 rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-50">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Emissions Split</h3>
              <CarbonChart summary={summary} />
            </div>

            {/* AI Advisor Panel */}
            <div className={`relative rounded-[32px] shadow-2xl p-8 transition-all overflow-hidden ${advice ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-900 text-white shadow-slate-100'}`}>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <i className="fas fa-robot text-6xl"></i>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${advice ? 'bg-white/20' : 'bg-emerald-500'}`}>
                  <i className="fas fa-sparkles"></i>
                </div>
                <h3 className="text-xl font-bold">Expert AI Insight</h3>
              </div>
              
              {!advice ? (
                <div className="space-y-6">
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Ready for a deeper dive? Our AI analyzes your patterns to provide hyper-local reduction strategies.</p>
                  <button 
                    onClick={fetchAdvice}
                    disabled={loadingAdvice}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                  >
                    {loadingAdvice ? (
                        <>
                            <i className="fas fa-circle-notch animate-spin"></i>
                            Analyzing...
                        </>
                    ) : 'Generate Report'}
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in">
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-3">Professional Analysis</h4>
                    <p className="text-sm text-white/90 leading-relaxed font-medium">{advice.summary}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Strategic Steps</h4>
                    <ul className="space-y-3">
                      {advice.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3 text-sm text-white/80 bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                          <i className="fas fa-arrow-right text-emerald-400 mt-0.5 text-xs"></i>
                          <span className="font-medium leading-snug">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-xs italic text-indigo-200 font-medium">Global context: {advice.comparativeInsight}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Educational Fact */}
            <div className="group bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-8 rounded-[32px] shadow-lg shadow-emerald-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/leaf.png')] opacity-10"></div>
                <div className="relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-emerald-200">
                        <i className="fas fa-info-circle"></i> Climate Fact
                    </h3>
                    <p className="text-lg font-bold leading-tight group-hover:scale-[1.02] transition-transform duration-500">
                        Average carbon footprints vary significantly by location. The average American generates ~1,300kg/month, while the global average is ~400kg.
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-emerald-200 text-xs font-black uppercase tracking-widest">
                        Learn More <i className="fas fa-external-link-alt text-[10px]"></i>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-12 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              <i className="fas fa-leaf text-xs"></i>
            </div>
            <span className="font-black text-slate-800 tracking-tight">CarbonFootprint</span>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">&copy; 2025 CarbonFootprint Tracker &bull; Powered by EPA/IPCC Open Data</p>
      </footer>
    </div>
  );
};

export default App;

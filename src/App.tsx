import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Activity, 
  Wallet, 
  History, 
  Settings, 
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  Bot,
  Bell,
  ChevronRight,
  Plus,
  Lock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { ArbitrageOpportunity, HistoryItem, ExchangeKey } from './types';
import { generateMockOpportunity, EXCHANGES } from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="glass-morphism p-6 rounded-2xl">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {change && (
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", 
          change.startsWith('+') ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
          {change}
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

const OpportunityRow = ({ opp, onSimulate }: { opp: ArbitrageOpportunity, onSimulate: (o: ArbitrageOpportunity) => void }) => (
  <motion.tr 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="border-b border-border-subtle hover:bg-white/[0.02] transition-colors group"
  >
    <td className="py-4 px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">
          {opp.coin[0]}
        </div>
        <span className="font-semibold">{opp.coin}</span>
      </div>
    </td>
    <td className="py-4 px-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{opp.exchangeA}</span>
        <span className="text-xs text-slate-500">${opp.priceA.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
    </td>
    <td className="py-4 px-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{opp.exchangeB}</span>
        <span className="text-xs text-slate-500">${opp.priceB.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
    </td>
    <td className="py-4 px-4">
      <span className={cn("text-sm font-bold", opp.diffPercent > 0 ? "text-brand-green" : "text-rose-400")}>
        {opp.diffPercent.toFixed(2)}%
      </span>
    </td>
    <td className="py-4 px-4">
      <span className="text-sm font-mono text-brand-blue">${opp.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </td>
    <td className="py-4 px-4">
      <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded", 
        opp.risk === 'Low' ? "bg-emerald-500/10 text-emerald-400" : 
        opp.risk === 'Medium' ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400")}>
        {opp.risk}
      </span>
    </td>
    <td className="py-4 px-4 text-right">
      <button 
        onClick={() => onSimulate(opp)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-brand-blue/10 rounded-lg text-brand-blue"
      >
        <Zap className="w-4 h-4" />
      </button>
    </td>
  </motion.tr>
);

export default function App() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<ArbitrageOpportunity | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock data for charts
  const profitData = [
    { name: 'Mon', profit: 120 },
    { name: 'Tue', profit: 450 },
    { name: 'Wed', profit: 300 },
    { name: 'Thu', profit: 800 },
    { name: 'Fri', profit: 600 },
    { name: 'Sat', profit: 950 },
    { name: 'Sun', profit: 1100 },
  ];

  useEffect(() => {
    const initialOpps = Array.from({ length: 6 }, generateMockOpportunity);
    setOpportunities(initialOpps);

    const interval = setInterval(() => {
      if (isScanning) {
        setOpportunities(prev => {
          const newOpp = generateMockOpportunity();
          return [newOpp, ...prev.slice(0, 5)];
        });
      }
    }, 5000);

    fetchHistory();

    return () => clearInterval(interval);
  }, [isScanning]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const handleSimulate = async (opp: ArbitrageOpportunity) => {
    setSelectedOpp(opp);
    setIsAnalyzing(true);
    setAiAnalysis(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this crypto arbitrage opportunity:
        Coin: ${opp.coin}
        Buy on: ${opp.exchangeA} at $${opp.priceA}
        Sell on: ${opp.exchangeB} at $${opp.priceB}
        Gross Diff: ${opp.diffPercent}%
        Risk Level: ${opp.risk}
        Transfer Time: ${opp.transferTime} mins
        
        Provide a concise professional risk assessment and recommendation. Focus on network congestion, exchange liquidity, and potential slippage.`,
      });
      setAiAnalysis(response.text || "Analysis unavailable.");
    } catch (e) {
      setAiAnalysis("AI Analysis failed. Please check your network connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeTrade = async () => {
    if (!selectedOpp) return;
    
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin: selectedOpp.coin,
          exchange_a: selectedOpp.exchangeA,
          exchange_b: selectedOpp.exchangeB,
          profit_percent: selectedOpp.diffPercent,
          profit_amount: selectedOpp.netProfit,
          status: 'Completed'
        })
      });
      fetchHistory();
      setSelectedOpp(null);
      alert("Trade executed successfully!");
    } catch (e) {
      alert("Trade execution failed.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-morphism border-r border-border-subtle flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center neon-glow-blue">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter text-white">ArbitrAI</h1>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
              { id: 'scanner', icon: Zap, label: 'Live Scanner' },
              { id: 'portfolio', icon: Wallet, label: 'Portfolio' },
              { id: 'history', icon: History, label: 'History' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  activeTab === item.id 
                    ? "bg-brand-blue/10 text-brand-blue font-semibold" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-gradient-to-br from-brand-blue/20 to-brand-green/20 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-brand-green" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Premium Bot</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
              Enable auto-trading and advanced risk management.
            </p>
            <button className="w-full py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-brand-green transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-dashboard-bg relative">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 glass-morphism px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">System Online</span>
            </div>
            <div className="h-4 w-px bg-border-subtle" />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className={cn("w-3 h-3", isScanning && "animate-spin")} />
              Scanning 4 Exchanges
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Gas Price:</span>
              <span className="text-xs font-mono text-brand-blue">12 Gwei</span>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-blue rounded-full border-2 border-dashboard-bg" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border-subtle">
              <div className="text-right">
                <p className="text-xs font-bold text-white">Alex Rivera</p>
                <p className="text-[10px] text-slate-500">Pro Trader</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-brand-green" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total Balance" 
                  value="$42,500.00" 
                  change="+12.5%" 
                  icon={Wallet} 
                  color="bg-brand-blue" 
                />
                <StatCard 
                  title="Daily Profit" 
                  value="$1,240.50" 
                  change="+5.2%" 
                  icon={TrendingUp} 
                  color="bg-brand-green" 
                />
                <StatCard 
                  title="Active Opportunities" 
                  value={opportunities.length.toString()} 
                  icon={Zap} 
                  color="bg-amber-500" 
                />
                <StatCard 
                  title="Success Rate" 
                  value="98.4%" 
                  change="+0.4%" 
                  icon={Shield} 
                  color="bg-indigo-500" 
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart */}
                <div className="lg:col-span-2 glass-morphism p-6 rounded-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-white">Profit Performance</h2>
                    <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-slate-400 outline-none">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={profitData}>
                        <defs>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#14161a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#00d2ff' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="profit" 
                          stroke="#00d2ff" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorProfit)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent History */}
                <div className="glass-morphism p-6 rounded-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                    <button onClick={() => setActiveTab('history')} className="text-brand-blue text-xs font-bold hover:underline">View All</button>
                  </div>
                  <div className="space-y-4">
                    {history.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{item.coin} Arbitrage</p>
                            <p className="text-[10px] text-slate-500">{item.exchange_a} → {item.exchange_b}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-brand-green">+${item.profit_amount.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-slate-500 text-sm italic">No trades executed yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Opportunities Table */}
              <div className="glass-morphism rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border-subtle flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-white">Live Arbitrage Scanner</h2>
                    <p className="text-xs text-slate-500">Real-time price gaps across major exchanges</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsScanning(!isScanning)}
                      className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", 
                        isScanning ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20")}
                    >
                      {isScanning ? "Pause Scanner" : "Resume Scanner"}
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        <th className="py-4 px-4">Asset</th>
                        <th className="py-4 px-4">Exchange A (Buy)</th>
                        <th className="py-4 px-4">Exchange B (Sell)</th>
                        <th className="py-4 px-4">Spread</th>
                        <th className="py-4 px-4">Est. Net Profit</th>
                        <th className="py-4 px-4">Risk</th>
                        <th className="py-4 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((opp) => (
                        <OpportunityRow key={opp.id} opp={opp} onSimulate={handleSimulate} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Portfolio Overview</h2>
                  <p className="text-slate-400">Consolidated balance across all connected exchanges</p>
                </div>
                <button className="px-6 py-3 bg-brand-blue text-black font-bold rounded-xl hover:bg-white transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Deposit Funds
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-morphism p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-6">Asset Allocation</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'BTC', value: 0.45 },
                          { name: 'ETH', value: 12.5 },
                          { name: 'SOL', value: 85 },
                          { name: 'USDT', value: 15400 },
                          { name: 'BNB', value: 4.2 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#14161a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          />
                          <Bar dataKey="value" fill="#00d2ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-morphism rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                          <th className="py-4 px-6">Asset</th>
                          <th className="py-4 px-6">Balance</th>
                          <th className="py-4 px-6">Value (USD)</th>
                          <th className="py-4 px-6">24h Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Bitcoin', symbol: 'BTC', balance: '0.45', value: '29,250.00', change: '+2.4%' },
                          { name: 'Ethereum', symbol: 'ETH', balance: '12.5', value: '43,750.00', change: '-1.2%' },
                          { name: 'Solana', symbol: 'SOL', balance: '85.0', value: '11,900.00', change: '+5.8%' },
                          { name: 'Tether', symbol: 'USDT', balance: '15,400', value: '15,400.00', change: '0.0%' },
                        ].map((asset) => (
                          <tr key={asset.symbol} className="border-b border-border-subtle hover:bg-white/[0.02]">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs">{asset.symbol[0]}</div>
                                <div>
                                  <p className="text-sm font-bold text-white">{asset.name}</p>
                                  <p className="text-[10px] text-slate-500">{asset.symbol}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm font-mono">{asset.balance}</td>
                            <td className="py-4 px-6 text-sm font-mono">${asset.value}</td>
                            <td className={cn("py-4 px-6 text-sm font-bold", asset.change.startsWith('+') ? "text-brand-green" : "text-rose-400")}>
                              {asset.change}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-morphism p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-6">Exchange Distribution</h3>
                    <div className="space-y-4">
                      {EXCHANGES.map((ex, i) => (
                        <div key={ex} className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-white font-medium">{ex}</span>
                            <span className="text-slate-400">{[45, 25, 20, 10][i]}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-blue rounded-full" 
                              style={{ width: `${[45, 25, 20, 10][i]}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="glass-morphism p-6 rounded-2xl bg-gradient-to-br from-brand-blue/10 to-transparent">
                    <Shield className="w-8 h-8 text-brand-blue mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Secure Storage</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Your API keys are encrypted using AES-256 and never leave our secure server environment.
                    </p>
                    <button className="text-brand-blue text-xs font-bold flex items-center gap-1 hover:underline">
                      Security Audit Report <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Arbitrage History</h2>
                  <p className="text-slate-400">Detailed log of all executed arbitrage trades</p>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors">
                    Export CSV
                  </button>
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors">
                    Filter
                  </button>
                </div>
              </div>

              <div className="glass-morphism rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      <th className="py-4 px-6">Date & Time</th>
                      <th className="py-4 px-6">Asset</th>
                      <th className="py-4 px-6">Route</th>
                      <th className="py-4 px-6">Spread</th>
                      <th className="py-4 px-6">Profit</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-border-subtle hover:bg-white/[0.02]">
                        <td className="py-4 px-6 text-xs text-slate-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-bold text-white">{item.coin}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-300">{item.exchange_a}</span>
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                            <span className="text-slate-300">{item.exchange_b}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-bold text-brand-green">{item.profit_percent.toFixed(2)}%</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-mono text-brand-blue">${item.profit_amount.toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 uppercase">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <History className="w-12 h-12 text-slate-700" />
                            <p className="text-slate-500">No trade history found.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scanner' && (
             <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Advanced Scanner</h2>
                    <p className="text-slate-400">Filtering 240+ pairs across 4 exchanges</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/5 p-1 rounded-xl flex">
                      <button className="px-4 py-1.5 bg-brand-blue text-black text-xs font-bold rounded-lg">Grid</button>
                      <button className="px-4 py-1.5 text-slate-400 text-xs font-bold rounded-lg">List</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {opportunities.map((opp) => (
                    <motion.div 
                      key={opp.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "glass-morphism p-6 rounded-2xl border-l-4 transition-all hover:translate-y-[-4px]",
                        opp.diffPercent > 1.5 ? "border-l-brand-green neon-glow-green" : "border-l-brand-blue"
                      )}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg font-bold">
                            {opp.coin[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{opp.coin}/USDT</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Network: ERC-20</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-brand-green">{opp.diffPercent.toFixed(2)}%</span>
                          <p className="text-[10px] text-slate-500">Spread</p>
                        </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Buy on {opp.exchangeA}</span>
                          <span className="font-mono text-white">${opp.priceA.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Sell on {opp.exchangeB}</span>
                          <span className="font-mono text-white">${opp.priceB.toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-border-subtle" />
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">Est. Net ROI</span>
                          <span className="text-sm font-bold text-brand-blue">${opp.netProfit.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-500 uppercase">Transfer Time</span>
                            <span className={cn("font-bold", opp.transferTime > 15 ? "text-rose-400" : "text-emerald-400")}>
                              {opp.transferTime}m
                            </span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full", opp.transferTime > 15 ? "bg-rose-500" : "bg-emerald-500")}
                              style={{ width: `${(opp.transferTime / 30) * 100}%` }}
                            />
                          </div>
                        </div>
                        {opp.transferTime > 15 && (
                          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400" title="High transfer time risk">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => handleSimulate(opp)}
                        className="w-full py-3 bg-brand-blue text-black font-bold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Analyze & Execute
                      </button>
                    </motion.div>
                  ))}
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Platform Settings</h2>
                <p className="text-slate-400">Configure your API keys and risk parameters</p>
              </div>

              <div className="space-y-6">
                <div className="glass-morphism p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-5 h-5 text-brand-blue" />
                    <h3 className="font-bold text-white">Exchange API Keys</h3>
                  </div>
                  <div className="space-y-4">
                    {EXCHANGES.map(ex => (
                      <div key={ex} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold">
                            {ex[0]}
                          </div>
                          <span className="text-sm font-medium">{ex}</span>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors">
                          <Plus className="w-3 h-3" />
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-morphism p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-5 h-5 text-brand-green" />
                    <h3 className="font-bold text-white">Risk Management</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-400 uppercase">Max Daily Loss</label>
                        <span className="text-xs font-mono text-brand-blue">$500.00</span>
                      </div>
                      <input type="range" className="w-full accent-brand-blue" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-400 uppercase">Min Profit Threshold</label>
                        <span className="text-xs font-mono text-brand-blue">0.5%</span>
                      </div>
                      <input type="range" className="w-full accent-brand-blue" />
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                      <div>
                        <p className="text-sm font-bold text-white">Telegram Alerts</p>
                        <p className="text-[10px] text-slate-500">Get notified of high-profit opportunities</p>
                      </div>
                      <div className="w-10 h-5 bg-brand-blue rounded-full relative">
                        <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Simulation Modal */}
      <AnimatePresence>
        {selectedOpp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOpp(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-morphism rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-border-subtle bg-gradient-to-r from-brand-blue/10 to-transparent">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">AI Profit Simulation</h2>
                    <p className="text-slate-400 text-sm">Simulating {selectedOpp.coin} trade: {selectedOpp.exchangeA} → {selectedOpp.exchangeB}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOpp(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Plus className="w-6 h-6 rotate-45 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Gross Spread</p>
                    <p className="text-xl font-bold text-white">{selectedOpp.diffPercent.toFixed(2)}%</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Est. Fees</p>
                    <p className="text-xl font-bold text-rose-400">-$12.40</p>
                  </div>
                  <div className="bg-brand-blue/10 p-4 rounded-2xl border border-brand-blue/20">
                    <p className="text-[10px] text-brand-blue uppercase font-bold mb-1">Net ROI</p>
                    <p className="text-xl font-bold text-brand-blue">${selectedOpp.netProfit.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-brand-blue" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Engine Analysis</h3>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5 min-h-[120px] flex items-center justify-center">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-6 h-6 text-brand-blue animate-spin" />
                        <p className="text-xs text-slate-400 animate-pulse">Analyzing liquidity & network health...</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-300 leading-relaxed italic">
                        "{aiAnalysis}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase">Fee Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Trading Fee (0.1%)</span>
                        <span className="text-white">$4.20</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Withdrawal Fee</span>
                        <span className="text-white">$6.00</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Network Gas</span>
                        <span className="text-white">$2.20</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase">Risk Indicators</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Liquidity Depth</span>
                        <span className="text-emerald-400 font-bold">Excellent</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Network Congestion</span>
                        <span className="text-amber-400 font-bold">Moderate</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Price Volatility</span>
                        <span className="text-emerald-400 font-bold">Low</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => setSelectedOpp(null)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeTrade}
                    className="flex-[2] py-4 bg-brand-blue text-black font-bold rounded-2xl hover:bg-brand-green transition-colors neon-glow-blue flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    Execute Arbitrage
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

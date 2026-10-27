import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Layers, 
  Zap, 
  Calendar,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function Analytics({ alerts, rules, groups }) {
  // Timeline Data
  const trendData = [
    { time: '04:00', alerts: 2, critical: 0 },
    { time: '08:00', alerts: 5, critical: 1 },
    { time: '12:00', alerts: 14, critical: 3 },
    { time: '16:00', alerts: 9, critical: 2 },
    { time: '20:00', alerts: 6, critical: 1 },
    { time: 'Now', alerts: alerts.length, critical: alerts.filter(a => a.priority === 'CRITICAL').length },
  ];

  // Priority Distribution Data
  const priorityCounts = {
    CRITICAL: alerts.filter(a => a.priority === 'CRITICAL').length,
    HIGH: alerts.filter(a => a.priority === 'HIGH').length,
    MEDIUM: alerts.filter(a => a.priority === 'MEDIUM').length,
    LOW: alerts.filter(a => a.priority === 'LOW').length,
  };

  const priorityPieData = [
    { name: 'Critical', value: priorityCounts.CRITICAL || 1, color: '#ef4444' },
    { name: 'High', value: priorityCounts.HIGH || 2, color: '#f59e0b' },
    { name: 'Medium', value: priorityCounts.MEDIUM || 2, color: '#3b82f6' },
    { name: 'Low', value: priorityCounts.LOW || 1, color: '#8b5cf6' },
  ];

  // Top Keywords Bar Chart Data
  const keywordHits = {};
  alerts.forEach(a => {
    (a.matchedKeywords || []).forEach(kw => {
      keywordHits[kw] = (keywordHits[kw] || 0) + 1;
    });
  });

  const keywordBarData = Object.entries(keywordHits).map(([kw, count]) => ({
    keyword: kw,
    count
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  if (keywordBarData.length === 0) {
    keywordBarData.push(
      { keyword: 'pricing', count: 8 },
      { keyword: 'quote', count: 6 },
      { keyword: 'security leak', count: 4 },
      { keyword: 'hiring CTO', count: 3 }
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" /> Keyword Intelligence & Social Trends
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time analytics on prescribed keyword frequency, priority distributions, and high-activity WhatsApp groups.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300">
          <Calendar className="w-4 h-4 text-emerald-400" /> Timeframe: Last 24 Hours
        </div>
      </div>

      {/* Grid 1: Area Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Keyword Match Frequency Timeline (8 cols) */}
        <div className="lg:col-span-8 glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Alert Trigger Volume Timeline
            </h4>
            <span className="text-xs text-emerald-400 font-mono font-semibold">+18% vs yesterday</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="alerts" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#alertGrad)" name="Total Alerts" />
                <Area type="monotone" dataKey="critical" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#critGrad)" name="Critical Alerts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart (4 cols) */}
        <div className="lg:col-span-4 glass-panel p-5 space-y-3 flex flex-col justify-between">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-amber-400" /> Priority Distribution
          </h4>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-3">
            {priorityPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400">{item.name}:</span>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid 2: Top Keyword Frequency Bar Chart */}
      <div className="glass-panel p-5 space-y-3">
        <h4 className="font-bold text-white text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" /> Most Frequently Triggered Prescribed Keywords
        </h4>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={keywordBarData}>
              <XAxis dataKey="keyword" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} name="Trigger Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

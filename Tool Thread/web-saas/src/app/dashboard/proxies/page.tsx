"use client";

import { CheckCircle2, AlertTriangle, Network, RefreshCw, Plus, Search, Filter, MoreVertical, MoreHorizontal } from "lucide-react";

export default function ProxiesPage() {
  const tableData = [
    {
      id: "FarmBot_Alpha_01",
      avatar: "A1",
      avatarColor: "bg-black text-white",
      ip: "192.168.1.105:8080",
      status: "ONLINE",
      statusColor: "bg-green-50 text-green-700 border-green-200",
      uptime: "42h 15m"
    },
    {
      id: "Gatherer_Beta_12",
      avatar: "B2",
      avatarColor: "bg-red-100 text-red-600",
      ip: "10.0.0.42:3128",
      status: "RATE LIMITED",
      statusColor: "bg-red-50 text-red-600 border-red-100",
      uptime: "--"
    },
    {
      id: "Trader_Gamma_05",
      avatar: "C3",
      avatarColor: "bg-zinc-200 text-zinc-600",
      ip: "172.16.254.1:1080",
      status: "OFFLINE",
      statusColor: "bg-zinc-200/50 text-zinc-600 border-zinc-200",
      uptime: "Last seen 2h ago"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-xl">
          <h2 className="text-4xl md:text-[2.75rem] font-bold tracking-tight text-black leading-[1.1] mb-4">
            Proxy & Account<br/>Management
          </h2>
          <p className="text-zinc-600 text-[15px] leading-relaxed">
            Monitor connected accounts, manage rotation schedules, and ensure optimal connection health across your bot network.
          </p>
        </div>
        
        <div className="flex items-center gap-3 pb-2">
          <button className="bg-white border border-zinc-200 text-zinc-900 font-bold text-[11px] uppercase tracking-wider px-5 py-3.5 rounded-full flex items-center gap-2 hover:bg-zinc-50 transition-colors shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rotate Proxies</span>
          </button>
          <button className="bg-black text-white font-bold text-[11px] uppercase tracking-wider px-6 py-3.5 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-md">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Card 1: Active Accounts */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Active Accounts</span>
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-3">
            <h3 className="text-[4rem] leading-none font-semibold text-black tracking-tighter">1,204</h3>
          </div>
          <div className="text-[13px] text-zinc-500 font-medium">
            <span className="text-green-600 font-bold">+12%</span> vs last week
          </div>
        </div>

        {/* Card 2: Proxy Health */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Proxy Health</span>
            <div className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mb-3 flex items-baseline gap-1">
            <h3 className="text-[4rem] leading-none font-semibold text-black tracking-tighter">94</h3>
            <span className="text-2xl font-bold text-black">%</span>
          </div>
          <div className="text-[13px] text-zinc-600 font-medium">
            12 proxies rate limited
          </div>
        </div>

        {/* Card 3: Network Load */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Network Load</span>
            <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center">
              <Network className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mb-3 flex items-baseline gap-2">
            <h3 className="text-[4rem] leading-none font-semibold text-black tracking-tighter">3.2</h3>
            <span className="text-xl font-bold text-black">GB/s</span>
          </div>
          <div className="text-[13px] text-zinc-600 font-medium">
            Optimal throughput
          </div>
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[2rem] p-4 md:p-8 shadow-sm shadow-zinc-200/50">
        
        {/* Table Top Bar */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search accounts or IPs..." 
              className="w-full bg-zinc-50 border-none rounded-full py-3 pl-11 pr-4 text-[13px] font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="text-zinc-500 hover:text-black transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="text-zinc-500 hover:text-black transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="pb-4 px-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100 w-1/3">Account ID</th>
                <th className="pb-4 px-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100">Proxy IP</th>
                <th className="pb-4 px-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100">Status</th>
                <th className="pb-4 px-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100">Uptime</th>
                <th className="pb-4 px-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index} className="group border-b border-zinc-50 last:border-0">
                  <td className="py-5 px-4 flex items-center gap-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${row.avatarColor}`}>
                      {row.avatar}
                    </div>
                    <span className="font-semibold text-[13px] text-zinc-900">{row.id}</span>
                  </td>
                  <td className="py-5 px-4 text-[13px] font-medium text-zinc-600 font-mono tracking-tight">{row.ip}</td>
                  <td className="py-5 px-4">
                    <span className={`inline-flex items-center border px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-5 px-4 text-[13px] font-medium text-zinc-600">{row.uptime}</td>
                  <td className="py-5 px-4 text-right">
                    <button className="text-zinc-400 hover:text-black transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

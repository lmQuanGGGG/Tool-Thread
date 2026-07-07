"use client";

import { Calendar, Download, Banknote, Bot, Eye, TrendingUp, Minus, ArrowUpRight } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 leading-tight mb-2">Performance<br/>Overview</h2>
          <p className="text-zinc-500 text-sm md:text-base max-w-sm leading-relaxed">
            Deep dive into revenue and bot efficiency across all networks.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-white border border-zinc-200 text-zinc-900 font-medium text-xs px-4 py-3 rounded-full flex items-center gap-2 hover:bg-zinc-50 transition-colors shadow-sm">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span>Last 30 Days</span>
          </button>
          <button className="bg-[#232325] text-white font-medium text-xs px-5 py-3 rounded-full flex items-center gap-2 hover:bg-black transition-colors shadow-md">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Revenue */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Revenue</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-[3.5rem] leading-none font-medium text-zinc-900 tracking-tight">$142.8K</h3>
          </div>
          <div className="flex items-center gap-1.5 text-blue-500 text-xs font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>+24.5% vs last month</span>
          </div>
        </div>

        {/* Card 2: Reels Posted */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Reels Posted</span>
            <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-[3.5rem] leading-none font-medium text-zinc-900 tracking-tight">4,208</h3>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-900 text-xs font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            <span>+12.2% efficiency</span>
          </div>
        </div>

        {/* Card 3: Threads Commented */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Threads Commented</span>
            <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-[3.5rem] leading-none font-medium text-zinc-900 tracking-tight">8.4M</h3>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
            <Minus className="w-4 h-4" />
            <span>Steady velocity</span>
          </div>
        </div>

      </div>

      {/* Main Chart Area */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow relative overflow-hidden h-[450px] flex flex-col">
        
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Revenue vs Performance</h3>
          
          <div className="flex items-center bg-zinc-100 p-1 rounded-full">
            <button className="bg-white text-zinc-900 text-xs font-bold px-5 py-2 rounded-full shadow-sm">
              Revenue
            </button>
            <button className="text-zinc-400 hover:text-zinc-600 text-xs font-bold px-5 py-2 rounded-full transition-colors">
              Views
            </button>
          </div>
        </div>

        {/* SVG Chart Graphic */}
        <div className="flex-1 w-full relative">
          {/* Horizontal Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pt-10 pb-4">
            <div className="border-t border-zinc-100 w-full"></div>
            <div className="border-t border-zinc-100 w-full"></div>
            <div className="border-t border-zinc-100 w-full"></div>
            <div className="border-t border-zinc-100 w-full"></div>
          </div>

          {/* SVG Area Chart */}
          <svg viewBox="0 0 1000 300" className="w-full h-full absolute inset-0 preserve-3d" preserveAspectRatio="none">
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            
            {/* The Area Fill */}
            <path 
              d="M 0 300 L 0 280 Q 250 250 450 210 T 800 90 L 1000 20 L 1000 300 Z" 
              fill="url(#blueGradient)" 
            />
            {/* The Stroke Line */}
            <path 
              d="M 0 280 Q 250 250 450 210 T 800 90 L 1000 20" 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="2.5" 
            />
          </svg>

          {/* HTML Tooltips overlaid on top of SVG */}
          {/* Tooltip 1: $62.4K */}
          <div className="absolute left-[45%] top-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="bg-[#232325] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg mb-2 shadow-md relative">
              $62.4K
              {/* Tooltip arrow down */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#232325] rotate-45"></div>
            </div>
            {/* Circle dot on line */}
            <div className="w-4 h-4 bg-white border-[3px] border-blue-500 rounded-full shadow-sm"></div>
          </div>

          {/* Tooltip 2: $118.2K */}
          <div className="absolute left-[80%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg mb-2 shadow-md relative">
              $118.2K
              {/* Tooltip arrow down */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rotate-45"></div>
            </div>
            {/* Circle dot on line */}
            <div className="w-4 h-4 bg-white border-[3px] border-blue-500 rounded-full shadow-sm"></div>
          </div>

        </div>

      </div>

    </div>
  );
}

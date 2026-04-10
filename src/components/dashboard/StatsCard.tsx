import { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: number
  icon: ReactNode
}

export function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <div className="group relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1">
      {/* Decorative gradient blob */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
      
      <div className="relative flex items-center justify-between z-10">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-600">
            {value}
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl text-blue-600 shadow-sm border border-blue-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          {icon}
        </div>
      </div>
    </div>
  )
}

'use client';

export default function StatCard({ icon: Icon, label, value, subtext, color = 'brand' }) {
  const colorMap = {
    brand: {
      bg: 'bg-brand-50',
      icon: 'text-brand-500',
      value: 'text-brand-700',
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-500',
      value: 'text-emerald-700',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-500',
      value: 'text-amber-700',
    },
    violet: {
      bg: 'bg-violet-50',
      icon: 'text-violet-500',
      value: 'text-violet-700',
    },
  };

  const colors = colorMap[color] || colorMap.brand;

  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${colors.value} tracking-tight`}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-surface-400 mt-1">{subtext}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${colors.bg} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}

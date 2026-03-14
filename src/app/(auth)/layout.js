import { Zap } from 'lucide-react';

export const metadata = {
  title: 'Authentication',
};

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-surface-900 via-surface-800 to-brand-950">
        {/* Abstract pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-brand-400 rounded-full" />
          <div className="absolute top-40 left-40 w-96 h-96 border border-brand-400/50 rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-brand-400/30 rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-brand-500/20 rounded-2xl rotate-45" />
          <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-brand-400/10 rounded-xl rotate-12" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              PageAmpHTML
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Deploy static pages
              <br />
              <span className="text-brand-400">in seconds.</span>
            </h1>
            <p className="text-surface-400 text-lg leading-relaxed">
              Upload HTML files, get instant subdomains. No configuration needed.
              Simple hosting for landing pages, portfolios, and projects.
            </p>
          </div>

          <div className="flex items-center gap-6 text-surface-500 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Instant deploy
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              Custom subdomains
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              ZIP support
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

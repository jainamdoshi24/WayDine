import { MapPin, LayoutDashboard, Bookmark, Menu, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  savedCount?: number;
  onOpenSaved?: () => void;
  onOpenDemo?: () => void;
}

export function Header({ savedCount = 0, onOpenSaved, onOpenDemo }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 text-[#1a2540] select-none">
            <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Way<span className="text-[#2563eb]">Dine</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink icon={<LayoutDashboard className="h-4 w-4" />} active>Explore</NavLink>
            <button
              onClick={onOpenSaved}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
              )}
            >
              <Bookmark className="h-4 w-4" />
              Saved Stops
              {savedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#2563eb] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {savedCount > 9 ? '9+' : savedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onOpenDemo}
              className="flex items-center gap-1.5 text-sm font-medium text-[#2563eb] border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 rounded-lg hover:bg-[#dbeafe] transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Demo
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          <MobileNavLink active>Explore</MobileNavLink>
          <button
            onClick={() => { setMobileOpen(false); onOpenSaved?.(); }}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Bookmark className="h-4 w-4" />
            Saved Stops
            {savedCount > 0 && (
              <span className="ml-auto w-5 h-5 bg-[#2563eb] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { setMobileOpen(false); onOpenDemo?.(); }}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#2563eb] hover:bg-[#eff6ff] transition-colors"
          >
            <Zap className="h-4 w-4" />
            Try Demo
          </button>
        </div>
      )}
    </header>
  );
}

function NavLink({ children, icon, active }: { children: React.ReactNode; icon?: React.ReactNode; active?: boolean }) {
  return (
    <a
      href="#"
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active ? 'text-[#2563eb] bg-[#eff6ff]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
      )}
    >
      {icon}
      {children}
    </a>
  );
}

function MobileNavLink({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <a
      href="#"
      className={cn(
        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active ? 'text-[#2563eb] bg-[#eff6ff]' : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      {children}
    </a>
  );
}

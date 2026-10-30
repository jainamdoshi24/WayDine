/**
 * NavBar — sticky navigation for the WayDine landing page.
 */
import { useState, useEffect } from 'react';
import { MapPin, Menu, X, Navigation2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavBarProps {
  onPlanRoute: () => void;
  onOpenDemo: () => void;
  savedCount?: number;
  onOpenSaved?: () => void;
}

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features',     href: '#features' },
  { label: 'Planner',      href: '#planner' },
  { label: 'Technology',   href: '#technology' },
];

export function NavBar({ onPlanRoute, onOpenDemo, savedCount = 0, onOpenSaved }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
      scrolled
        ? 'bg-white/95 backdrop-blur border-b border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a
            href="#"
            onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 select-none"
          >
            <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className={cn(
              'text-lg font-semibold tracking-tight transition-colors',
              scrolled ? 'text-[#1a2540]' : 'text-white'
            )}>
              Way<span className={scrolled ? 'text-[#2563eb]' : 'text-[#60a5fa]'}>Dine</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  scrolled
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2">
            {savedCount > 0 && (
              <button
                onClick={onOpenSaved}
                className={cn(
                  'relative text-sm font-medium px-3 py-1.5 rounded-lg transition-colors',
                  scrolled ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                           : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                Saved ({savedCount})
              </button>
            )}
            <button
              onClick={onOpenDemo}
              className={cn(
                'text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border',
                scrolled
                  ? 'text-[#2563eb] border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#dbeafe]'
                  : 'text-white border-white/30 bg-white/10 hover:bg-white/20'
              )}
            >
              Try Demo
            </button>
            <button
              onClick={onPlanRoute}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors shadow-sm"
            >
              <Navigation2 className="h-3.5 w-3.5" />
              Plan My Route
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className={cn(
              'md:hidden p-1.5 rounded-lg transition-colors',
              scrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white hover:bg-white/10'
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1 shadow-lg">
          {NAV_LINKS.map(link => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => { setMobileOpen(false); onOpenDemo(); }}
              className="w-full text-center text-sm font-medium px-4 py-2.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]"
            >
              Try Demo
            </button>
            <button
              onClick={() => { setMobileOpen(false); onPlanRoute(); }}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#2563eb] text-white"
            >
              <Navigation2 className="h-3.5 w-3.5" />
              Plan My Route
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

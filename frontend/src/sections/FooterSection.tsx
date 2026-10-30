/**
 * FooterSection — brand identity, section links, attribution, data limitations.
 */
import { MapPin } from 'lucide-react';

const LINKS = [
  {
    title: 'Product',
    items: [
      { label: 'How It Works',  href: '#how-it-works' },
      { label: 'Features',      href: '#features' },
      { label: 'Planner',       href: '#planner' },
      { label: 'Scenarios',     href: '#scenarios' },
    ],
  },
  {
    title: 'Technology',
    items: [
      { label: 'Architecture',  href: '#technology' },
      { label: 'Rule Engine',   href: '#demo' },
      { label: 'Detour Wallet', href: '#features' },
    ],
  },
];

export function FooterSection() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0d1421] text-white/60 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/8">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white text-lg font-semibold tracking-tight">
                Way<span className="text-[#60a5fa]">Dine</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs mb-5">
              Route-based highway restaurant recommendations using deterministic algorithms,
              real road routing, and transparent rule-based logic. No AI. No guesses.
            </p>
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-medium text-white/40 uppercase tracking-widest text-[10px]">Technology stack</span>
              <span>React 19 + TypeScript + Vite · Express.js backend</span>
              <span>OSRM routing · OpenStreetMap / Nominatim · Haversine geometry</span>
              <span>Deterministic rule engine · No AI/ML models</span>
            </div>
          </div>

          {/* Nav links */}
          {LINKS.map(section => (
            <div key={section.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.items.map(item => (
                  <li key={item.label}>
                    <button
                      onClick={() => scrollTo(item.href)}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>
            Road data ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white transition-colors"
            >
              OpenStreetMap contributors
            </a>{' '}
            · Routing by{' '}
            <a
              href="http://project-osrm.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white transition-colors"
            >
              OSRM
            </a>{' '}
            (ODbL)
          </span>
          <span className="text-white/30">
            Demo data only — restaurant information is synthetic and for demonstration purposes.
          </span>
        </div>
      </div>
    </footer>
  );
}

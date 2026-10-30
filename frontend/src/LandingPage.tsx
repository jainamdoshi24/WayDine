/**
 * LandingPage — root orchestrator for the WayDine scrollable landing page.
 * Assembles all 10 sections and shared state.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { NavBar }                from '@/sections/NavBar';
import { HeroSection }           from '@/sections/HeroSection';
import { HowItWorksSection }     from '@/sections/HowItWorksSection';
import { FeatureShowcaseSection } from '@/sections/FeatureShowcaseSection';
import { SmartPlannerSection }   from '@/sections/SmartPlannerSection';
import { RejectionDemoSection }  from '@/sections/RejectionDemoSection';
import { TechnologySection }     from '@/sections/TechnologySection';
import { ScenariosSection }      from '@/sections/ScenariosSection';
import { CtaSection }            from '@/sections/CtaSection';
import { FooterSection }         from '@/sections/FooterSection';
import { DemoModal, DemoScenario } from '@/components/demo/DemoModal';
import { SavedStopsDrawer }      from '@/components/saved/SavedStopsDrawer';
import { useSavedStops }         from '@/hooks/useSavedStops';

// ── Scroll-progress bar ────────────────────────────────────────────────────────
function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total    = document.body.scrollHeight - window.innerHeight;
      setPct(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 pointer-events-none">
      <div
        className="h-full bg-[#2563eb] transition-all duration-75"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Back-to-top button ─────────────────────────────────────────────────────────
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-[#1a2540] text-white shadow-lg hover:bg-[#2563eb] transition-all flex items-center justify-center text-lg"
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const plannerRef = useRef<HTMLDivElement>(null);
  const [heroSource, setHeroSource] = useState('');
  const [heroDest, setHeroDest]     = useState('');
  const [demoOpen, setDemoOpen]     = useState(false);
  const [savedOpen, setSavedOpen]   = useState(false);

  const { savedStops, toggleSave, clearAll } = useSavedStops();

  const scrollToPlanner = useCallback(() => {
    const el = document.querySelector('#planner');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleHeroSearch = useCallback((src: string, dst: string) => {
    setHeroSource(src);
    setHeroDest(dst);
    scrollToPlanner();
  }, [scrollToPlanner]);

  const handleLoadDemo = useCallback((scenario: DemoScenario) => {
    setHeroSource(scenario.source);
    setHeroDest(scenario.destination);
    setDemoOpen(false);
    scrollToPlanner();
  }, [scrollToPlanner]);

  return (
    <>
      <ScrollProgress />

      {/* Sticky navbar */}
      <NavBar
        onPlanRoute={scrollToPlanner}
        onOpenDemo={() => setDemoOpen(true)}
        savedCount={savedStops.length}
        onOpenSaved={() => setSavedOpen(true)}
      />

      {/* ── Sections ─────────────────────────────────────────────────── */}
      <main>
        <HeroSection onSearch={handleHeroSearch} />
        <HowItWorksSection />
        <FeatureShowcaseSection />
        <SmartPlannerSection
          plannerRef={plannerRef}
          initialSource={heroSource}
          initialDest={heroDest}
        />
        <RejectionDemoSection />
        <TechnologySection />
        <ScenariosSection />
        <CtaSection onPlanRoute={scrollToPlanner} />
      </main>

      <FooterSection />

      {/* ── Overlays ──────────────────────────────────────────────────── */}
      <DemoModal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        onLoadScenario={handleLoadDemo}
      />

      <SavedStopsDrawer
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        savedStops={savedStops}
        onClearAll={clearAll}
        onRemove={(id) => {
          const stop = savedStops.find(s => s.restaurant.id === id);
          if (stop) toggleSave(stop.restaurant);
        }}
      />

      <BackToTop />
    </>
  );
}

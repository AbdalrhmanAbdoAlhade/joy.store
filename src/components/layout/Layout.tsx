import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Header } from './Header';
import { Footer } from './Footer';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * App shell: sticky header, page outlet, footer.
 *
 * Two motion rules run here (per the interface-polish guidance):
 *  - **Skip animation on first paint** — the very first view renders as-is,
 *    because animating content the user has not asked for yet only delays it.
 *  - **Scroll to top + fade on navigation** — every route change returns the
 *    viewport to the top and plays a short, interruptible entrance.
 */
export function Layout() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isFirstRender = useRef(true);
  const mainRef = useRef<HTMLElement>(null);

  // Return to the top on every navigation, preserving history behaviour.
  useEffect(() => {
    if (isFirstRender.current) return;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.search]);

  useGSAP(
    () => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!mainRef.current) return;

      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: navigationType === 'POP' ? -10 : 14 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'opacity,transform' },
      );
    },
    { dependencies: [location.pathname, location.search, navigationType] },
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link hit-target rounded-full bg-joy-ink px-4 py-2 text-sm font-bold text-white">
        تخطَّ إلى المحتوى
      </a>

      <Header />

      <main id="main" ref={mainRef} className="flex-1 pb-16">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

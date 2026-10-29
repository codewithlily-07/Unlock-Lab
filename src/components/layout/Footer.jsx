import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Cpu,
  RefreshCw,
  Play,
  Sparkles,
  Heart,
  Building,
  Activity,
  CheckCircle2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';
import './Footer.css';

export function Footer() {
  const { showToast } = useNotifications();
  const [inView, setInView] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const footerRef = useRef(null);
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  // IntersectionObserver for entrance stagger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.08 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  // Ambient Quantum Node Network Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize 30 interactive campus node particles
    const particleCount = Math.min(35, Math.max(16, Math.floor(width / 38)));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1.2,
      baseAlpha: Math.random() * 0.35 + 0.2,
      isGold: Math.random() > 0.65,
      pulse: Math.random() * Math.PI * 2
    }));

    let isVisible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );
    io.observe(canvas);

    const render = (time) => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

        const mouse = mouseRef.current;
        const maxDist = 110;

        // Update & Draw Particles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.pulse += 0.02;

          // Wrap edges
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          // Mouse magnetic pull
          if (mouse.active) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 140 && dist > 1) {
              p.x += (dx / dist) * 0.6;
              p.y += (dy / dist) * 0.6;
            }
          }

          // Draw node
          const alpha = p.baseAlpha + Math.sin(p.pulse) * 0.15;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.isGold
            ? `rgba(243, 166, 107, ${alpha})`
            : `rgba(142, 196, 175, ${alpha})`;
          ctx.fill();

          // Connect nearby nodes
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.hypot(dx, dy);
            if (dist < maxDist) {
              const lineAlpha = (1 - dist / maxDist) * 0.18;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = p.isGold || p2.isGold
                ? `rgba(216, 190, 114, ${lineAlpha})`
                : `rgba(18, 107, 79, ${lineAlpha * 1.5})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      io.disconnect();
    };
  }, []);

  function handleMouseMove(e) {
    if (!footerRef.current) return;
    const rect = footerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true
    };
  }

  function handleMouseLeave() {
    mouseRef.current.active = false;
  }

  function handleResetDemo() {
    if (window.confirm('Reset all demo data back to clean factory state?')) {
      setIsResetting(true);
      api.resetDemoData();
      showToast('Demo data reset to clean seed state.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    }
  }

  function handleReplayIntro() {
    try {
      sessionStorage.removeItem('hasSeenUnlockLabIntro');
    } catch (e) {}
    window.location.href = '/';
  }

  return (
    <footer
      ref={footerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative bg-[#103C2D] text-[#C9D9C7] text-xs border-t border-[#1B5240] pt-14 pb-10 mt-auto overflow-hidden select-none"
    >
      {/* 1. Animated Top Fiber Optic Traveling Beam */}
      <div className="footer-light-beam" aria-hidden="true" />

      {/* 2. Interactive Quantum Lab Node Canvas */}
      <canvas ref={canvasRef} className="footer-particle-canvas" aria-hidden="true" />

      {/* 3. Subtle Ambient Radial Glow */}
      <div
        className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#126B4F]/25 rounded-full blur-3xl pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 right-0 w-80 h-80 bg-[#F3A66B]/10 rounded-full blur-3xl pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 space-y-10">
        {/* 4 Staggered 3D Hologram Column Pods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pod 1: Brand & Institutional Identity */}
          <div
            className={`footer-column-pod transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              inView ? 'footer-pod-visible' : 'footer-pod-hidden'
            }`}
            style={{ transitionDelay: '0ms' }}
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-white font-extrabold text-base group cursor-pointer">
                <div className="footer-logo-emblem w-10 h-10 rounded-xl bg-[#1B5240] border border-[#F3A66B]/60 flex items-center justify-center text-sm text-[#F3A66B] shadow-md">
                  <div className="footer-logo-ring" aria-hidden="true" />
                  <svg
                    className="w-5 h-5 text-[#F3A66B] transition-transform duration-500 group-hover:rotate-12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                </div>
                <div>
                  <span className="font-sans font-bold text-lg tracking-tight block text-[#F7F1E7]">
                    UnlockLab
                  </span>
                  <span className="text-[10px] font-bold text-[#F3A66B] tracking-wider uppercase block">
                    Institutional Network
                  </span>
                </div>
              </div>

              <p className="text-[#C7D9C4]/80 text-[11px] leading-relaxed">
                Institutional Equipment &amp; Space Sharing Platform for Electronics and Communication Engineering labs.
              </p>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-[#F3A66B]">
                <Sparkles className="w-3 h-3 text-[#F3A66B] animate-pulse" />
                <span>Zero Friction · 100% Custody</span>
              </div>
            </div>
          </div>

          {/* Pod 2: Navigation & Transparency */}
          <div
            className={`footer-column-pod transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              inView ? 'footer-pod-visible' : 'footer-pod-hidden'
            }`}
            style={{ transitionDelay: '120ms' }}
          >
            <h4 className="text-[#F7F1E7] font-bold mb-3.5 uppercase tracking-wider text-[11px] font-sans flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#F3A66B]" />
              <span>Campus Navigation</span>
            </h4>
            <ul className="space-y-2.5 text-[#C9D9C7]/85 text-[11px]">
              <li>
                <Link to="/campuses" className="footer-link-item">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-[#F3A66B] opacity-70" />
                  <span>Campus Facilities &amp; Labs</span>
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="footer-link-item">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-[#F3A66B] opacity-70" />
                  <span>My Active Reservations</span>
                </Link>
              </li>
              <li>
                <Link to="/how-allocation-works" className="footer-link-item">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-[#F3A66B] opacity-70" />
                  <span>How Fair Allocation Works</span>
                </Link>
              </li>
              <li>
                <Link to="/credentials" className="footer-link-item">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-[#F3A66B] opacity-70" />
                  <span>Safety Compliance &amp; Badges</span>
                </Link>
              </li>
              <li>
                <span className="text-[#C9D9C7]/50 inline-flex items-center gap-1.5 pt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-[#126B4F]" />
                  <span>Append-Only Audit Trail</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Pod 3: Hackathon Cinematic Experience */}
          <div
            className={`footer-column-pod transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              inView ? 'footer-pod-visible' : 'footer-pod-hidden'
            }`}
            style={{ transitionDelay: '240ms' }}
          >
            <h4 className="text-[#F7F1E7] font-bold mb-3.5 uppercase tracking-wider text-[11px] font-sans flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F3A66B]" />
              <span>Cinematic Experience</span>
            </h4>
            <p className="text-[11px] text-[#C9D9C7]/80 leading-relaxed mb-4">
              Experience the 5-phase WebGL LightTunnel, assembling 3D resource blocks, and refractive Prism brand reveal.
            </p>
            <button
              onClick={handleReplayIntro}
              className="footer-shimmer-btn w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#1B5240] hover:bg-[#154636] text-[#F7F1E7] border border-[#F3A66B]/50 text-[11px] font-bold shadow-md hover:border-[#F3A66B]"
            >
              <div className="w-2 h-2 rounded-full bg-[#F3A66B] animate-ping" />
              <Play className="w-3.5 h-3.5 text-[#F3A66B] fill-[#F3A66B]" />
              <span>Replay Cinematic Intro</span>
            </button>
          </div>

          {/* Pod 4: Judge Testing Controls */}
          <div
            className={`footer-column-pod transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              inView ? 'footer-pod-visible' : 'footer-pod-hidden'
            }`}
            style={{ transitionDelay: '360ms' }}
          >
            <h4 className="text-[#F7F1E7] font-bold mb-3.5 uppercase tracking-wider text-[11px] font-sans flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F3A66B]" />
              <span>Judge Testing Controls</span>
            </h4>
            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="footer-shimmer-btn w-full px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#F7F1E7] border border-white/20 flex items-center justify-center gap-2 text-[11px] font-bold shadow-sm hover:border-[#F3A66B] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#F3A66B] ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting Demo...' : 'Reset Demo Seed Baseline'}</span>
            </button>
            <p className="text-[10px] text-[#C9D9C7]/65 mt-2.5 leading-relaxed">
              Cleans 10 lab resources, 6 bookings, incident disputes, and 8 personas back to factory hackathon state.
            </p>
          </div>
        </div>

        {/* 5. Live Campus Network Telemetry Capsule */}
        <div className="footer-telemetry-bar flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#C9D9C7]">
          <div className="flex items-center space-x-2">
            <span className="footer-beacon-pulse w-2.5 h-2.5 rounded-full bg-[#126B4F]" />
            <span className="font-bold text-[#F7F1E7]">Campus Telemetry Grid Online</span>
            <span className="text-[#C9D9C7]/40 hidden sm:inline">&middot;</span>
            <span className="text-[#C9D9C7]/75 hidden sm:inline">10 Lab Stations Synced</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[10px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              <Activity className="w-3 h-3 text-[#F3A66B]" />
              <span>Latency: 0.8ms</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              <ShieldCheck className="w-3 h-3 text-[#8EC4AF]" />
              <span>Audit Chain: Tamper-Proof</span>
            </span>
          </div>
        </div>

        {/* 6. Bottom Copyright & Credits */}
        <div className="pt-4 border-t border-[#1B5240]/60 flex flex-col sm:flex-row items-center justify-between text-[#C9D9C7]/65 text-[11px] gap-2">
          <div>
            UnlockLab &middot; 48-Hour Hackathon &middot; Built with React 18, Tailwind, WebGL &amp; Supabase
          </div>
          <div className="flex items-center gap-1 text-[#F7F1E7]/90 font-medium">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-[#F3A66B] fill-[#F3A66B] animate-pulse mx-0.5" />
            <span>for Academic Excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

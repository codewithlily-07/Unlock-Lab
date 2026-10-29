import React, { useState, useEffect } from 'react';
import { LightTunnel } from '../effects/LightTunnel';
import { Prism } from '../effects/Prism';
import { ResourceBlock } from './ResourceBlock';
import {
  Cpu,
  BookOpen,
  FlaskConical,
  Trophy,
  Users,
  Wrench,
} from 'lucide-react';
import './UnlockLabIntro.css';

// Coordinated intro animation stages:
// LIGHTTUNNEL_OPEN (0.0s–1.8s) -> LIGHTTUNNEL_FADE_OUT (1.8s–2.3s) -> BLOCKS_ASSEMBLE (2.3s–4.5s)
// -> PRISM (4.5s–6.0s) -> BRAND_REVEAL (6.0s–7.0s) -> LANDING_PAGE (7.0s–8.0s)
export const INTRO_STAGES = {
  LIGHTTUNNEL_OPEN: 'LIGHTTUNNEL_OPEN',
  LIGHTTUNNEL_FADE_OUT: 'LIGHTTUNNEL_FADE_OUT',
  BLOCKS_ASSEMBLE: 'BLOCKS_ASSEMBLE',
  PRISM: 'PRISM',
  BRAND_REVEAL: 'BRAND_REVEAL',
  LANDING_PAGE: 'LANDING_PAGE',
};

// 3D Block coordinates for symmetric interlocking central structure (UNMODIFIED)
const INTRO_BLOCKS = [
  { id: 1, variant: 'emerald', size: 56, targetX: -65, targetY: -45, targetZ: 20,  delay: 0.08 },
  { id: 2, variant: 'gold',    size: 48, targetX: 65,  targetY: -45, targetZ: 10,  delay: 0.14 },
  { id: 3, variant: 'cream',   size: 52, targetX: -70, targetY: 45,  targetZ: -10, delay: 0.20 },
  { id: 4, variant: 'glass',   size: 50, targetX: 65,  targetY: 45,  targetZ: 15,  delay: 0.11 },
  { id: 5, variant: 'emerald', size: 44, targetX: 0,   targetY: -80, targetZ: -20, delay: 0.17 },
  { id: 6, variant: 'gold',    size: 44, targetX: 0,   targetY: 80,  targetZ: 25,  delay: 0.25 },
  { id: 7, variant: 'glass',   size: 46, targetX: -92, targetY: 0,   targetZ: 15,  delay: 0.22 },
  { id: 8, variant: 'cream',   size: 46, targetX: 92,  targetY: 0,   targetZ: -15, delay: 0.24 },
];

// Orbiting Resource category icons (UNMODIFIED)
const ORBIT_ICONS = [
  { icon: Cpu,          label: 'Electronics', x: -145, y: -75,  delay: 0.1 },
  { icon: BookOpen,     label: 'Books',       x: 145,  y: -75,  delay: 0.2 },
  { icon: FlaskConical, label: 'Lab Gear',    x: -165, y: 55,   delay: 0.3 },
  { icon: Trophy,       label: 'Sports',      x: 165,  y: 55,   delay: 0.4 },
  { icon: Users,        label: 'Community',   x: 0,    y: -155, delay: 0.15 },
  { icon: Wrench,       label: 'Tools',       x: 0,    y: 155,  delay: 0.35 },
];

export function UnlockLabIntro({ onComplete }) {
  // STRICT SEQUENTIAL TIMELINE:
  // 0.0s–0.2s: Cream background appears and LightTunnel starts immediately.
  // 0.2s–1.8s: LightTunnel expands and displays visible moving fibres and light pulses. No blocks visible yet.
  // 1.8s–2.3s: LightTunnel smoothly fades away. Blocks have NOT started rising.
  // 2.3s–4.5s: Original blocks rise from below (2.3s) and assemble (3.4s) into existing central structure.
  // 4.5s–6.0s: Existing Prism effect highlights assembled structure.
  // 6.0s–7.0s: Reveal existing UnlockLab logo and tagline.
  // 7.0s–8.0s: Transition into functioning landing page.
  const [stage, setStage] = useState(INTRO_STAGES.LIGHTTUNNEL_OPEN);
  const [blocksEmerging, setBlocksEmerging] = useState(false);
  const [blocksAssembled, setBlocksAssembled] = useState(false);
  const [showTunnel, setShowTunnel] = useState(true);

  const tunnelFading = stage === INTRO_STAGES.LIGHTTUNNEL_FADE_OUT;
  const showBlocks = stage === INTRO_STAGES.BLOCKS_ASSEMBLE || stage === INTRO_STAGES.PRISM || stage === INTRO_STAGES.BRAND_REVEAL || stage === INTRO_STAGES.LANDING_PAGE;
  const showPrism = stage === INTRO_STAGES.PRISM || stage === INTRO_STAGES.BRAND_REVEAL || stage === INTRO_STAGES.LANDING_PAGE;
  const showBrand = stage === INTRO_STAGES.BRAND_REVEAL || stage === INTRO_STAGES.LANDING_PAGE;
  const fadingOut = stage === INTRO_STAGES.LANDING_PAGE;

  useEffect(() => {
    // Respect reduced motion
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReduced) {
      handleSkip();
      return;
    }

    // Step 2: 1.8s - LightTunnel smoothly fades away (1.8s - 2.3s)
    const tTunnelFade = setTimeout(() => {
      setStage(INTRO_STAGES.LIGHTTUNNEL_FADE_OUT);
    }, 1800);

    // Step 3a: 2.3s - LightTunnel finished fading out; unmount tunnel and trigger block rise
    const tBlocksRise = setTimeout(() => {
      setShowTunnel(false);
      setStage(INTRO_STAGES.BLOCKS_ASSEMBLE);
      setBlocksEmerging(true);
    }, 2300);

    // Step 3b: 3.4s - Blocks assemble into central interlocking structure
    const tBlocksAssemble = setTimeout(() => {
      setBlocksAssembled(true);
    }, 3400);

    // Step 4: 4.5s - Existing Prism effect highlights assembled structure (4.5s - 6.0s)
    const tPrism = setTimeout(() => {
      setStage(INTRO_STAGES.PRISM);
    }, 4500);

    // Step 5: 6.0s - Reveal UnlockLab logo and tagline (6.0s - 7.0s)
    const tBrand = setTimeout(() => {
      setStage(INTRO_STAGES.BRAND_REVEAL);
    }, 6000);

    // Step 6: 7.0s - Smooth fade-out into live landing page (7.0s - 8.0s)
    const tLandingPage = setTimeout(() => {
      setStage(INTRO_STAGES.LANDING_PAGE);
    }, 7000);

    // 8.0s: Intro complete
    const tComplete = setTimeout(() => {
      try {
        sessionStorage.setItem('hasSeenUnlockLabIntro', 'true');
      } catch (e) {
        // Safe storage check
      }
      if (onComplete) onComplete();
    }, 8000);

    return () => {
      clearTimeout(tTunnelFade);
      clearTimeout(tBlocksRise);
      clearTimeout(tBlocksAssemble);
      clearTimeout(tPrism);
      clearTimeout(tBrand);
      clearTimeout(tLandingPage);
      clearTimeout(tComplete);
    };
  }, []);

  function handleSkip() {
    setStage(INTRO_STAGES.LANDING_PAGE);
    try {
      sessionStorage.setItem('hasSeenUnlockLabIntro', 'true');
    } catch (e) {}
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 350);
  }

  return (
    <div className={`intro-container ${fadingOut ? 'intro-fading' : ''}`}>
      {/* Light Warm Ivory Background (#FAF9F4) */}
      <div className="intro-background" />

      {/* Skip Intro Button */}
      <button
        onClick={handleSkip}
        className="intro-skip-btn"
        aria-label="Skip introduction animation"
      >
        Skip Intro &rarr;
      </button>

      {/* 1. FIRST: React Bits LightTunnel (Starts at 0s, expands 0.2s-1.8s, fades 1.8s-2.3s) */}
      {showTunnel && (
        <div className={`intro-light-layer ${tunnelFading ? 'is-fading' : ''}`}>
          <LightTunnel
            cableColor="#8FBFA9"
            pulseColor="#D8BE72"
            tunnelColor="#B8D4B8"
            tunnelOpacity={0.3}
            speed={0.7}
            flowDirection="inward"
            pulseSpeed={2.5}
            pulseLength={0.35}
            pulseBlend={0.65}
            pulseWidth={1.2}
            pulseDensity={0.65}
            cableCount={56}
            thickness={0.4}
            rimWidth={0.2}
            waviness={0.3}
            sway={0.4}
            bend={0.4}
            size={1}
            centerX={0}
            centerY={0}
            glow={1.2}
            fadeNear={0.3}
            fadeFar={2.5}
            brightness={1.2}
            colorVariance={true}
            grain={false}
            opacity={1}
            mouseInteraction={false}
            clickSurge={false}
            intro={true}
            variation={0}
            lightMode={false}
            fadeOut={tunnelFading}
          />
        </div>
      )}

      {/* 2. SECOND: Existing 3D Resource Blocks & Central Assembly (Triggers ONLY at 2.3s after LightTunnel is gone) */}
      {showBlocks && (
        <div className="intro-blocks active">
          <div className={`intro-center-stage ${blocksAssembled ? 'floating' : ''}`}>
            {/* Central Geometric Connected Leaf Emblem */}
            <div className={`central-emblem ${blocksAssembled ? 'assembled' : ''}`}>
              <div className="emblem-pulse-ring" />
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                {/* Custom stylized UnlockLab sharing emblem */}
                <svg
                  className="w-10 h-10 text-[#D8BE72] drop-shadow-md"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
            </div>

            {/* 3D Emerging and Assembling Blocks */}
            {INTRO_BLOCKS.map((block) => (
              <ResourceBlock
                key={block.id}
                variant={block.variant}
                size={block.size}
                targetX={block.targetX}
                targetY={block.targetY}
                targetZ={block.targetZ}
                isEmerging={blocksEmerging}
                isAssembled={blocksAssembled}
                delay={block.delay}
              />
            ))}

            {/* Orbiting Resource Category Badges */}
            {ORBIT_ICONS.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className={`orbit-icon-badge ${blocksAssembled ? 'visible' : ''}`}
                  style={{
                    left: `calc(50% + ${item.x}px)`,
                    top: `calc(50% + ${item.y}px)`,
                    transform: `translate(-50%, -50%)`,
                    transitionDelay: `${item.delay}s`,
                  }}
                  title={item.label}
                >
                  <IconComponent className="w-5 h-5 text-[#073D2D]" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. THIRD: Prism light sweep layer behind structure (Activates 4.5s-6.0s) */}
      <div className={`intro-prism ${showPrism ? 'visible' : ''}`}>
        <Prism
          animationType="rotate"
          timeScale={0.35}
          height={3.5}
          baseWidth={5.5}
          scale={3.2}
          glow={1.1}
          saturation={1.4}
          colorFrequency={1}
          interactive={false}
          intro={true}
          lightMode={false}
          colors={['#8AD9D5', '#126B4F', '#D8BE72', '#8FBFA9', '#55C7C8']}
        />
      </div>

      {/* 4. FOURTH: Brand reveal text & tagline (Reveals 6.0s-7.0s) */}
      <div className={`intro-brand-reveal ${showBrand ? 'visible' : ''}`}>
        <h1 className="intro-brand-title">UnlockLab</h1>
        <p className="intro-brand-tagline">Share &middot; Borrow &middot; Collaborate &middot; Grow</p>
      </div>
    </div>
  );
}

export default UnlockLabIntro;

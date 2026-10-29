import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Layers,
  Wrench,
  Camera,
  Laptop,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  Maximize2,
  X,
  Zap,
} from 'lucide-react';

// Floating 3D objects orbiting the miniature campus laboratory building
const FLOATING_OBJECTS_DATA = [
  {
    id: 'obj-laptop',
    name: 'Lab Workstation Laptop',
    category: 'Computing',
    type: 'laptop',
    // Resting percentages within the stage
    x: 14,
    y: 18,
    depth: 0.28, // parallax amplitude
    size: 96,
    phase: 0.2, // idle float phase
    label: 'Telemetry Laptop',
    status: 'Connected',
  },
  {
    id: 'obj-fpga',
    name: 'UltraScale+ FPGA Circuit',
    category: 'Microelectronics',
    type: 'circuit',
    x: 78,
    y: 16,
    depth: 0.24,
    size: 88,
    phase: 1.8,
    label: 'Zynq FPGA Board',
    status: 'Ready',
  },
  {
    id: 'obj-camera',
    name: 'Diagnostic Thermal Camera',
    category: 'Diagnostics',
    type: 'camera',
    x: 84,
    y: 50,
    depth: 0.32,
    size: 78,
    phase: 3.1,
    label: 'Fluke IR Camera',
    status: 'Available',
  },
  {
    id: 'obj-scope',
    name: 'Tektronix 1GHz Oscilloscope',
    category: 'Instruments',
    type: 'oscilloscope',
    x: 12,
    y: 62,
    depth: 0.34,
    size: 104,
    phase: 4.4,
    label: '1GHz MSO Scope',
    status: 'Active',
  },
  {
    id: 'obj-solder',
    name: 'Precision SMD Soldering Tool',
    category: 'Fabrication',
    type: 'solder',
    x: 74,
    y: 80,
    depth: 0.22,
    size: 72,
    phase: 2.5,
    label: 'Weller SMD Iron',
    status: 'Ready',
  },
  {
    id: 'obj-books',
    name: 'Engineering Literature & Schematics',
    category: 'Resources',
    type: 'books',
    x: 20,
    y: 84,
    depth: 0.16,
    size: 70,
    phase: 5.2,
    label: 'Lab Protocols',
    status: 'Cataloged',
  },
  {
    id: 'obj-crystal',
    name: 'Decentralized Sharing Node',
    category: 'Network',
    type: 'polyhedron',
    x: 50,
    y: 6,
    depth: 0.38,
    size: 46,
    phase: 0.9,
    label: 'Sharing Core',
    status: 'Synced',
  },
];

export function MiniatureIsometricLaboratory() {
  const containerRef = useRef(null);
  const [isLanded, setIsLanded] = useState(false);
  const [hoveredObj, setHoveredObj] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Target pointer position normalized to [-1, 1] relative to center
  const targetPointerRef = useRef({ x: 0, y: 0, px: 0, py: 0, active: false });
  // Current smoothly interpolated pointer position
  const currentPointerRef = useRef({ x: 0, y: 0 });

  // Real-time animation state for objects
  const [objectTransforms, setObjectTransforms] = useState(() =>
    FLOATING_OBJECTS_DATA.map(() => ({
      x: 0,
      y: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scale: 1,
    }))
  );

  // Building tilt state
  const [buildingTilt, setBuildingTilt] = useState({ rotX: 0, rotY: 0, x: 0, y: 0 });

  // Intro drop trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsLanded(true), 120);
    return () => clearTimeout(timer);
  }, []);

  // Continuous spring-damper physics loop
  useEffect(() => {
    let animId;
    let startTime = performance.now();

    const loop = (timestamp) => {
      const elapsed = (timestamp - startTime) / 1000;
      const target = targetPointerRef.current;
      const current = currentPointerRef.current;

      // Smooth lerp pointer (spring damping factor: 0.08)
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;

      // 1. Building gentle tilt & parallax
      setBuildingTilt({
        rotX: -current.y * 5, // max +/- 5 deg tilt
        rotY: current.x * 6,
        x: current.x * 12,
        y: current.y * 10,
      });

      // 2. Compute individual physics for each floating object
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cursorPixelX = (target.x + 1) * 0.5 * rect.width;
        const cursorPixelY = (target.y + 1) * 0.5 * rect.height;

        const updated = FLOATING_OBJECTS_DATA.map((obj, i) => {
          const objPixelX = (obj.x / 100) * rect.width;
          const objPixelY = (obj.y / 100) * rect.height;

          // Euclidean distance from cursor to object center
          const dist = Math.hypot(cursorPixelX - objPixelX, cursorPixelY - objPixelY);

          // Proximity magnetic effect (radius: 220px)
          let magX = 0;
          let magY = 0;
          let extraRotX = 0;
          let extraRotY = 0;
          let extraScale = 1;

          if (target.active && dist < 220) {
            const pull = (1 - dist / 220); // 0 to 1
            magX = ((cursorPixelX - objPixelX) / dist) * pull * 16;
            magY = ((cursorPixelY - objPixelY) / dist) * pull * 16;
            extraRotX = -(cursorPixelY - objPixelY) * 0.08 * pull;
            extraRotY = (cursorPixelX - objPixelX) * 0.08 * pull;
            extraScale = 1 + pull * 0.06;
          }

          // Idle autonomous floating breath (continues even when stationary)
          const idleY = Math.sin(elapsed * 1.6 + obj.phase) * 6;
          const idleRotZ = Math.cos(elapsed * 1.2 + obj.phase) * 3;

          // Parallax from global pointer
          const parallaxX = current.x * obj.depth * 45;
          const parallaxY = current.y * obj.depth * 35;

          return {
            x: parallaxX + magX,
            y: parallaxY + magY + idleY,
            rotX: -current.y * 8 * obj.depth + extraRotX,
            rotY: current.x * 10 * obj.depth + extraRotY,
            rotZ: idleRotZ,
            scale: extraScale,
          };
        });

        setObjectTransforms(updated);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Pointer move handlers
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetPointerRef.current = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    targetPointerRef.current = { x: 0, y: 0, px: 0, py: 0, active: false };
    setHoveredObj(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[480px] sm:h-[540px] lg:h-[580px] select-none overflow-visible flex items-center justify-center"
      style={{ perspective: '1200px' }}
    >
      {/* ATMOSPHERIC BACKGROUND: Warm Ivory transitioning to Deep Forest-Green illuminated area */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none transition-all duration-700"
        style={{
          background: `
            radial-gradient(ellipse 70% 65% at 55% 50%, rgba(16, 60, 45, 0.94) 0%, rgba(11, 41, 31, 0.96) 55%, rgba(247, 241, 231, 0) 100%),
            radial-gradient(circle at 45% 40%, rgba(243, 166, 107, 0.28) 0%, transparent 60%)
          `,
          filter: 'drop-shadow(0 20px 40px rgba(16, 60, 45, 0.22))',
        }}
      />

      {/* Subtle architectural floor shadow beneath the building */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[72%] h-20 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(16, 60, 45, 0.6) 0%, rgba(16, 60, 45, 0) 70%)',
          filter: 'blur(16px)',
          transform: `translate(${buildingTilt.x * 0.5}px, ${buildingTilt.y * 0.5}px)`,
        }}
      />

      {/* ========================================================================= */}
      {/* CONNECTING ORBITAL LIGHT TRAILS (SVG Splines between objects & building) */}
      {/* ========================================================================= */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 600 580"
        fill="none"
      >
        <defs>
          <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3A66B" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#C9D9C7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#103C2D" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="orbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F4D7C2" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#F3A66B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C9D9C7" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glowLight" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Trail 1: Top-Left Laptop -> Central Computing Room -> Oscilloscope */}
        <path
          d={`M 110 130 C 220 ${180 + buildingTilt.y}, 260 ${270 + buildingTilt.y}, 100 370`}
          stroke="url(#orbitGrad1)"
          strokeWidth="1.6"
          strokeDasharray="4 6"
          strokeLinecap="round"
          className="animate-waveform"
          opacity="0.75"
        />

        {/* Trail 2: Top-Right FPGA -> Rooftop Optics -> Thermal Camera */}
        <path
          d={`M 470 120 C 370 ${140 + buildingTilt.y}, 340 ${260 + buildingTilt.y}, 490 310`}
          stroke="url(#orbitGrad2)"
          strokeWidth="1.6"
          strokeDasharray="5 7"
          strokeLinecap="round"
          className="animate-waveform"
          opacity="0.75"
        />

        {/* Trail 3: Lower Fabrication -> Solder Tool -> Books */}
        <path
          d={`M 440 450 C 330 ${420 + buildingTilt.y}, 210 ${460 + buildingTilt.y}, 130 480`}
          stroke="url(#orbitGrad1)"
          strokeWidth="1.4"
          strokeDasharray="3 5"
          opacity="0.6"
        />

        {/* Pulsing Light Particles travelling on orbits */}
        <circle cx={240 + buildingTilt.x * 0.4} cy={220 + buildingTilt.y * 0.4} r="3" fill="#F3A66B" filter="url(#glowLight)" className="animate-beacon" />
        <circle cx={360 + buildingTilt.x * 0.4} cy={200 + buildingTilt.y * 0.4} r="2.5" fill="#F4D7C2" filter="url(#glowLight)" className="animate-beacon" />
      </svg>

      {/* ========================================================================= */}
      {/* THE ISOMETRIC 3D MINIATURE CAMPUS LABORATORY BUILDING (CENTERPIECE)     */}
      {/* ========================================================================= */}
      <div
        className={`relative z-20 w-[340px] sm:w-[390px] lg:w-[420px] h-[360px] sm:h-[410px] transition-all duration-700 ${
          isLanded ? 'opacity-100 scale-100' : 'opacity-0 scale-90 translate-y-8'
        }`}
        style={{
          transform: `translate(${buildingTilt.x}px, ${buildingTilt.y}px) rotateX(${buildingTilt.rotX}deg) rotateY(${buildingTilt.rotY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Rendered Isometric Miniature Laboratory Vector SVG */}
        <svg
          viewBox="0 0 500 520"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ------------------------------------------------------------- */}
          {/* BASE: Terrazzo Foundation Plinth & Campus Lawns */}
          {/* ------------------------------------------------------------- */}
          {/* Isometric Base Slab (Top Face) */}
          <polygon
            points="250,420 440,320 250,225 60,320"
            fill="#EFE7DA"
            stroke="#D6CBB9"
            strokeWidth="1.5"
          />
          {/* Base Slab (Left Face) */}
          <polygon
            points="60,320 250,420 250,442 60,342"
            fill="#C9BEAC"
          />
          {/* Base Slab (Right Face) */}
          <polygon
            points="250,420 440,320 440,342 250,442"
            fill="#B8AC98"
          />

          {/* Campus Grass Path & Stepping Stones */}
          <polygon points="120,330 190,365 175,372 105,338" fill="#C9D9C7" opacity="0.8" />
          <polygon points="310,365 380,330 395,338 325,373" fill="#C9D9C7" opacity="0.8" />

          {/* Miniature Botanical Plants at Base */}
          {/* Plant 1 (Left corner) */}
          <circle cx="100" cy="315" r="9" fill="#103C2D" />
          <circle cx="95" cy="312" r="7" fill="#1B5240" />
          <circle cx="104" cy="310" r="6" fill="#9CB799" />
          {/* Plant 2 (Right corner) */}
          <circle cx="400" cy="315" r="9" fill="#103C2D" />
          <circle cx="405" cy="312" r="7" fill="#1B5240" />
          <circle cx="396" cy="310" r="6" fill="#9CB799" />

          {/* ------------------------------------------------------------- */}
          {/* GROUND LEVEL: Fabrication Room & Creative Study Pavilion      */}
          {/* ------------------------------------------------------------- */}
          {/* Interior Warm Wooden Floor Slab */}
          <polygon
            points="250,380 400,300 250,225 100,300"
            fill="#F4EADB"
            stroke="#E0D3BE"
            strokeWidth="1"
          />
          {/* Floor Planks Texture Lines */}
          <line x1="130" y1="285" x2="280" y2="365" stroke="#E3D5C0" strokeWidth="1" />
          <line x1="160" y1="270" x2="310" y2="350" stroke="#E3D5C0" strokeWidth="1" />
          <line x1="190" y1="255" x2="340" y2="335" stroke="#E3D5C0" strokeWidth="1" />
          <line x1="220" y1="240" x2="370" y2="320" stroke="#E3D5C0" strokeWidth="1" />

          {/* Miniature Interior Furniture: Fabrication Room (Left) */}
          {/* Workbench */}
          <polygon points="140,290 180,270 195,278 155,298" fill="#103C2D" />
          {/* 3D Printer (Orange & Charcoal) */}
          <rect x="156" y="260" width="16" height="18" rx="2" fill="#22251F" />
          <rect x="159" y="263" width="10" height="10" rx="1" fill="#F3A66B" />
          <line x1="164" y1="264" x2="164" y2="271" stroke="#FFFFFF" strokeWidth="1.5" />
          {/* Miniature Tools & Parts */}
          <circle cx="148" cy="288" r="2.5" fill="#F3A66B" />
          <circle cx="152" cy="286" r="2" fill="#C9D9C7" />

          {/* Miniature Interior Furniture: Study Room & Desk (Right) */}
          <polygon points="310,272 350,292 335,300 295,280" fill="#E8DDD0" />
          {/* Study Monitor / Computer */}
          <rect x="312" y="262" width="14" height="10" rx="1" fill="#22251F" />
          <rect x="314" y="264" width="10" height="6" fill="#F4D7C2" />
          <polygon points="317,272 321,272 323,275 315,275" fill="#525B4E" />
          {/* Tiny Desk Lamp (Warm glowing cone) */}
          <circle cx="342" cy="272" r="3" fill="#F3A66B" />
          <path d="M 342 275 L 335 292 L 349 292 Z" fill="#F3A66B" opacity="0.3" />

          {/* Transparent Glass Walls (Ground Level) */}
          {/* Left Glass Facade */}
          <polygon
            points="100,300 250,380 250,285 100,205"
            fill="url(#glassLeft)"
            stroke="#103C2D"
            strokeWidth="2.5"
            opacity="0.85"
          />
          {/* Right Glass Facade */}
          <polygon
            points="250,380 400,300 400,205 250,285"
            fill="url(#glassRight)"
            stroke="#103C2D"
            strokeWidth="2.5"
            opacity="0.85"
          />

          {/* Structural Deep Green Beams & Floor Dividers */}
          <line x1="100" y1="205" x2="100" y2="300" stroke="#103C2D" strokeWidth="4" strokeLinecap="round" />
          <line x1="250" y1="285" x2="250" y2="380" stroke="#103C2D" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="400" y1="205" x2="400" y2="300" stroke="#103C2D" strokeWidth="4" strokeLinecap="round" />
          {/* Specular Diagonal Sheen on Glass */}
          <line x1="120" y1="225" x2="220" y2="345" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.45" strokeLinecap="round" />
          <line x1="270" y1="355" x2="380" y2="235" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.45" strokeLinecap="round" />

          {/* ------------------------------------------------------------- */}
          {/* MID LEVEL: High-Performance Computing & Circuit Room         */}
          {/* ------------------------------------------------------------- */}
          {/* Cantilevered Slab (Middle Floor) */}
          <polygon
            points="250,280 410,195 250,110 90,195"
            fill="#103C2D"
            stroke="#1B5240"
            strokeWidth="2"
          />
          {/* Interior Floor Glow */}
          <polygon
            points="250,274 402,195 250,116 98,195"
            fill="#F4EADB"
            opacity="0.9"
          />

          {/* Computing Room Interior: Server Blades & Multi-Monitors */}
          {/* Miniature Server Blade Rack */}
          <polygon points="140,185 170,170 178,174 148,189" fill="#22251F" />
          <circle cx="152" cy="180" r="1.5" fill="#4ADE80" className="animate-pulse" />
          <circle cx="157" cy="177" r="1.5" fill="#F3A66B" className="animate-pulse" />
          <circle cx="162" cy="174" r="1.5" fill="#38BDF8" />
          {/* Dual Monitor Computing Station */}
          <rect x="235" y="180" width="16" height="12" rx="1.5" fill="#22251F" />
          <rect x="237" y="182" width="12" height="8" rx="1" fill="#0C2B20" />
          <line x1="239" y1="185" x2="247" y2="185" stroke="#38BDF8" strokeWidth="1" />
          <line x1="239" y1="187" x2="245" y2="187" stroke="#F3A66B" strokeWidth="1" />
          {/* Secondary Display */}
          <rect x="254" y="182" width="14" height="11" rx="1.5" fill="#22251F" />
          <rect x="256" y="184" width="10" height="7" rx="1" fill="#F3A66B" opacity="0.8" />

          {/* Balcony Potted Plant */}
          <circle cx="370" cy="192" r="7" fill="#103C2D" />
          <circle cx="370" cy="188" r="5" fill="#9CB799" />

          {/* Middle Floor Transparent Glass Facade */}
          <polygon
            points="90,195 250,280 250,180 90,95"
            fill="url(#glassLeftMid)"
            stroke="#103C2D"
            strokeWidth="2.5"
            opacity="0.8"
          />
          <polygon
            points="250,280 410,195 410,95 250,180"
            fill="url(#glassRightMid)"
            stroke="#103C2D"
            strokeWidth="2.5"
            opacity="0.8"
          />
          <line x1="250" y1="180" x2="250" y2="280" stroke="#103C2D" strokeWidth="4" />
          <line x1="90" y1="95" x2="90" y2="195" stroke="#103C2D" strokeWidth="3.5" />
          <line x1="410" y1="95" x2="410" y2="195" stroke="#103C2D" strokeWidth="3.5" />

          {/* ------------------------------------------------------------- */}
          {/* TOP LEVEL: Optical Research Observatory & Camera Lab          */}
          {/* ------------------------------------------------------------- */}
          {/* Rooftop Base */}
          <polygon
            points="250,175 365,115 250,55 135,115"
            fill="#EFE7DA"
            stroke="#D6CBB9"
            strokeWidth="1.5"
          />
          {/* Observatory Glass Pavilion */}
          <polygon
            points="145,110 250,165 250,90 145,35"
            fill="url(#glassTopLeft)"
            stroke="#103C2D"
            strokeWidth="2"
            opacity="0.85"
          />
          <polygon
            points="250,165 355,110 355,35 250,90"
            fill="url(#glassTopRight)"
            stroke="#103C2D"
            strokeWidth="2"
            opacity="0.85"
          />
          {/* Glass Roof Pyramid/Skylight */}
          <polygon
            points="250,15 145,35 250,90 355,35"
            fill="url(#glassRoof)"
            stroke="#103C2D"
            strokeWidth="2"
            opacity="0.75"
          />

          {/* Miniature Optical Microscope (Brass & Steel) */}
          <ellipse cx="235" cy="115" rx="4" ry="2" fill="#525B4E" />
          <line x1="235" y1="115" x2="235" y2="100" stroke="#D6AD63" strokeWidth="2.5" />
          <line x1="232" y1="102" x2="240" y2="95" stroke="#22251F" strokeWidth="3" />
          <circle cx="240" cy="95" r="2" fill="#38BDF8" />

          {/* Diagnostic Camera on Tripod */}
          <line x1="270" y1="118" x2="265" y2="130" stroke="#22251F" strokeWidth="1.5" />
          <line x1="270" y1="118" x2="275" y2="130" stroke="#22251F" strokeWidth="1.5" />
          <rect x="265" y="110" width="10" height="8" rx="1" fill="#F3A66B" />
          <circle cx="270" cy="114" r="2.5" fill="#22251F" />

          {/* RF Telemetry Mast Antenna on Corner */}
          <line x1="145" y1="35" x2="145" y2="10" stroke="#D6AD63" strokeWidth="2" />
          <circle cx="145" cy="8" r="3" fill="#F3A66B" className="animate-pulse" />
          <circle cx="145" cy="8" r="7" fill="none" stroke="#F3A66B" strokeWidth="0.8" opacity="0.6" className="animate-beacon" />

          {/* ------------------------------------------------------------- */}
          {/* GRADIENTS FOR GLASS REFLECTIONS & WARM INTERNAL LIGHTING       */}
          {/* ------------------------------------------------------------- */}
          <defs>
            {/* Ground Left Glass */}
            <linearGradient id="glassLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="40%" stopColor="#F4D7C2" stopOpacity="0.25" />
              <stop offset="80%" stopColor="#103C2D" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F3A66B" stopOpacity="0.3" />
            </linearGradient>

            {/* Ground Right Glass */}
            <linearGradient id="glassRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3A66B" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#F7F1E7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#103C2D" stopOpacity="0.5" />
            </linearGradient>

            {/* Mid Left Glass */}
            <linearGradient id="glassLeftMid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
              <stop offset="60%" stopColor="#C9D9C7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#103C2D" stopOpacity="0.35" />
            </linearGradient>

            {/* Mid Right Glass */}
            <linearGradient id="glassRightMid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3A66B" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#F7F1E7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#103C2D" stopOpacity="0.4" />
            </linearGradient>

            {/* Top Observatory Glass */}
            <linearGradient id="glassTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#F3A66B" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="glassTopRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3A66B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="glassRoof" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F7F1E7" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#C9D9C7" stopOpacity="0.45" />
            </linearGradient>
          </defs>
        </svg>

        {/* Translucent Information Pill (Accompanying the building naturally) */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#F7F1E7]/90 border border-[#103C2D]/30 backdrop-blur-md shadow-md text-[11px] font-bold text-[#103C2D] flex items-center space-x-2 pointer-events-auto cursor-pointer hover:border-[#F3A66B] transition-all"
          title="Modular ECE Research Building"
        >
          <span className="w-2 h-2 rounded-full bg-[#103C2D] animate-ping" />
          <span>Modular Campus Lab Building · 5 Connected Bays</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEPARATE FLOATING 3D OBJECTS ORBITING THE BUILDING (LAYERED DEPTHS)     */}
      {/* ========================================================================= */}
      {FLOATING_OBJECTS_DATA.map((obj, idx) => {
        const transform = objectTransforms[idx] || { x: 0, y: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1 };
        const isHovered = hoveredObj?.id === obj.id;

        return (
          <div
            key={obj.id}
            onMouseEnter={() => {
              setHoveredObj(obj);
              setActiveTooltip(obj);
            }}
            onMouseLeave={() => setHoveredObj(null)}
            className={`absolute z-30 cursor-pointer transition-opacity duration-700 ${
              isLanded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              width: `${obj.size}px`,
              height: `${obj.size}px`,
              transform: `translate(-50%, -50%) translate3d(${transform.x}px, ${transform.y}px, 0px) rotateX(${transform.rotX}deg) rotateY(${transform.rotY}deg) rotateZ(${transform.rotZ}deg) scale(${transform.scale})`,
              transformStyle: 'preserve-3d',
              transition: isLanded ? 'transform 0.08s ease-out' : 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* ------------------------------------------------------------- */}
            {/* OBJECT A: SLEEK OPEN LAPTOP / WORKSTATION                     */}
            {/* ------------------------------------------------------------- */}
            {obj.type === 'laptop' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center filter drop-shadow-xl">
                {/* Laptop Screen (angled open) */}
                <div
                  className="w-20 h-14 rounded-t-lg bg-[#22251F] border border-[#525B4E] p-1 shadow-2xl relative overflow-hidden"
                  style={{ transform: 'rotateX(-18deg)', transformOrigin: 'bottom center' }}
                >
                  {/* Screen Content: Live waveform & telemetry */}
                  <div className="w-full h-full rounded bg-[#0B291F] border border-[#103C2D] p-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[6px] font-mono text-[#F3A66B] font-bold">waveform.py</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    {/* Mini Waveform */}
                    <svg viewBox="0 0 40 12" className="w-full h-3">
                      <path d="M 0 6 Q 10 0, 20 6 T 40 6" fill="none" stroke="#F3A66B" strokeWidth="1.4" />
                    </svg>
                    <span className="text-[5px] font-mono text-[#C9D9C7] truncate">&gt; 100% Calibrated</span>
                  </div>
                </div>

                {/* Laptop Keyboard Deck */}
                <div
                  className="w-22 h-14 rounded-b-lg bg-gradient-to-b from-[#E5DDD0] to-[#C9BEAC] border border-[#B8AC98] shadow-md p-1 flex flex-col items-center justify-between"
                  style={{ transform: 'rotateX(55deg)', transformOrigin: 'top center', marginTop: '-4px' }}
                >
                  {/* Keyboard Rows */}
                  <div className="w-18 h-7 bg-[#22251F]/80 rounded grid grid-cols-6 gap-0.5 p-0.5">
                    {Array.from({ length: 12 }).map((_, k) => (
                      <div key={k} className="bg-[#525B4E]/60 rounded-[1px] h-1" />
                    ))}
                  </div>
                  {/* Trackpad */}
                  <div className="w-6 h-3 bg-[#B8AC98] rounded-sm mt-0.5" />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* OBJECT B: ULTRASCALE+ CIRCUIT BOARD & PROCESSOR CHIP          */}
            {/* ------------------------------------------------------------- */}
            {obj.type === 'circuit' && (
              <div
                className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#103C2D] via-[#0B291F] to-[#071F17] border-2 border-[#D6AD63]/80 p-2 shadow-2xl flex flex-col justify-between"
                style={{ transform: 'rotateX(20deg) rotateY(-15deg)' }}
              >
                {/* Gold Edge Connector Fingers */}
                <div className="absolute top-0 inset-x-3 h-1.5 bg-[repeating-linear-gradient(90deg,#D6AD63,#D6AD63_3px,transparent_3px,transparent_6px)]" />

                {/* Central Silicon BGA Processor Chip */}
                <div className="mt-2 mx-auto w-9 h-9 rounded-lg bg-gradient-to-br from-[#22251F] to-[#171A15] border border-[#D6AD63] flex items-center justify-center relative shadow-inner">
                  <Cpu className="w-5 h-5 text-[#D6AD63]" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#F3A66B] animate-ping" />
                </div>

                {/* Circuit Traces */}
                <div className="space-y-1 px-1">
                  <div className="h-0.5 bg-[#D6AD63]/60 rounded w-full" />
                  <div className="h-0.5 bg-[#F3A66B]/80 rounded w-4/5" />
                  <div className="h-0.5 bg-[#C9D9C7]/70 rounded w-3/5" />
                </div>

                <div className="flex justify-between items-center text-[7px] text-[#F4D7C2] font-mono px-0.5">
                  <span className="font-bold">XILINX MPSoC</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* OBJECT C: DIAGNOSTIC THERMAL CAMERA                           */}
            {/* ------------------------------------------------------------- */}
            {obj.type === 'camera' && (
              <div
                className="relative w-full h-full flex items-center justify-center filter drop-shadow-xl"
                style={{ transform: 'rotateY(15deg) rotateX(-10deg)' }}
              >
                <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#22251F] to-[#171A15] border border-[#525B4E] p-2 flex flex-col items-center justify-between shadow-2xl relative">
                  {/* Circular Infrared Lens with Concentric Heatmap Iris */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#F3A66B] via-[#D6AD63] to-[#103C2D] p-0.5 shadow-md flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[#0B291F] flex items-center justify-center relative overflow-hidden">
                      <div className="w-4 h-4 rounded-full bg-[#F3A66B] animate-pulse" />
                      <div className="absolute inset-x-0 top-1/2 h-px bg-white/50" />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-white/50" />
                    </div>
                  </div>

                  {/* Grip & Model Readout */}
                  <div className="w-full flex items-center justify-between text-[7px] font-mono text-[#F4D7C2] pt-1">
                    <span className="font-bold">Ti480 PRO</span>
                    <span className="text-[#F3A66B]">34.8°C</span>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* OBJECT D: TEKTRONIX BENCH OSCILLOSCOPE                       */}
            {/* ------------------------------------------------------------- */}
            {obj.type === 'oscilloscope' && (
              <div
                className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#EFE7DA] to-[#D6CBB9] border-2 border-[#103C2D] p-2 shadow-2xl flex flex-col justify-between"
                style={{ transform: 'rotateX(-12deg) rotateY(18deg)' }}
              >
                {/* Scope CRT Screen */}
                <div className="w-full h-12 rounded-lg bg-[#0B291F] border border-[#103C2D] relative overflow-hidden flex items-center justify-center p-1">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#103C2D_1px,transparent_1px),linear-gradient(to_bottom,#103C2D_1px,transparent_1px)] bg-[size:6px_6px] opacity-40" />
                  {/* Animated Waveform */}
                  <svg viewBox="0 0 60 20" className="w-full h-full relative z-10">
                    <path
                      d="M 0 10 Q 15 0, 30 10 T 60 10"
                      fill="none"
                      stroke="#F3A66B"
                      strokeWidth="2"
                      className="animate-waveform"
                    />
                  </svg>
                  <span className="absolute top-0.5 right-1 text-[6px] font-mono text-[#F4D7C2]">
                    1.0 GHz
                  </span>
                </div>

                {/* Rotary Knobs & Channel BNC Jacks */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex space-x-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#22251F] border border-[#D6CBB9] flex items-center justify-center">
                      <div className="w-0.5 h-1.5 bg-[#F3A66B]" />
                    </div>
                    <div className="w-3 h-3 rounded-full bg-[#22251F]" />
                  </div>
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 rounded-full bg-[#F3A66B]" />
                    <span className="w-2 h-2 rounded-full bg-[#103C2D]" />
                    <span className="w-2 h-2 rounded-full bg-[#C9D9C7]" />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* OBJECT E: PRECISION SMD SOLDERING PEN & STAND                 */}
            {/* ------------------------------------------------------------- */}
            {obj.type === 'solder' && (
              <div
                className="relative w-full h-full flex items-center justify-center filter drop-shadow-lg"
                style={{ transform: 'rotateZ(25deg) rotateX(-15deg)' }}
              >
                <div className="w-16 h-12 rounded-xl bg-[#22251F] border border-[#525B4E] p-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] font-mono font-bold text-[#F3A66B]">350°C</span>
                    <Wrench className="w-3 h-3 text-[#C9D9C7]" />
                  </div>
                  {/* Heated Tip */}
                  <div className="flex items-center space-x-1">
                    <div className="w-8 h-1.5 bg-[#C9D9C7] rounded-sm relative">
                      <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#F3A66B] shadow-[0_0_8px_#F3A66B] rounded-r-sm animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* OBJECT F: STACKED CAMPUS TEXTBOOKS & PROTOCOLS               */}
            {/* ------------------------------------------------------------- */}
            {obj.type === 'books' && (
              <div
                className="relative w-full h-full flex flex-col items-center justify-center filter drop-shadow-md"
                style={{ transform: 'rotateZ(-15deg) rotateX(15deg)' }}
              >
                {/* Book 1 (Top Peach) */}
                <div className="w-14 h-4 rounded-sm bg-[#F4D7C2] border-l-3 border-[#D87E3A] shadow-sm flex items-center px-1">
                  <span className="text-[5px] font-bold text-[#22251F] truncate">RF Circuit Design</span>
                </div>
                {/* Book 2 (Middle Sage) */}
                <div className="w-15 h-4 rounded-sm bg-[#C9D9C7] border-l-3 border-[#103C2D] shadow-sm -mt-0.5 flex items-center px-1">
                  <span className="text-[5px] font-bold text-[#103C2D] truncate">FPGA Synthesis</span>
                </div>
                {/* Book 3 (Bottom Forest Green) */}
                <div className="w-16 h-4 rounded-sm bg-[#103C2D] border-l-3 border-[#F3A66B] shadow-sm -mt-0.5 flex items-center px-1">
                  <span className="text-[5px] font-bold text-[#F7F1E7] truncate">Cleanroom Handbook</span>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* OBJECT G: HOLOGRAPHIC GEOMETRIC DODECAHEDRON NODE             */}
            {/* ------------------------------------------------------------- */}
            {obj.type === 'polyhedron' && (
              <div
                className="relative w-full h-full flex items-center justify-center filter drop-shadow-xl"
                style={{ transform: 'rotateY(45deg)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F3A66B] via-[#C9D9C7] to-[#103C2D] p-0.5 shadow-lg animate-pulse">
                  <div className="w-full h-full rounded-lg bg-[#0B291F]/90 border border-white/40 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#F4D7C2]" />
                  </div>
                </div>
              </div>
            )}

            {/* Subtle floating translucent label (visible on hover) */}
            <div
              className={`absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md transition-all duration-200 pointer-events-none flex items-center space-x-1 ${
                isHovered
                  ? 'opacity-100 translate-y-0 bg-[#22251F] text-[#F7F1E7] border border-[#F3A66B]'
                  : 'opacity-0 translate-y-1'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F3A66B]" />
              <span>{obj.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MiniatureIsometricLaboratory;

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

// Equipment object definitions positioned inside the modular laboratory building
const LAB_OBJECTS = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    name: 'Tektronix 1GHz MSO',
    fullName: 'Tektronix 4-Channel 1GHz Digital Oscilloscope (MSO44)',
    category: 'instrument',
    categoryLabel: 'Test & Measurement',
    room: 'Room 202, Bench 4',
    status: 'Available',
    statusColor: 'emerald',
    cert: 'ESD Level 2 Certified',
    dropDelay: '0.15s',
    parallax: 0.22,
    baseX: 20, // percentage from left
    baseY: 54, // percentage from top
    width: 140,
    type: 'oscilloscope',
    badge: '1GHz · 4-Channel',
    nextSlot: 'Today, 2:00 PM – 5:00 PM',
    photo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description: 'High-performance mixed signal oscilloscope with 6.25 GS/s sample rate and I2C/SPI bus decode.',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000005',
    name: 'UltraScale+ FPGA',
    fullName: 'Xilinx Zynq UltraScale+ MPSoC Platform (ZCU104)',
    category: 'computing',
    categoryLabel: 'FPGA Computing',
    room: 'Room 208, Locker 3',
    status: 'Ready',
    statusColor: 'emerald',
    cert: 'FPGA Tools Certified',
    dropDelay: '0.3s',
    parallax: 0.28,
    baseX: 62,
    baseY: 42,
    width: 135,
    type: 'fpga',
    badge: 'Quad ARM + FPGA',
    nextSlot: 'Today, 3:30 PM – 6:30 PM',
    photo: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80',
    description: 'Heterogeneous compute platform with UltraScale+ logic and video codec unit for AI inference.',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000008',
    name: 'Fluke Ti480 Thermal Cam',
    fullName: 'Fluke Precision High-Speed Thermal Imaging Camera (Ti480 PRO)',
    category: 'camera',
    categoryLabel: 'Diagnostics',
    room: 'Room 210, Cabinet A',
    status: 'Available',
    statusColor: 'emerald',
    cert: 'Macro Diagnostic Lens',
    dropDelay: '0.45s',
    parallax: 0.35,
    baseX: 68,
    baseY: 15,
    width: 120,
    type: 'camera',
    badge: '640x480 IR Sensor',
    nextSlot: 'Tomorrow, 10:00 AM',
    photo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    description: 'Precision thermal camera for identifying micro-short circuits and power trace hotspots.',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000006',
    name: 'Weller SMD Rework',
    fullName: 'Weller Professional SMD Rework Station (WT2M)',
    category: 'fabrication',
    categoryLabel: 'Fabrication & Solder',
    room: 'Room 105, Station B',
    status: 'Available',
    statusColor: 'emerald',
    cert: 'SMD Solder Certified',
    dropDelay: '0.22s',
    parallax: 0.18,
    baseX: 24,
    baseY: 76,
    width: 125,
    type: 'solder',
    badge: '450°C Micro-Tweezers',
    nextSlot: 'Today, 4:00 PM',
    photo: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80',
    description: 'Dual-channel micro-soldering station with active fume extraction for 0402/0201 passives.',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000007',
    name: 'Prusa MK3S+ 3D Printer',
    fullName: 'Prusa i3 MK3S+ Precision Rapid Prototyping 3D Printer',
    category: 'fabrication',
    categoryLabel: 'Prototyping',
    room: 'Makerspace, Block D',
    status: 'Printing Active',
    statusColor: 'amber',
    cert: 'General Workshop Clearance',
    dropDelay: '0.5s',
    parallax: 0.25,
    baseX: 65,
    baseY: 72,
    width: 120,
    type: 'printer',
    badge: 'PEI Heated Bed',
    nextSlot: 'Today, 6:00 PM',
    photo: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    description: 'FDM 3D printer for electronics enclosures, robotics brackets, and custom sensor jigs.',
  },
  {
    id: 'laptop-workstation-01',
    name: 'Lab Telemetry Workstation',
    fullName: 'High-Performance Developer & Instrument Control Laptop',
    category: 'computing',
    categoryLabel: 'Host Telemetry',
    room: 'Room 202, Bench 4',
    status: 'Live Link',
    statusColor: 'emerald',
    cert: 'Lab Network Connected',
    dropDelay: '0.38s',
    parallax: 0.3,
    baseX: 18,
    baseY: 28,
    width: 110,
    type: 'laptop',
    badge: 'SCPI / USB-TMC',
    nextSlot: 'Continuous Host',
    photo: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    description: 'Instrument control workstation running waveform streaming, Python automation, and logic capture.',
  },
];

export function InteractiveLaboratory({ onSelectEquipment }) {
  const containerRef = useRef(null);
  const [hasLanded, setHasLanded] = useState(false);
  const [hoveredObj, setHoveredObj] = useState(null);
  const [selectedObj, setSelectedObj] = useState(LAB_OBJECTS[0]); // default selected for instant richness
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 }); // normalized [-1, 1]
  const [smoothPos, setSmoothPos] = useState({ x: 0, y: 0 });

  // Trigger drop animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasLanded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Smooth lerp loop for buttery cursor parallax
  useEffect(() => {
    let animId;
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const tick = () => {
      setSmoothPos((prev) => ({
        x: lerp(prev.x, pointerPos.x, 0.08),
        y: lerp(prev.y, pointerPos.y, 0.08),
      }));
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [pointerPos]);

  // Handle mouse move over container
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setPointerPos({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  };

  const handleMouseLeave = () => {
    setPointerPos({ x: 0, y: 0 });
    setHoveredObj(null);
  };

  const handleSelect = (obj) => {
    setSelectedObj(obj);
    if (onSelectEquipment) onSelectEquipment(obj);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-xl mx-auto rounded-3xl overflow-hidden border border-[#126B4F]/40 shadow-2xl bg-gradient-to-b from-[#093527]/95 via-[#06291E]/95 to-[#041c14]/98 p-4 sm:p-6 transition-all duration-300"
      style={{
        boxShadow: '0 24px 60px rgba(4, 28, 20, 0.45), 0 0 0 1px rgba(214, 173, 99, 0.15)',
      }}
    >
      {/* Ambient Lighting & Laboratory Grid Canvas */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(214, 173, 99, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(214, 173, 99, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Radial soft emerald & orange glow lights */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-[#126B4F]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-16 w-56 h-56 bg-[#DE7347]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-[#D6AD63]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Telemetry & Modular Facility Header Bar */}
      <div className="relative z-20 flex items-center justify-between pb-3 mb-2 border-b border-[#126B4F]/30 text-xs">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DE7347] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#DE7347]" />
          </span>
          <span className="font-bold text-[#FAF7F0] tracking-wide uppercase text-[11px] font-sans">
            Modular Lab Building · Live Bay Matrix
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#126B4F]/40 text-[#D8EADB] border border-[#126B4F]/50">
            6 Active Nodes
          </span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DE7347]/25 text-[#FFB69B] border border-[#DE7347]/30">
            Interactive Parallax
          </span>
        </div>
      </div>

      {/* 3D PERSPECTIVE STAGE CONTAINER */}
      <div
        className="relative w-full h-[370px] sm:h-[400px] rounded-2xl overflow-hidden perspective-1200 preserve-3d"
        style={{
          transform: `perspective(1000px) rotateX(${-smoothPos.y * 6}deg) rotateY(${smoothPos.x * 6}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* ========================================================= */}
        {/* MODULAR LABORATORY BUILDING CENTERPIECE (3-TIER ARCHITECTURE) */}
        {/* ========================================================= */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none select-none">
          {/* LEVEL 3 (APEX): Diagnostic Optics & RF Roof Deck */}
          <div
            className="relative mx-auto w-[82%] h-[82px] rounded-2xl bg-gradient-to-r from-[#0E4734]/80 via-[#12553F]/75 to-[#0E4734]/80 border border-[#197556]/60 backdrop-blur-md p-2.5 shadow-lg flex items-center justify-between"
            style={{
              transform: `translate(${smoothPos.x * 5}px, ${smoothPos.y * 5}px)`,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(214, 173, 99, 0.25)',
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-[#DE7347]/25 border border-[#DE7347]/40 flex items-center justify-center text-[#FFB69B]">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#FAF7F0] block leading-none">
                  Deck 03 · Diagnostics &amp; IR Imaging
                </span>
                <span className="text-[9px] text-[#A3C9B8] block mt-0.5">
                  Cleanroom Class 10,000 · High-Speed Thermal Sensors
                </span>
              </div>
            </div>

            {/* Glowing signal beacon */}
            <div className="flex items-center space-x-1.5 pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#126B4F] animate-pulse" />
              <span className="text-[9px] font-mono text-[#D6AD63] font-semibold">RF: ONLINE</span>
            </div>
          </div>

          {/* LEVEL 2 (CORE): High-Performance & FPGA Computing Bay */}
          <div
            className="relative mx-auto w-[92%] h-[115px] rounded-2xl bg-gradient-to-r from-[#0C3D2D]/90 via-[#104D39]/85 to-[#0C3D2D]/90 border border-[#1E8260]/60 backdrop-blur-md p-3 shadow-xl flex items-center justify-between"
            style={{
              transform: `translate(${smoothPos.x * 10}px, ${smoothPos.y * 10}px)`,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Visual server rack & bus trace art */}
            <div className="absolute inset-y-2 left-3 w-28 opacity-30 flex flex-col justify-around pointer-events-none">
              <div className="h-1.5 rounded bg-[#D6AD63]/50 w-full" />
              <div className="h-1.5 rounded bg-[#126B4F]/80 w-3/4" />
              <div className="h-1.5 rounded bg-[#DE7347]/60 w-5/6" />
              <div className="h-1.5 rounded bg-[#D6AD63]/50 w-2/3" />
            </div>

            <div className="relative z-10 pl-2">
              <span className="text-[10px] font-bold text-[#FAF7F0] block leading-none">
                Deck 02 · FPGA Cluster &amp; Microelectronics
              </span>
              <span className="text-[9px] text-[#A3C9B8] block mt-0.5">
                MPSoC Neural Engines · Vivado License Node
              </span>
            </div>

            {/* Micro chip matrix LEDs */}
            <div className="flex space-x-1 pr-2">
              <span className="w-2 h-2 rounded-sm bg-[#D6AD63] animate-ping opacity-75" />
              <span className="w-2 h-2 rounded-sm bg-[#126B4F]" />
              <span className="w-2 h-2 rounded-sm bg-[#DE7347]" />
            </div>
          </div>

          {/* LEVEL 1 (BASE): Test & Measurement + Precision Fabrication Floor */}
          <div
            className="relative mx-auto w-[98%] h-[125px] rounded-2xl bg-gradient-to-r from-[#082C20]/95 via-[#0C3829]/95 to-[#082C20]/95 border border-[#197556]/70 backdrop-blur-md p-3.5 shadow-2xl flex items-center justify-between"
            style={{
              transform: `translate(${smoothPos.x * 15}px, ${smoothPos.y * 15}px)`,
              boxShadow: '0 18px 45px rgba(0, 0, 0, 0.65), inset 0 1.5px 0 rgba(214, 173, 99, 0.3)',
            }}
          >
            <div className="relative z-10 pl-2">
              <span className="text-[11px] font-bold text-[#FAF7F0] block leading-none">
                Deck 01 · Heavy Test &amp; Fabrication Floor
              </span>
              <span className="text-[9px] text-[#A3C9B8] block mt-1">
                Grounded ESD Benches · SMD Soldering &middot; FDM Enclosure Print Bay
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[10px] text-[#D6AD63] font-semibold pr-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#126B4F]" />
              <span className="hidden sm:inline">100% Calibrated</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE RESOURCE OBJECTS WITH GENTLE INTRO DROP & PARALLAX */}
        {/* ========================================================= */}
        {LAB_OBJECTS.map((obj) => {
          const isHovered = hoveredObj?.id === obj.id;
          const isSelected = selectedObj?.id === obj.id;

          // Parallax movement calculation
          const offsetX = smoothPos.x * obj.parallax * 40;
          const offsetY = smoothPos.y * obj.parallax * 30;

          // Bounded magnetic movement when cursor is nearby
          return (
            <div
              key={obj.id}
              onClick={() => handleSelect(obj)}
              onMouseEnter={() => setHoveredObj(obj)}
              className={`absolute cursor-pointer transition-all duration-300 z-30 group ${
                hasLanded ? 'opacity-100' : 'opacity-0 -translate-y-16 scale-75'
              }`}
              style={{
                left: `${obj.baseX}%`,
                top: `${obj.baseY}%`,
                transform: `translate(${offsetX}px, ${offsetY}px) ${
                  isSelected ? 'scale(1.08)' : isHovered ? 'scale(1.04)' : 'scale(1)'
                }`,
                transitionDelay: hasLanded ? '0s' : obj.dropDelay,
                transitionProperty: hasLanded ? 'transform, box-shadow' : 'all',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              title={`Click to inspect ${obj.name}`}
            >
              {/* Floating Hover Label */}
              <div
                className={`absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg transition-all pointer-events-none z-40 flex items-center space-x-1.5 ${
                  isHovered || isSelected
                    ? 'opacity-100 translate-y-0 bg-[#073D2D] text-[#FAF7F0] border border-[#DE7347]/70 shadow-md'
                    : 'opacity-0 translate-y-1'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#DE7347] animate-pulse" />
                <span>{obj.name}</span>
                <span className="text-[#D6AD63] text-[9px] font-normal">({obj.status})</span>
              </div>

              {/* OBJECT RENDERING BY TYPE */}

              {/* 1. TEKTRONIX OSCILLOSCOPE */}
              {obj.type === 'oscilloscope' && (
                <div
                  className={`w-36 h-20 rounded-xl bg-gradient-to-br from-[#1b2f28] to-[#0c1e18] border ${
                    isSelected
                      ? 'border-[#DE7347] shadow-[0_0_20px_rgba(222,115,71,0.5)]'
                      : 'border-[#126B4F]/60 group-hover:border-[#DE7347]/60'
                  } p-1.5 flex flex-col justify-between shadow-xl relative overflow-hidden`}
                >
                  {/* Scope screen with live waveform */}
                  <div className="w-full h-10 rounded-md bg-[#04140e] border border-[#126B4F]/40 relative overflow-hidden flex items-center justify-center">
                    {/* Grid lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#093021_1px,transparent_1px),linear-gradient(to_bottom,#093021_1px,transparent_1px)] bg-[size:8px_8px] opacity-40" />

                    {/* Animated waveform path */}
                    <svg className="w-full h-7 relative z-10 px-1" viewBox="0 0 100 24" fill="none">
                      <path
                        d="M 0 12 Q 12 2, 25 12 T 50 12 T 75 12 T 100 12"
                        stroke="#DE7347"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        className="animate-waveform"
                      />
                      <path
                        d="M 0 12 Q 12 20, 25 12 T 50 12 T 75 12 T 100 12"
                        stroke="#126B4F"
                        strokeWidth="1.2"
                        opacity="0.8"
                        strokeLinecap="round"
                      />
                    </svg>

                    <span className="absolute top-0.5 right-1 text-[7px] font-mono text-[#D6AD63]">
                      1.0 GHz
                    </span>
                  </div>

                  {/* Scope control knobs & channel jacks */}
                  <div className="flex items-center justify-between px-1 pt-0.5 text-[8px] text-[#A3C9B8]">
                    <span className="font-mono text-[#DE7347] font-bold">MSO44</span>
                    <div className="flex space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DE7347]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#126B4F]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D6AD63]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. XILINX ULTRASCALE+ FPGA BOARD */}
              {obj.type === 'fpga' && (
                <div
                  className={`w-32 h-20 rounded-xl bg-gradient-to-br from-[#072418] to-[#04160f] border ${
                    isSelected
                      ? 'border-[#DE7347] shadow-[0_0_20px_rgba(222,115,71,0.5)]'
                      : 'border-[#126B4F]/60 group-hover:border-[#DE7347]/60'
                  } p-1.5 flex flex-col justify-between shadow-xl relative overflow-hidden`}
                >
                  {/* Gold edge connector pins */}
                  <div className="absolute top-0 inset-x-2 h-1 bg-[repeating-linear-gradient(90deg,#D6AD63,#D6AD63_2px,transparent_2px,transparent_4px)] opacity-80" />

                  <div className="flex items-center justify-between pt-1">
                    {/* BGA Heat Sink Chip */}
                    <div className="w-8 h-8 rounded-lg bg-[#126B4F]/40 border border-[#D6AD63]/60 flex items-center justify-center relative shadow-inner">
                      <Cpu className="w-4 h-4 text-[#D6AD63]" />
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#DE7347] animate-ping" />
                    </div>

                    {/* Circuit traces & microchips */}
                    <div className="flex-1 pl-2 space-y-1">
                      <div className="h-1 bg-[#126B4F]/70 rounded w-full" />
                      <div className="h-1 bg-[#DE7347]/60 rounded w-4/5" />
                      <div className="h-1 bg-[#D6AD63]/60 rounded w-3/5" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[8px] text-[#A3C9B8] px-0.5">
                    <span className="font-mono text-[#D6AD63] font-bold">ZCU104 MPSoC</span>
                    <span className="text-[#DE7347] font-semibold text-[7px]">ARM+FPGA</span>
                  </div>
                </div>
              )}

              {/* 3. FLUKE THERMAL CAMERA */}
              {obj.type === 'camera' && (
                <div
                  className={`w-28 h-18 rounded-xl bg-gradient-to-br from-[#1e1e1a] to-[#0e1210] border ${
                    isSelected
                      ? 'border-[#DE7347] shadow-[0_0_20px_rgba(222,115,71,0.5)]'
                      : 'border-[#126B4F]/60 group-hover:border-[#DE7347]/60'
                  } p-1.5 shadow-xl relative overflow-hidden flex items-center space-x-2`}
                >
                  {/* Circular thermal lens with glowing heatmap */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#DE7347] via-[#D6AD63] to-[#126B4F] p-0.5 shadow-md shrink-0 flex items-center justify-center relative">
                    <div className="w-full h-full rounded-full bg-[#04120b] flex items-center justify-center relative overflow-hidden">
                      <div className="w-3 h-3 rounded-full bg-[#DE7347] animate-pulse" />
                      {/* Crosshairs */}
                      <div className="absolute inset-x-0 top-1/2 h-px bg-white/40" />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-white/40" />
                    </div>
                  </div>

                  <div className="space-y-0.5 text-left">
                    <span className="text-[8px] font-bold text-[#FAF7F0] block leading-none">
                      Ti480 PRO
                    </span>
                    <span className="text-[7px] text-[#DE7347] font-mono block">
                      34.8°C Hotspot
                    </span>
                    <span className="text-[7px] text-[#A3C9B8] block">Macro PCB</span>
                  </div>
                </div>
              )}

              {/* 4. WELLER SMD SOLDERING STATION */}
              {obj.type === 'solder' && (
                <div
                  className={`w-30 h-16 rounded-xl bg-gradient-to-br from-[#162720] to-[#0b1712] border ${
                    isSelected
                      ? 'border-[#DE7347] shadow-[0_0_20px_rgba(222,115,71,0.5)]'
                      : 'border-[#126B4F]/60 group-hover:border-[#DE7347]/60'
                  } p-1.5 shadow-xl flex items-center space-x-2`}
                >
                  {/* Digital temperature display */}
                  <div className="w-11 h-9 rounded-lg bg-[#04130d] border border-[#126B4F]/50 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-mono font-bold text-[#DE7347]">350°C</span>
                    <span className="text-[6px] text-[#D6AD63]">SET WT2M</span>
                  </div>

                  {/* Micro pencil iron with glowing tip */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-1">
                      <div className="w-8 h-1 rounded-full bg-[#526359] relative">
                        <span className="absolute right-0 -top-0.5 w-1.5 h-2 rounded-sm bg-[#DE7347] shadow-[0_0_8px_#DE7347] animate-pulse" />
                      </div>
                    </div>
                    <span className="text-[7px] text-[#A3C9B8] block">ESD Micro-Pencil</span>
                  </div>
                </div>
              )}

              {/* 5. PRUSA 3D PRINTER */}
              {obj.type === 'printer' && (
                <div
                  className={`w-28 h-18 rounded-xl bg-gradient-to-br from-[#1c211e] to-[#091510] border ${
                    isSelected
                      ? 'border-[#DE7347] shadow-[0_0_20px_rgba(222,115,71,0.5)]'
                      : 'border-[#126B4F]/60 group-hover:border-[#DE7347]/60'
                  } p-1.5 shadow-xl relative overflow-hidden flex flex-col justify-between`}
                >
                  {/* Gantry top bar & extruder carriage */}
                  <div className="w-full h-1 bg-[#DE7347] rounded-full relative">
                    <span className="absolute left-1/2 -translate-x-1/2 -top-0.5 w-2 h-2 rounded-sm bg-[#FAF7F0] shadow-sm animate-pulse" />
                  </div>

                  {/* Bed grid */}
                  <div className="w-full h-7 rounded bg-[#071710] border border-[#126B4F]/30 flex items-center justify-center">
                    <Wrench className="w-3.5 h-3.5 text-[#DE7347]" />
                  </div>

                  <div className="flex justify-between items-center text-[7px] text-[#A3C9B8]">
                    <span className="font-bold text-[#FAF7F0]">MK3S+</span>
                    <span className="text-[#DE7347]">215°C / 60°C</span>
                  </div>
                </div>
              )}

              {/* 6. TELEMETRY LAPTOP WORKSTATION */}
              {obj.type === 'laptop' && (
                <div
                  className={`w-26 h-18 rounded-xl bg-gradient-to-br from-[#192b23] to-[#0a1812] border ${
                    isSelected
                      ? 'border-[#DE7347] shadow-[0_0_20px_rgba(222,115,71,0.5)]'
                      : 'border-[#126B4F]/60 group-hover:border-[#DE7347]/60'
                  } p-1.5 shadow-xl flex flex-col justify-between`}
                >
                  {/* Laptop screen with mini terminal code */}
                  <div className="w-full h-9 rounded bg-[#031109] border border-[#126B4F]/40 p-1 flex flex-col justify-around">
                    <div className="flex space-x-1">
                      <span className="w-1 h-1 rounded-full bg-rose-500" />
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[6px] font-mono text-[#DE7347] truncate">
                      $ telemetry.stream()
                    </span>
                    <span className="text-[6px] font-mono text-emerald-400 truncate">
                      &gt; 4 channels sync
                    </span>
                  </div>

                  {/* Laptop keyboard deck */}
                  <div className="w-full h-3 rounded-b-md bg-[#253930] flex items-center justify-center">
                    <div className="w-4 h-1 bg-[#126B4F]/60 rounded-sm" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* FUNCTIONAL EQUIPMENT DETAIL CARD (INTEGRATED DIRECT ACTION) */}
      {/* ========================================================= */}
      {selectedObj && (
        <div className="relative z-30 mt-3 pt-3 border-t border-[#126B4F]/40 rounded-2xl bg-[#073325]/90 border border-[#DE7347]/30 p-3.5 shadow-lg backdrop-blur-md animate-fade-in text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#D6AD63]/40 shadow-sm shrink-0">
                <img
                  src={selectedObj.photo}
                  alt={selectedObj.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-[#073D2D]/90 text-[8px] font-bold text-center text-[#FAF7F0] py-0.5">
                  LIVE
                </span>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#FAF7F0] font-sans">
                    {selectedObj.fullName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#126B4F] text-white">
                    {selectedObj.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#C7D9C4] mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#DE7347]" />
                    {selectedObj.room}
                  </span>
                  <span className="flex items-center gap-1 text-[#D6AD63]">
                    <ShieldCheck className="w-3 h-3" />
                    {selectedObj.cert}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Booking Actions */}
            <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 justify-end">
              <Link
                to={selectedObj.id.startsWith('f0') ? `/resources/${selectedObj.id}` : '/explore'}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#DE7347] hover:bg-[#EA8D63] text-white shadow-md hover:shadow-orange-500/25 transition-all btn-shimmer"
              >
                <span>Reserve Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/explore"
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#126B4F]/50 hover:bg-[#126B4F] text-[#FAF7F0] border border-[#126B4F] transition-all"
                title="Browse in full catalog"
              >
                Catalog
              </Link>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-[#A3C9B8] leading-relaxed flex items-center justify-between border-t border-[#126B4F]/30 pt-1.5">
            <span>{selectedObj.description}</span>
            <span className="text-[#DE7347] font-semibold shrink-0 ml-2">
              Next: {selectedObj.nextSlot}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default InteractiveLaboratory;

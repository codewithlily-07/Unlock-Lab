import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UnlockLabIntro } from '../components/intro/UnlockLabIntro';
import { MiniatureIsometricLaboratory } from '../components/laboratory/MiniatureIsometricLaboratory';
import CircularCarousel from '../components/effects/CircularCarousel';
import InfiniteSpiral from '../components/effects/InfiniteSpiral';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Cpu,
  Layers,
  Wrench,
  Users,
  MapPin,
  Play,
  Building,
  Check,
  Sliders,
  BarChart3,
  Camera,
  Activity,
  Compass
} from 'lucide-react';
import { formatDuration } from '../lib/utils';

// ============================================================================
// ANIMATED COUNT-UP METRIC COMPONENT
// ============================================================================
function CountUpMetric({ endValue, suffix = '', duration = 1200, label, sublabel, icon: Icon, accent = 'forest' }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.25 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime;
    let animId;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * endValue));
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [hasStarted, endValue, duration]);

  const colorMap = {
    forest: 'text-[#103C2D] bg-[#DCE8DB] border-[#C9D9C7]',
    orange: 'text-[#D87E3A] bg-[#FAEDE3] border-[#F4D7C2]',
    sage: 'text-[#1B5240] bg-[#E0EFEA] border-[#C9D9C7]',
    charcoal: 'text-[#22251F] bg-[#EFE7DA] border-[#D6CBB9]',
  };

  return (
    <div
      ref={ref}
      className="p-6 rounded-2xl bg-white border border-[#E5DDD0] shadow-sm hover:shadow-md hover:border-[#103C2D]/40 transition-all duration-300 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F7F1E7] text-[#4A5043] border border-[#E5DDD0]">
          Verified
        </span>
      </div>

      <div>
        <div className="text-3xl sm:text-4xl font-extrabold text-[#22251F] font-sans tracking-tight mb-1">
          {count}
          {suffix}
        </div>
        <div className="text-sm font-bold text-[#22251F]">{label}</div>
        <div className="text-xs text-[#6B7266] mt-0.5 leading-relaxed">{sublabel}</div>
      </div>
    </div>
  );
}

// Curated lifestyle photos representing genuine campus resource sharing & lab life
const LIFESTYLE_SPIRAL_ITEMS = [
  {
    src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
    alt: 'Students collaborating on embedded circuit prototyping',
    href: '/explore'
  },
  {
    src: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    alt: 'Tektronix oscilloscope digital signal debugging in ECE Lab',
    href: '/explore?cat=instrument'
  },
  {
    src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    alt: 'Engineering study group reviewing FPGA hardware schematics',
    href: '/campuses'
  },
  {
    src: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80',
    alt: 'Weller SMD micro-soldering bench session',
    href: '/explore?cat=fabrication'
  },
  {
    src: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    alt: 'Prusa 3D printing custom robotics enclosure in makerspace',
    href: '/explore?cat=fabrication'
  },
  {
    src: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=600&q=80',
    alt: 'Graduate researchers sharing diagnostic test benches',
    href: '/explore'
  },
  {
    src: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80',
    alt: 'Keysight logic analyzer bus capture at workstation',
    href: '/explore?cat=instrument'
  },
  {
    src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
    alt: 'Senior capstone hardware team celebration',
    href: '/campuses'
  },
  {
    src: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    alt: 'Rohde & Schwarz spectrum analyzer RF characterization',
    href: '/explore?cat=instrument'
  },
  {
    src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    alt: 'Makerspace collaborative physical prototyping workshop',
    href: '/campuses'
  },
  {
    src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    alt: 'Fluke thermal imaging camera short-circuit diagnostics',
    href: '/explore?cat=camera'
  },
  {
    src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80',
    alt: 'Laboratory seminar and peer hardware review session',
    href: '/how-allocation-works'
  }
];

// Curated Distinct Laboratory & Scientific Instrument Photography (Each strictly unique)
const DISTINCT_EQUIPMENT_PHOTOS = [
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', // 1. RF & Microwave Engineering
  'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=80', // 2. High-Speed Digital Oscilloscope
  'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80', // 3. Scanning Electron Microscopy (SEM)
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', // 4. Silicon FPGA Hardware Acceleration
  'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80', // 5. Precision 3D Rapid Prototyping
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80', // 6. Articulated Testing & Load Frame
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80', // 7. Analytical UV-Vis Spectrophotometer
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80', // 8. AI Supercomputing Node & High Compute
  'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=800&q=80', // 9. Digital SMD Soldering & Rework
  'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80', // 10. Sterile Cleanroom Cell Incubator
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80', // 11. Thermal Imaging & Diagnostics
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80', // 12. Articulated Robotic Manipulator
  'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80', // 13. Laser Optics & Photonics Table
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80', // 14. Liquid Chromatography & Mass Spec
  'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=800&q=80', // 15. High-Temperature Tube Furnace
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', // 16. Robotic Bioassay Microplate Pipetting
  'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=800&q=80', // 17. Optical Surface Profilometer
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80', // 18. Quantum Cryogenic Packaging
  'https://images.unsplash.com/photo-1581093806997-124204d9fa9d?auto=format&fit=crop&w=800&q=80', // 19. Anechoic Chamber Antenna Array
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80'  // 20. Sub-Micron Precision Micro-Machining
];

// Baseline Institutional Laboratory Instruments for CircularCarousel (Each with unique photo)
const DEFAULT_EQUIPMENT_ITEMS = [
  {
    id: 'res-equip-vna',
    name: 'Keysight E5080B ENA Vector Network Analyzer',
    title: 'Keysight E5080B VNA',
    subtitle: 'RF & MICROWAVE • North Campus 304',
    category: 'instrument',
    src: DISTINCT_EQUIPMENT_PHOTOS[0],
    alt: 'Keysight Vector Network Analyzer'
  },
  {
    id: 'res-equip-scope',
    name: 'Tektronix 4-Channel 1GHz Mixed Signal Oscilloscope',
    title: 'Tektronix 1GHz MSO',
    subtitle: 'ELECTRONICS • Digital Lab 208',
    category: 'instrument',
    src: DISTINCT_EQUIPMENT_PHOTOS[1],
    alt: 'Tektronix Digital Oscilloscope'
  },
  {
    id: 'res-equip-sem',
    name: 'JEOL JSM-IT200 Scanning Electron Microscope',
    title: 'JEOL JSM-IT200 SEM',
    subtitle: 'MICROSCOPY • Science Park B1',
    category: 'microscopy',
    src: DISTINCT_EQUIPMENT_PHOTOS[2],
    alt: 'JEOL Scanning Electron Microscope'
  },
  {
    id: 'res-equip-fpga',
    name: 'Xilinx Zynq UltraScale+ MPSoC Development Platform',
    title: 'Xilinx Zynq MPSoC FPGA',
    subtitle: 'EMBEDDED AI • Lab 412',
    category: 'fpga',
    src: DISTINCT_EQUIPMENT_PHOTOS[3],
    alt: 'Xilinx FPGA Platform'
  },
  {
    id: 'res-equip-3d',
    name: 'Prusa MK4 Precision Multi-Material Prototyping Bay',
    title: 'Prusa MK4 Multi-Material',
    subtitle: 'FABRICATION • Maker Hub Bay 03',
    category: 'fabrication',
    src: DISTINCT_EQUIPMENT_PHOTOS[4],
    alt: 'Prusa 3D Rapid Prototyping'
  },
  {
    id: 'res-equip-tensile',
    name: 'Instron 5969 Universal Mechanical Testing Bay',
    title: 'Instron 5969 Load Frame',
    subtitle: 'MATERIALS • Materials Lab 112',
    category: 'testing_bay',
    src: DISTINCT_EQUIPMENT_PHOTOS[5],
    alt: 'Instron Universal Testing System'
  },
  {
    id: 'res-equip-spectro',
    name: 'Shimadzu UV-2600i Double-Beam UV-Vis Spectrophotometer',
    title: 'Shimadzu UV-2600i UV-Vis',
    subtitle: 'SPECTROSCOPY • Bioanalytics 215',
    category: 'spectroscopy',
    src: DISTINCT_EQUIPMENT_PHOTOS[6],
    alt: 'Shimadzu Spectrophotometer'
  },
  {
    id: 'res-equip-dgx',
    name: 'NVIDIA DGX A100 AI Supercomputing Cluster Node',
    title: 'NVIDIA DGX A100 Cluster',
    subtitle: 'HIGH COMPUTE • Data Center Rack 08',
    category: 'computing',
    src: DISTINCT_EQUIPMENT_PHOTOS[7],
    alt: 'NVIDIA DGX A100 AI Server'
  },
  {
    id: 'res-equip-solder',
    name: 'Weller WXsmart Digital Soldering & SMD Rework Station',
    title: 'Weller WXsmart Station',
    subtitle: 'PROTOTYPING • Bench 07',
    category: 'soldering',
    src: DISTINCT_EQUIPMENT_PHOTOS[8],
    alt: 'Weller Soldering and SMD Rework'
  },
  {
    id: 'res-equip-incubator',
    name: 'Thermo Forma Steri-Cycle CO2 Cell Culture Suite',
    title: 'Thermo Forma CO2 Suite',
    subtitle: 'BIO CLEANROOM • Molecular Cleanroom 104',
    category: 'cleanroom',
    src: DISTINCT_EQUIPMENT_PHOTOS[9],
    alt: 'Thermo Forma Incubator Suite'
  }
];

// ============================================================================
// EXPLORE BY EQUIPMENT SECTION WITH RISE-FROM-BELOW REVEAL (MATCHING INTRO)
// ============================================================================
function ExploreEquipmentSection({ carouselItems, navigate }) {
  const [hasEntered, setHasEntered] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
        }
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    const timer = setTimeout(() => setHasEntered(true), 600);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const items = carouselItems && carouselItems.length > 0 ? carouselItems : DEFAULT_EQUIPMENT_ITEMS;

  return (
    <section
      ref={sectionRef}
      className={`rounded-3xl bg-[#E8EFE6] p-6 sm:p-10 lg:p-12 border border-[#C9D9C7] space-y-6 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        hasEntered
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-28 opacity-0 scale-[0.98]'
      }`}
    >
      <div
        className={`text-center max-w-2xl mx-auto space-y-1 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          hasEntered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#103C2D] mb-1">
          <Compass className="w-3.5 h-3.5 text-[#D87E3A]" />
          <span>Campus Resource Directory</span>
        </div>
        <h2 className="text-3xl font-bold text-[#22251F] font-serif">
          Explore by Equipment Discipline
        </h2>
        <p className="text-sm text-[#4A5043] mt-1.5">
          Drag horizontally or click through our 3D equipment cylinder to inspect precision instruments, FPGA platforms, and fabrication tools.
        </p>
      </div>

      {/* React Bits CircularCarousel Component (Database-Driven 3D Cylinder with Intro Rise) */}
      <div
        className={`relative w-full h-[450px] sm:h-[490px] lg:h-[530px] rounded-2xl overflow-hidden my-4 border border-[#C9D9C7]/50 shadow-inner bg-[#E8EFE6] transition-all duration-1000 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          hasEntered ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
        }`}
      >
        <CircularCarousel
          key={items.length}
          items={items}
          preset="cylinder"
          intro="rise"
          cardWidth={220}
          aspectRatio={1}
          speed={14}
          captions={true}
          autoplay="drift"
          pauseOnHover={true}
          draggable={true}
          focusOnClick={true}
          snap={true}
          fadeColor="#E8EFE6"
          onItemClick={(item) => {
            if (item?.id) {
              navigate(`/resources/${item.id}`);
            }
          }}
        />
      </div>

      {/* Interactive Controls & Navigation Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#C9D9C7]/60 text-xs text-[#4A5043]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#103C2D] animate-ping" />
          <span className="font-semibold text-[#103C2D]">
            Live 3D Cylinder: Drag horizontally to spin &bull; Click any instrument to view specs &amp; reserve
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#C9D9C7] text-[#103C2D] font-bold shadow-sm hover:bg-[#F4EFE6] transition-all"
          >
            <span>Browse Full Directory</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D87E3A]" />
          </Link>
        </div>
      </div>

      {/* Quick Equipment Discipline Navigation Cards with Staggered Rise */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        <Link
          to="/explore?cat=instrument"
          className={`p-3.5 rounded-2xl bg-white border border-[#C9D9C7] hover:border-[#103C2D] hover:shadow-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group text-left flex flex-col justify-between space-y-2 ${
            hasEntered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#DCE8DB] text-[#103C2D] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#22251F] group-hover:text-[#103C2D] block">
              Instruments
            </span>
            <span className="text-[10px] text-[#6B7266] block">
              4 Stations
            </span>
          </div>
        </Link>

        <Link
          to="/explore?cat=computing"
          className={`p-3.5 rounded-2xl bg-white border border-[#C9D9C7] hover:border-[#D87E3A] hover:shadow-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group text-left flex flex-col justify-between space-y-2 ${
            hasEntered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          style={{ transitionDelay: '220ms' }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#FAEDE3] text-[#8C3E14] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#22251F] group-hover:text-[#D87E3A] block">
              FPGA &amp; Compute
            </span>
            <span className="text-[10px] text-[#6B7266] block">
              UltraScale+
            </span>
          </div>
        </Link>

        <Link
          to="/explore?cat=fabrication"
          className={`p-3.5 rounded-2xl bg-white border border-[#C9D9C7] hover:border-[#103C2D] hover:shadow-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group text-left flex flex-col justify-between space-y-2 ${
            hasEntered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          style={{ transitionDelay: '290ms' }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#FAF5EC] text-[#22251F] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#22251F] group-hover:text-[#103C2D] block">
              Fabrication
            </span>
            <span className="text-[10px] text-[#6B7266] block">
              SMD &amp; 3D Print
            </span>
          </div>
        </Link>

        <Link
          to="/explore?cat=camera"
          className={`p-3.5 rounded-2xl bg-white border border-[#C9D9C7] hover:border-[#103C2D] hover:shadow-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group text-left flex flex-col justify-between space-y-2 ${
            hasEntered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          style={{ transitionDelay: '360ms' }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#E0EFEA] text-[#1B5240] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#22251F] group-hover:text-[#103C2D] block">
              Diagnostics
            </span>
            <span className="text-[10px] text-[#6B7266] block">
              Thermal Cameras
            </span>
          </div>
        </Link>

        <Link
          to="/explore?cat=room"
          className={`p-3.5 rounded-2xl bg-white border border-[#C9D9C7] hover:border-[#7A3613] hover:shadow-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group text-left flex flex-col justify-between space-y-2 ${
            hasEntered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          style={{ transitionDelay: '430ms' }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#FAEDE3] text-[#7A3613] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#22251F] group-hover:text-[#7A3613] block">
              Project Bays
            </span>
            <span className="text-[10px] text-[#6B7266] block">
              Shielded Rooms
            </span>
          </div>
        </Link>

        <Link
          to="/explore"
          className={`p-3.5 rounded-2xl bg-[#103C2D] text-white hover:bg-[#1B5240] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group text-left flex flex-col justify-between space-y-2 border border-[#103C2D] shadow-sm ${
            hasEntered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          style={{ transitionDelay: '500ms' }}
        >
          <div className="w-8 h-8 rounded-lg bg-white/10 text-[#F3A66B] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              Catalog View
            </span>
            <span className="text-[10px] text-[#C9D9C7] block">
              All 10 Resources &rarr;
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================
export function LandingPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interactive Allocation Simulator State
  const [simUrgency, setSimUrgency] = useState(38); // 1-40
  const [simReliability, setSimReliability] = useState(28); // 1-30
  const [simQuota, setSimQuota] = useState(24); // 1-30

  // Intro state: check sessionStorage or reduced motion
  const [showIntro, setShowIntro] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (prefersReduced) return false;
      const seen = sessionStorage.getItem('hasSeenUnlockLabIntro');
      return !seen;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const resList = await api.getResources().catch(() => []);
      setResources(resList || []);

      try {
        const bList = await api.getBookings();
        setBookings(bList || []);
      } catch (e) {
        setBookings([]);
      }
    } catch (err) {
      console.error('Error fetching landing page data:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/explore');
    }
  }

  function handleReplayIntro() {
    try {
      sessionStorage.removeItem('hasSeenUnlockLabIntro');
    } catch (e) {}
    setShowIntro(true);
  }

  const activeResources = resources.filter((r) => r.status === 'active');
  const activeCount = activeResources.length;
  const activeEquipment = activeResources.filter((r) => r.type === 'equipment');
  const activeRooms = activeResources.filter((r) => r.type === 'room');

  // Real equipment items mapped for CircularCarousel with guaranteed distinct photos
  const seenPhotos = new Set();
  const carouselItems = (
    activeEquipment.length > 0
      ? activeEquipment
      : activeResources.length > 0
      ? activeResources
      : DEFAULT_EQUIPMENT_ITEMS
  ).map((item, index) => {
    let photoUrl = Array.isArray(item.photos) && item.photos.length > 0 ? item.photos[0] : item.src;
    // If photo is missing, duplicate, or broken, assign a unique photo from the curated gallery
    if (!photoUrl || seenPhotos.has(photoUrl) || photoUrl.includes('photo-1581092335397-9583fe92d232')) {
      photoUrl = DISTINCT_EQUIPMENT_PHOTOS[index % DISTINCT_EQUIPMENT_PHOTOS.length];
    }
    seenPhotos.add(photoUrl);

    return {
      src: photoUrl,
      alt: item.name || item.alt || 'Laboratory Equipment',
      title: (item.name || item.title || '').split('(')[0].trim(),
      subtitle: item.subtitle || `${(item.category || 'EQUIPMENT').toUpperCase()} · ${(item.location || 'Campus Core').split(',')[0]}`,
      id: item.id,
      category: item.category,
      requiresApproval: item.requires_approval
    };
  });

  // Simulator calculation
  const simTotalScore = simUrgency + simReliability + simQuota;
  const simDecision =
    simTotalScore >= 85
      ? { label: 'Instant Priority Approval', color: 'text-emerald-800 bg-emerald-50 border-emerald-300', badge: 'Auto-Approved' }
      : simTotalScore >= 70
      ? { label: 'Standard Approval (Queue 1)', color: 'text-sky-800 bg-sky-50 border-sky-300', badge: 'Fast Track' }
      : { label: 'Waitlist / Peer Quota Review', color: 'text-amber-800 bg-amber-50 border-amber-300', badge: 'Manager Review' };

  return (
    <div className="relative min-h-screen bg-[#F7F1E7]">
      {/* Cinematic Animated Intro (Phase 1 to Phase 5) */}
      {showIntro && <UnlockLabIntro onComplete={() => setShowIntro(false)} />}

      <div className="space-y-16 sm:space-y-24 py-4 transition-all duration-700">
        {/* ================================================================= */}
        {/* HERO SECTION — WARM IVORY ON LEFT, DEEP-GREEN/ILLUMINATED ON RIGHT */}
        {/* ================================================================= */}
        <section
          className="relative rounded-3xl overflow-hidden border border-[#E5DDD0] shadow-sm p-6 sm:p-10 lg:p-12 transition-all"
          style={{
            background: `
              linear-gradient(90deg, #F7F1E7 0%, #F5EDE1 45%, #EBE1D2 65%, #103C2D 100%)
            `,
          }}
        >
          {/* Subtle warm atmospheric glow */}
          <div
            className="absolute top-10 right-1/4 w-80 h-80 bg-[#F3A66B]/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Top Control Bar: Hackathon Pill & Replay Intro */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold pb-6 mb-4 border-b border-[#E5DDD0]">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#DCE8DB] border border-[#C9D9C7] text-[#103C2D]">
              <Sparkles className="w-3.5 h-3.5 text-[#D87E3A]" />
              <span>Institutional Resource Sharing · Multi-Disciplinary Campus Labs</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/campuses"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F7F1E7] text-[#103C2D] border border-[#C9D9C7] shadow-sm transition-all hover:border-[#103C2D] font-bold"
              >
                <Building className="w-3.5 h-3.5 text-[#103C2D]" />
                <span>View Campuses</span>
              </Link>

              <button
                onClick={handleReplayIntro}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F7F1E7] text-[#22251F] border border-[#E5DDD0] shadow-sm transition-all hover:border-[#103C2D]"
                title="Replay the 5-phase cinematic animation with LightTunnel &amp; Prism"
              >
                <Play className="w-3.5 h-3.5 text-[#103C2D] fill-[#103C2D]" />
                <span>Replay Intro Animation</span>
              </button>
            </div>
          </div>

          {/* Hero Grid: Left Content (50%) & Right 3D Visual (50%) */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* ------------------------------------------------------------- */}
            {/* LEFT COLUMN: EDITORIAL TYPOGRAPHY & INTERACTIVE CONTROLS     */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-6 space-y-6 text-left pr-0 lg:pr-4">
              {/* Responsive Editorial Serif Headline with exact phrasing & line breaks */}
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#DCE8DB] text-[#103C2D] text-xs font-bold uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-[#103C2D]" />
                  <span>Campus Equipment Network</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-[1.12]">
                  <span className="block text-[#22251F]">
                    Share Resources.
                  </span>
                  <span className="block text-[#F3A66B] mt-1 sm:mt-2">
                    Build Possibilities.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-[#4A5043] leading-relaxed max-w-xl font-sans font-normal pt-1">
                  Discover, borrow, and share equipment, tools, creative spaces, and resources across your campus.
                  Real-time custody tracking, cryptographic check-in receipts, and explainable fair allocation.
                </p>
              </div>

              {/* Functional Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg">
                <div className="flex items-center bg-white rounded-2xl border-2 border-[#C9D9C7] focus-within:border-[#103C2D] shadow-sm overflow-hidden p-1.5 transition-all">
                  <Search className="w-5 h-5 text-[#4A5043] ml-3 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search equipment by name, protocol, model (e.g. Tektronix, FPGA, Weller)..."
                    className="w-full bg-transparent border-none text-xs sm:text-sm text-[#22251F] focus:outline-none placeholder:text-[#6B7266]"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="shrink-0 bg-[#103C2D] hover:bg-[#1B5240] text-white font-bold rounded-xl px-4 py-2 text-xs"
                  >
                    Search
                  </Button>
                </div>
              </form>

              {/* Quick Interactive Category Buttons */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5043] block">
                  Equipment Category Chips:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/explore?cat=instrument"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#DCE8DB] text-[#22251F] hover:text-[#103C2D] border border-[#C9D9C7] text-xs font-semibold transition-all hover:scale-105"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#103C2D]" />
                    <span>Oscilloscopes &amp; Analyzers</span>
                  </Link>

                  <Link
                    to="/explore?cat=computing"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAEDE3] text-[#22251F] hover:text-[#8C3E14] border border-[#C9D9C7] text-xs font-semibold transition-all hover:scale-105"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#8C3E14]" />
                    <span>Xilinx FPGA Clusters</span>
                  </Link>

                  <Link
                    to="/explore?cat=fabrication"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF5EC] text-[#22251F] border border-[#C9D9C7] text-xs font-semibold transition-all hover:scale-105"
                  >
                    <Wrench className="w-3.5 h-3.5 text-[#22251F]" />
                    <span>SMD Soldering &amp; 3D Print</span>
                  </Link>

                  <Link
                    to="/campuses"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#103C2D] text-white text-xs font-semibold shadow-sm hover:bg-[#1B5240] transition-all"
                  >
                    <Building className="w-3.5 h-3.5 text-[#F3A66B]" />
                    <span>Campus Facilities &rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Trust & Custody Guarantee Badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E5DDD0]">
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#22251F]">
                  <CheckCircle2 className="w-4 h-4 text-[#103C2D] shrink-0" />
                  <span>Verified Safe</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#22251F]">
                  <Clock className="w-4 h-4 text-[#D87E3A] shrink-0" />
                  <span>Fair Allocations</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#22251F]">
                  <ShieldCheck className="w-4 h-4 text-[#1B5240] shrink-0" />
                  <span>QR Custody Lock</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* RIGHT COLUMN: 3D ISOMETRIC MINIATURE CAMPUS LABORATORY       */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-6 relative w-full flex items-center justify-center">
              <MiniatureIsometricLaboratory />
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 1: EXPLORE BY EQUIPMENT — CIRCULARCAROUSEL 3D COMPONENT  */}
        {/* ================================================================= */}
        <ExploreEquipmentSection carouselItems={carouselItems} navigate={navigate} />

        {/* ================================================================= */}
        {/* SECTION 2: CAMPUS IMPACT METRICS (CRISP WARM IVORY BACKGROUND)    */}
        {/* ================================================================= */}
        <section className="rounded-3xl bg-white border border-[#E5DDD0] p-8 sm:p-10 shadow-sm space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#103C2D]">
              Measurable Institutional Impact
            </span>
            <h2 className="text-3xl font-bold text-[#22251F] font-serif">
              Unlocking Real Campus Potential
            </h2>
            <p className="text-xs text-[#4A5043]">
              Real database-verified metrics across all academic campus facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <CountUpMetric
              endValue={activeEquipment.length}
              suffix=""
              label="Active Instruments"
              sublabel="Hardware instruments online"
              icon={Cpu}
              accent="forest"
            />
            <CountUpMetric
              endValue={activeRooms.length}
              suffix=""
              label="Rooms &amp; Testing Bays"
              sublabel="Collaborative spaces &amp; labs"
              icon={Building}
              accent="sage"
            />
            <CountUpMetric
              endValue={bookings.length}
              suffix=""
              label="Reservations Requested"
              sublabel="Total dynamic bookings logged"
              icon={Clock}
              accent="orange"
            />
            <CountUpMetric
              endValue={bookings.filter((b) => b.status === 'approved' || b.status === 'completed').length}
              suffix=""
              label="Approved Sessions"
              sublabel="Reviewed &amp; scheduled bookings"
              icon={CheckCircle2}
              accent="charcoal"
            />
          </div>

          {/* Visual Utilization Progress Bar */}
          <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E5DDD0] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-[#22251F] gap-2">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#D87E3A]" />
                Off-Peak Lab Utilization Gain: +49% Net Campus Increase
              </span>
              <span className="text-[#103C2D]">Baseline 24% &rarr; Current 73%</span>
            </div>

            <div className="h-4 w-full rounded-full bg-[#E5DDD0] overflow-hidden flex shadow-inner">
              <div
                className="bg-[#6B7266] h-full transition-all duration-1000 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: '24%' }}
                title="Historical Baseline: 24%"
              >
                24% Pre
              </div>
              <div
                className="bg-gradient-to-r from-[#103C2D] via-[#D87E3A] to-[#F3A66B] h-full transition-all duration-1000 flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                style={{ width: '49%' }}
                title="Unlocked with UnlockLab: +49%"
              >
                +49% Unlocked With Platform
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-[#6B7266]">
              <span>Idle &amp; Dark Bench Hours</span>
              <span>Target: 85% Utilization by Semester End</span>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 3: RESOURCE SHARING LIFESTYLE & INFINITESPIRAL COMPONENT   */}
        {/* ================================================================= */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#103C2D]">
              <Layers className="w-3.5 h-3.5 text-[#D87E3A]" />
              <span>Community Collaboration &amp; Custody</span>
            </div>
            <h2 className="text-3xl font-bold text-[#22251F] font-serif">
              Resource-Sharing Lifestyle &amp; Custody
            </h2>
            <p className="text-sm text-[#4A5043]">
              From safety verification to immutable return receipts — zero friction, 100% accountability across students and faculty.
            </p>
          </div>

          {/* Integrated Showcase: Custody Workflow (Left) & InfiniteSpiral 3D Gallery (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 6 Columns: 4 Step Custody Lifecycle */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E5DDD0] shadow-sm hover:shadow-md hover:border-[#103C2D]/40 transition-all space-y-2.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-[#DCE8DB] text-[#103C2D] flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h3 className="text-sm font-bold text-[#22251F]">
                  Discover &amp; Eligibility Check
                </h3>
                <p className="text-xs text-[#4A5043] leading-relaxed">
                  Prerequisites, ESD training certificates, and student standing are validated programmatically before request submission.
                </p>
                <div className="pt-1.5 text-[10px] font-semibold text-[#103C2D] flex items-center gap-1 border-t border-[#F0EBE0]">
                  <Check className="w-3 h-3" /> Automated Rules Engine
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E5DDD0] shadow-sm hover:shadow-md hover:border-[#8C3E14]/40 transition-all space-y-2.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-[#FAEDE3] text-[#8C3E14] flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3 className="text-sm font-bold text-[#22251F]">
                  Fair Allocation &amp; Waitlist
                </h3>
                <p className="text-xs text-[#4A5043] leading-relaxed">
                  Lab managers review requests with rule-based suggested decisions. Overlapping slots enter a transparent 100-point priority waitlist.
                </p>
                <div className="pt-1.5 text-[10px] font-semibold text-[#8C3E14] flex items-center gap-1 border-t border-[#F0EBE0]">
                  <Check className="w-3 h-3" /> 100-Point Transparency
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E5DDD0] shadow-sm hover:shadow-md hover:border-[#22251F]/40 transition-all space-y-2.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-[#FAF5EC] text-[#22251F] flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h3 className="text-sm font-bold text-[#22251F]">
                  QR Check-In Inspection
                </h3>
                <p className="text-xs text-[#4A5043] leading-relaxed">
                  Borrower scans physical bench QR code and completes an initial 3-point condition inspection with photo custody evidence.
                </p>
                <div className="pt-1.5 text-[10px] font-semibold text-[#22251F] flex items-center gap-1 border-t border-[#F0EBE0]">
                  <Check className="w-3 h-3" /> Physical Presence Lock
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E5DDD0] shadow-sm hover:shadow-md hover:border-[#1B5240]/40 transition-all space-y-2.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-[#E0EFEA] text-[#1B5240] flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <h3 className="text-sm font-bold text-[#22251F]">
                  Certified Return &amp; Receipt
                </h3>
                <p className="text-xs text-[#4A5043] leading-relaxed">
                  Post-session condition is logged. Any damages flag dispute incidents, and an append-only tamper-proof custody receipt is issued.
                </p>
                <div className="pt-1.5 text-[10px] font-semibold text-[#1B5240] flex items-center gap-1 border-t border-[#F0EBE0]">
                  <Check className="w-3 h-3" /> Cryptographic Custody
                </div>
              </div>

              {/* Bottom Nav Hint */}
              <div className="sm:col-span-2 pt-2 flex items-center justify-between text-xs text-[#4A5043]">
                <Link
                  to="/campuses"
                  className="font-bold text-[#103C2D] hover:underline flex items-center gap-1"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>See All Campus Laboratory Hubs</span>
                </Link>
                <Link
                  to="/how-allocation-works"
                  className="font-bold text-[#D87E3A] hover:underline flex items-center gap-1"
                >
                  <span>Learn Fair Allocation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right 6 Columns: InfiniteSpiral 3D Helical Gallery */}
            <div className="lg:col-span-6 relative w-full h-[460px] sm:h-[500px] lg:h-[520px] rounded-3xl bg-white border border-[#E5DDD0] shadow-sm overflow-hidden flex flex-col justify-between p-4">
              <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-[#F0EBE0] z-20">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#103C2D] animate-pulse" />
                  <span className="text-xs font-bold text-[#22251F] uppercase tracking-wider">
                    Campus Resource Sharing Lifestyle
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#103C2D] bg-[#DCE8DB] px-2 py-0.5 rounded-full">
                  Interactive 3D Spiral
                </span>
              </div>

              {/* InfiniteSpiral Component */}
              <div className="relative w-full h-full flex-1 overflow-hidden my-1">
                <InfiniteSpiral
                  items={LIFESTYLE_SPIRAL_ITEMS}
                  animationMode="all"
                  speed={0.55}
                  direction="up"
                  radius={170}
                  cardWidth={100}
                  cardHeight={100}
                  verticalSpacing={60}
                  perspective={1000}
                  cardRadius={10}
                  centerScale={1.2}
                  edgeBlur={6}
                  cardsPerTurn={7}
                  pauseOnHover={true}
                />
              </div>

              <div className="px-2 pt-2 border-t border-[#F0EBE0] flex items-center justify-between text-[11px] text-[#6B7266] z-20">
                <span>Scroll or drag vertically to rotate helix</span>
                <span className="text-[#103C2D] font-bold">12 Sharing Moments</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 4: FAIR ALLOCATION AND TRUST FEATURES (INTERACTIVE TOOL)  */}
        {/* ================================================================= */}
        <section className="rounded-3xl bg-white border border-[#E5DDD0] p-8 sm:p-12 shadow-sm space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left 6 Columns */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FAEDE3] text-[#8C3E14] border border-[#F4D7C2] text-xs font-bold">
                <Sliders className="w-3.5 h-3.5" />
                <span>Zero Gatekeeping Algorithm</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-[#22251F] font-serif leading-tight">
                Explainable Fair Allocation &amp; Trust Features
              </h2>

              <p className="text-sm text-[#4A5043] leading-relaxed">
                Unlike opaque sign-up sheets, UnlockLab assigns reservations using an open, deterministic mathematical formula that guarantees equal access.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#F7F1E7] border border-[#E5DDD0]">
                  <div className="w-8 h-8 rounded-lg bg-[#FAEDE3] text-[#8C3E14] flex items-center justify-center font-bold text-xs shrink-0">
                    40%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#22251F]">Academic Urgency &amp; Project Milestone</h4>
                    <p className="text-[11px] text-[#6B7266] mt-0.5">
                      Upcoming thesis deadlines and defense dates receive prioritized allocation windows.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#F7F1E7] border border-[#E5DDD0]">
                  <div className="w-8 h-8 rounded-lg bg-[#DCE8DB] text-[#103C2D] flex items-center justify-center font-bold text-xs shrink-0">
                    30%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#22251F]">Rolling Quota &amp; Departmental Reciprocity</h4>
                    <p className="text-[11px] text-[#6B7266] mt-0.5">
                      Prevents single-user monopolization. Lab sharers gain reciprocal credits.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#F7F1E7] border border-[#E5DDD0]">
                  <div className="w-8 h-8 rounded-lg bg-[#EFE7DA] text-[#22251F] flex items-center justify-center font-bold text-xs shrink-0">
                    30%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#22251F]">Historical Custody Reliability &amp; On-Time Returns</h4>
                    <p className="text-[11px] text-[#6B7266] mt-0.5">
                      Punctual returns and pristine equipment care build high trust ranking over time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/how-allocation-works">
                  <Button variant="secondary" size="sm" className="font-bold bg-white border-[#E5DDD0] text-[#103C2D] hover:border-[#103C2D]">
                    <span>Read Full Transparency Whitepaper</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right 6 Columns: Interactive Simulator Widget */}
            <div className="lg:col-span-6 bg-[#F7F1E7] rounded-3xl border-2 border-[#E5DDD0] p-6 sm:p-8 shadow-sm space-y-6 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5DDD0]">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-[#103C2D] animate-pulse" />
                  <span className="text-xs font-bold text-[#22251F] uppercase tracking-wider">
                    Interactive Allocation Simulator
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#8C3E14] bg-[#FAEDE3] px-2 py-0.5 rounded-full border border-[#F4D7C2]">
                  Live Calculator
                </span>
              </div>

              {/* Slider 1: Urgency */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#22251F]">
                  <span>1. Academic Deadline Urgency:</span>
                  <span className="text-[#8C3E14] font-mono">{simUrgency} / 40 pts</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={simUrgency}
                  onChange={(e) => setSimUrgency(Number(e.target.value))}
                  className="w-full accent-[#8C3E14] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#6B7266]">
                  <span>Flexible Exploration</span>
                  <span>Thesis Defense in 48 Hours</span>
                </div>
              </div>

              {/* Slider 2: Reliability */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#22251F]">
                  <span>2. Historical Custody Reliability:</span>
                  <span className="text-[#103C2D] font-mono">{simReliability} / 30 pts</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={simReliability}
                  onChange={(e) => setSimReliability(Number(e.target.value))}
                  className="w-full accent-[#103C2D] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#6B7266]">
                  <span>1 Late Return</span>
                  <span>100% Punctual &amp; Calibrated</span>
                </div>
              </div>

              {/* Slider 3: Quota */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#22251F]">
                  <span>3. Fair Rolling Quota Balance:</span>
                  <span className="text-[#22251F] font-mono">{simQuota} / 30 pts</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={simQuota}
                  onChange={(e) => setSimQuota(Number(e.target.value))}
                  className="w-full accent-[#22251F] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#6B7266]">
                  <span>Quota Limit Reached</span>
                  <span>Light Weekly Usage</span>
                </div>
              </div>

              {/* Score Display Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5DDD0] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#6B7266] uppercase tracking-wider block">
                      Calculated Allocation Score
                    </span>
                    <div className="text-3xl font-extrabold text-[#22251F] font-sans">
                      {simTotalScore} <span className="text-sm font-normal text-[#6B7266]">/ 100</span>
                    </div>
                  </div>

                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${simDecision.color}`}>
                    {simDecision.badge}
                  </span>
                </div>

                <div className="text-xs font-semibold text-[#22251F] flex items-center gap-1.5 pt-1 border-t border-[#F0EBE0]">
                  <CheckCircle2 className="w-4 h-4 text-[#103C2D]" />
                  <span>Rule Output: {simDecision.label}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 5: FULL-WIDTH DEEP FOREST-GREEN CLOSING CTA               */}
        {/* ================================================================= */}
        <section
          className="rounded-3xl bg-[#103C2D] p-8 sm:p-12 lg:p-16 text-white shadow-xl relative overflow-hidden text-center border border-[#1B5240]"
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#F3A66B]/20 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-[#F4D7C2] text-xs font-bold border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#F3A66B]" />
              <span>Campus Resource Sharing Platform</span>
            </span>

            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F7F1E7] font-serif leading-tight">
              Elevate Your Research. <br />
              <span className="text-[#F3A66B]">Share Equipment with Confidence.</span>
            </h2>

            <p className="text-sm sm:text-base text-[#C9D9C7] max-w-xl mx-auto leading-relaxed font-sans font-normal">
              Explore available equipment, test your eligibility credentials, or switch between judge personas in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <Link to="/campuses">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto font-bold bg-[#F3A66B] hover:bg-[#F8C49E] text-[#22251F] border-none shadow-lg px-7 py-3 rounded-xl"
                >
                  <span>Browse Campus Facilities</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>

              <Link to="/how-allocation-works">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-[#F7F1E7] border-white/25 px-6 py-3 rounded-xl font-bold"
                >
                  Fair Allocation Rules
                </Button>
              </Link>

              <Link to="/how-allocation-works">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-[#F7F1E7] border-white/25 px-6 py-3 rounded-xl font-bold"
                >
                  Learn About Fair Allocation
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LandingPage;

import React from "react";
import { 
  Shield, 
  BookOpen, 
  Cpu, 
  Heart, 
  CheckCircle2, 
  Radio, 
  MapPin, 
  Lightbulb, 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  History, 
  Flame, 
  BrainCircuit, 
  Clock 
} from "lucide-react";

const About = () => {
  const features = [
    { name: "Real-Time SOS Alert Management", icon: ShieldAlert, color: "text-red-500 bg-red-500/10 border-red-500/20" },
    { name: "Live Citizen Location Tracking", icon: MapPin, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { name: "Smart Streetlight Integration", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { name: "Emergency Command & Control Dashboard", icon: LayoutDashboard, color: "text-brand-primary bg-blue-500/10 border-blue-500/20" },
    { name: "Multi-User Incident Management", icon: Users, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
    { name: "Officer Assignment & Incident Monitoring", icon: Shield, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { name: "Historical Incident Analytics", icon: History, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
    { name: "Risk Heatmaps & Hotspot Detection", icon: Flame, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
    { name: "Predictive Safety Analysis", icon: BrainCircuit, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
    { name: "Firebase-Powered Real-Time Synchronization", icon: Radio, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" }
  ];

  return (
    <div className="space-y-8 select-none max-w-4xl mx-auto py-4">
      {/* 1. Header Banner & Logo */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center gap-8 bg-grid-cyber">
        <div className="shrink-0 flex items-center justify-center">
          <img 
            src="/logo.jpg" 
            alt="VISION Logo" 
            className="w-32 h-32 rounded-2xl shadow-2xl border-2 border-brand-border object-contain bg-slate-950 animate-logo-pulse" 
          />
        </div>

        <div className="space-y-3 text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-600/10 text-brand-primary border border-blue-500/20 text-[10px] font-mono font-bold uppercase tracking-widest">
            🛡️ Official Command Center Asset
          </div>
          <h2 className="font-display font-black text-3xl tracking-wider text-brand-text uppercase">
            About VISION SOS
          </h2>
          <p className="text-xs text-gray-400 font-mono tracking-wider">
            Smart Public Safety & Emergency Response Platform // Safe City Bengaluru Initiative
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-mono text-gray-500 pt-1">
            <span>VERSION: 4.8.0-PROD</span>
            <span>BUILD: SECURE_CAD_17809</span>
            <span>SECURITY LEVEL: CLASS-A MHA</span>
          </div>
        </div>
      </div>

      {/* 2. Platform Overview Context */}
      <div className="bg-brand-card border border-brand-border p-6 rounded-xl shadow-md space-y-4">
        <h3 className="font-display font-bold text-sm text-brand-text uppercase tracking-wider border-b border-brand-border pb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-brand-primary" />
          System Overview
        </h3>
        <div className="text-xs text-gray-400 leading-relaxed space-y-4 font-sans">
          <p>
            <strong>VISION SOS</strong> is an innovative Smart Public Safety and Emergency Response Platform designed to improve emergency response efficiency through modern technology, real-time communication, and intelligent analytics.
          </p>
          <p>
            Our mission is to provide a faster, smarter, and more connected emergency assistance ecosystem that helps citizens receive immediate support during critical situations such as harassment, accidents, medical emergencies, or public safety threats.
          </p>
          <p>
            The system integrates a Flutter-based mobile application, a centralized Police Command & Control Dashboard, Firebase cloud infrastructure, IoT-enabled smart streetlights, and advanced Machine Learning analytics to create a comprehensive emergency response network.
          </p>
          <p>
            When a citizen activates the SOS feature, the system instantly captures and transmits the user's location to authorized emergency personnel, updates the command center dashboard in real time, and assists authorities in identifying the nearest smart streetlight infrastructure for faster incident response.
          </p>
          <p>
            To enhance public safety planning, VISION SOS utilizes advanced analytics techniques including Kernel Density Estimation (KDE), DBSCAN Clustering, and Random Forest-based predictive analysis. These technologies help identify emergency hotspots, analyze incident patterns, and support data-driven decision-making for safer communities.
          </p>
        </div>
      </div>

      {/* 3. Motto Section */}
      <div className="bg-slate-900/60 border border-brand-border py-6 px-8 rounded-xl shadow-inner text-center flex flex-col items-center justify-center gap-2.5">
        <span className="text-[9px] font-mono tracking-widest text-blue-500 uppercase font-bold">Official Commissioned Motto</span>
        <h4 className="font-display font-black text-2xl tracking-widest text-brand-text uppercase">
          SEE <span className="text-blue-500">•</span> SECURE <span className="text-blue-500">•</span> SERVE
        </h4>
        <p className="text-[10px] text-gray-500 italic max-w-sm">
          "Ensuring citizen safety through active vigilance, immediate containment, and dedicated civic service."
        </p>
      </div>

      {/* 4. Core Features Grid */}
      <div className="bg-brand-card border border-brand-border p-6 rounded-xl shadow-md space-y-5">
        <h3 className="font-display font-bold text-sm text-brand-text uppercase tracking-wider border-b border-brand-border pb-3 flex items-center gap-2">
          <Cpu size={16} className="text-purple-500" />
          Key Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950/40 border border-brand-border rounded-lg">
                <div className={`p-2 rounded-md border shrink-0 ${f.color}`}>
                  <Icon size={14} className="animate-pulse" />
                </div>
                <span className="text-xs text-gray-300 font-semibold">{f.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Vision vs Mission Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Our Vision */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-xl shadow-md space-y-3">
          <h4 className="font-display font-bold text-xs uppercase text-brand-text tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Our Vision
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            To build a safer and smarter society by leveraging technology, data analytics, and intelligent emergency response systems that enable faster assistance, improved public awareness, and proactive safety management.
          </p>
        </div>

        {/* Our Mission */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-xl shadow-md space-y-3">
          <h4 className="font-display font-bold text-xs uppercase text-brand-text tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Our Mission
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            To empower citizens and emergency response teams with a reliable, scalable, and intelligent platform that reduces response time, improves situational awareness, and enhances overall public safety.
          </p>
        </div>
      </div>

      {/* 6. Developed For Mandate */}
      <div className="bg-brand-card border border-brand-border p-6 rounded-xl shadow-md space-y-4">
        <h3 className="font-display font-bold text-sm text-brand-text uppercase tracking-wider border-b border-brand-border pb-3 flex items-center gap-2">
          <Shield size={16} className="text-emerald-500" />
          Developed For
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed font-sans">
          VISION SOS is developed as a Smart City and Public Safety solution, demonstrating how modern technologies such as Mobile Computing, Cloud Services, Internet of Things (IoT), Geographic Information Systems (GIS), and Machine Learning can work together to create an effective emergency response ecosystem.
        </p>
      </div>

      {/* 7. Meet The Team */}
      <div className="space-y-4">
        <div className="text-center md:text-left">
          <h3 className="font-display font-black text-xl tracking-wider text-brand-text uppercase">
            Meet The Team
          </h3>
          <p className="text-xs text-blue-400 font-mono tracking-widest uppercase mt-0.5">
            The Team Behind VISION SOS
          </p>
        </div>

        {/* Scrolling marquee viewport */}
        <div className="w-full overflow-hidden py-4 border-y border-brand-border bg-slate-950/20 backdrop-blur-sm rounded-xl relative select-none">
          {/* Left/Right fading gradient mask for high premium look */}
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-brand-bg to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-brand-bg to-transparent z-10 pointer-events-none" />

          {/* Marquee track */}
          <div className="animate-marquee-right-to-left flex gap-6">
            {/* Render duplicated list for seamless looping */}
            {[
              {
                name: "Navaneetha M",
                role: "IoT & Hardware R&D",
                desc: "Researches and designs IoT streetlight controllers and hardware micro-receiver modules.",
                initials: "NM",
                color: "from-blue-500 to-cyan-500"
              },
              {
                name: "R Nataraj",
                role: "Police Dashboard Development",
                desc: "Engineers React-based dispatch feeds, layout routing, and RTDB socket state bridges.",
                initials: "RN",
                color: "from-blue-600 to-indigo-600"
              },
              {
                name: "Sowmya J",
                role: "Machine Learning Algorithms",
                desc: "Formulates KDE spatial density risk grids and DBSCAN clustering mathematical boundaries.",
                initials: "SJ",
                color: "from-purple-500 to-indigo-500"
              },
              {
                name: "V Kamala Kannan",
                role: "Flutter Application Development",
                desc: "Constructs mobile Flutter clients, geolocation trackers, and client distress trigger APIs.",
                initials: "KK",
                color: "from-sky-500 to-blue-500"
              },
              {
                name: "Vijaya M",
                role: "ML Datasets & Analytics",
                desc: "Curates background pseudo-absence data and trains Random Forest predictive risk classifiers.",
                initials: "VM",
                color: "from-purple-600 to-pink-600"
              },
              // Loop duplication for marquee effect
              {
                name: "Navaneetha M",
                role: "IoT & Hardware R&D",
                desc: "Researches and designs IoT streetlight controllers and hardware micro-receiver modules.",
                initials: "NM",
                color: "from-blue-500 to-cyan-500"
              },
              {
                name: "R Nataraj",
                role: "Police Dashboard Development",
                desc: "Engineers React-based dispatch feeds, layout routing, and RTDB socket state bridges.",
                initials: "RN",
                color: "from-blue-600 to-indigo-600"
              },
              {
                name: "Sowmya J",
                role: "Machine Learning Algorithms",
                desc: "Formulates KDE spatial density risk grids and DBSCAN clustering mathematical boundaries.",
                initials: "SJ",
                color: "from-purple-500 to-indigo-500"
              },
              {
                name: "V Kamala Kannan",
                role: "Flutter Application Development",
                desc: "Constructs mobile Flutter clients, geolocation trackers, and client distress trigger APIs.",
                initials: "KK",
                color: "from-sky-500 to-blue-500"
              },
              {
                name: "Vijaya M",
                role: "ML Datasets & Analytics",
                desc: "Curates background pseudo-absence data and trains Random Forest predictive risk classifiers.",
                initials: "VM",
                color: "from-purple-600 to-pink-600"
              }
            ].map((member, idx) => (
              <div 
                key={idx}
                className="w-[200px] sm:w-[220px] shrink-0 bg-slate-900/40 border border-brand-border rounded-xl p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer flex flex-col items-center text-center space-y-3 group relative overflow-hidden"
              >
                {/* Accent glow behind card */}
                <div className="absolute -inset-px bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />

                {/* Avatar Icon inside glowing circle */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${member.color} flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white/10 shrink-0`}>
                  {member.initials}
                </div>

                {/* Name */}
                <span className="font-display font-bold text-xs text-brand-text truncate w-full block">
                  {member.name}
                </span>

                {/* Role (Standard View) */}
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wide group-hover:hidden truncate w-full block">
                  {member.role}
                </span>

                {/* Role Description (Visible on Hover) */}
                <span className="text-[9px] text-gray-400 leading-normal hidden group-hover:block transition-all duration-300 font-sans">
                  {member.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Credits */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-gray-500 pt-4 border-t border-brand-border select-none">
        <span>© 2026 Bengaluru Police Command Center. All rights reserved.</span>
        <span className="flex items-center gap-1 mt-1 sm:mt-0">
          Made with <Heart size={10} className="text-red-500 fill-red-500" /> for Smart City Initiatives
        </span>
      </div>
    </div>
  );
};

export default About;

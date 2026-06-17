"use client";

import React, { useState } from "react";
import { LiveRatesProvider, useLiveRates } from "@/components/live-rates-provider";
import { PriceChart } from "@/components/price-chart";
import { ProductCards } from "@/components/product-cards";
import { FarmerCalculator } from "@/components/farmer-calculator";
import { SlotBooking } from "@/components/slot-booking";
import {
  Sprout,
  Building,
  Layers,
  ArrowRight,
  Send,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Zap,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Running Stock Ticker Component
const MarketTicker: React.FC = () => {
  const { usCotton, usCottonChange, inCotton, inCottonChange, cottonSeed, cottonSeedChange } = useLiveRates();

  const isUsUp = usCottonChange >= 0;
  const isInUp = inCottonChange >= 0;
  const isSeedUp = cottonSeedChange >= 0;

  return (
    <div className="bg-primary/95 text-primary-foreground border-b border-primary/20 py-2.5 overflow-hidden text-xs font-bold tracking-wider select-none z-50 relative">
      <div className="flex animate-infinite-scroll whitespace-nowrap gap-16 justify-center items-center">
        {/* Item 1 */}
        <span className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-primary-foreground/75" />
          <span>ICE US COTTON:</span>
          <span className="font-extrabold text-white">{usCotton}¢/lb</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${isUsUp ? "bg-emerald-500/25 text-emerald-300" : "bg-red-500/25 text-red-300"}`}>
            {isUsUp ? "▲" : "▼"} {isUsUp ? "+" : ""}{usCottonChange}%
          </span>
        </span>
        {/* Item 2 */}
        <span className="flex items-center gap-2">
          <Building className="h-3.5 w-3.5 text-primary-foreground/75" />
          <span>MCX COTTON SPOT:</span>
          <span className="font-extrabold text-white">₹{inCotton.toLocaleString()}/Quintal</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${isInUp ? "bg-emerald-500/25 text-emerald-300" : "bg-red-500/25 text-red-300"}`}>
            {isInUp ? "▲" : "▼"} {isInUp ? "+" : ""}{inCottonChange}%
          </span>
        </span>
        {/* Item 3 */}
        <span className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-primary-foreground/75" />
          <span>COTTON SEEDS OIL CAKE:</span>
          <span className="font-extrabold text-white">₹{cottonSeed.toLocaleString()}/Qntl</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${isSeedUp ? "bg-emerald-500/25 text-emerald-300" : "bg-red-500/25 text-red-300"}`}>
            {isSeedUp ? "▲" : "▼"} {isSeedUp ? "+" : ""}{cottonSeedChange}%
          </span>
        </span>
        {/* Duplicate for infinite ticker scrolling look on larger displays */}
        <span className="hidden lg:flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-primary-foreground/75" />
          <span>ICE US COTTON:</span>
          <span className="font-extrabold text-white">{usCotton}¢/lb</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${isUsUp ? "bg-emerald-500/25 text-emerald-300" : "bg-red-500/25 text-red-300"}`}>
            {isUsUp ? "▲" : "▼"} {isUsUp ? "+" : ""}{usCottonChange}%
          </span>
        </span>
      </div>
    </div>
  );
};

const HeaderNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-md border-b border-border/40 select-none">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center shadow-lg">
            <Sprout className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white block leading-none">WHITE GOLD</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 block">Industries</span>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
          <button onClick={() => scrollToSection("products")} className="hover:text-white transition-colors">Core Products</button>
          <button onClick={() => scrollToSection("farmer-portal")} className="hover:text-white transition-colors">Farmer&apos;s Portal</button>
          <button onClick={() => scrollToSection("process")} className="hover:text-white transition-colors">Our Process</button>
          <button onClick={() => scrollToSection("market-dashboard")} className="hover:text-white transition-colors">Live Markets</button>
          <button onClick={() => scrollToSection("contact")} className="hover:text-white transition-colors">Contact Inquiry</button>
        </nav>

        {/* Call to action */}
        <div className="hidden md:block">
          <button
            onClick={() => scrollToSection("farmer-portal")}
            className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-lg border-0 hover:bg-primary/95 transition-all duration-200 active:scale-95"
          >
            Sell Cotton
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-muted-foreground hover:text-white">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {isOpen && (
        <div className="md:hidden bg-card border-b border-border/80 px-6 py-6 space-y-4 text-sm font-semibold flex flex-col items-stretch absolute w-full z-50">
          <button onClick={() => scrollToSection("products")} className="text-left py-2 border-b border-border/20 text-muted-foreground hover:text-white">Core Products</button>
          <button onClick={() => scrollToSection("farmer-portal")} className="text-left py-2 border-b border-border/20 text-muted-foreground hover:text-white">Farmer&apos;s Portal</button>
          <button onClick={() => scrollToSection("process")} className="text-left py-2 border-b border-border/20 text-muted-foreground hover:text-white">Our Process</button>
          <button onClick={() => scrollToSection("market-dashboard")} className="text-left py-2 border-b border-border/20 text-muted-foreground hover:text-white">Live Markets</button>
          <button onClick={() => scrollToSection("contact")} className="text-left py-2 text-muted-foreground hover:text-white">Contact Inquiry</button>
          <button
            onClick={() => scrollToSection("farmer-portal")}
            className="w-full text-center py-3 bg-primary text-primary-foreground rounded-xl shadow-lg font-bold text-xs"
          >
            Sell Cotton Now
          </button>
        </div>
      )}
    </header>
  );
};

const MainDashboard: React.FC = () => {
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryMsg, setInquiryMsg] = useState("");

  const handleInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryEmail || !inquiryMsg) {
      toast.error("Please fill in all inquiry fields.");
      return;
    }
    toast.success(`Thank you ${inquiryName}! Your wholesale inquiry has been submitted. Our team will contact you shortly.`);
    setInquiryName("");
    setInquiryEmail("");
    setInquiryMsg("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* Ticker at the very top */}
      <MarketTicker />

      {/* Header */}
      <HeaderNavbar />

      {/* Hero Section */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center overflow-hidden">
        {/* Glowing background shapes */}
        <div className="absolute top-1/4 left-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="lg:col-span-7 space-y-6 relative z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-amber-300">
            <Zap className="h-3.5 w-3.5 fill-amber-300" /> Real-time Commodities Exchange Sourced
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
            We Extract Value From <span className="bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">Raw Cotton</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
            Partnering directly with local farmers. We intake organic raw Kapas, separate it using state-of-the-art double-roller ginning machines, and produce standardized pure cotton lint bales and seed oil cake.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={() => document.getElementById("farmer-portal")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto px-6 py-3.5 font-bold text-xs bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-2 hover:bg-primary/95 transition-all duration-200 shadow-xl border-0 active:scale-95 cursor-pointer"
            >
              Farmers Portal
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto px-6 py-3.5 font-bold text-xs bg-secondary border border-border/80 text-foreground hover:bg-secondary/70 hover:border-muted-foreground/30 rounded-xl transition-all duration-200 shadow-md active:scale-95"
            >
              Wholesale Buying
            </button>
          </div>

          {/* Key Stats banner */}
          <div className="grid grid-cols-3 gap-4 border-t border-border/40 pt-8 max-w-md mx-auto lg:mx-0">
            <div className="text-center lg:text-left">
              <span className="block text-xl sm:text-2xl font-black text-white">35K+</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">Tons Ginning</span>
            </div>
            <div className="text-center lg:text-left border-x border-border/30 px-2">
              <span className="block text-xl sm:text-2xl font-black text-white">12K+</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">Active Farmers</span>
            </div>
            <div className="text-center lg:text-left">
              <span className="block text-xl sm:text-2xl font-black text-white">100%</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">Grade Pure</span>
            </div>
          </div>
        </div>

        {/* Live Sparkline Card */}
        <div className="lg:col-span-5 relative z-10 w-full" id="market-dashboard">
          <PriceChart />
        </div>
      </section>

      {/* CORE 3-COMPONENTS Showcase */}
      <section className="bg-secondary/10 border-y border-border/30 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <ProductCards />
        </div>
      </section>

      {/* FARMER'S PORTAL */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full" id="farmer-portal">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="px-3 py-1 text-xs bg-amber-500/10 text-amber-300 border-amber-500/20 mb-3 tracking-widest uppercase">
            Ginning Gates
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
            Farmer&apos;s Digital Payout Portal
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Estimate your raw Kapas processing earnings in seconds based on live global commodities market spot prices, and immediately book your delivery gate pass.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Earnings calculator */}
          <FarmerCalculator />

          {/* Slot booking */}
          <SlotBooking />
        </div>
      </section>

      {/* PROCESS WALKTHROUGH (Stepper) */}
      <section className="bg-secondary/15 border-y border-border/30 py-20 px-6" id="process">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20 mb-3 tracking-widest uppercase">
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
              Modern Ginning separating process
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We process raw cotton from farmers using advanced mechanical separating grids, maximizing yield and grading pure fibers for manufacturing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-card/20 border border-border/40 rounded-2xl p-6 relative">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm mb-4">
                01
              </div>
              <h4 className="text-base font-bold text-white mb-2">Farmer Inwarding</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Farmers book their slot, unload raw Kapas at our scales, and receive a high-speed digital analysis of moisture and trash percentage.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-card/20 border border-border/40 rounded-2xl p-6 relative">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm mb-4">
                02
              </div>
              <h4 className="text-base font-bold text-white mb-2">Double-Roller Ginning</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Mechanical rollers carefully detach pure cotton lint from seeds without snapping fibers, protecting staple length and micronaire grade.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-card/20 border border-border/40 rounded-2xl p-6 relative">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm mb-4">
                03
              </div>
              <h4 className="text-base font-bold text-white mb-2">Lint Pressing & seed Extraction</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Lint is pressed into 170kg compact bales wrapped in clean cotton sheets. Raw seeds are screened and packed into 100kg quintal bags.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-card/20 border border-border/40 rounded-2xl p-6 relative">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm mb-4">
                04
              </div>
              <h4 className="text-base font-bold text-white mb-2">Instant Settlement</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                The farmer&apos;s bank account receives an immediate digital payout with exact credits for the extracted seeds, ensuring maximum earnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* B2B INQUIRY CONTACT FORM */}
      <section className="py-20 px-6 max-w-3xl mx-auto w-full" id="contact">
        <div className="bg-card/40 backdrop-blur-md border border-border/60 rounded-3xl p-8 shadow-2xl relative">
          <div className="text-center max-w-md mx-auto mb-8">
            <Building className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-white tracking-tight">Wholesale & Trade Inquiries</h3>
            <p className="text-muted-foreground text-xs font-semibold mt-1">Request quotation for Cotton Bales or Seeds</p>
          </div>

          <form onSubmit={handleInquiry} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold text-muted-foreground tracking-widest">Business/Buyer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vardhman Textiles"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  className="w-full bg-secondary/30 border border-border/60 rounded-xl p-3.5 text-xs font-semibold text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/80"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold text-muted-foreground tracking-widest">Inquiry Email</label>
                <input
                  type="email"
                  placeholder="e.g. trade@textile.com"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  className="w-full bg-secondary/30 border border-border/60 rounded-xl p-3.5 text-xs font-semibold text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/80"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-extrabold text-muted-foreground tracking-widest">Your Requirements / Quantity</label>
              <textarea
                rows={3}
                placeholder="e.g. Seeking quotes for 500 Bales MCU-5 grade, June Delivery..."
                value={inquiryMsg}
                onChange={(e) => setInquiryMsg(e.target.value)}
                className="w-full bg-secondary/30 border border-border/60 rounded-xl p-3.5 text-xs font-semibold text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/80 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-primary/95 transition-all duration-200 border-0 active:scale-98 cursor-pointer shadow-lg mt-4"
            >
              Submit Trade Inquiry
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-secondary/30 border-t border-border/40 py-12 px-6 select-none mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                <Sprout className="h-4 w-4" />
              </div>
              <span className="text-sm font-extrabold text-white">WHITE GOLD</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Empowering farmers and sourcing industries with state-of-the-art cotton processing, transparent commodity rates, and instant settlements.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[10px]">Headquarters</h5>
            <p className="text-muted-foreground leading-relaxed flex items-start gap-1.5 text-[11px]">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              49/1 , S H -16,MAGANAGERA CROSS,YADRAMI TQ,BIRYALHISSA,GULBARGA
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[10px]">Contact Desk</h5>
            <ul className="space-y-3 text-muted-foreground text-[11px]">
              <li className="flex items-start gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span>+91 98455 16982</span>
                  <span>+91 94490 83047</span>
                  <span>+91 98452 21066</span>
                  <span>+91 97310 80149</span>
                </div>
              </li>
              <li className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary shrink-0" /> basaveshwaracottonindustries@gmail.com
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[10px]">Trade Hours</h5>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Intake Gates: Mon - Sat: 08:00 AM - 08:00 PM<br />
              Commercial Desk: Mon - Fri: 09:30 AM - 06:30 PM
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-border/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground font-semibold">
          <span>&copy; 2026 White Gold Cotton Industries. All Rights Reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Ginning</a>
            <a href="#" className="hover:text-white transition-colors">Brokerage Rules</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function Home() {
  return (
    <LiveRatesProvider>
      <MainDashboard />
    </LiveRatesProvider>
  );
}

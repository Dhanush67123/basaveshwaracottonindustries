"use client";

import React, { useState } from "react";
import { useLiveRates } from "./live-rates-provider";
import { ArrowUpRight, Leaf, Database, ShoppingBag, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const ProductCards: React.FC = () => {
  const { balePrice, cottonSeed, rawCottonBuyRate, isSimulating } = useLiveRates();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const products = [
    {
      id: "bales",
      title: "Pure Cotton Bales (Lint)",
      tagline: "High-grade spun cotton pressed into standard bales",
      badge: "Finished Product",
      rate: `₹${balePrice.toLocaleString()}`,
      unit: "per 170kg Bale",
      icon: <ShoppingBag className="h-6 w-6 text-emerald-400" />,
      colorClass: "from-emerald-950/40 to-slate-900/40 border-emerald-500/30",
      glowClass: "bg-emerald-500/10",
      description: "Extracted from premium raw Kapas through our modern, double-roller ginning plant. Standardized for top-tier spinning mills.",
      specs: [
        { label: "Fiber Staple Length", value: "29.5 mm - 31.0 mm" },
        { label: "Fiber Strength", value: "29.5 - 30.5 g/tex" },
        { label: "Micronaire (Fineness)", value: "3.8 - 4.4 NCL" },
        { label: "Trash Content", value: "< 1.5% (Ultra-Clean)" },
        { label: "Moisture Level", value: "< 7.5% Standardized" },
      ],
      ctaText: "Inquire Bulk Purchase",
      ctaAction: () => scrollToSection("contact"),
    },
    {
      id: "seeds",
      title: "Premium Cotton Seeds",
      tagline: "High-oil & high-protein nutrient seeds",
      badge: "By-Product",
      rate: `₹${cottonSeed.toLocaleString()}`,
      unit: "per 100kg Quintal",
      icon: <Leaf className="h-6 w-6 text-amber-400" />,
      colorClass: "from-amber-950/40 to-slate-900/40 border-amber-500/30",
      glowClass: "bg-amber-500/10",
      description: "Clean, organic, and oil-rich seeds separated during ginning. Excellent raw material for cattle feed and cotton seed oil extraction.",
      specs: [
        { label: "Oil Content Ratio", value: "18.5% - 20.0%" },
        { label: "Protein Content", value: "22.0% - 24.5%" },
        { label: "Moisture Level", value: "< 8.0% Max" },
        { label: "Sand & Silica Trash", value: "< 0.8% (Highly Screened)" },
        { label: "Free Fatty Acids (FFA)", value: "< 1.2% Premium" },
      ],
      ctaText: "Order Feedstock",
      ctaAction: () => scrollToSection("contact"),
    },
    {
      id: "cotton",
      title: "Raw Cotton (Kapas)",
      tagline: "Pure farm-fresh raw cotton with high ginning yield",
      badge: "Sourced Material",
      rate: `₹${rawCottonBuyRate.toLocaleString()}`,
      unit: "per 100kg Quintal",
      icon: <Database className="h-6 w-6 text-sky-400" />,
      colorClass: "from-sky-950/40 to-slate-900/40 border-sky-500/30",
      glowClass: "bg-sky-500/10",
      description: "Sourced directly from certified regional farmers. We offer immediate digital payouts linked dynamically to global market indices.",
      specs: [
        { label: "Ginning Outturn (GOT)", value: "33.5% - 35.0% Pure Lint" },
        { label: "Seed Outturn (SOT)", value: "62.0% - 63.5% Seeds" },
        { label: "Trash & Moisture Waste", value: "1.5% - 2.0% Low Waste" },
        { label: "Staple Class", value: "Medium-Long Staple (Bunny/MCU-5)" },
        { label: "Farmers Empowered", value: "12,500+ Regional Sourced" },
      ],
      ctaText: "Book Selling Slot",
      ctaAction: () => scrollToSection("farmer-portal"),
    },
  ];

  return (
    <div className="py-12" id="products">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <Badge variant="outline" className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/20 mb-3 tracking-widest uppercase">
          Core Operations
        </Badge>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
          Three Pillars of White Gold
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          From the fertile soils of the farms to global manufacturing units, we process raw Kapas, separating it into industry-standard pure lint bales and premium organic seeds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product, index) => {
          const isHovered = hoveredIndex === index;

          return (
            <Card
              key={product.id}
              className={`bg-card/30 backdrop-blur-md border ${product.colorClass} transition-all duration-500 ease-out relative overflow-hidden flex flex-col justify-between`}
              style={{
                transform: isHovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                boxShadow: isHovered ? "0 20px 40px -15px rgba(0, 0, 0, 0.7)" : "none",
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Radial gradient background light */}
              <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[100px] pointer-events-none transition-opacity duration-500 -mr-16 -mt-16 ${product.glowClass} ${isHovered ? "opacity-100" : "opacity-40"}`} />

              <CardHeader className="pb-4 relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-3 bg-secondary/80 rounded-xl border border-border/40">
                    {product.icon}
                  </div>
                  <Badge
                    variant="outline"
                    className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-white/5 text-white/80 border-white/10"
                  >
                    {product.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-1.5 mt-2">
                  {product.title}
                  {isHovered && <Sparkles className="h-4 w-4 text-accent animate-pulse" />}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs font-medium">
                  {product.tagline}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-6 relative z-10 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-6">
                    {product.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest block mb-3">
                      Quality Specifications
                    </span>
                    {product.specs.map((spec, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex justify-between items-center py-1.5 border-b border-border/20 text-xs"
                      >
                        <span className="text-muted-foreground">{spec.label}</span>
                        <span className="font-semibold text-white/95">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-secondary/40 border border-border/30 rounded-xl p-4 mt-auto">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] uppercase font-extrabold text-muted-foreground tracking-widest block">
                        Live Purchase/Sell Rate
                      </span>
                      <span className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1 mt-0.5">
                        {product.rate}
                        {isSimulating && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping self-center" />
                        )}
                      </span>
                    </div>
                    <Badge variant="secondary" className="px-2 py-1 text-[10px] font-bold bg-white/5 border border-white/10 text-muted-foreground">
                      {product.unit}
                    </Badge>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-6 relative z-10">
                <Button
                  onClick={product.ctaAction}
                  variant="outline"
                  className={`w-full group rounded-xl py-5 font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-2 border-border/60 hover:bg-white hover:text-black hover:border-white active:scale-95`}
                >
                  {product.ctaText}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

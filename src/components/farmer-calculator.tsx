"use client";

import React, { useState } from "react";
import { useLiveRates } from "./live-rates-provider";
import { Calculator, ShieldCheck, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const FarmerCalculator: React.FC = () => {
  const { rawCottonBuyRate, cottonSeed } = useLiveRates();

  // Inputs
  const [variety, setVariety] = useState<"mcu5" | "bunny" | "local">("mcu5");
  const [quantity, setQuantity] = useState<number>(50); // in quintals
  const [moisture, setMoisture] = useState<number>(7.5); // standard in percentage
  const [trash, setTrash] = useState<number>(1.8); // standard in percentage

  // Variety details
  const varietyBonuses = {
    mcu5: { name: "MCU-5 Premium Long Staple", bonus: 250 },
    bunny: { name: "Bunny Medium-Long Staple", bonus: 100 },
    local: { name: "Local Medium Staple", bonus: 0 },
  };

  // Derived calculations:
  // 1. Calculate base rate per quintal (linked to live rate + variety bonus)
  const baseRatePerQuintal = rawCottonBuyRate + varietyBonuses[variety].bonus;
  const basePayout = baseRatePerQuintal * quantity;

  // 2. Moisture deduction: Optimum is <= 8%.
  // For every 1% above 8%, we deduct 1.5% of gross value.
  const moistureDeduction = moisture > 8 
    ? Math.round(basePayout * ((moisture - 8) * 0.015)) 
    : 0;

  // 3. Trash deduction: Optimum is <= 2%.
  // For every 1% above 2%, we deduct 1% of gross value.
  const trashDeduction = trash > 2 
    ? Math.round(basePayout * ((trash - 2) * 0.01)) 
    : 0;

  // 4. Processing/Ginning Fees: ₹450 per quintal flat
  const processingFee = 450 * quantity;

  // 5. Seeds credit: 1 quintal raw cotton yields 64kg of seed.
  // Cotton Seed Price per kg = (cottonSeed / 100).
  // Seed Credit = 64 kg * seed price per kg * quantity.
  const seedPricePerKg = cottonSeed / 100;
  const seedCredit = Math.round(64 * seedPricePerKg * quantity);

  // 6. Net payout
  const totalNetEarnings = Math.max(0, basePayout - moistureDeduction - trashDeduction - processingFee + seedCredit);

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/60 rounded-2xl p-6 relative overflow-hidden shadow-2xl transition-all duration-300 hover:border-primary/30">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2.5 bg-secondary/80 rounded-xl border border-border/40 text-primary">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white leading-tight">Earnings Estimator</h3>
          <p className="text-muted-foreground text-xs font-medium">Calculate your raw Kapas processing value</p>
        </div>
      </div>

      <div className="space-y-4 mb-6 relative z-10">
        {/* Variety selection */}
        <div>
          <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest block mb-2">
            Select Cotton Variety
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(varietyBonuses) as Array<keyof typeof varietyBonuses>).map((key) => (
              <button
                key={key}
                onClick={() => setVariety(key)}
                className={`py-2 px-1 text-center rounded-xl border text-[10px] sm:text-xs font-bold transition-all duration-200 ${
                  variety === key
                    ? "bg-primary/10 border-primary/45 text-white shadow-lg"
                    : "bg-secondary/40 border-border/50 text-muted-foreground hover:bg-secondary/80 hover:text-white"
                }`}
              >
                <span className="block truncate">{varietyBonuses[key].name.split(" ")[0]}</span>
                <span className="block text-[9px] text-muted-foreground font-medium mt-0.5">
                  {varietyBonuses[key].bonus > 0 ? `+₹${varietyBonuses[key].bonus}` : "Base Rate"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity (Quintals) */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest block">
              Raw Cotton Weight (Quintals)
            </label>
            <span className="text-xs font-bold text-white bg-secondary/80 px-2.5 py-0.5 rounded-lg border border-border/40">
              {quantity} Quintals <span className="text-muted-foreground text-[10px]">({quantity * 100} kg)</span>
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="250"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-bold mt-1.5 px-0.5">
            <span>5 Qntl</span>
            <span>100 Qntl</span>
            <span>250 Qntl</span>
          </div>
        </div>

        {/* Dynamic Sliders for Moisture and Trash */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest flex items-center gap-1">
                Moisture %
              </label>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                moisture <= 8 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
              }`}>
                {moisture}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="18"
              step="0.5"
              value={moisture}
              onChange={(e) => setMoisture(Number(e.target.value))}
              className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[9px] text-muted-foreground/60 block mt-1 font-semibold">Standard is 8%</span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest flex items-center gap-1">
                Trash %
              </label>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                trash <= 2 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
              }`}>
                {trash}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="6"
              step="0.1"
              value={trash}
              onChange={(e) => setTrash(Number(e.target.value))}
              className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[9px] text-muted-foreground/60 block mt-1 font-semibold">Standard is 2%</span>
          </div>
        </div>
      </div>

      {/* Calculator Breakdown Display */}
      <div className="bg-secondary/20 border border-border/40 rounded-xl p-4 relative z-10">
        <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest block mb-3">
          Estimated Payout Sheet
        </span>

        <div className="space-y-2 text-xs mb-4">
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">Gross Value ({quantity} Qntl)</span>
            <span className="font-semibold text-white/95">₹{basePayout.toLocaleString()}</span>
          </div>

          {moistureDeduction > 0 && (
            <div className="flex justify-between items-center py-1 text-amber-400">
              <span className="flex items-center gap-1">
                Moisture Penalty
              </span>
              <span className="font-semibold">-₹{moistureDeduction.toLocaleString()}</span>
            </div>
          )}

          {trashDeduction > 0 && (
            <div className="flex justify-between items-center py-1 text-amber-400">
              <span className="flex items-center gap-1">
                Excess Trash Penalty
              </span>
              <span className="font-semibold">-₹{trashDeduction.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 text-red-400/90 border-b border-border/20 pb-2">
            <span>Ginning Processing Fee</span>
            <span className="font-semibold">-₹{processingFee.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 text-emerald-400 font-medium">
            <span className="flex items-center gap-1">
              Seeds Extracted Credit
            </span>
            <span className="font-bold">+₹{seedCredit.toLocaleString()}</span>
          </div>
        </div>

        {/* Net payout total */}
        <div className="border-t border-border/40 pt-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest block">
              Estimated Net Payout
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Landmark className="h-4.5 w-4.5 text-primary" />
              <span className="text-2xl font-black text-white tracking-tight">
                ₹{totalNetEarnings.toLocaleString()}
              </span>
            </div>
          </div>
          <Badge className="px-2.5 py-1 text-[10px] font-bold bg-primary text-primary-foreground flex items-center gap-1 border-0">
            <ShieldCheck className="h-3.5 w-3.5" /> Direct to Bank
          </Badge>
        </div>
      </div>
    </div>
  );
};

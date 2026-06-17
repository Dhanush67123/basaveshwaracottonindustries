"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface MarketRateState {
  usCotton: number; // US ICE Cotton Futures (cents/lb)
  usCottonChange: number; // Daily percentage change
  inCotton: number; // Indian Cotton Spot (INR / Quintal - 100 kg)
  inCottonChange: number; // Daily percentage change
  cottonSeed: number; // Indian NCDEX Cotton Seed Oil Cake / Raw Seed (INR / Quintal - 100 kg)
  cottonSeedChange: number; // Percentage change
  balePrice: number; // Pure Cotton Bale (INR / 170 kg Bale) - derived
  rawCottonBuyRate: number; // Kapas Buying Rate (INR / Quintal) offered to farmers - derived
  isSimulating: boolean;
  history: {
    usCotton: number[];
    inCotton: number[];
  };
}

interface LiveRatesContextType extends MarketRateState {
  toggleSimulation: () => void;
  triggerManualRefresh: () => void;
}

const LiveRatesContext = createContext<LiveRatesContextType | undefined>(undefined);

export const LiveRatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usCotton, setUsCotton] = useState(84.45);
  const [usCottonChange, setUsCottonChange] = useState(1.24);
  const [inCotton, setInCotton] = useState(16348); // INR / Quintal (approx 58200 / 3.56)
  const [inCottonChange, setInCottonChange] = useState(0.85);
  const [cottonSeed, setCottonSeed] = useState(3150);
  const [cottonSeedChange, setCottonSeedChange] = useState(-0.42);
  const [isSimulating, setIsSimulating] = useState(true);

  // Maintain historical data for charts (last 7 data points)
  const [usHistory, setUsHistory] = useState<number[]>([82.1, 83.0, 82.5, 83.8, 84.1, 83.9, 84.45]);
  const [inHistory, setInHistory] = useState<number[]>([16039, 16123, 16067, 16235, 16292, 16264, 16348]);

  // Derived calculations:
  // 1 Quintal = 100 kg of pure lint.
  // Standard Bale = 170 kg of pure lint.
  // Bale Price = (inCotton / 100) * 170 * 1.02
  const balePrice = Math.round((inCotton / 100) * 170 * 1.02);

  // 1 Quintal (100 kg) of Kapas (Raw Cotton) yields:
  // - ~34 kg Pure Cotton Lint (derived from inCotton per kg)
  // - ~64 kg Cotton Seeds (derived from cottonSeed per kg)
  // - ~2 kg waste
  // Farmer Buy Rate = (34 * lintPricePerKg) + (64 * seedPricePerKg) - Ginning/Processing Fee (approx INR 600)
  const lintPricePerKg = inCotton / 100;
  const seedPricePerKg = cottonSeed / 100;
  const rawCottonBuyRate = Math.round((34 * lintPricePerKg) + (64 * seedPricePerKg) - 600);

  const fetchLiveRates = async () => {
    try {
      const res = await fetch("/api/cotton-rates");
      if (!res.ok) throw new Error("Failed to fetch rates");
      const data = await res.json();
      
      setUsCotton(data.usCotton);
      setUsCottonChange(data.usCottonChange);
      setInCotton(data.inCotton);
      setInCottonChange(data.inCottonChange);
      setCottonSeed(data.cottonSeed);
      setCottonSeedChange(data.cottonSeedChange);

      setUsHistory((h) => [...h.slice(1), data.usCotton]);
      setInHistory((h) => [...h.slice(1), data.inCotton]);
    } catch (err) {
      console.error("Failed to load live rates, using fallback simulation data:", err);
    }
  };

  const simulateTicks = () => {
    // Tick size: US cotton: +/- 0.05 to 0.25, Indian cotton: +/- 15 to 60, Seeds: +/- 5 to 25
    const usTick = (Math.random() - 0.48) * 0.3; // Slight upward bias
    const inTick = Math.round((Math.random() - 0.47) * 35); // Dynamic tick per quintal
    const seedTick = Math.round((Math.random() - 0.5) * 15);

    setUsCotton((prev) => {
      const newVal = parseFloat((prev + usTick).toFixed(2));
      setUsHistory((h) => [...h.slice(1), newVal]);
      return newVal;
    });
    setInCotton((prev) => {
      const newVal = prev + inTick;
      setInHistory((h) => [...h.slice(1), newVal]);
      return newVal;
    });
    setCottonSeed((prev) => prev + seedTick);

    // Dynamic percent change updates
    setUsCottonChange((prev) => parseFloat((prev + usTick * 0.15).toFixed(2)));
    setInCottonChange((prev) => parseFloat((prev + (inTick / 16300) * 100).toFixed(2)));
    setCottonSeedChange((prev) => parseFloat((prev + (seedTick / 3150) * 100).toFixed(2)));
  };

  // Fetch live rates on mount
  useEffect(() => {
    fetchLiveRates();
  }, []);

  // Set up intervals for simulation or live polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(simulateTicks, 4000);
    } else {
      // Poll live rates every 30 seconds when streaming/simulation is paused
      interval = setInterval(fetchLiveRates, 30000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const toggleSimulation = () => {
    setIsSimulating((prev) => !prev);
  };

  const triggerManualRefresh = () => {
    if (isSimulating) {
      simulateTicks();
    } else {
      fetchLiveRates();
    }
  };

  return (
    <LiveRatesContext.Provider
      value={{
        usCotton,
        usCottonChange,
        inCotton,
        inCottonChange,
        cottonSeed,
        cottonSeedChange,
        balePrice,
        rawCottonBuyRate,
        isSimulating,
        history: {
          usCotton: usHistory,
          inCotton: inHistory,
        },
        toggleSimulation,
        triggerManualRefresh,
      }}
    >
      {children}
    </LiveRatesContext.Provider>
  );
};

export const useLiveRates = () => {
  const context = useContext(LiveRatesContext);
  if (context === undefined) {
    throw new Error("useLiveRates must be used within a LiveRatesProvider");
  }
  return context;
};

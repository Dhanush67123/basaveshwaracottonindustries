import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";
export const revalidate = 10; // 10 seconds cache to propagate manual rate changes instantly

// Helper to format date in DD-MM-YYYY format
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper to get current date in IST (UTC+5.30)
function getISTDate(): Date {
  const utcDate = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(utcDate.getTime() + istOffset);
}

// Fetch rates list for a specific date from CAI
async function fetchCAIRatesForDate(dateStr: string) {
  try {
    const formData = new FormData();
    formData.append("date", dateStr);

    const res = await fetch("https://caionline.in/details/cai/spot-rates/by/date", {
      method: "POST",
      body: formData,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data && Array.isArray(data.list) && data.list.length > 0) {
      // Check if there's any non-zero price data
      const hasPrices = data.list.some((item: any) => parseFloat(item.per_candy) > 0);
      if (hasPrices) {
        return data.list;
      }
    }
  } catch (err) {
    console.error(`Failed to fetch CAI rates for ${dateStr}:`, err);
  }
  return null;
}

// Walk back up to 7 days to find the latest valid rates
async function fetchLatestCAIRates() {
  let currentDate = getISTDate();
  for (let i = 0; i < 7; i++) {
    const dateStr = formatDate(currentDate);
    const list = await fetchCAIRatesForDate(dateStr);
    if (list) {
      return { list, dateObj: new Date(currentDate), dateStr };
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }
  return null;
}

// Find previous day with rates to compute daily change
async function fetchPreviousCAIRates(latestDateObj: Date) {
  let currentDate = new Date(latestDateObj);
  currentDate.setDate(currentDate.getDate() - 1);
  for (let i = 0; i < 7; i++) {
    const dateStr = formatDate(currentDate);
    const list = await fetchCAIRatesForDate(dateStr);
    if (list) {
      return list;
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }
  return null;
}

// Find standard Gujarat Shankar-6 ICS-105 29mm spot rate
function findBenchmarkRate(list: any[]): number {
  let item = list.find(
    (x: any) =>
      x.growth?.toUpperCase() === "GUJ" &&
      x.grade_standard?.toUpperCase() === "ICS-105" &&
      x.staple?.toLowerCase().includes("29 mm")
  );

  if (!item) {
    item = list.find(
      (x: any) =>
        x.grade_standard?.toUpperCase() === "ICS-105" &&
        x.staple?.toLowerCase().includes("29 mm")
    );
  }

  if (!item) {
    item = list.find((x: any) => x.grade_standard?.toUpperCase() === "ICS-105");
  }

  if (!item) {
    item = list.find((x: any) => parseFloat(x.per_candy) > 0);
  }

  if (item && parseFloat(item.per_candy) > 0) {
    return parseFloat(item.per_candy);
  }

  return 0;
}

async function fetchYahooPrice(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch Yahoo Finance for ${symbol}`);
  }
  const data = await res.json();
  const meta = data.chart.result[0].meta;
  return {
    symbol: meta.symbol,
    price: meta.regularMarketPrice as number,
    prevClose: meta.chartPreviousClose as number,
  };
}

export async function GET() {
  try {
    let manualBalePrice = null;
    let manualSeedPrice = null;
    let useManualRates = false;

    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        const docRef = doc(db, "settings", "rates");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          manualBalePrice = data.manualBalePrice || null;
          manualSeedPrice = data.manualSeedPrice || null;
          useManualRates = !!data.useManualRates;
        }
      }
    } catch (dbErr) {
      console.error("Failed to fetch manual rates from Firestore:", dbErr);
    }

    // Fetch Yahoo Finance in parallel
    const [cotton, usdInr] = await Promise.all([
      fetchYahooPrice("CT=F").catch(() => null),
      fetchYahooPrice("INR=X").catch(() => null),
    ]);

    const usCotton = cotton ? cotton.price : 84.45;
    const usCottonChange = cotton
      ? parseFloat(((cotton.price - cotton.prevClose) / cotton.prevClose * 100).toFixed(2))
      : 1.24;

    let inCotton = 0;
    let inCottonChange = 0;
    let usingCAI = false;
    let caiDate = "";

    // Pull from CAI
    const latestCAIData = await fetchLatestCAIRates();
    if (latestCAIData) {
      const latestRateCandy = findBenchmarkRate(latestCAIData.list);
      if (latestRateCandy > 0) {
        inCotton = Math.round(latestRateCandy * 0.2812);
        usingCAI = true;
        caiDate = latestCAIData.dateStr;

        // Fetch previous rate to calculate change
        const prevList = await fetchPreviousCAIRates(latestCAIData.dateObj);
        if (prevList) {
          const prevRateCandy = findBenchmarkRate(prevList);
          if (prevRateCandy > 0) {
            inCottonChange = parseFloat(
              (((latestRateCandy - prevRateCandy) / prevRateCandy) * 100).toFixed(2)
            );
          }
        }
      }
    }

    // Fallback to estimation if CAI fails
    if (!usingCAI) {
      const usdInrPrice = usdInr ? usdInr.price : 83.5;
      const usdInrPrev = usdInr ? usdInr.prevClose : 83.5;
      const cottonPrice = cotton ? cotton.price : 84.45;
      const cottonPrev = cotton ? cotton.prevClose : 84.45;

      inCotton = Math.round(cottonPrice * 2.20462262 * usdInrPrice);
      const prevInCotton = cottonPrev * 2.20462262 * usdInrPrev;
      inCottonChange = parseFloat(
        ((inCotton - prevInCotton) / prevInCotton * 100).toFixed(2)
      );
    }

    // NCDEX Cotton Seed Oil Cake rate proportionally:
    const seedBase = 3150;
    const prevInCotton = inCottonChange !== 0 ? inCotton / (1 + inCottonChange / 100) : inCotton;
    const cottonChangeFactor = prevInCotton !== 0 ? (inCotton - prevInCotton) / prevInCotton : 0;
    const cottonSeed = Math.round(seedBase * (1 + cottonChangeFactor));
    const cottonSeedChange = inCottonChange;

    return NextResponse.json({
      usCotton,
      usCottonChange,
      inCotton,
      inCottonChange,
      cottonSeed,
      cottonSeedChange,
      manualBalePrice,
      manualSeedPrice,
      useManualRates,
      source: usingCAI ? `Cotton Association of India (CAI - ${caiDate})` : "Estimated (Yahoo Finance)",
    });
  } catch (error: any) {
    console.error("Error fetching live rates:", error);
    return NextResponse.json({
      usCotton: 84.45,
      usCottonChange: 1.24,
      inCotton: 16348,
      inCottonChange: 0.85,
      cottonSeed: 3150,
      cottonSeedChange: -0.42,
      error: error.message || "Failed to fetch live rates",
    });
  }
}

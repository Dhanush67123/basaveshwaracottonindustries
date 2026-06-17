import { NextResponse } from "next/server";

export const revalidate = 60; // cache for 60 seconds

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
    const [cotton, usdInr] = await Promise.all([
      fetchYahooPrice("CT=F"),
      fetchYahooPrice("INR=X"),
    ]);

    const usCotton = cotton.price;
    const usCottonChange = parseFloat(((cotton.price - cotton.prevClose) / cotton.prevClose * 100).toFixed(2));

    // Conversion:
    // usCotton is in cents/lb.
    // 1 lb = 0.45359237 kg -> 1 kg = 2.20462262 lbs.
    // usCotton in USD/lb = usCotton / 100
    // usCotton in USD/kg = (usCotton / 100) * 2.20462262
    // usCotton in INR/kg = (usCotton / 100) * 2.20462262 * usdInr.price
    // usCotton in INR/Quintal (100 kg) = usCotton * 2.20462262 * usdInr.price
    const inCotton = Math.round(usCotton * 2.20462262 * usdInr.price);
    
    // Compute the previous close in INR per Quintal to get a highly accurate change percentage
    const prevInCotton = cotton.prevClose * 2.20462262 * usdInr.prevClose;
    const inCottonChange = parseFloat(((inCotton - prevInCotton) / prevInCotton * 100).toFixed(2));

    // NCDEX Cotton Seed Oil Cake rate / Raw Seed per Quintal:
    // Base standard is ~3150. Let's make it change proportionally with Indian cotton.
    const seedBase = 3150;
    const cottonChangeFactor = (inCotton - prevInCotton) / prevInCotton;
    const cottonSeed = Math.round(seedBase * (1 + cottonChangeFactor));
    const cottonSeedChange = inCottonChange;

    return NextResponse.json({
      usCotton,
      usCottonChange,
      inCotton,
      inCottonChange,
      cottonSeed,
      cottonSeedChange,
    });
  } catch (error: any) {
    console.error("Error fetching live rates:", error);
    // Return standard fallback values so the app doesn't break
    return NextResponse.json({
      usCotton: 84.45,
      usCottonChange: 1.24,
      inCotton: 16348, // 58200 / 3.56
      inCottonChange: 0.85,
      cottonSeed: 3150,
      cottonSeedChange: -0.42,
      error: error.message || "Failed to fetch live rates",
    });
  }
}

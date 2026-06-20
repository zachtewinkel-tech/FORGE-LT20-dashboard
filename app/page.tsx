"use client";

import React, { useEffect, useMemo, useState } from "react";

type Tab =
  | "dailyBrief"
  | "actionItems"
  | "holdings"
  | "bench"
  | "sp500Screener"
  | "forgeSignal"
  | "taxLots"
  | "coveredCalls"
  | "performance"
  | "fundProfile"
  | "ruleSet"
  | "settings";

type Sleeve = "Core" | "Opportunistic";
type TaConfidence = "Manual" | "Low" | "Medium" | "High";
type ActionState =
  | "HOLD"
  | "BUY"
  | "TRIM"
  | "SELL"
  | "REBALANCE"
  | "COVER"
  | "BUY BACK"
  | "TAX HARVEST"
  | "DAF CANDIDATE";

type Holding = {
  id: string;
  ticker: string;
  name: string;
  sleeve: Sleeve;
  sector: string;
  shares: number;
  cost: number;
  price: number;
  forgeRank: number;
  signalScore: number;
  upside: number;
  revisionScore: number;
  momentumScore: number;
  qualityScore: number;
  dispersion: number;
  daysHeld: number;
  purchaseDate?: string;
  above200dma: boolean;
  earningsBeforeExpiry: boolean;
  technicalExtension: number;
  buyZoneLow: number;
  buyZoneHigh: number;
  buyAnchor: number;
  stopLevel: number;
  trimLow: number;
  trimHigh: number;
  taConfidence: TaConfidence;
  taNotes: string;
  notes: string;
};

type BenchCandidate = {
  rank: number;
  ticker: string;
  name: string;
  sleeveFit: Sleeve;
  sector: string;
  price: number;
  signalScore: number;
  upside: number;
  revisionScore: number;
  momentumScore: number;
  qualityScore: number;
  dispersion: number;
  buyZoneLow: number;
  buyZoneHigh: number;
  buyAnchor: number;
  stopLevel: number;
  trimLow: number;
  trimHigh: number;
  taConfidence: TaConfidence;
  taNotes: string;
  notes: string;
};

type CoveredCall = {
  id: string;
  ticker: string;
  sharesCovered: number;
  stockPrice: number;
  strike: number;
  dte: number;
  delta: number;
  premiumReceived: number;
  currentMark: number;
  earningsBeforeExpiry: boolean;
  notes: string;
};

type OptionCandidate = {
  ticker: string;
  expiration: string;
  strike: number;
  dte: number;
  delta: number | null;
  bid: number | null;
  ask: number | null;
  last: number | null;
  mid: number | null;
  impliedVolatility: number | null;
  openInterest: number | null;
  volume: number | null;
  score: number;
  note: string;
};

type HoldingRow = Holding & {
  marketValue: number;
  weight: number;
  gain: number;
  ltcg: boolean;
  coverEligible: boolean;
  action: ActionState;
};

type LiveQuote = {
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  asOf: string;
  source: string;
};

type SignalAutoData = {
  ticker: string;
  asOf: string;
  price: number | null;
  targetHigh: number | null;
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  targetLastUpdated: string | null;
  upside: number | null;
  upsideSource: "Finnhub price target" | "Manual";
  recommendationScore: number | null;
  recommendationTrend: string;
  momentumScore: number | null;
  momentum1m: number | null;
  momentum3m: number | null;
  momentum6m: number | null;
  momentum12m: number | null;
  qualityScore: number | null;
  qualityNotes: string;
  dispersion: number | null;
  dispersionSource: "Finnhub target range" | "Manual";
  warnings: string[];
};

type TechnicalAutoData = {
  ticker: string;
  asOf: string;
  price: number | null;
  sma50: number | null;
  sma200: number | null;
  above200dma: boolean | null;
  technicalExtension: number | null;
  hvn: number | null;
  support: number | null;
  resistance: number | null;
  buyZoneLow: number | null;
  buyZoneHigh: number | null;
  buyAnchor: number | null;
  stopLevel: number | null;
  trimLow: number | null;
  trimHigh: number | null;
  rsi14: number | null;
  macdState: string;
  trendState: string;
  confidence: TaConfidence;
  notes: string;
  warnings: string[];
};

type ScreenerCandidate = {
  rank: number;
  ticker: string;
  name: string;
  sector: string;
  price: number | null;
  buyZoneLow: number | null;
  buyZoneHigh: number | null;
  trimLow: number | null;
  trimHigh: number | null;
  score: number;
  suggestedRole: Sleeve;
  action: "ADD TO BENCH" | "BUY ZONE" | "WATCH" | "CALL / TRIM" | "AVOID";
  dataQuality: "Full Data" | "Partial Data" | "Price/TA Only" | "Fallback";
  upside: number | null;
  momentumScore: number | null;
  qualityScore: number | null;
  technicalScore: number | null;
  sourceStatus: string;
};

type ScreenerMeta = {
  universe: string;
  offset: number;
  limit: number;
  processed: number;
  universeSize: number;
  asOf: string;
};

type MarketApiResponse = {
  asOf: string;
  provider: string;
  quotes: Record<string, LiveQuote>;
  market: {
    spy: LiveQuote | null;
    spySma50: number | null;
    spySma200: number | null;
  };
  options?: Record<string, OptionCandidate[]>;
  signal?: Record<string, SignalAutoData>;
  technical?: Record<string, TechnicalAutoData>;
  screener?: ScreenerCandidate[];
  screenerMeta?: ScreenerMeta;
  warnings?: string[];
};

const TAB_LABELS: Record<Tab, string> = {
  dailyBrief: "Daily Brief",
  actionItems: "Action Items",
  holdings: "Holdings",
  bench: "Bench",
  sp500Screener: "S&P 500 Screener",
  forgeSignal: "FORGE Signal",
  taxLots: "Tax Lots",
  coveredCalls: "Covered Calls",
  performance: "Performance",
  fundProfile: "Fund Profile",
  ruleSet: "Rule Set",
  settings: "Settings",
};

const STORAGE_KEYS = {
  activeTab: "forgeLt20ActiveTab.v1",
  holdings: "forgeLt20Holdings.v1",
  bench: "forgeLt20Bench.v1",
  calls: "forgeLt20CoveredCalls.v1",
  settings: "forgeLt20Settings.v1",
  liveSettings: "forgeLt20LiveSettings.v1",
  screener: "forgeLt20Screener.v1",
};

const DEFAULT_TA_FIELDS = {
  buyZoneLow: 0,
  buyZoneHigh: 0,
  buyAnchor: 0,
  stopLevel: 0,
  trimLow: 0,
  trimHigh: 0,
  taConfidence: "Manual" as TaConfidence,
  taNotes: "",
};

const DEFAULT_BENCH: BenchCandidate[] = ([
  {
    rank: 1,
    ticker: "AVGO",
    name: "Broadcom",
    sleeveFit: "Core",
    sector: "Technology",
    price: 265,
    signalScore: 93,
    upside: 0.23,
    revisionScore: 94,
    momentumScore: 88,
    qualityScore: 90,
    dispersion: 0.19,
    notes:
      "AI infrastructure / semis. Watch valuation and AI capex durability.",
  },
  {
    rank: 2,
    ticker: "NVDA",
    name: "NVIDIA",
    sleeveFit: "Opportunistic",
    sector: "Technology",
    price: 160,
    signalScore: 95,
    upside: 0.24,
    revisionScore: 96,
    momentumScore: 92,
    qualityScore: 89,
    dispersion: 0.23,
    notes: "Highest signal, but AI concentration and valuation-duration risk.",
  },
  {
    rank: 3,
    ticker: "VST",
    name: "Vistra",
    sleeveFit: "Opportunistic",
    sector: "Utilities",
    price: 185,
    signalScore: 93,
    upside: 0.22,
    revisionScore: 92,
    momentumScore: 94,
    qualityScore: 78,
    dispersion: 0.24,
    notes: "Power / AI electricity demand. Opportunistic sleeve candidate.",
  },
  {
    rank: 4,
    ticker: "AXON",
    name: "Axon Enterprise",
    sleeveFit: "Core",
    sector: "Industrials",
    price: 670,
    signalScore: 92,
    upside: 0.22,
    revisionScore: 91,
    momentumScore: 90,
    qualityScore: 85,
    dispersion: 0.22,
    notes: "Durable public safety platform. High multiple; monitor dispersion.",
  },
  {
    rank: 5,
    ticker: "ETN",
    name: "Eaton",
    sleeveFit: "Core",
    sector: "Industrials",
    price: 420,
    signalScore: 91,
    upside: 0.2,
    revisionScore: 90,
    momentumScore: 86,
    qualityScore: 88,
    dispersion: 0.18,
    notes: "Electrification compounder. Core candidate.",
  },
  {
    rank: 6,
    ticker: "ORCL",
    name: "Oracle",
    sleeveFit: "Opportunistic",
    sector: "Technology",
    price: 205,
    signalScore: 91,
    upside: 0.21,
    revisionScore: 90,
    momentumScore: 83,
    qualityScore: 82,
    dispersion: 0.21,
    notes:
      "AI/cloud infrastructure. Opportunistic until revisions prove durable.",
  },
  {
    rank: 7,
    ticker: "GE",
    name: "GE Aerospace",
    sleeveFit: "Core",
    sector: "Industrials",
    price: 225,
    signalScore: 88,
    upside: 0.18,
    revisionScore: 86,
    momentumScore: 84,
    qualityScore: 86,
    dispersion: 0.2,
    notes: "Aerospace quality growth. Core candidate.",
  },
  {
    rank: 8,
    ticker: "BSX",
    name: "Boston Scientific",
    sleeveFit: "Core",
    sector: "Healthcare",
    price: 93,
    signalScore: 87,
    upside: 0.17,
    revisionScore: 85,
    momentumScore: 78,
    qualityScore: 89,
    dispersion: 0.14,
    notes: "Medtech growth; diversifies software/AI risk.",
  },
  {
    rank: 9,
    ticker: "MSFT",
    name: "Microsoft",
    sleeveFit: "Core",
    sector: "Technology",
    price: 515,
    signalScore: 86,
    upside: 0.14,
    revisionScore: 84,
    momentumScore: 74,
    qualityScore: 94,
    dispersion: 0.12,
    notes: "Core compounder. Balance AI upside with concentration risk.",
  },
  {
    rank: 10,
    ticker: "NOW",
    name: "ServiceNow",
    sleeveFit: "Opportunistic",
    sector: "Technology",
    price: 840,
    signalScore: 86,
    upside: 0.21,
    revisionScore: 79,
    momentumScore: 60,
    qualityScore: 88,
    dispersion: 0.26,
    notes: "Software value-trap screen required before inclusion.",
  },
  {
    rank: 11,
    ticker: "ISRG",
    name: "Intuitive Surgical",
    sleeveFit: "Core",
    sector: "Healthcare",
    price: 545,
    signalScore: 85,
    upside: 0.15,
    revisionScore: 81,
    momentumScore: 76,
    qualityScore: 93,
    dispersion: 0.16,
    notes: "High-quality medtech compounder.",
  },
  {
    rank: 12,
    ticker: "AMZN",
    name: "Amazon",
    sleeveFit: "Core",
    sector: "Consumer Discretionary",
    price: 224,
    signalScore: 85,
    upside: 0.15,
    revisionScore: 82,
    momentumScore: 73,
    qualityScore: 90,
    dispersion: 0.17,
    notes: "Core platform / AWS / retail operating leverage.",
  },
  {
    rank: 13,
    ticker: "LLY",
    name: "Eli Lilly",
    sleeveFit: "Core",
    sector: "Healthcare",
    price: 940,
    signalScore: 84,
    upside: 0.13,
    revisionScore: 84,
    momentumScore: 75,
    qualityScore: 91,
    dispersion: 0.18,
    notes: "Healthcare ballast; valuation discipline required.",
  },
  {
    rank: 14,
    ticker: "GOOGL",
    name: "Alphabet",
    sleeveFit: "Core",
    sector: "Communication Services",
    price: 191,
    signalScore: 84,
    upside: 0.16,
    revisionScore: 80,
    momentumScore: 70,
    qualityScore: 92,
    dispersion: 0.15,
    notes: "Core platform. AI disruption and search monetization watch item.",
  },
  {
    rank: 15,
    ticker: "CAT",
    name: "Caterpillar",
    sleeveFit: "Opportunistic",
    sector: "Industrials",
    price: 400,
    signalScore: 84,
    upside: 0.15,
    revisionScore: 74,
    momentumScore: 78,
    qualityScore: 84,
    dispersion: 0.19,
    notes: "Cyclical / infrastructure exposure. Opportunistic candidate.",
  },
  {
    rank: 16,
    ticker: "V",
    name: "Visa",
    sleeveFit: "Core",
    sector: "Financials",
    price: 355,
    signalScore: 81,
    upside: 0.12,
    revisionScore: 75,
    momentumScore: 68,
    qualityScore: 95,
    dispersion: 0.11,
    notes: "Financial rails compounder.",
  },
  {
    rank: 17,
    ticker: "MA",
    name: "Mastercard",
    sleeveFit: "Core",
    sector: "Financials",
    price: 565,
    signalScore: 82,
    upside: 0.13,
    revisionScore: 76,
    momentumScore: 71,
    qualityScore: 96,
    dispersion: 0.1,
    notes: "Financial rails compounder.",
  },
  {
    rank: 18,
    ticker: "SPGI",
    name: "S&P Global",
    sleeveFit: "Core",
    sector: "Financials",
    price: 520,
    signalScore: 83,
    upside: 0.14,
    revisionScore: 78,
    momentumScore: 72,
    qualityScore: 94,
    dispersion: 0.13,
    notes: "Data / ratings compounder.",
  },
  {
    rank: 19,
    ticker: "BRK.B",
    name: "Berkshire Hathaway",
    sleeveFit: "Core",
    sector: "Financials",
    price: 475,
    signalScore: 78,
    upside: 0.09,
    revisionScore: 67,
    momentumScore: 60,
    qualityScore: 95,
    dispersion: 0.08,
    notes: "Quality ballast; lower signal upside.",
  },
  {
    rank: 20,
    ticker: "FICO",
    name: "Fair Isaac",
    sleeveFit: "Opportunistic",
    sector: "Information Services",
    price: 2180,
    signalScore: 89,
    upside: 0.19,
    revisionScore: 82,
    momentumScore: 81,
    qualityScore: 97,
    dispersion: 0.18,
    notes: "Exceptional quality; high price / concentration sizing issue.",
  },
  {
    rank: 21,
    ticker: "SYK",
    name: "Stryker",
    sleeveFit: "Core",
    sector: "Healthcare",
    price: 395,
    signalScore: 80,
    upside: 0.12,
    revisionScore: 73,
    momentumScore: 70,
    qualityScore: 91,
    dispersion: 0.14,
    notes: "Healthcare / medtech quality bench.",
  },
  {
    rank: 22,
    ticker: "TRANE",
    name: "Trane Technologies",
    sleeveFit: "Core",
    sector: "Industrials",
    price: 410,
    signalScore: 79,
    upside: 0.11,
    revisionScore: 72,
    momentumScore: 76,
    qualityScore: 88,
    dispersion: 0.16,
    notes: "HVAC / efficiency compounder.",
  },
  {
    rank: 23,
    ticker: "META",
    name: "Meta Platforms",
    sleeveFit: "Core",
    sector: "Communication Services",
    price: 640,
    signalScore: 82,
    upside: 0.12,
    revisionScore: 77,
    momentumScore: 79,
    qualityScore: 92,
    dispersion: 0.16,
    notes: "Core platform; AI spend discipline watch.",
  },
  {
    rank: 24,
    ticker: "COST",
    name: "Costco",
    sleeveFit: "Core",
    sector: "Consumer Staples",
    price: 980,
    signalScore: 76,
    upside: 0.08,
    revisionScore: 70,
    momentumScore: 72,
    qualityScore: 96,
    dispersion: 0.09,
    notes: "Quality compounder; valuation usually demanding.",
  },
] as Omit<BenchCandidate, keyof typeof DEFAULT_TA_FIELDS>[]).map((candidate) => ({
  ...DEFAULT_TA_FIELDS,
  ...candidate,
}));

const RULES = [
  {
    title: "Regime Classification",
    detail:
      "Classify SPY versus MA50/MA200 into R0/R1/R2/R3. Market regime sits at the top of the decision tree.",
  },
  {
    title: "Dynamic Leverage",
    detail:
      "Set target leverage from regime: 0.50x in R0, 1.25x in R1/R2, 1.75x in R3. Rebalance only if target and actual differ by more than 3%.",
  },
  {
    title: "FORGE Signal Score",
    detail:
      "Rank S&P 500 candidates using consensus upside, target revisions, EPS/revenue revisions, momentum, quality, and dispersion penalty.",
  },
  {
    title: "Portfolio Construction",
    detail:
      "Own 20 stocks: 15 Core compounders and 5 Opportunistic signal names. Initial weight 5%; trim above 7.5%; sector cap 25%.",
  },
  {
    title: "Tax-Lot Review",
    detail:
      "Prefer 366+ day holds. Tax-loss harvest anytime if the replacement is better. Track high-basis sale lots and low-basis DAF candidates.",
  },
  {
    title: "Quarterly Rebalance",
    detail:
      "Review monthly; rebalance quarterly. After 366 days, sell or trim only if outlook weakens, rank breaks, risk limits are exceeded, or replacement is superior.",
  },
  {
    title: "Covered-Call Eligibility",
    detail:
      "Calls only on technically extended, overweight positions: >6% weight, above 200DMA, no earnings before expiry, 20–35 DTE, 0.10–0.20 delta.",
  },
  {
    title: "Call Buyback Rule",
    detail:
      "Buy back if delta reaches 0.35, stock trades within 5% of strike, call loses 2x original premium, 70–80% premium captured, or 7 DTE remains.",
  },
  {
    title: "Risk-Trigger Sells",
    detail:
      "Early sale is permitted for thesis break, major negative revision, balance-sheet risk, sector cap breach, or superior tax-loss harvest replacement.",
  },
  {
    title: "Daily Monitoring",
    detail:
      "Evaluate regime, leverage, rankings, sector caps, tax lots, covered-call status, and cash needs. Output one primary action state.",
  },
  {
    title: "Tax & DAF Management",
    detail:
      "Sell highest-basis LT lots for cash needs; donate lowest-basis winners to DAF where appropriate; maintain tax-lot register.",
  },
  {
    title: "Risk Controls",
    detail:
      "FORGE is theory-driven and rules-based, not a backtested performance claim. Leverage, single-name risk, stale targets, and call caps remain material risks.",
  },
];

const blankHolding = (): Holding => ({
  id: crypto.randomUUID(),
  ticker: "",
  name: "",
  sleeve: "Core",
  sector: "",
  shares: 0,
  cost: 0,
  price: 0,
  forgeRank: 999,
  signalScore: 0,
  upside: 0,
  revisionScore: 0,
  momentumScore: 0,
  qualityScore: 0,
  dispersion: 0,
  daysHeld: 0,
  purchaseDate: "",
  above200dma: false,
  earningsBeforeExpiry: false,
  technicalExtension: 0,
  buyZoneLow: 0,
  buyZoneHigh: 0,
  buyAnchor: 0,
  stopLevel: 0,
  trimLow: 0,
  trimHigh: 0,
  taConfidence: "Manual",
  taNotes: "",
  notes: "",
});

const blankBenchCandidate = (rank: number): BenchCandidate => ({
  rank,
  ticker: "",
  name: "",
  sleeveFit: "Core",
  sector: "",
  price: 0,
  signalScore: 0,
  upside: 0,
  revisionScore: 0,
  momentumScore: 0,
  qualityScore: 0,
  dispersion: 0,
  buyZoneLow: 0,
  buyZoneHigh: 0,
  buyAnchor: 0,
  stopLevel: 0,
  trimLow: 0,
  trimHigh: 0,
  taConfidence: "Manual",
  taNotes: "",
  notes: "",
});

const blankCall = (): CoveredCall => ({
  id: crypto.randomUUID(),
  ticker: "",
  sharesCovered: 0,
  stockPrice: 0,
  strike: 0,
  dte: 30,
  delta: 0.15,
  premiumReceived: 0,
  currentMark: 0,
  earningsBeforeExpiry: false,
  notes: "",
});

function normalizeTicker(value: string): string {
  return value.trim().toUpperCase();
}

function displayDateString(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDateFromDaysHeld(daysHeld: number): string {
  if (!Number.isFinite(daysHeld) || daysHeld <= 0) return "";
  const date = new Date();
  date.setDate(date.getDate() - Math.round(daysHeld));
  return date.toISOString().slice(0, 10);
}

function daysHeldFromPurchaseDate(purchaseDate: string | undefined, fallbackDays = 0): number {
  if (!purchaseDate) return Math.max(0, Math.round(fallbackDays || 0));
  const purchase = new Date(`${purchaseDate}T00:00:00`);
  if (Number.isNaN(purchase.getTime())) return Math.max(0, Math.round(fallbackDays || 0));
  const now = new Date();
  const diff = now.getTime() - purchase.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatSignedPercentPoints(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatSignedCurrency(value: number): string {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundNumber(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function upsideToScore(upside: number): number {
  return clampNumber((upside / 0.25) * 100, 0, 100);
}

function dispersionToScore(dispersion: number): number {
  return clampNumber(100 - dispersion * 200, 0, 100);
}

function calculateTechnicalSetupScore(input: {
  price?: number;
  buyZoneLow?: number;
  buyZoneHigh?: number;
  stopLevel?: number;
  trimLow?: number;
  trimHigh?: number;
  taConfidence?: TaConfidence;
  above200dma?: boolean;
  technicalExtension?: number;
}): number {
  const price = positiveNumber(input.price) ?? 0;
  const buyLow = positiveNumber(input.buyZoneLow) ?? 0;
  const buyHigh = positiveNumber(input.buyZoneHigh) ?? 0;
  const stop = positiveNumber(input.stopLevel) ?? 0;
  const trimLow = positiveNumber(input.trimLow) ?? 0;
  const trimHigh = positiveNumber(input.trimHigh) ?? 0;
  let score = 55;

  if (input.above200dma) score += 10;
  if (input.taConfidence === "Medium") score += 8;
  if (input.taConfidence === "High") score += 15;
  if (input.taConfidence === "Low") score += 2;

  if (price > 0 && buyLow > 0 && buyHigh > 0) {
    if (price >= buyLow && price <= buyHigh) score += 25;
    else if (price > buyHigh && (!trimLow || price < trimLow)) score += 10;
    else if (price < buyLow) score += 3;
  }

  if (price > 0 && stop > 0 && price < stop) score -= 35;
  if (price > 0 && trimLow > 0 && price >= trimLow) score -= 10;
  if (price > 0 && trimHigh > 0 && price >= trimHigh) score -= 15;
  if (typeof input.technicalExtension === "number") {
    if (input.technicalExtension >= 0.18) score -= 12;
    else if (input.technicalExtension >= 0.10) score -= 5;
    else if (input.technicalExtension >= -0.05 && input.technicalExtension <= 0.08)
      score += 5;
  }

  return roundNumber(clampNumber(score, 0, 100), 0);
}

function calculateForgeSignalScore(input: {
  upside: number;
  revisionScore: number;
  momentumScore: number;
  qualityScore: number;
  dispersion: number;
  price?: number;
  buyZoneLow?: number;
  buyZoneHigh?: number;
  stopLevel?: number;
  trimLow?: number;
  trimHigh?: number;
  taConfidence?: TaConfidence;
  above200dma?: boolean;
  technicalExtension?: number;
}): number {
  const upsideScore = upsideToScore(input.upside);
  const momentumComposite = clampNumber(
    input.momentumScore * 0.7 + input.revisionScore * 0.3,
    0,
    100,
  );
  const technicalScore = calculateTechnicalSetupScore(input);
  const score =
    upsideScore * 0.3 +
    momentumComposite * 0.25 +
    input.qualityScore * 0.2 +
    technicalScore * 0.25;
  return roundNumber(clampNumber(score, 0, 100), 0);
}

function autoTag(active: boolean, label = "AUTO") {
  return active ? (
    <div className="mt-1 text-[10px] font-black tracking-wide text-[#067647]">
      {label}
    </div>
  ) : (
    <div className="mt-1 text-[10px] font-black tracking-wide text-[#667085]">
      MANUAL
    </div>
  );
}

function positiveNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function formatCurrencyTable(value: number | null | undefined): string {
  const n = positiveNumber(value);
  if (!n) return "—";
  const digits = n < 20 ? 2 : n < 100 ? 1 : 0;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMetric(value: number | null | undefined, digits = 0): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatRatio(value: number | null | undefined, digits = 0): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

function formatSignedRatio(value: number | null | undefined, digits = 1): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const pct = value * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(digits)}%`;
}

function valueBox(
  main: React.ReactNode,
  sub?: React.ReactNode,
  tone: "neutral" | "positive" | "warning" | "negative" = "neutral",
) {
  return (
    <div className={`readonly-box readonly-${tone}`}>
      <div className="readonly-main">{main}</div>
      {sub ? <div className="readonly-sub">{sub}</div> : null}
    </div>
  );
}

function zoneBox(
  low: number | null | undefined,
  high: number | null | undefined,
  sub?: React.ReactNode,
  tone: "neutral" | "positive" | "warning" | "negative" = "neutral",
) {
  return valueBox(
    `${formatCurrencyTable(low)} – ${formatCurrencyTable(high)}`,
    sub,
    tone,
  );
}

function scoreTone(score: number): "neutral" | "positive" | "warning" | "negative" {
  if (score >= 80) return "positive";
  if (score >= 65) return "neutral";
  if (score >= 50) return "warning";
  return "negative";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "STRONG";
  if (score >= 65) return "WATCH";
  if (score >= 50) return "NEUTRAL";
  return "WEAK";
}

function displayTaFields(
  row: Pick<
    Holding | BenchCandidate,
    | "price"
    | "buyZoneLow"
    | "buyZoneHigh"
    | "buyAnchor"
    | "stopLevel"
    | "trimLow"
    | "trimHigh"
    | "taConfidence"
    | "taNotes"
  >,
  ta?: TechnicalAutoData,
) {
  const price = positiveNumber(row.price) ?? positiveNumber(ta?.price) ?? 0;
  const buyZoneLow =
    positiveNumber(row.buyZoneLow) ?? positiveNumber(ta?.buyZoneLow) ??
    (price ? price * 0.88 : 0);
  const buyZoneHigh =
    positiveNumber(row.buyZoneHigh) ?? positiveNumber(ta?.buyZoneHigh) ??
    (price ? price * 0.97 : 0);
  const buyAnchor =
    positiveNumber(row.buyAnchor) ?? positiveNumber(ta?.buyAnchor) ??
    (price ? price * 0.94 : 0);
  const stopLevel =
    positiveNumber(row.stopLevel) ?? positiveNumber(ta?.stopLevel) ??
    (buyZoneLow ? buyZoneLow * 0.93 : 0);
  const trimLow =
    positiveNumber(row.trimLow) ?? positiveNumber(ta?.trimLow) ??
    (price ? price * 1.1 : 0);
  const trimHigh =
    positiveNumber(row.trimHigh) ?? positiveNumber(ta?.trimHigh) ??
    (price ? price * 1.18 : 0);
  const confidence =
    row.taConfidence && row.taConfidence !== "Manual"
      ? row.taConfidence
      : ta?.confidence ?? (price ? "Low" : "Manual");
  const notes =
    row.taNotes ||
    ta?.notes ||
    (price
      ? "Fallback price-based TA estimate. Verify chips/HVN/ribbon/MACD/RSI directly in TradingView before trading."
      : "Enter ticker and refresh live data to calculate the TA confluence framework.");

  return {
    price,
    buyZoneLow: roundNumber(buyZoneLow, 2),
    buyZoneHigh: roundNumber(buyZoneHigh, 2),
    buyAnchor: roundNumber(buyAnchor, 2),
    stopLevel: roundNumber(stopLevel, 2),
    trimLow: roundNumber(trimLow, 2),
    trimHigh: roundNumber(trimHigh, 2),
    confidence,
    notes,
  };
}

function actionTone(action: string): string {
  if (["BUY", "COVER"].includes(action)) return "text-[#067647]";
  if (["SELL", "BUY BACK", "TAX HARVEST"].includes(action))
    return "text-[#B42318]";
  if (["TRIM", "REBALANCE", "DAF CANDIDATE"].includes(action))
    return "text-[#C9A84C]";
  return "text-[#0D1B2A]";
}

function statusPill(action: string): string {
  if (["BUY", "COVER"].includes(action))
    return "bg-green-50 text-green-800 border-green-200";
  if (["SELL", "BUY BACK", "TAX HARVEST"].includes(action))
    return "bg-red-50 text-red-800 border-red-200";
  if (["TRIM", "REBALANCE", "DAF CANDIDATE"].includes(action))
    return "bg-yellow-50 text-yellow-800 border-yellow-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function classifyRegime(spy: number, ma50: number, ma200: number) {
  if (spy < ma50 && spy < ma200)
    return {
      code: "R0",
      label: "Bear",
      target: 0.5,
      posture: "Defensive / harvest",
      overlay: "No new calls unless risk reducing",
    };
  if (spy < ma50 && spy >= ma200)
    return {
      code: "R1",
      label: "Weak",
      target: 1.25,
      posture: "Selective buys",
      overlay: "Limited",
    };
  if (spy >= ma50 && spy < ma200)
    return {
      code: "R2",
      label: "Mixed",
      target: 1.25,
      posture: "Normal exposure",
      overlay: "Selective",
    };
  return {
    code: "R3",
    label: "Strong",
    target: 1.75,
    posture: "Max exposure",
    overlay: "Extended winners only",
  };
}

function metricCard(
  label: string,
  value: string,
  sub?: string,
  tone = "text-[#0D1B2A]",
) {
  return (
    <div className="border border-[#E5D8A8] bg-white p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#C9A84C]">
        {label}
      </div>
      <div className={`mt-3 text-2xl font-black ${tone}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-[#344054]">{sub}</div> : null}
    </div>
  );
}

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function ForgeDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dailyBrief");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [benchCandidates, setBenchCandidates] =
    useState<BenchCandidate[]>(DEFAULT_BENCH);
  const [openCalls, setOpenCalls] = useState<CoveredCall[]>([]);
  const [optionCandidates, setOptionCandidates] = useState<
    Record<string, OptionCandidate[]>
  >({});
  const [spy, setSpy] = useState(645);
  const [ma50, setMa50] = useState(628);
  const [ma200, setMa200] = useState(570);
  const [cash, setCash] = useState(0);
  const [marginDebt, setMarginDebt] = useState(0);
  const [marginRate, setMarginRate] = useState(5.75);
  const [hydrated, setHydrated] = useState(false);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, LiveQuote>>({});
  const [signalData, setSignalData] = useState<Record<string, SignalAutoData>>({});
  const [technicalData, setTechnicalData] = useState<Record<string, TechnicalAutoData>>({});
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");
  const [lastLiveRefresh, setLastLiveRefresh] = useState("");
  const [useLiveQuotes, setUseLiveQuotes] = useState(true);
  const [autoRefreshQuotes, setAutoRefreshQuotes] = useState(false);
  const [finnhubApiKey, setFinnhubApiKey] = useState("");
  const [screenerResults, setScreenerResults] = useState<ScreenerCandidate[]>([]);
  const [screenerMeta, setScreenerMeta] = useState<ScreenerMeta | null>(null);
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [screenerError, setScreenerError] = useState("");
  const [screenerMessage, setScreenerMessage] = useState("");

  useEffect(() => {
    try {
      const savedActiveTab = localStorage.getItem(STORAGE_KEYS.activeTab);
      const savedHoldings = localStorage.getItem(STORAGE_KEYS.holdings);
      const savedBench = localStorage.getItem(STORAGE_KEYS.bench);
      const savedCalls = localStorage.getItem(STORAGE_KEYS.calls);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);
      const savedLiveSettings = localStorage.getItem(STORAGE_KEYS.liveSettings);
      const savedScreener = localStorage.getItem(STORAGE_KEYS.screener);

      if (savedActiveTab) {
        const parsedTab = JSON.parse(savedActiveTab) as Tab;
        if (parsedTab in TAB_LABELS) setActiveTab(parsedTab);
      }
      if (savedHoldings) setHoldings(JSON.parse(savedHoldings) as Holding[]);
      if (savedBench)
        setBenchCandidates(JSON.parse(savedBench) as BenchCandidate[]);
      if (savedCalls) setOpenCalls(JSON.parse(savedCalls) as CoveredCall[]);
      if (savedScreener) setScreenerResults(JSON.parse(savedScreener) as ScreenerCandidate[]);
      if (savedSettings) {
        const s = JSON.parse(savedSettings) as {
          spy?: number;
          ma50?: number;
          ma200?: number;
          cash?: number;
          marginDebt?: number;
          marginRate?: number;
        };
        if (typeof s.spy === "number") setSpy(s.spy);
        if (typeof s.ma50 === "number") setMa50(s.ma50);
        if (typeof s.ma200 === "number") setMa200(s.ma200);
        if (typeof s.cash === "number") setCash(s.cash);
        if (typeof s.marginDebt === "number") setMarginDebt(s.marginDebt);
        if (typeof s.marginRate === "number") setMarginRate(s.marginRate);
      }
      if (savedLiveSettings) {
        const s = JSON.parse(savedLiveSettings) as {
          useLiveQuotes?: boolean;
          autoRefreshQuotes?: boolean;
          finnhubApiKey?: string;
        };
        if (typeof s.useLiveQuotes === "boolean")
          setUseLiveQuotes(s.useLiveQuotes);
        if (typeof s.autoRefreshQuotes === "boolean")
          setAutoRefreshQuotes(s.autoRefreshQuotes);
        if (typeof s.finnhubApiKey === "string")
          setFinnhubApiKey(s.finnhubApiKey);
      }
    } catch {
      // Leave default empty state if browser storage is invalid.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.activeTab, JSON.stringify(activeTab));
  }, [activeTab, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.holdings, JSON.stringify(holdings));
  }, [holdings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.bench, JSON.stringify(benchCandidates));
  }, [benchCandidates, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.calls, JSON.stringify(openCalls));
  }, [openCalls, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.screener, JSON.stringify(screenerResults.slice(0, 150)));
  }, [screenerResults, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({ spy, ma50, ma200, cash, marginDebt, marginRate }),
    );
  }, [cash, hydrated, ma200, ma50, marginDebt, marginRate, spy]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEYS.liveSettings,
      JSON.stringify({ useLiveQuotes, autoRefreshQuotes, finnhubApiKey }),
    );
  }, [autoRefreshQuotes, finnhubApiKey, hydrated, useLiveQuotes]);

  const quoteSymbols = useMemo(() => {
    const symbols = [
      "SPY",
      ...holdings.map((h) => h.ticker),
      ...benchCandidates.map((b) => b.ticker),
      ...openCalls.map((c) => c.ticker),
    ]
      .map(normalizeTicker)
      .filter(Boolean);
    return Array.from(new Set(symbols)).join(",");
  }, [benchCandidates, holdings, openCalls]);

  const optionSymbols = useMemo(() => {
    const symbols = holdings
      .filter((h) => h.ticker && h.shares > 0)
      .map((h) => normalizeTicker(h.ticker));
    return Array.from(new Set(symbols)).slice(0, 20).join(",");
  }, [holdings]);

  const signalSymbols = useMemo(() => {
    const symbols = [
      ...holdings.map((h) => h.ticker),
      ...benchCandidates.map((b) => b.ticker),
    ]
      .map(normalizeTicker)
      .filter(Boolean);
    return Array.from(new Set(symbols)).slice(0, 30).join(",");
  }, [benchCandidates, holdings]);

  async function refreshLiveMarketData() {
    if (!quoteSymbols) return;
    setLiveLoading(true);
    setLiveError("");
    try {
      const optionQuery = optionSymbols
        ? `&includeOptions=1&optionSymbols=${encodeURIComponent(optionSymbols)}`
        : "";
      const signalQuery = signalSymbols
        ? `&includeSignal=1&signalSymbols=${encodeURIComponent(signalSymbols)}`
        : "";
      const technicalQuery = signalSymbols
        ? `&includeTechnical=1&technicalSymbols=${encodeURIComponent(signalSymbols)}`
        : "";
      const response = await fetch(
        `/api/market?symbols=${encodeURIComponent(quoteSymbols)}${optionQuery}${signalQuery}${technicalQuery}`,
        {
          cache: "no-store",
          headers: finnhubApiKey.trim()
            ? { "x-finnhub-key": finnhubApiKey.trim() }
            : undefined,
        },
      );
      const data = (await response.json()) as MarketApiResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Live market data request failed.");
      }
      setLiveQuotes(data.quotes ?? {});
      setSignalData(data.signal ?? {});
      setTechnicalData(data.technical ?? {});
      setOptionCandidates(data.options ?? {});
      setLastLiveRefresh(data.asOf ?? new Date().toISOString());

      const nextSpy = data.market?.spy?.price;
      if (typeof nextSpy === "number" && nextSpy > 0)
        setSpy(Number(nextSpy.toFixed(2)));
      if (typeof data.market?.spySma50 === "number" && data.market.spySma50 > 0)
        setMa50(Number(data.market.spySma50.toFixed(2)));
      if (
        typeof data.market?.spySma200 === "number" &&
        data.market.spySma200 > 0
      )
        setMa200(Number(data.market.spySma200.toFixed(2)));

      setHoldings((prev) =>
        prev.map((h) => {
          const ticker = normalizeTicker(h.ticker);
          const q = data.quotes?.[ticker];
          const auto = data.signal?.[ticker];
          const ta = data.technical?.[ticker];
          const next = {
            ...h,
            price: q?.price ? Number(q.price.toFixed(2)) : h.price,
            upside: auto?.upside ?? h.upside,
            revisionScore: auto?.recommendationScore ?? h.revisionScore,
            momentumScore: auto?.momentumScore ?? h.momentumScore,
            qualityScore: auto?.qualityScore ?? h.qualityScore,
            dispersion: auto?.dispersion ?? h.dispersion,
            above200dma: ta?.above200dma ?? h.above200dma,
            technicalExtension: ta?.technicalExtension ?? h.technicalExtension,
            buyZoneLow: ta?.buyZoneLow ?? h.buyZoneLow ?? 0,
            buyZoneHigh: ta?.buyZoneHigh ?? h.buyZoneHigh ?? 0,
            buyAnchor: ta?.buyAnchor ?? h.buyAnchor ?? 0,
            stopLevel: ta?.stopLevel ?? h.stopLevel ?? 0,
            trimLow: ta?.trimLow ?? h.trimLow ?? 0,
            trimHigh: ta?.trimHigh ?? h.trimHigh ?? 0,
            taConfidence: ta?.confidence ?? h.taConfidence ?? "Manual",
            taNotes: ta?.notes ?? h.taNotes ?? "",
          };
          return {
            ...next,
            signalScore: calculateForgeSignalScore(next),
          };
        }),
      );
      setBenchCandidates((prev) =>
        prev.map((b) => {
          const ticker = normalizeTicker(b.ticker);
          const q = data.quotes?.[ticker];
          const auto = data.signal?.[ticker];
          const ta = data.technical?.[ticker];
          const next = {
            ...b,
            price: q?.price ? Number(q.price.toFixed(2)) : b.price,
            upside: auto?.upside ?? b.upside,
            revisionScore: auto?.recommendationScore ?? b.revisionScore,
            momentumScore: auto?.momentumScore ?? b.momentumScore,
            qualityScore: auto?.qualityScore ?? b.qualityScore,
            dispersion: auto?.dispersion ?? b.dispersion,
            buyZoneLow: ta?.buyZoneLow ?? b.buyZoneLow ?? 0,
            buyZoneHigh: ta?.buyZoneHigh ?? b.buyZoneHigh ?? 0,
            buyAnchor: ta?.buyAnchor ?? b.buyAnchor ?? 0,
            stopLevel: ta?.stopLevel ?? b.stopLevel ?? 0,
            trimLow: ta?.trimLow ?? b.trimLow ?? 0,
            trimHigh: ta?.trimHigh ?? b.trimHigh ?? 0,
            taConfidence: ta?.confidence ?? b.taConfidence ?? "Manual",
            taNotes: ta?.notes ?? b.taNotes ?? "",
          };
          return {
            ...next,
            signalScore: calculateForgeSignalScore(next),
          };
        }),
      );
      setOpenCalls((prev) =>
        prev.map((c) => {
          const q = data.quotes?.[normalizeTicker(c.ticker)];
          return q?.price
            ? { ...c, stockPrice: Number(q.price.toFixed(2)) }
            : c;
        }),
      );
    } catch (error) {
      setLiveError(
        error instanceof Error ? error.message : "Unknown market-data error.",
      );
    } finally {
      setLiveLoading(false);
    }
  }

  useEffect(() => {
    if (!hydrated || !useLiveQuotes) return;
    void refreshLiveMarketData();
    if (!autoRefreshQuotes) return;
    const id = window.setInterval(() => {
      void refreshLiveMarketData();
    }, 60_000);
    return () => window.clearInterval(id);
    // Intentionally keyed to the symbol list; price-only updates should not recreate the interval.
  }, [
    autoRefreshQuotes,
    finnhubApiKey,
    hydrated,
    optionSymbols,
    quoteSymbols,
    signalSymbols,
    useLiveQuotes,
  ]);

  const snapshot = useMemo(() => {
    const longMarketValue = holdings.reduce(
      (sum, h) => sum + h.shares * h.price,
      0,
    );
    const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.cost, 0);
    const netLiquidationValue = longMarketValue + cash - marginDebt;
    const currentLeverage =
      netLiquidationValue > 0 ? longMarketValue / netLiquidationValue : 0;
    const totalPnl = longMarketValue - totalCost;
    const weightedForgeScore =
      longMarketValue > 0
        ? holdings.reduce(
            (sum, h) => sum + h.signalScore * (h.shares * h.price),
            0,
          ) / longMarketValue
        : 0;
    const weightedUpside =
      longMarketValue > 0
        ? holdings.reduce(
            (sum, h) => sum + h.upside * (h.shares * h.price),
            0,
          ) / longMarketValue
        : 0;
    const coreValue = holdings
      .filter((h) => h.sleeve === "Core")
      .reduce((sum, h) => sum + h.shares * h.price, 0);
    const opportunisticValue = holdings
      .filter((h) => h.sleeve === "Opportunistic")
      .reduce((sum, h) => sum + h.shares * h.price, 0);
    const coreWeight = longMarketValue > 0 ? coreValue / longMarketValue : 0;
    const opportunisticWeight =
      longMarketValue > 0 ? opportunisticValue / longMarketValue : 0;
    const regime = classifyRegime(spy, ma50, ma200);
    const leverageGap = regime.target - currentLeverage;

    const enrichedHoldings: HoldingRow[] = holdings.map((h) => {
      const marketValue = h.shares * h.price;
      const weight = longMarketValue > 0 ? marketValue / longMarketValue : 0;
      const gain = h.cost > 0 ? h.price / h.cost - 1 : 0;
      const daysHeld = daysHeldFromPurchaseDate(h.purchaseDate, h.daysHeld);
      const ltcg = daysHeld >= 366;
      const priceInBuyZone =
        h.buyZoneLow > 0 &&
        h.buyZoneHigh > 0 &&
        h.price >= h.buyZoneLow &&
        h.price <= h.buyZoneHigh;
      const atTrimZone = h.trimLow > 0 && h.price >= h.trimLow;
      const invalidated = h.stopLevel > 0 && h.price > 0 && h.price < h.stopLevel;
      const coverEligible =
        weight > 0.06 &&
        h.above200dma &&
        (h.technicalExtension >= 0.15 || atTrimZone);
      const trim = weight > 0.075 || (h.trimHigh > 0 && h.price >= h.trimHigh);
      const buy = priceInBuyZone && h.signalScore >= 65 && !invalidated;
      const taxHarvest = gain < -0.08 && daysHeld < 366;
      const sell = invalidated || (daysHeld >= 366 && h.forgeRank > 100);
      const action: ActionState = sell
        ? "SELL"
        : taxHarvest
          ? "TAX HARVEST"
          : trim
            ? "TRIM"
            : coverEligible
              ? "COVER"
              : buy
                ? "BUY"
                : "HOLD";
      return { ...h, daysHeld, marketValue, weight, gain, ltcg, coverEligible, action };
    });

    const sectorWeights = Object.entries(
      enrichedHoldings.reduce<Record<string, number>>((acc, h) => {
        const key = h.sector || "Unclassified";
        acc[key] = (acc[key] ?? 0) + h.marketValue;
        return acc;
      }, {}),
    )
      .map(([sector, value]) => ({
        sector,
        weight: longMarketValue > 0 ? value / longMarketValue : 0,
      }))
      .sort((a, b) => b.weight - a.weight);

    const callAlerts = openCalls.map((c) => {
      const withinFivePercent =
        c.strike > 0 ? c.stockPrice >= c.strike * 0.95 : false;
      const twoTimesLoss =
        c.premiumReceived > 0 ? c.currentMark >= c.premiumReceived * 2 : false;
      const capture =
        c.premiumReceived > 0
          ? (c.premiumReceived - c.currentMark) / c.premiumReceived
          : 0;
      const buyback =
        c.delta >= 0.35 ||
        withinFivePercent ||
        twoTimesLoss ||
        capture >= 0.7 ||
        c.dte <= 7 ||
        c.earningsBeforeExpiry;
      return { ...c, capture, buyback };
    });

    const firstHoldingAction = enrichedHoldings.find(
      (h) => h.action !== "HOLD",
    )?.action;
    const primaryAction: ActionState =
      holdings.length === 0
        ? "BUY"
        : Math.abs(leverageGap) > 0.03
          ? "REBALANCE"
          : (firstHoldingAction ??
            (callAlerts.some((c) => c.buyback) ? "BUY BACK" : "HOLD"));

    return {
      longMarketValue,
      totalCost,
      netLiquidationValue,
      currentLeverage,
      totalPnl,
      weightedForgeScore,
      weightedUpside,
      coreWeight,
      opportunisticWeight,
      coreCount: holdings.filter((h) => h.sleeve === "Core").length,
      opportunisticCount: holdings.filter((h) => h.sleeve === "Opportunistic")
        .length,
      regime,
      leverageGap,
      primaryAction,
      enrichedHoldings,
      sectorWeights,
      callAlerts,
      annualFinancingCost: marginDebt * (marginRate / 100),
    };
  }, [cash, holdings, ma50, ma200, marginDebt, marginRate, openCalls, spy]);

  const actionItems = useMemo(() => {
    const items: Array<{ action: ActionState; title: string; detail: string }> =
      [];
    if (holdings.length === 0) {
      items.push({
        action: "BUY",
        title: "Build initial FORGE LT20 portfolio",
        detail:
          "Portfolio is empty. Use the Bench tab to promote candidates into 15 Core and 5 Opportunistic holdings, then enter shares, cost basis, current price, and holding period.",
      });
      return items;
    }
    if (snapshot.primaryAction === "REBALANCE") {
      items.push({
        action: "REBALANCE",
        title: "Leverage gap exceeds 3%",
        detail: `Target ${snapshot.regime.target.toFixed(2)}x vs current ${snapshot.currentLeverage.toFixed(2)}x. Adjust exposure after confirming cash buffer and financing cost.`,
      });
    }
    snapshot.enrichedHoldings
      .filter((h) => h.action !== "HOLD")
      .forEach((h) => {
        items.push({
          action: h.action,
          title: `${h.ticker} — ${h.action}`,
          detail: `${h.name}; weight ${(h.weight * 100).toFixed(1)}%, rank ${h.forgeRank}, days held ${h.daysHeld}.`,
        });
      });
    snapshot.enrichedHoldings
      .filter(
        (h) =>
          h.coverEligible &&
          (optionCandidates[normalizeTicker(h.ticker)]?.length ?? 0) > 0,
      )
      .forEach((h) => {
        const top = optionCandidates[normalizeTicker(h.ticker)]?.[0];
        if (top)
          items.push({
            action: "COVER",
            title: `${h.ticker} covered-call candidate`,
            detail: `Finnhub chain candidate: ${top.expiration} $${top.strike.toFixed(2)} call, ${top.dte} DTE, delta ${top.delta === null ? "n/a" : top.delta.toFixed(2)}, mid ${top.mid === null ? "n/a" : formatCurrency(top.mid)}.`,
          });
      });
    snapshot.callAlerts
      .filter((c) => c.buyback)
      .forEach((c) => {
        items.push({
          action: "BUY BACK",
          title: `${c.ticker} call buyback trigger`,
          detail: `Delta ${c.delta.toFixed(2)}, ${c.dte} DTE, capture ${(c.capture * 100).toFixed(0)}%. Buyback-first overlay rule applies.`,
        });
      });
    return items.length
      ? items
      : [
          {
            action: "HOLD" as ActionState,
            title: "No hard rule triggered",
            detail:
              "Maintain current portfolio posture; continue monitoring regime, rankings, tax lots, and covered-call status.",
          },
        ];
  }, [holdings.length, optionCandidates, snapshot]);

  function updateHolding(
    id: string,
    field: keyof Holding,
    value: string | number | boolean,
  ) {
    setHoldings((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const next = { ...h, [field]: value } as Holding;
        if (field === "ticker" && typeof value === "string") {
          const meta = tickerMetadata.get(normalizeTicker(value));
          if (meta) {
            next.name = next.name || meta.name;
            next.sleeve = meta.sleeve;
            next.sector = meta.sector;
            next.forgeRank = meta.rank ?? next.forgeRank;
            next.signalScore = meta.score ?? next.signalScore;
          }
        }
        return next;
      }),
    );
  }

  function updateCall(
    id: string,
    field: keyof CoveredCall,
    value: string | number | boolean,
  ) {
    setOpenCalls((prev) =>
      prev.map((c) =>
        c.id === id ? ({ ...c, [field]: value } as CoveredCall) : c,
      ),
    );
  }

  function updateBenchCandidate(
    index: number,
    field: keyof BenchCandidate,
    value: string | number,
  ) {
    setBenchCandidates((prev) =>
      prev.map((b, i) => {
        if (i !== index) return b;
        const next = { ...b, [field]: value } as BenchCandidate;
        if (field === "ticker" && typeof value === "string") {
          const meta = tickerMetadata.get(normalizeTicker(value));
          if (meta) {
            next.name = next.name || meta.name;
            next.sleeveFit = meta.sleeve;
            next.sector = meta.sector;
            next.signalScore = meta.score ?? next.signalScore;
          }
        }
        return next;
      }),
    );
  }

  function mergeScreenerCandidates(
    current: ScreenerCandidate[],
    incoming: ScreenerCandidate[],
  ): ScreenerCandidate[] {
    const map = new Map<string, ScreenerCandidate>();
    for (const item of current) {
      const ticker = normalizeTicker(item.ticker);
      if (ticker) map.set(ticker, item);
    }
    for (const item of incoming) {
      const ticker = normalizeTicker(item.ticker);
      if (ticker) map.set(ticker, item);
    }
    return Array.from(map.values())
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }))
      .slice(0, 150);
  }

  async function runSp500Screener(mode: "first" | "next" | "full") {
    setScreenerLoading(true);
    setScreenerError("");
    const batchSize = 75;
    let nextOffset = mode === "next" ? screenerMeta?.offset ?? screenerResults.length : 0;
    let accumulated = mode === "next" ? screenerResults : [];

    try {
      const maxBatches = mode === "full" ? 7 : 1;
      for (let batch = 0; batch < maxBatches; batch += 1) {
        setScreenerMessage(
          mode === "full"
            ? `Running S&P 500 screen batch ${batch + 1}...`
            : "Running S&P 500 screener...",
        );
        const response = await fetch(
          `/api/market?includeScreener=1&screenerUniverse=sp500&screenerLimit=${batchSize}&screenerOffset=${nextOffset}`,
          {
            cache: "no-store",
            headers: finnhubApiKey.trim()
              ? { "x-finnhub-key": finnhubApiKey.trim() }
              : undefined,
          },
        );
        const data = (await response.json()) as MarketApiResponse & { error?: string };
        if (!response.ok) throw new Error(data.error || "S&P 500 screen failed.");
        accumulated = mergeScreenerCandidates(accumulated, data.screener ?? []);
        setScreenerResults(accumulated);
        if (data.screenerMeta) {
          setScreenerMeta(data.screenerMeta);
          nextOffset = data.screenerMeta.offset + data.screenerMeta.processed;
          if (nextOffset >= data.screenerMeta.universeSize) break;
        } else {
          break;
        }
      }
      setScreenerMessage(
        `Screen complete. Ranked ${accumulated.length} stored candidates. Top 50 shown below.`,
      );
    } catch (error) {
      setScreenerError(error instanceof Error ? error.message : "Unknown screener error.");
    } finally {
      setScreenerLoading(false);
    }
  }

  function addScreenerToBench(candidate: ScreenerCandidate) {
    const ticker = normalizeTicker(candidate.ticker);
    if (!ticker) return;
    setBenchCandidates((prev) => {
      if (prev.some((item) => normalizeTicker(item.ticker) === ticker)) return prev;
      const nextCandidate: BenchCandidate = {
        rank: prev.length + 1,
        ticker,
        name: candidate.name || ticker,
        sleeveFit: candidate.suggestedRole,
        sector: candidate.sector || "Unclassified",
        price: candidate.price ?? 0,
        signalScore: candidate.score,
        upside: candidate.upside ?? 0,
        revisionScore: 50,
        momentumScore: candidate.momentumScore ?? 50,
        qualityScore: candidate.qualityScore ?? 50,
        dispersion: 0,
        buyZoneLow: candidate.buyZoneLow ?? 0,
        buyZoneHigh: candidate.buyZoneHigh ?? 0,
        buyAnchor: candidate.buyZoneLow && candidate.buyZoneHigh ? (candidate.buyZoneLow + candidate.buyZoneHigh) / 2 : 0,
        stopLevel: 0,
        trimLow: candidate.trimLow ?? 0,
        trimHigh: candidate.trimHigh ?? 0,
        taConfidence: candidate.dataQuality === "Full Data" ? "High" : candidate.dataQuality === "Partial Data" ? "Medium" : "Low",
        taNotes: candidate.sourceStatus,
        notes: `Added from S&P 500 Screener. Data quality: ${candidate.dataQuality}.`,
      };
      return [...prev, nextCandidate];
    });
    setActiveTab("bench");
  }

  function addScreenerToHoldings(candidate: ScreenerCandidate) {
    addScreenerToBench(candidate);
    setTimeout(() => {
      const benchCandidate: BenchCandidate = {
        rank: 1,
        ticker: normalizeTicker(candidate.ticker),
        name: candidate.name || candidate.ticker,
        sleeveFit: candidate.suggestedRole,
        sector: candidate.sector || "Unclassified",
        price: candidate.price ?? 0,
        signalScore: candidate.score,
        upside: candidate.upside ?? 0,
        revisionScore: 50,
        momentumScore: candidate.momentumScore ?? 50,
        qualityScore: candidate.qualityScore ?? 50,
        dispersion: 0,
        buyZoneLow: candidate.buyZoneLow ?? 0,
        buyZoneHigh: candidate.buyZoneHigh ?? 0,
        buyAnchor: candidate.buyZoneLow && candidate.buyZoneHigh ? (candidate.buyZoneLow + candidate.buyZoneHigh) / 2 : 0,
        stopLevel: 0,
        trimLow: candidate.trimLow ?? 0,
        trimHigh: candidate.trimHigh ?? 0,
        taConfidence: candidate.dataQuality === "Full Data" ? "High" : candidate.dataQuality === "Partial Data" ? "Medium" : "Low",
        taNotes: candidate.sourceStatus,
        notes: `Promoted from S&P 500 Screener. Data quality: ${candidate.dataQuality}.`,
      };
      addCandidateToHoldings(benchCandidate);
    }, 0);
  }

  function addBenchCandidate() {
    const nextRank =
      benchCandidates.reduce(
        (max, b) => Math.max(max, Number(b.rank) || 0),
        0,
      ) + 1;
    setBenchCandidates((prev) => [...prev, blankBenchCandidate(nextRank)]);
  }

  function resetBenchToDefault() {
    if (
      window.confirm(
        "Reset the FORGE Bench to the default candidate list? This will overwrite manual bench edits in this browser.",
      )
    ) {
      setBenchCandidates(DEFAULT_BENCH);
    }
  }

  function addOptionCandidateToCalls(candidate: OptionCandidate) {
    setOpenCalls((prev) => [
      ...prev,
      {
        ...blankCall(),
        ticker: candidate.ticker,
        stockPrice: liveQuotes[normalizeTicker(candidate.ticker)]?.price ?? 0,
        strike: candidate.strike,
        dte: candidate.dte,
        delta: candidate.delta ?? 0,
        premiumReceived:
          candidate.mid ??
          candidate.bid ??
          candidate.ask ??
          candidate.last ??
          0,
        currentMark:
          candidate.mid ??
          candidate.bid ??
          candidate.ask ??
          candidate.last ??
          0,
        notes: `Finnhub candidate ${candidate.expiration}; verify bid/ask in brokerage before trade.`,
      },
    ]);
    setActiveTab("coveredCalls");
  }

  function addCandidateToHoldings(candidate: BenchCandidate) {
    const alreadyOwned = holdings.some(
      (h) => h.ticker.toUpperCase() === candidate.ticker.toUpperCase(),
    );
    if (alreadyOwned) return;
    setHoldings((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ticker: candidate.ticker,
        name: candidate.name,
        sleeve: candidate.sleeveFit,
        sector: candidate.sector,
        shares: 0,
        cost: candidate.price,
        price: candidate.price,
        forgeRank: candidate.rank,
        signalScore: candidate.signalScore,
        upside: candidate.upside,
        revisionScore: candidate.revisionScore,
        momentumScore: candidate.momentumScore,
        qualityScore: candidate.qualityScore,
        dispersion: candidate.dispersion,
        daysHeld: 0,
        purchaseDate: todayIsoDate(),
        above200dma: true,
        earningsBeforeExpiry: false,
        technicalExtension: 0,
        buyZoneLow: candidate.buyZoneLow ?? 0,
        buyZoneHigh: candidate.buyZoneHigh ?? 0,
        buyAnchor: candidate.buyAnchor ?? 0,
        stopLevel: candidate.stopLevel ?? 0,
        trimLow: candidate.trimLow ?? 0,
        trimHigh: candidate.trimHigh ?? 0,
        taConfidence: candidate.taConfidence ?? "Manual",
        taNotes: candidate.taNotes ?? "",
        notes: candidate.notes,
      },
    ]);
    setActiveTab("holdings");
  }

  function clearHoldings() {
    if (window.confirm("Clear all FORGE holdings from this browser?")) {
      setHoldings([]);
    }
  }

  const ownedTickers = new Set(holdings.map((h) => h.ticker.toUpperCase()));

  const tickerMetadata = useMemo(() => {
    const map = new Map<string, { name: string; sleeve: Sleeve; sector: string; rank?: number; score?: number }>();
    for (const candidate of DEFAULT_BENCH) {
      const ticker = normalizeTicker(candidate.ticker);
      if (ticker) {
        map.set(ticker, {
          name: candidate.name,
          sleeve: candidate.sleeveFit,
          sector: candidate.sector || "Unclassified",
          rank: candidate.rank,
          score: candidate.signalScore,
        });
      }
    }
    for (const candidate of benchCandidates) {
      const ticker = normalizeTicker(candidate.ticker);
      if (ticker) {
        map.set(ticker, {
          name: candidate.name || map.get(ticker)?.name || ticker,
          sleeve: candidate.sleeveFit,
          sector: candidate.sector || map.get(ticker)?.sector || "Unclassified",
          rank: candidate.rank,
          score: candidate.signalScore,
        });
      }
    }
    for (const candidate of screenerResults) {
      const ticker = normalizeTicker(candidate.ticker);
      if (ticker && !map.has(ticker)) {
        map.set(ticker, {
          name: candidate.name || ticker,
          sleeve: candidate.suggestedRole,
          sector: candidate.sector || "Unclassified",
          rank: candidate.rank,
          score: candidate.score,
        });
      }
    }
    return map;
  }, [benchCandidates, screenerResults]);

  function metadataForTicker(ticker: string) {
    return tickerMetadata.get(normalizeTicker(ticker));
  }

  return (
    <main className="min-h-screen bg-[#EEF1F6] text-[#0D1B2A]">
      <style jsx global>{`
        .compact-data-table {
          font-size: 10px;
          line-height: 1.1;
        }
        .compact-data-table th {
          padding: 6px 4px !important;
          font-size: 9px !important;
          line-height: 1.05 !important;
          white-space: nowrap;
        }
        .compact-data-table td {
          padding: 4px !important;
          vertical-align: top;
        }
        .compact-data-table input,
        .compact-data-table select,
        .compact-data-table textarea {
          width: 100% !important;
          min-height: 26px;
          padding: 3px 4px !important;
          font-size: 10px !important;
          line-height: 1.1 !important;
        }
        .compact-data-table .live-label {
          font-size: 8px !important;
          line-height: 1.05 !important;
        }
        .holdings-table {
          min-width: 980px !important;
        }
        .bench-table {
          min-width: 820px !important;
        }
        .readonly-cell {
          min-height: 26px;
          border: 1px solid #E5D8A8;
          background: #F8FAFC;
          padding: 5px 6px;
          font-weight: 900;
          white-space: nowrap;
        }
        .readonly-box {
          min-height: 26px;
          border: 1px solid #E5D8A8;
          background: #F8FAFC;
          padding: 4px 5px;
          white-space: nowrap;
        }
        .readonly-main {
          font-weight: 900;
          color: #0D1B2A;
        }
        .readonly-sub {
          margin-top: 2px;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #667085;
        }
        .readonly-positive .readonly-sub,
        .readonly-positive .readonly-main {
          color: #067647;
        }
        .readonly-warning .readonly-sub,
        .readonly-warning .readonly-main {
          color: #A17600;
        }
        .readonly-negative .readonly-sub,
        .readonly-negative .readonly-main {
          color: #B42318;
        }
        .ta-detail-row td {
          background: #F8FAFC;
          border-bottom: 1px solid #E5D8A8;
          padding: 0 4px 8px 4px !important;
        }
        .ta-detail-box {
          border: 1px solid #E5D8A8;
          border-left: 4px solid #C9A84C;
          background: #FFFFFF;
          padding: 8px 10px;
        }
        .ta-detail-title {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0D1B2A;
        }
        .ta-detail-text {
          margin-top: 3px;
          font-size: 11px;
          line-height: 1.35;
          color: #344054;
        }
        .ta-mini-grid {
          margin-top: 7px;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 6px;
        }
        .ta-mini-item {
          border: 1px solid #EEF1F6;
          background: #F8FAFC;
          padding: 5px;
        }
        .ta-mini-label {
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          color: #667085;
        }
        .ta-mini-value {
          margin-top: 2px;
          font-size: 10px;
          font-weight: 900;
          color: #0D1B2A;
        }
      `}</style>
      <section className="mx-auto max-w-7xl bg-white shadow-sm">
        <header className="border-b-2 border-[#C9A84C] bg-[#0D1B2A] px-8 py-7 text-white">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-[0.08em]">
                Tenacity Investments
              </h1>
              <p className="mt-2 text-sm italic tracking-wide text-[#C9A84C]">
                Portfolio Strategies
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{displayDateString()}</p>
              <p className="mt-5 text-sm font-black uppercase tracking-wide text-[#C9A84C]">
                Private &amp; Confidential
              </p>
            </div>
          </div>
        </header>

        <div className="px-8 py-8">
          <div className="grid grid-cols-[1fr_280px] gap-8">
            <div>
              <h2 className="text-4xl font-black tracking-tight">
                FORGE LT20 Strategy Dashboard
              </h2>
              <p className="mt-5 max-w-4xl text-base leading-8 text-[#0D1B2A]">
                Tax-aware equity appreciation dashboard for a 20-stock S&amp;P
                500 portfolio using a 15 Core / 5 Opportunistic structure,
                APEX-style regime leverage, tax-lot monitoring, candidate bench
                management, and selective covered-call overlay management.
              </p>
            </div>
            <div className="flex items-center justify-end">
              <img
                src="/bull-logo.jpg"
                alt="Tenacity bull logo"
                className="max-h-44 w-full object-contain"
              />
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="bg-[#0D1B2A] p-4 text-center text-white">
              <div className="text-[10px] font-black uppercase tracking-widest">
                Target Return
              </div>
              <div className="mt-2 text-2xl font-black text-[#C9A84C]">
                ~15%
              </div>
              <div className="text-xs italic">pre-tax cycle target</div>
            </div>
            <div className="bg-[#0D1B2A] p-4 text-center text-white">
              <div className="text-[10px] font-black uppercase tracking-widest">
                Portfolio
              </div>
              <div className="mt-2 text-2xl font-black text-[#C9A84C]">
                20 Stocks
              </div>
              <div className="text-xs italic">S&amp;P 500 universe</div>
            </div>
            <div className="bg-[#0D1B2A] p-4 text-center text-white">
              <div className="text-[10px] font-black uppercase tracking-widest">
                Core / Opport.
              </div>
              <div className="mt-2 text-2xl font-black text-[#C9A84C]">
                15 / 5
              </div>
              <div className="text-xs italic">compounders / signal</div>
            </div>
            <div className="bg-[#0D1B2A] p-4 text-center text-white">
              <div className="text-[10px] font-black uppercase tracking-widest">
                Max Leverage
              </div>
              <div className="mt-2 text-2xl font-black text-[#C9A84C]">
                1.75x
              </div>
              <div className="text-xs italic">R3 max target</div>
            </div>
            <div className="bg-[#0D1B2A] p-4 text-center text-white">
              <div className="text-[10px] font-black uppercase tracking-widest">
                Holding Window
              </div>
              <div className="mt-2 text-2xl font-black text-[#C9A84C]">
                366+ Days
              </div>
              <div className="text-xs italic">LTCG preferred</div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
            {metricCard(
              "Net Liq",
              formatCurrency(snapshot.netLiquidationValue),
              "Long value + cash − margin",
            )}
            {metricCard(
              "Total P&L",
              formatSignedCurrency(snapshot.totalPnl),
              "Unrealized model P&L",
              snapshot.totalPnl >= 0 ? "text-[#067647]" : "text-[#B42318]",
            )}
            {metricCard(
              "Holdings",
              `${holdings.length}/20`,
              `${snapshot.coreCount} Core / ${snapshot.opportunisticCount} Opportunistic`,
            )}
            {metricCard(
              "FORGE Score",
              snapshot.weightedForgeScore.toFixed(1),
              "Weighted signal score",
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-[#E5D8A8] bg-[#F0EBD8] px-4 py-3 text-sm text-[#344054]">
            <div>
              <strong className="text-[#0D1B2A]">Live data:</strong>{" "}
              {useLiveQuotes ? "Enabled" : "Manual mode"}
              {lastLiveRefresh
                ? ` · Last refresh ${new Date(lastLiveRefresh).toLocaleTimeString("en-US")}`
                : " · Not refreshed yet"}
              {liveError ? (
                <span className="ml-2 font-bold text-[#B42318]">
                  {liveError}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void refreshLiveMarketData()}
              disabled={liveLoading || !useLiveQuotes}
              className="bg-[#0D1B2A] px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              {liveLoading ? "Refreshing..." : "Refresh Live Data"}
            </button>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border px-4 py-3 text-sm ${activeTab === tab ? "border-[#C9A84C] bg-[#C9A84C] text-white" : "border-[#E5D8A8] bg-white text-[#0D1B2A] hover:bg-[#F0EBD8]"}`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-4 max-w-7xl px-0 pb-10">
        <div className="grid gap-4 px-0 md:grid-cols-4">
          {metricCard(
            "Regime",
            `${snapshot.regime.code}`,
            `${snapshot.regime.label} · ${snapshot.regime.posture}`,
          )}
          {metricCard(
            "Target Leverage",
            `${snapshot.regime.target.toFixed(2)}x`,
            "APEX-style MA50/MA200 framework",
          )}
          {metricCard(
            "Current Leverage",
            `${snapshot.currentLeverage.toFixed(2)}x`,
            `Gap ${snapshot.leverageGap >= 0 ? "+" : ""}${snapshot.leverageGap.toFixed(2)}x`,
          )}
          {metricCard(
            "Primary Action",
            snapshot.primaryAction,
            holdings.length === 0
              ? "Build initial 20-stock book"
              : snapshot.primaryAction === "REBALANCE"
                ? "Leverage deviation >3%"
                : "Rule-engine output",
            actionTone(snapshot.primaryAction),
          )}
        </div>

        <div className="mt-4 rounded-none bg-white p-6 shadow-sm">
          {activeTab === "dailyBrief" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="border border-[#E5D8A8] p-5">
                <h3 className="text-xl font-black">Executive readout</h3>
                <p className="mt-2 text-sm leading-6 text-[#344054]">
                  FORGE is in{" "}
                  <strong>
                    {snapshot.regime.code} — {snapshot.regime.label}
                  </strong>
                  . Target leverage is{" "}
                  <strong>{snapshot.regime.target.toFixed(2)}x</strong>, current
                  leverage is{" "}
                  <strong>{snapshot.currentLeverage.toFixed(2)}x</strong>, and
                  the primary action is{" "}
                  <strong className={actionTone(snapshot.primaryAction)}>
                    {snapshot.primaryAction}
                  </strong>
                  .
                </p>
                {holdings.length === 0 ? (
                  <div className="mt-4 border border-[#E5D8A8] bg-[#F0EBD8] p-4 text-sm leading-6 text-[#344054]">
                    The FORGE book has not been started. Use the{" "}
                    <strong>Bench</strong> tab to promote candidates into the
                    Holdings ledger, then edit shares, basis, current price,
                    rank, signal score, and tax-lot age.
                  </div>
                ) : null}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {metricCard(
                    "Core Sleeve",
                    formatPercent(snapshot.coreWeight),
                    "Target 75% / 15 names",
                  )}
                  {metricCard(
                    "Opportunistic",
                    formatPercent(snapshot.opportunisticWeight),
                    "Target 25% / 5 names",
                  )}
                  {metricCard("Cash", formatCurrency(cash), "Liquidity buffer")}
                  {metricCard(
                    "Financing Cost",
                    formatCurrency(snapshot.annualFinancingCost),
                    "Estimated annual drag",
                  )}
                </div>
              </section>
              <section className="border border-[#E5D8A8] p-5">
                <h3 className="text-xl font-black">Immediate commentary</h3>
                <p className="mt-2 text-sm leading-6 text-[#344054]">
                  The dashboard reviews regime, leverage, holdings, bench
                  candidates, rankings, sector caps, tax lots, covered-call
                  status, and cash needs each session, then outputs one primary
                  action state.
                </p>
                <div className="mt-4 space-y-3">
                  {actionItems.slice(0, 5).map((item, i) => (
                    <div
                      key={`${item.title}-${i}`}
                      className="border-l-4 border-[#C9A84C] bg-[#EEF1F6] p-3"
                    >
                      <div
                        className={`text-sm font-black ${actionTone(item.action)}`}
                      >
                        {item.action} · {item.title}
                      </div>
                      <div className="mt-1 text-sm text-[#344054]">
                        {item.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "actionItems" && (
            <section>
              <h3 className="text-xl font-black">Action Items</h3>
              <p className="mt-2 text-sm text-[#344054]">
                Rule-engine output based on regime, leverage, holdings, signal
                ranks, tax lots, and covered-call status.
              </p>
              <div className="mt-4 grid gap-3">
                {actionItems.map((item, i) => (
                  <div
                    key={`${item.title}-${i}`}
                    className="grid gap-3 border border-[#E5D8A8] p-4 md:grid-cols-[140px_1fr]"
                  >
                    <div>
                      <span
                        className={`border px-3 py-2 text-xs font-black ${statusPill(item.action)}`}
                      >
                        {item.action}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black">{item.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-[#344054]">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "holdings" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">
                    Holdings Ledger
                  </h3>
                  <p className="mt-2 text-sm text-[#344054]">
                    Streamlined decision view. Editable inputs remain on the left; calculated outputs are locked: live price, buy zone, call zone, combined 0–100 score, and action state.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setHoldings((prev) => [...prev, blankHolding()])
                    }
                    className="bg-[#C9A84C] px-4 py-2 text-sm font-black text-white"
                  >
                    Add Holding
                  </button>
                  <button
                    type="button"
                    onClick={clearHoldings}
                    className="border border-[#E5D8A8] px-4 py-2 text-sm font-black text-[#0D1B2A]"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {holdings.length === 0 ? (
                <div className="mt-4 border border-[#E5D8A8] bg-[#F0EBD8] p-4 text-sm text-[#344054]">
                  No holdings entered yet. Go to the <strong>Bench</strong> tab
                  and click <strong>Promote</strong> next to a candidate, or use{" "}
                  <strong>Add Holding</strong> above.
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="compact-data-table holdings-table w-full border-collapse">
                    <thead className="bg-[#0D1B2A] text-white">
                      <tr>
                        {[
                          "Ticker",
                          "Name",
                          "Sleeve",
                          "Sector",
                          "Shares",
                          "Cost",
                          "Purchase Date",
                          "Price",
                          "Buy Zone",
                          "Call Zone",
                          "Score",
                          "Weight",
                          "P&L",
                          "Action",
                          "",
                        ].map((h) => (
                          <th
                            key={h}
                            className="p-3 text-left text-xs uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.enrichedHoldings.map((h) => {
                        const ticker = normalizeTicker(h.ticker);
                        const live = liveQuotes[ticker];
                        const ta = technicalData[ticker];
                        const meta = metadataForTicker(ticker);
                        const displaySleeve = meta?.sleeve ?? h.sleeve;
                        const displaySector = meta?.sector || h.sector || "Unclassified";
                        const displayTa = displayTaFields(h, ta);
                        const inBuyZone =
                          displayTa.price > 0 &&
                          displayTa.buyZoneLow > 0 &&
                          displayTa.buyZoneHigh > 0 &&
                          displayTa.price >= displayTa.buyZoneLow &&
                          displayTa.price <= displayTa.buyZoneHigh;
                        const inTrimZone =
                          displayTa.price > 0 &&
                          displayTa.trimLow > 0 &&
                          displayTa.price >= displayTa.trimLow;
                        const combinedScore = calculateForgeSignalScore({
                          ...h,
                          price: displayTa.price,
                          buyZoneLow: displayTa.buyZoneLow,
                          buyZoneHigh: displayTa.buyZoneHigh,
                          stopLevel: displayTa.stopLevel,
                          trimLow: displayTa.trimLow,
                          trimHigh: displayTa.trimHigh,
                          taConfidence: displayTa.confidence,
                          above200dma: ta?.above200dma ?? h.above200dma,
                          technicalExtension: ta?.technicalExtension ?? h.technicalExtension,
                        });
                        return (
                          <tr key={h.id} className="border-b border-[#E5D8A8] align-top">
                            <td className="p-2">
                              <input
                                className="w-20 border border-[#E5D8A8] p-2 font-black"
                                value={h.ticker}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "ticker",
                                    e.target.value.toUpperCase(),
                                  )
                                }
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-40 border border-[#E5D8A8] p-2"
                                value={h.name}
                                onChange={(e) =>
                                  updateHolding(h.id, "name", e.target.value)
                                }
                              />
                            </td>
                            <td className="p-2">
                              <div className="readonly-cell">{displaySleeve}</div>
                            </td>
                            <td className="p-2">
                              <div className="readonly-cell">{displaySector}</div>
                            </td>
                            <td className="p-2">
                              <input
                                className="w-20 border border-[#E5D8A8] p-2"
                                type="number"
                                value={h.shares}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "shares",
                                    parseNumber(e.target.value),
                                  )
                                }
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-20 border border-[#E5D8A8] p-2"
                                type="number"
                                value={h.cost}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "cost",
                                    parseNumber(e.target.value),
                                  )
                                }
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-28 border border-[#E5D8A8] p-2"
                                type="date"
                                value={h.purchaseDate || isoDateFromDaysHeld(h.daysHeld)}
                                onChange={(e) =>
                                  updateHolding(h.id, "purchaseDate", e.target.value)
                                }
                              />
                              {h.ltcg ? (
                                <div className="text-xs font-bold text-[#067647]">LTCG</div>
                              ) : (
                                <div className="text-xs font-bold text-[#B42318]">ST · {Math.max(0, 366 - h.daysHeld)}d</div>
                              )}
                            </td>
                            <td className="p-2">
                              {valueBox(
                                formatCurrencyTable(displayTa.price || h.price),
                                live
                                  ? `LIVE ${formatSignedPercentPoints(live.changePercent)}`
                                  : "STORED",
                                live ? "positive" : "neutral",
                              )}
                            </td>
                            <td className="p-2">
                              {zoneBox(
                                displayTa.buyZoneLow,
                                displayTa.buyZoneHigh,
                                inBuyZone ? "IN ZONE" : undefined,
                                inBuyZone ? "positive" : "neutral",
                              )}
                            </td>
                            <td className="p-2">
                              {zoneBox(
                                displayTa.trimLow,
                                displayTa.trimHigh,
                                inTrimZone ? "COVER / TRIM" : undefined,
                                inTrimZone ? "warning" : "neutral",
                              )}
                            </td>
                            <td className="p-2">
                              {valueBox(
                                formatMetric(combinedScore),
                                scoreLabel(combinedScore),
                                scoreTone(combinedScore),
                              )}
                            </td>
                            <td className="p-3 font-bold">
                              {formatPercent(h.weight)}
                            </td>
                            <td
                              className={`p-3 font-bold ${h.gain >= 0 ? "text-[#067647]" : "text-[#B42318]"}`}
                            >
                              {formatPercent(h.gain)}
                            </td>
                            <td className="p-3">
                              <span
                                className={`border px-2 py-1 text-xs font-black ${statusPill(h.action)}`}
                              >
                                {h.action}
                              </span>
                            </td>
                            <td className="p-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setHoldings((prev) =>
                                    prev.filter((x) => x.id !== h.id),
                                  )
                                }
                                className="text-xs font-black text-[#B42318]"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === "bench" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">
                    Bench / Top Candidate Pool
                  </h3>
                  <p className="mt-2 text-sm text-[#344054]">
                    Clean candidate view. Add or edit potential positions, then use the locked outputs — live price, buy zone, call zone, and combined FORGE Score — to prioritize adds and promotions.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addBenchCandidate}
                    className="bg-[#C9A84C] px-4 py-2 text-sm font-black text-white"
                  >
                    Add Candidate
                  </button>
                  <button
                    type="button"
                    onClick={resetBenchToDefault}
                    className="border border-[#E5D8A8] px-4 py-2 text-sm font-black text-[#0D1B2A]"
                  >
                    Reset Default
                  </button>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="compact-data-table bench-table w-full border-collapse">
                  <thead className="bg-[#0D1B2A] text-white">
                    <tr>
                      {[
                        "Rank",
                        "Ticker",
                        "Name",
                        "Sleeve",
                        "Sector",
                        "Price",
                        "Buy Zone",
                        "Call Zone",
                        "Score",
                        "Status",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="p-3 text-left text-xs uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {benchCandidates.map((s, index) => {
                      const ticker = normalizeTicker(s.ticker);
                      const owned = ownedTickers.has(s.ticker.toUpperCase());
                      const live = liveQuotes[ticker];
                      const ta = technicalData[ticker];
                      const meta = metadataForTicker(ticker);
                      const displaySleeve = meta?.sleeve ?? s.sleeveFit;
                      const displaySector = meta?.sector || s.sector || "Unclassified";
                      const displayTa = displayTaFields(s, ta);
                      const inBuyZone =
                        displayTa.price > 0 &&
                        displayTa.buyZoneLow > 0 &&
                        displayTa.buyZoneHigh > 0 &&
                        displayTa.price >= displayTa.buyZoneLow &&
                        displayTa.price <= displayTa.buyZoneHigh;
                      const inTrimZone =
                        displayTa.price > 0 &&
                        displayTa.trimLow > 0 &&
                        displayTa.price >= displayTa.trimLow;
                      const combinedScore = calculateForgeSignalScore({
                        ...s,
                        price: displayTa.price,
                        buyZoneLow: displayTa.buyZoneLow,
                        buyZoneHigh: displayTa.buyZoneHigh,
                        stopLevel: displayTa.stopLevel,
                        trimLow: displayTa.trimLow,
                        trimHigh: displayTa.trimHigh,
                        taConfidence: displayTa.confidence,
                      });
                      return (
                        <tr key={`${s.ticker || "bench"}-${index}`} className="border-b border-[#E5D8A8] align-top">
                          <td className="p-2">
                            <input
                              className="w-10 border border-[#E5D8A8] p-1 text-center font-black"
                              type="number"
                              value={s.rank}
                              onChange={(e) =>
                                updateBenchCandidate(
                                  index,
                                  "rank",
                                  parseNumber(e.target.value),
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-20 border border-[#E5D8A8] p-2 font-black"
                              value={s.ticker}
                              onChange={(e) =>
                                updateBenchCandidate(
                                  index,
                                  "ticker",
                                  e.target.value.toUpperCase(),
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-48 border border-[#E5D8A8] p-2"
                              value={s.name}
                              onChange={(e) =>
                                updateBenchCandidate(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <div className="readonly-cell">{displaySleeve}</div>
                          </td>
                          <td className="p-2">
                            <div className="readonly-cell">{displaySector}</div>
                          </td>
                          <td className="p-2">
                            {valueBox(
                              formatCurrencyTable(displayTa.price || s.price),
                              live
                                ? `LIVE ${formatSignedPercentPoints(live.changePercent)}`
                                : "STORED",
                              live ? "positive" : "neutral",
                            )}
                          </td>
                          <td className="p-2">
                            {zoneBox(
                              displayTa.buyZoneLow,
                              displayTa.buyZoneHigh,
                              inBuyZone ? "IN ZONE" : undefined,
                              inBuyZone ? "positive" : "neutral",
                            )}
                          </td>
                          <td className="p-2">
                            {zoneBox(
                              displayTa.trimLow,
                              displayTa.trimHigh,
                              inTrimZone ? "COVER / TRIM" : undefined,
                              inTrimZone ? "warning" : "neutral",
                            )}
                          </td>
                          <td className="p-2">
                            {valueBox(
                              formatMetric(combinedScore),
                              scoreLabel(combinedScore),
                              scoreTone(combinedScore),
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`border px-2 py-1 text-xs font-black ${owned ? statusPill("HOLD") : statusPill("BUY")}`}
                            >
                              {owned ? "OWNED" : "BENCH"}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                disabled={owned || !s.ticker}
                                onClick={() => addCandidateToHoldings(s)}
                                className={`px-3 py-2 text-xs font-black ${owned || !s.ticker ? "bg-slate-100 text-slate-400" : "bg-[#C9A84C] text-white"}`}
                              >
                                {owned ? "Added" : "Promote"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setBenchCandidates((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  )
                                }
                                className="text-xs font-black text-[#B42318]"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "sp500Screener" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">S&amp;P 500 Universe Screener</h3>
                  <p className="mt-2 text-sm text-[#344054]">
                    Separate heavier screen for ranking the broader S&amp;P 500 universe. Normal Refresh Live Data updates Holdings and Bench; this tab screens the universe in batches so it does not slow the dashboard.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScreenerResults([]);
                      setScreenerMeta(null);
                      void runSp500Screener("first");
                    }}
                    className="bg-[#C9A84C] px-4 py-2 text-sm font-black text-white"
                    disabled={screenerLoading}
                  >
                    Run First Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => void runSp500Screener("next")}
                    className="border border-[#E5D8A8] px-4 py-2 text-sm font-black text-[#0D1B2A]"
                    disabled={screenerLoading || !screenerMeta}
                  >
                    Run Next Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenerResults([]);
                      setScreenerMeta(null);
                      void runSp500Screener("full");
                    }}
                    className="border border-[#E5D8A8] bg-[#0D1B2A] px-4 py-2 text-sm font-black text-white"
                    disabled={screenerLoading}
                  >
                    Run Full Screen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenerResults([]);
                      setScreenerMeta(null);
                      setScreenerMessage("");
                    }}
                    className="border border-[#E5D8A8] px-4 py-2 text-sm font-black text-[#B42318]"
                    disabled={screenerLoading}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {metricCard("Stored Candidates", String(screenerResults.length), "Ranked by score")}
                {metricCard("Universe Progress", screenerMeta ? `${Math.min(screenerMeta.offset + screenerMeta.processed, screenerMeta.universeSize)} / ${screenerMeta.universeSize}` : "Not run", "S&P 500 batches")}
                {metricCard("Top Candidate", screenerResults[0]?.ticker ?? "—", screenerResults[0] ? `${screenerResults[0].score}/100` : "Run screen")}
                {metricCard("Selection Goal", "15 + 5", "Core + Opportunistic")}
              </div>
              {screenerMessage ? (
                <div className="mt-4 border border-[#E5D8A8] bg-[#F0EBD8] p-3 text-sm text-[#344054]">
                  {screenerMessage}
                </div>
              ) : null}
              {screenerError ? (
                <div className="mt-4 border border-[#F04438] bg-[#FEF3F2] p-3 text-sm font-bold text-[#B42318]">
                  {screenerError}
                </div>
              ) : null}
              <div className="mt-4 overflow-x-auto">
                <table className="compact-data-table bench-table w-full border-collapse">
                  <thead className="bg-[#0D1B2A] text-white">
                    <tr>
                      {["Rank", "Ticker", "Name", "Sector", "Role", "Price", "Buy Zone", "Call Zone", "Score", "Action", "Data Level", ""].map((h) => (
                        <th key={h} className="p-3 text-left text-xs uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {screenerResults.slice(0, 50).map((s) => {
                      const owned = ownedTickers.has(normalizeTicker(s.ticker));
                      return (
                        <tr key={s.ticker} className="border-b border-[#E5D8A8] align-top">
                          <td className="p-2 font-black">{s.rank}</td>
                          <td className="p-2 font-black">{s.ticker}</td>
                          <td className="p-2">{s.name}</td>
                          <td className="p-2">{s.sector || "—"}</td>
                          <td className="p-2">{s.suggestedRole}</td>
                          <td className="p-2">{valueBox(formatCurrencyTable(s.price), undefined, "neutral")}</td>
                          <td className="p-2">{zoneBox(s.buyZoneLow, s.buyZoneHigh, undefined, "neutral")}</td>
                          <td className="p-2">{zoneBox(s.trimLow, s.trimHigh, undefined, "neutral")}</td>
                          <td className="p-2">{valueBox(formatMetric(s.score), scoreLabel(s.score), scoreTone(s.score))}</td>
                          <td className="p-2">
                            <span className={`border px-2 py-1 text-xs font-black ${statusPill(s.action === "AVOID" ? "SELL" : s.action === "CALL / TRIM" ? "COVER" : s.action === "BUY ZONE" ? "BUY" : "HOLD")}`}>
                              {owned ? "OWNED" : s.action}
                            </span>
                          </td>
                          <td className="p-2 text-[10px] leading-4 text-[#344054]">
                            <div className="font-black text-[#0D1B2A]">{s.dataQuality}</div>
                            {s.sourceStatus ? <div>{s.sourceStatus}</div> : null}
                          </td>
                          <td className="p-2">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => addScreenerToBench(s)}
                                className="bg-[#C9A84C] px-3 py-2 text-xs font-black text-white"
                              >
                                Add Bench
                              </button>
                              <button
                                type="button"
                                disabled={owned}
                                onClick={() => addScreenerToHoldings(s)}
                                className={`px-3 py-2 text-xs font-black ${owned ? "bg-slate-100 text-slate-400" : "border border-[#E5D8A8] text-[#0D1B2A]"}`}
                              >
                                {owned ? "Owned" : "Promote"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {screenerResults.length === 0 && !screenerLoading ? (
                <div className="mt-4 border border-[#E5D8A8] bg-white p-4 text-sm text-[#344054]">
                  No screen results yet. Use <strong>Run First Batch</strong> for a quick sample, or <strong>Run Full Screen</strong> for the broader universe. Full screen may take time and can hit API limits on free data plans.
                </div>
              ) : null}
            </section>
          )}

          {activeTab === "forgeSignal" && (
            <section>
              <h3 className="text-xl font-black">FORGE Signal Engine</h3>
              <p className="mt-2 text-sm text-[#344054]">
                Consensus upside is the entry signal, not the whole strategy.
                Final ownership requires target revisions, EPS/revenue
                revisions, momentum confirmation, quality, and dispersion
                control.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {metricCard(
                  "Consensus Upside",
                  "25%",
                  "Median target preferred",
                )}
                {metricCard("Target Revisions", "15%", "Stale target control")}
                {metricCard("EPS Revisions", "20%", "Earnings momentum")}
                {metricCard("Revenue Revisions", "10%", "Sales confirmation")}
                {metricCard("Momentum", "15%", "Relative strength")}
                {metricCard("Quality", "10%", "FCF / balance sheet")}
                {metricCard("Dispersion", "5%", "Penalty for disagreement")}
                {metricCard("Bench", "Top 50", "Replacement pool")}
              </div>
              <div className="mt-5 border border-[#E5D8A8] bg-[#F0EBD8] p-4 text-sm leading-6 text-[#344054]">
                Current build: the main Bench and Holdings pages intentionally
                expose fewer fields. Refresh Live Data updates the names already in
                Holdings and Bench; the S&P 500 Screener tab separately ranks a broader
                universe so Bench candidates can be refreshed over time.
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-sm">
                  <thead className="bg-[#0D1B2A] text-white">
                    <tr>
                      {[
                        "Ticker",
                        "Upside",
                        "Revisions / Reco",
                        "Momentum",
                        "Quality",
                        "Dispersion",
                        "Target Median",
                        "TA Buy Zone",
                        "TA Status",
                        "Source Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="p-3 text-left text-xs uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      new Set([
                        ...holdings.map((h) => normalizeTicker(h.ticker)),
                        ...benchCandidates.map((b) => normalizeTicker(b.ticker)),
                      ].filter(Boolean)),
                    )
                      .slice(0, 30)
                      .map((ticker) => {
                        const sig = signalData[ticker];
                        return (
                          <tr key={ticker} className="border-b border-[#E5D8A8]">
                            <td className="p-3 font-black">{ticker}</td>
                            <td className="p-3">
                              {sig?.upside === null || sig?.upside === undefined
                                ? "Manual"
                                : formatPercent(sig.upside)}
                            </td>
                            <td className="p-3">
                              {sig?.recommendationScore === null || sig?.recommendationScore === undefined
                                ? "Manual"
                                : `${sig.recommendationScore}/100`}
                            </td>
                            <td className="p-3">
                              {sig?.momentumScore === null || sig?.momentumScore === undefined
                                ? "Manual"
                                : `${sig.momentumScore}/100`}
                            </td>
                            <td className="p-3">
                              {sig?.qualityScore === null || sig?.qualityScore === undefined
                                ? "Manual"
                                : `${sig.qualityScore}/100`}
                            </td>
                            <td className="p-3">
                              {sig?.dispersion === null || sig?.dispersion === undefined
                                ? "Manual"
                                : formatPercent(sig.dispersion)}
                            </td>
                            <td className="p-3">
                              {sig?.targetMedian ? formatCurrency(sig.targetMedian) : "—"}
                            </td>
                            <td className="p-3">
                              {technicalData[ticker]?.buyZoneLow && technicalData[ticker]?.buyZoneHigh
                                ? `${formatCurrency(technicalData[ticker].buyZoneLow ?? 0)} – ${formatCurrency(technicalData[ticker].buyZoneHigh ?? 0)}`
                                : "Manual"}
                            </td>
                            <td className="p-3 text-xs text-[#344054]">
                              {technicalData[ticker]
                                ? `${technicalData[ticker].confidence}; ${technicalData[ticker].trendState}; ${technicalData[ticker].macdState}`
                                : "Refresh Live Data to load TA."}
                            </td>
                            <td className="p-3 text-xs text-[#344054]">
                              {sig
                                ? `${sig.upsideSource}; ${sig.dispersionSource}; ${sig.recommendationTrend}`
                                : "Refresh Live Data to load Finnhub signal fields."}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "taxLots" && (
            <section>
              <h3 className="text-xl font-black">Tax Lots</h3>
              <p className="mt-2 text-sm text-[#344054]">
                Current version treats each holding as one lot. Later, this
                should become a multi-lot register. Prefer 366+ day holds, but
                tax-loss harvest anytime if the replacement is better.
              </p>
              <div className="mt-4 grid gap-3">
                {snapshot.enrichedHoldings.length === 0 ? (
                  <div className="border border-[#E5D8A8] bg-[#F0EBD8] p-4 text-sm text-[#344054]">
                    No holdings entered yet.
                  </div>
                ) : (
                  snapshot.enrichedHoldings.map((lot) => {
                    const harvest = lot.gain < -0.08;
                    return (
                      <div
                        key={lot.id}
                        className="grid gap-3 border border-[#E5D8A8] p-4 md:grid-cols-[120px_1fr_120px_140px]"
                      >
                        <div className="font-black">
                          {lot.ticker}
                          <div className="text-xs font-normal text-[#344054]">
                            {lot.sleeve}
                          </div>
                        </div>
                        <div className="text-sm text-[#344054]">
                          {lot.daysHeld >= 366
                            ? "LTCG eligible. Sell highest-basis LT shares first for cash needs; consider DAF only for low-basis winners."
                            : `Not yet LTCG eligible. ${366 - lot.daysHeld} days remaining.`}
                        </div>
                        <div
                          className={
                            lot.gain >= 0 ? "text-[#067647]" : "text-[#B42318]"
                          }
                        >
                          {formatPercent(lot.gain)}
                        </div>
                        <div>
                          {harvest ? (
                            <span className="text-[#B42318] font-bold">
                              Harvest candidate
                            </span>
                          ) : lot.daysHeld >= 366 ? (
                            <span className="text-[#067647] font-bold">
                              LTCG
                            </span>
                          ) : (
                            <span className="text-[#B42318] font-bold">ST</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {activeTab === "coveredCalls" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">Covered Call Overlay</h3>
                  <p className="mt-2 text-sm text-[#344054]">
                    Calls are income-enhancing, not position-exiting. Finnhub
                    option-chain candidates are refreshed with live data and
                    should be verified in your brokerage platform before
                    execution.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenCalls((prev) => [...prev, blankCall()])}
                  className="bg-[#C9A84C] px-4 py-2 text-sm font-black text-white"
                >
                  Add Call
                </button>
              </div>

              <div className="mt-5 border border-[#E5D8A8] bg-[#F0EBD8] p-4">
                <h4 className="font-black text-[#0D1B2A]">
                  Finnhub Sell-Call Candidates
                </h4>
                <p className="mt-2 text-sm leading-6 text-[#344054]">
                  Screen: holding must satisfy FORGE cover eligibility, then the
                  app looks for calls roughly 20–35 DTE, 10–15% OTM, and near
                  0.10–0.20 delta when delta is available. Free option-chain
                  data can be stale; use this as a daily alert, not a trade
                  ticket.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[1050px] border-collapse text-sm">
                    <thead className="bg-[#0D1B2A] text-white">
                      <tr>
                        {[
                          "Ticker",
                          "Expiration",
                          "Strike",
                          "DTE",
                          "Delta",
                          "Bid",
                          "Ask",
                          "Mid",
                          "OI",
                          "Volume",
                          "Note",
                          "",
                        ].map((h) => (
                          <th
                            key={h}
                            className="p-3 text-left text-xs uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.enrichedHoldings
                        .filter((h) => h.coverEligible)
                        .flatMap(
                          (h) =>
                            optionCandidates[normalizeTicker(h.ticker)] ?? [],
                        ).length === 0 ? (
                        <tr>
                          <td
                            colSpan={12}
                            className="p-4 text-sm text-[#344054]"
                          >
                            No Finnhub option candidates loaded. Click Refresh
                            Live Data after holdings are entered and cover
                            eligibility is satisfied.
                          </td>
                        </tr>
                      ) : (
                        snapshot.enrichedHoldings
                          .filter((h) => h.coverEligible)
                          .flatMap(
                            (h) =>
                              optionCandidates[normalizeTicker(h.ticker)] ?? [],
                          )
                          .map((o, idx) => (
                            <tr
                              key={`${o.ticker}-${o.expiration}-${o.strike}-${idx}`}
                              className="border-b border-[#E5D8A8]"
                            >
                              <td className="p-3 font-black">{o.ticker}</td>
                              <td className="p-3">{o.expiration}</td>
                              <td className="p-3">
                                {formatCurrency(o.strike)}
                              </td>
                              <td className="p-3">{o.dte}</td>
                              <td className="p-3">
                                {o.delta === null ? "—" : o.delta.toFixed(2)}
                              </td>
                              <td className="p-3">
                                {o.bid === null ? "—" : formatCurrency(o.bid)}
                              </td>
                              <td className="p-3">
                                {o.ask === null ? "—" : formatCurrency(o.ask)}
                              </td>
                              <td className="p-3 font-bold">
                                {o.mid === null ? "—" : formatCurrency(o.mid)}
                              </td>
                              <td className="p-3">{o.openInterest ?? "—"}</td>
                              <td className="p-3">{o.volume ?? "—"}</td>
                              <td className="p-3 text-xs text-[#344054]">
                                {o.note}
                              </td>
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => addOptionCandidateToCalls(o)}
                                  className="bg-[#C9A84C] px-3 py-2 text-xs font-black text-white"
                                >
                                  Use
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <h4 className="mt-6 font-black text-[#0D1B2A]">
                Open / Manual Covered Calls
              </h4>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse text-sm">
                  <thead className="bg-[#0D1B2A] text-white">
                    <tr>
                      {[
                        "Ticker",
                        "Shares",
                        "Stock",
                        "Strike",
                        "DTE",
                        "Delta",
                        "Premium",
                        "Mark",
                        "Capture",
                        "Earnings",
                        "Status",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="p-3 text-left text-xs uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.callAlerts.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-4 text-sm text-[#344054]">
                          No covered calls open.
                        </td>
                      </tr>
                    ) : (
                      snapshot.callAlerts.map((c) => (
                        <tr key={c.id} className="border-b border-[#E5D8A8]">
                          <td className="p-2">
                            <input
                              className="w-24 border border-[#E5D8A8] p-2 font-black"
                              value={c.ticker}
                              onChange={(e) =>
                                updateCall(
                                  c.id,
                                  "ticker",
                                  e.target.value.toUpperCase(),
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-24 border border-[#E5D8A8] p-2"
                              type="number"
                              value={c.sharesCovered}
                              onChange={(e) =>
                                updateCall(
                                  c.id,
                                  "sharesCovered",
                                  parseNumber(e.target.value),
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-24 border border-[#E5D8A8] p-2"
                              type="number"
                              value={c.stockPrice}
                              onChange={(e) =>
                                updateCall(
                                  c.id,
                                  "stockPrice",
                                  parseNumber(e.target.value),
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-24 border border-[#E5D8A8] p-2"
                              type="number"
                              value={c.strike}
                              onChange={(e) =>
                                updateCall(
                                  c.id,
                                  "strike",
                                  parseNumber(e.target.value),
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-20 border border-[#E5D8A8] p-2"
                              type="number"
                              value={c.dte}
                              onChange={(e) =>
                                updateCall(
                                  c.id,
                                  "dte",
                                  parseNumber(e.target.value),
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-20 border border-[#E5D8A8] p-2"
                              type="number"
                              step="0.01"
                              value={c.delta}
                              onChange={(e) =>
                                updateCall(
                                  c.id,
                                  "delta",
                                  parseNumber(e.target.value),
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-24 border border-[#E5D8A8] p-2"
                              type="number"
                              value={c.premiumReceived}
                              onChange={(e) =>
                                updateCall(
                                  c.id,
                                  "premiumReceived",
                                  parseNumber(e.target.value),
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-24 border border-[#E5D8A8] p-2"
                              type="number"
                              value={c.currentMark}
                              onChange={(e) =>
                                updateCall(
                                  c.id,
                                  "currentMark",
                                  parseNumber(e.target.value),
                                )
                              }
                            />
                          </td>
                          <td className="p-3">{formatPercent(c.capture)}</td>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={c.earningsBeforeExpiry}
                              onChange={(e) =>
                                updateCall(
                                  c.id,
                                  "earningsBeforeExpiry",
                                  e.target.checked,
                                )
                              }
                            />
                          </td>
                          <td className="p-3">
                            <span
                              className={`border px-2 py-1 text-xs font-black ${statusPill(c.buyback ? "BUY BACK" : "HOLD")}`}
                            >
                              {c.buyback ? "BUY BACK" : "HOLD"}
                            </span>
                          </td>
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenCalls((prev) =>
                                  prev.filter((x) => x.id !== c.id),
                                )
                              }
                              className="text-xs font-black text-[#B42318]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "performance" && (
            <section>
              <h3 className="text-xl font-black">Performance</h3>
              <p className="mt-2 text-sm text-[#344054]">
                FORGE is theory-driven and rules-based, not a backtested
                performance claim. This page should eventually compare FORGE
                against SPY, equal-weight S&amp;P 500, TITAN, and
                dividend-income proxies.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {metricCard("Net Liq", formatCurrency(snapshot.netLiquidationValue), "cash + holdings - margin")}
                {metricCard("Total P&L", formatCurrency(snapshot.totalPnl), "unrealized vs entered cost")}
                {metricCard("Weighted Score", formatMetric(snapshot.weightedForgeScore), "current holdings")}
                {metricCard("Benchmark", "SPY", "FORGE primary yardstick")}
                {metricCard("Target Return", "~15%", "pre-tax cycle target")}
                {metricCard("Tax Goal", "LTCG", "366+ days preferred")}
                {metricCard("Turnover", "Low/Mod", "Core biased to hold")}
                {metricCard("Screener", screenerResults.length ? `${screenerResults.length} names` : "Not run", "S&P 500 candidate pool")}
              </div>
            </section>
          )}

          {activeTab === "fundProfile" && (
            <section>
              <h3 className="text-xl font-black">Fund Profile</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="border border-[#E5D8A8] p-4">
                  <h4 className="font-black text-[#C9A84C]">Strategy Role</h4>
                  <p className="mt-2 text-sm leading-6 text-[#344054]">
                    Taxable-account appreciation sleeve inside the Tenacity
                    strategy stack. APEX enhances core index ownership; TITAN
                    focuses on income/yield; FORGE converts equity appreciation
                    into tax-aware cash flow.
                  </p>
                </div>
                <div className="border border-[#E5D8A8] p-4">
                  <h4 className="font-black text-[#C9A84C]">Document Links</h4>
                  <div className="mt-2 flex flex-col gap-2 text-sm">
                    <a
                      className="font-bold text-[#1A3A5C] underline"
                      href="/FORGE_LT20_Whitepaper.pdf"
                      target="_blank"
                    >
                      FORGE LT20 Whitepaper
                    </a>
                    <a
                      className="font-bold text-[#1A3A5C] underline"
                      href="/FORGE_LT20_Rule_Set_Quick_Reference.pdf"
                      target="_blank"
                    >
                      FORGE LT20 Rule Set Quick Reference
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "ruleSet" && (
            <section>
              <h3 className="text-xl font-black">Rule Set</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {RULES.map((r, idx) => (
                  <div
                    key={r.title}
                    className="border border-[#E5D8A8] bg-white p-4"
                  >
                    <div className="mb-2 inline-block bg-[#0D1B2A] px-2 py-1 text-xs font-black text-[#C9A84C]">
                      R{idx + 1}
                    </div>
                    <h4 className="font-black">{r.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-[#344054]">
                      {r.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "settings" && (
            <section>
              <h3 className="text-xl font-black">Settings</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="border border-[#E5D8A8] bg-[#F0EBD8] p-4 md:col-span-2">
                  <h4 className="font-black text-[#0D1B2A]">
                    Live Market Data
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-[#344054]">
                    Enter a Finnhub API key here for browser-managed live
                    quotes. The key is saved only in this browser's local
                    storage and is sent to this app's server-side{" "}
                    <code>/api/market</code> route when refreshing quotes and
                    once-daily option-chain candidates. You may still use{" "}
                    <code>FINNHUB_API_KEY</code> in <code>.env.local</code> or
                    Vercel environment variables as a fallback.
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">
                        Finnhub API Key
                      </span>
                      <input
                        className="mt-2 w-full border border-[#E5D8A8] bg-white p-3 font-mono text-sm"
                        type="password"
                        value={finnhubApiKey}
                        onChange={(e) => setFinnhubApiKey(e.target.value)}
                        placeholder="Paste Finnhub key here"
                        autoComplete="off"
                      />
                    </label>
                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => setFinnhubApiKey("")}
                        className="border border-[#C9A84C] px-4 py-3 text-xs font-black uppercase tracking-widest text-[#0D1B2A]"
                      >
                        Clear Key
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-5 text-sm">
                    <label className="flex items-center gap-2 font-bold">
                      <input
                        type="checkbox"
                        checked={useLiveQuotes}
                        onChange={(e) => setUseLiveQuotes(e.target.checked)}
                      />{" "}
                      Use live quotes
                    </label>
                    <label className="flex items-center gap-2 font-bold">
                      <input
                        type="checkbox"
                        checked={autoRefreshQuotes}
                        onChange={(e) => setAutoRefreshQuotes(e.target.checked)}
                      />{" "}
                      Auto-refresh every 60 seconds
                    </label>
                    <button
                      type="button"
                      onClick={() => void refreshLiveMarketData()}
                      disabled={liveLoading || !useLiveQuotes}
                      className="bg-[#0D1B2A] px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      Refresh Now
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-[#344054]">
                    API key source:{" "}
                    {finnhubApiKey.trim()
                      ? "Settings tab"
                      : "Server environment fallback"}
                  </div>
                  {lastLiveRefresh ? (
                    <div className="mt-2 text-xs text-[#344054]">
                      Last refresh:{" "}
                      {new Date(lastLiveRefresh).toLocaleString("en-US")}
                    </div>
                  ) : null}
                  {liveError ? (
                    <div className="mt-2 text-xs font-bold text-[#B42318]">
                      {liveError}
                    </div>
                  ) : null}
                </div>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">
                    SPY
                  </span>
                  <input
                    className="mt-2 w-full border border-[#E5D8A8] p-3"
                    type="number"
                    value={spy}
                    onChange={(e) => setSpy(Number(e.target.value))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">
                    MA50
                  </span>
                  <input
                    className="mt-2 w-full border border-[#E5D8A8] p-3"
                    type="number"
                    value={ma50}
                    onChange={(e) => setMa50(Number(e.target.value))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">
                    MA200
                  </span>
                  <input
                    className="mt-2 w-full border border-[#E5D8A8] p-3"
                    type="number"
                    value={ma200}
                    onChange={(e) => setMa200(Number(e.target.value))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">
                    Cash
                  </span>
                  <input
                    className="mt-2 w-full border border-[#E5D8A8] p-3"
                    type="number"
                    value={cash}
                    onChange={(e) => setCash(Number(e.target.value))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">
                    Margin Debt
                  </span>
                  <input
                    className="mt-2 w-full border border-[#E5D8A8] p-3"
                    type="number"
                    value={marginDebt}
                    onChange={(e) => setMarginDebt(Number(e.target.value))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">
                    Margin Rate %
                  </span>
                  <input
                    className="mt-2 w-full border border-[#E5D8A8] p-3"
                    type="number"
                    value={marginRate}
                    onChange={(e) => setMarginRate(Number(e.target.value))}
                  />
                </label>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

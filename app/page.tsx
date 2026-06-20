"use client";

import React, { useEffect, useMemo, useState } from "react";

type Tab =
  | "dailyBrief"
  | "actionItems"
  | "holdings"
  | "bench"
  | "tradeLog"
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


type TradeType =
  | "deposit"
  | "withdrawal"
  | "dividend"
  | "interest_expense"
  | "fee"
  | "buy_stock"
  | "sell_stock"
  | "buy_to_open_call"
  | "sell_to_close_call"
  | "sell_to_open_call"
  | "buy_to_close_call"
  | "buy_to_open_put"
  | "sell_to_close_put"
  | "sell_to_open_put"
  | "buy_to_close_put"
  // legacy values from older FORGE builds; preserved so old browser-stored trades still rebuild correctly
  | "buy"
  | "sell";

type Trade = {
  id: string;
  createdAt: string;
  date: string;
  type: TradeType;
  ticker: string;
  amount: number;
  shares: number;
  price: number;
  contracts: number;
  expiry: string;
  strike: number;
  notes: string;
};

type TradeFormState = {
  date: string;
  type: TradeType;
  ticker: string;
  amount: string;
  shares: string;
  price: string;
  contracts: string;
  expiry: string;
  strike: string;
  notes: string;
};

type OpenOptionPosition = {
  key: string;
  ticker: string;
  side: "CALL" | "PUT";
  direction: "LONG" | "SHORT";
  expiry: string;
  strike: number;
  contracts: number;
  avgPremium: number;
  marketValue: number;
  openedDate: string;
};

type TradeStats = {
  cashImpact: number;
  deposits: number;
  withdrawals: number;
  stockTradeCount: number;
  optionTradeCount: number;
  realizedOptionPnl: number;
  openOptions: OpenOptionPosition[];
};

type PerformanceSettings = {
  startingForgeCapital: number;
  masterMonthlyMarginInterest: number;
  forgeAssignedEquityCapital: number;
  masterTotalStrategyDebits: number;
  allocateMarginByDebitShare: boolean;
};

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
  instrumentType?: "Stock" | "Option";
  optionSide?: "CALL" | "PUT";
  optionDirection?: "LONG" | "SHORT";
  optionExpiry?: string;
  optionStrike?: number;
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
  tradeLog: "Trade Log",
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
  trades: "forgeLt20Trades.v1",
  bench: "forgeLt20Bench.v1",
  calls: "forgeLt20CoveredCalls.v1",
  settings: "forgeLt20Settings.v1",
  liveSettings: "forgeLt20LiveSettings.v1",
  screener: "forgeLt20Screener.v1",
  performanceSettings: "forgeLt20PerformanceSettings.v1",
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


const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  startingForgeCapital: 0,
  masterMonthlyMarginInterest: 0,
  forgeAssignedEquityCapital: 0,
  masterTotalStrategyDebits: 0,
  allocateMarginByDebitShare: true,
};

function makeTradeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`;
}

function makeEmptyTradeForm(): TradeFormState {
  return {
    date: todayIsoDate(),
    type: "buy_stock",
    ticker: "",
    amount: "",
    shares: "",
    price: "",
    contracts: "",
    expiry: "",
    strike: "",
    notes: "",
  };
}

function tradeTypeLabel(type: TradeType): string {
  const labels: Record<TradeType, string> = {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    dividend: "Dividend Received",
    interest_expense: "Interest Expense",
    fee: "Fee / Expense",
    buy_stock: "Buy Stock",
    sell_stock: "Sell Stock",
    buy_to_open_call: "Buy to Open Call",
    sell_to_close_call: "Sell to Close Call",
    sell_to_open_call: "Sell to Open Call",
    buy_to_close_call: "Buy to Close Call",
    buy_to_open_put: "Buy to Open Put",
    sell_to_close_put: "Sell to Close Put",
    sell_to_open_put: "Sell to Open Put",
    buy_to_close_put: "Buy to Close Put",
    buy: "Buy Stock",
    sell: "Sell Stock",
  };
  return labels[type] ?? type;
}

function isCashTrade(type: TradeType): boolean {
  return type === "deposit" || type === "withdrawal" || type === "dividend" || type === "interest_expense" || type === "fee";
}

function isStockTrade(type: TradeType): boolean {
  return type === "buy_stock" || type === "sell_stock" || type === "buy" || type === "sell";
}

function isBuyStockTrade(type: TradeType): boolean {
  return type === "buy_stock" || type === "buy";
}

function isSellStockTrade(type: TradeType): boolean {
  return type === "sell_stock" || type === "sell";
}

function isOptionTrade(type: TradeType): boolean {
  return !isCashTrade(type) && !isStockTrade(type);
}

function optionSideFromTrade(type: TradeType): "CALL" | "PUT" | null {
  if (type.includes("call")) return "CALL";
  if (type.includes("put")) return "PUT";
  return null;
}

function optionDirectionFromTrade(type: TradeType): "LONG" | "SHORT" | null {
  if (type.startsWith("buy_to_open") || type.startsWith("sell_to_close")) return "LONG";
  if (type.startsWith("sell_to_open") || type.startsWith("buy_to_close")) return "SHORT";
  return null;
}

function isOpeningOptionTrade(type: TradeType): boolean {
  return type.startsWith("buy_to_open") || type.startsWith("sell_to_open");
}

function optionKey(ticker: string, side: "CALL" | "PUT", direction: "LONG" | "SHORT", expiry: string, strike: number): string {
  return `${normalizeTicker(ticker)}-${expiry}-${strike}-${side}-${direction}`;
}

function buildTradeFromForm(form: TradeFormState): Trade | null {
  const type = form.type;
  const ticker = normalizeTicker(form.ticker);
  const amount = roundNumber(parseNumber(form.amount), 2);
  const shares = roundNumber(parseNumber(form.shares), 4);
  const price = roundNumber(parseNumber(form.price), 4);
  const contracts = roundNumber(parseNumber(form.contracts), 0);
  const strike = roundNumber(parseNumber(form.strike), 4);

  if (isCashTrade(type) && amount <= 0) return null;
  if (isStockTrade(type) && (!ticker || shares <= 0 || price <= 0)) return null;
  if (isOptionTrade(type) && (!ticker || contracts <= 0 || price < 0 || strike <= 0 || !form.expiry)) return null;

  return {
    id: makeTradeId(),
    createdAt: new Date().toISOString(),
    date: form.date || todayIsoDate(),
    type,
    ticker: isCashTrade(type) && type !== "dividend" ? "" : ticker,
    amount: isCashTrade(type) ? amount : 0,
    shares: isStockTrade(type) ? shares : 0,
    price: isStockTrade(type) || isOptionTrade(type) ? price : 0,
    contracts: isOptionTrade(type) ? contracts : 0,
    expiry: isOptionTrade(type) ? form.expiry : "",
    strike: isOptionTrade(type) ? strike : 0,
    notes: form.notes.trim(),
  };
}

function describeTrade(trade: Trade): string {
  if (trade.type === "deposit") return `Deposit ${formatCurrency(trade.amount)}`;
  if (trade.type === "withdrawal") return `Withdrawal ${formatCurrency(trade.amount)}`;
  if (trade.type === "dividend") return `${trade.ticker ? `${trade.ticker} ` : ""}dividend ${formatCurrency(trade.amount)}`;
  if (trade.type === "interest_expense") return `Interest expense ${formatCurrency(trade.amount)}`;
  if (trade.type === "fee") return `Fee / expense ${formatCurrency(trade.amount)}`;
  if (isBuyStockTrade(trade.type)) return `Buy ${formatMetric(trade.shares, 0)} ${trade.ticker} @ ${formatCurrencyTable(trade.price)}`;
  if (isSellStockTrade(trade.type)) return `Sell ${formatMetric(trade.shares, 0)} ${trade.ticker} @ ${formatCurrencyTable(trade.price)}`;
  const side = optionSideFromTrade(trade.type) ?? "CALL";
  const suffix = side === "CALL" ? "C" : "P";
  return `${tradeTypeLabel(trade.type)} ${formatMetric(trade.contracts, 0)} ${trade.ticker} ${trade.expiry} $${trade.strike}${suffix} @ ${formatCurrencyTable(trade.price)}`;
}

function tradeCashImpact(trade: Trade): number {
  if (trade.type === "deposit" || trade.type === "dividend") return trade.amount;
  if (trade.type === "withdrawal" || trade.type === "interest_expense" || trade.type === "fee") return -trade.amount;
  if (isBuyStockTrade(trade.type)) return -(trade.shares * trade.price);
  if (isSellStockTrade(trade.type)) return trade.shares * trade.price;
  const premium = trade.contracts * trade.price * 100;
  if (trade.type.startsWith("buy_")) return -premium;
  return premium;
}

function externalFlowAmount(trade: Trade): number {
  if (trade.type === "deposit") return trade.amount;
  if (trade.type === "withdrawal") return -trade.amount;
  return 0;
}

function calculateTradeStats(trades: Trade[]): TradeStats {
  const sorted = [...trades].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  );
  const stats: TradeStats = {
    cashImpact: 0,
    deposits: 0,
    withdrawals: 0,
    stockTradeCount: 0,
    optionTradeCount: 0,
    realizedOptionPnl: 0,
    openOptions: [],
  };
  const optionMap = new Map<string, OpenOptionPosition>();

  for (const trade of sorted) {
    const impact = tradeCashImpact(trade);
    stats.cashImpact = roundNumber(stats.cashImpact + impact, 2);
    if (trade.type === "deposit") stats.deposits = roundNumber(stats.deposits + trade.amount, 2);
    if (trade.type === "withdrawal") stats.withdrawals = roundNumber(stats.withdrawals + trade.amount, 2);
    if (isStockTrade(trade.type)) stats.stockTradeCount += 1;
    if (!isOptionTrade(trade.type)) continue;

    stats.optionTradeCount += 1;
    const side = optionSideFromTrade(trade.type);
    const direction = optionDirectionFromTrade(trade.type);
    if (!side || !direction) continue;
    const key = optionKey(trade.ticker, side, direction, trade.expiry, trade.strike);
    const existing = optionMap.get(key) ?? {
      key,
      ticker: trade.ticker,
      side,
      direction,
      expiry: trade.expiry,
      strike: trade.strike,
      contracts: 0,
      avgPremium: 0,
      marketValue: 0,
      openedDate: trade.date,
    };

    if (isOpeningOptionTrade(trade.type)) {
      const existingPremiumCost = existing.avgPremium * existing.contracts;
      const nextContracts = existing.contracts + trade.contracts;
      existing.avgPremium = nextContracts > 0
        ? roundNumber((existingPremiumCost + trade.price * trade.contracts) / nextContracts, 4)
        : trade.price;
      existing.contracts = nextContracts;
      if (trade.date < existing.openedDate) existing.openedDate = trade.date;
      existing.marketValue = roundNumber(existing.contracts * existing.avgPremium * 100, 2);
      optionMap.set(key, existing);
    } else {
      const closingContracts = Math.min(existing.contracts, trade.contracts);
      if (closingContracts > 0) {
        const pnlPerContract = direction === "LONG"
          ? trade.price - existing.avgPremium
          : existing.avgPremium - trade.price;
        stats.realizedOptionPnl = roundNumber(stats.realizedOptionPnl + pnlPerContract * closingContracts * 100, 2);
      }
      existing.contracts = Math.max(0, existing.contracts - trade.contracts);
      existing.marketValue = roundNumber(existing.contracts * existing.avgPremium * 100, 2);
      if (existing.contracts > 0) optionMap.set(key, existing);
      else optionMap.delete(key);
    }
  }

  stats.openOptions = Array.from(optionMap.values()).filter((position) => position.contracts > 0);
  return stats;
}


export default function ForgeDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dailyBrief");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeForm, setTradeForm] = useState<TradeFormState>(makeEmptyTradeForm());
  const [tradeMessage, setTradeMessage] = useState("");
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>(DEFAULT_PERFORMANCE_SETTINGS);
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
      const savedTrades = localStorage.getItem(STORAGE_KEYS.trades);
      const savedPerformanceSettings = localStorage.getItem(STORAGE_KEYS.performanceSettings);
      const savedBench = localStorage.getItem(STORAGE_KEYS.bench);
      const savedCalls = localStorage.getItem(STORAGE_KEYS.calls);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);
      const savedLiveSettings = localStorage.getItem(STORAGE_KEYS.liveSettings);
      const savedScreener = localStorage.getItem(STORAGE_KEYS.screener);

      if (savedActiveTab) {
        const parsedTab = JSON.parse(savedActiveTab) as Tab;
        if (parsedTab in TAB_LABELS && parsedTab !== "coveredCalls") setActiveTab(parsedTab);
      }
      // Holdings are derived from the Trade Log, not loaded as a separate source of truth.
      if (savedTrades) setTrades(JSON.parse(savedTrades) as Trade[]);
      if (savedPerformanceSettings) setPerformanceSettings({ ...DEFAULT_PERFORMANCE_SETTINGS, ...(JSON.parse(savedPerformanceSettings) as Partial<PerformanceSettings>) });
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
    rebuildHoldingsFromTradeLog(trades);
    const cashMargin = calculateCashMarginFromTrades(trades);
    setCash(cashMargin.cash);
    setMarginDebt(cashMargin.marginDebt);
    // Run once after browser storage has loaded so Holdings always comes from Trade Log.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

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
    localStorage.setItem(STORAGE_KEYS.trades, JSON.stringify(trades));
  }, [hydrated, trades]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.performanceSettings, JSON.stringify(performanceSettings));
  }, [hydrated, performanceSettings]);

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
    const forgeInternalDebit = Math.max(
      0,
      longMarketValue - performanceSettings.forgeAssignedEquityCapital,
    );
    const assignedAnnualFinancingCost =
      performanceSettings.allocateMarginByDebitShare &&
      performanceSettings.masterMonthlyMarginInterest > 0 &&
      performanceSettings.masterTotalStrategyDebits > 0
        ? performanceSettings.masterMonthlyMarginInterest *
          12 *
          (forgeInternalDebit / performanceSettings.masterTotalStrategyDebits)
        : marginDebt * (marginRate / 100);
    const netPnlAfterFinancing = totalPnl - assignedAnnualFinancingCost;
    const netContributions = trades.reduce((sum, trade) => sum + externalFlowAmount(trade), 0);

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
      forgeInternalDebit,
      assignedAnnualFinancingCost,
      annualFinancingCost: assignedAnnualFinancingCost,
      netPnlAfterFinancing,
      netContributions,
    };
  }, [cash, holdings, ma50, ma200, marginDebt, marginRate, openCalls, performanceSettings, spy, trades]);

  const actionItems = useMemo(() => {
    const items: Array<{ action: ActionState; title: string; detail: string }> =
      [];
    if (holdings.length === 0) {
      items.push({
        action: "BUY",
        title: "Build initial FORGE LT20 portfolio",
        detail:
          "Portfolio is empty. Use Bench and the S&P 500 Screener to decide candidates, then enter Buy trades in the Trade Log to create holdings.",
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

  function calculateCashMarginFromTrades(nextTrades: Trade[]) {
    let nextCash = 0;
    let nextMarginDebt = 0;
    const sorted = [...nextTrades].sort(
      (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    );

    for (const trade of sorted) {
      const impact = tradeCashImpact(trade);
      if (impact >= 0) {
        const debtPaydown = Math.min(nextMarginDebt, impact);
        nextMarginDebt = roundNumber(nextMarginDebt - debtPaydown, 2);
        nextCash = roundNumber(nextCash + impact - debtPaydown, 2);
      } else {
        const needed = Math.abs(impact);
        if (nextCash >= needed) {
          nextCash = roundNumber(nextCash - needed, 2);
        } else {
          nextMarginDebt = roundNumber(nextMarginDebt + needed - nextCash, 2);
          nextCash = 0;
        }
      }
    }

    return { cash: nextCash, marginDebt: nextMarginDebt };
  }

  function updateTradeForm(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setTradeForm((prev) => ({ ...prev, [name]: value }));
  }

  function holdingPositionKey(holding: Pick<Holding, "ticker" | "instrumentType" | "optionSide" | "optionDirection" | "optionExpiry" | "optionStrike">): string {
    const ticker = normalizeTicker(holding.ticker);
    if (holding.instrumentType === "Option") {
      return `OPT:${ticker}:${holding.optionDirection ?? "LONG"}:${holding.optionSide ?? "CALL"}:${holding.optionExpiry ?? ""}:${holding.optionStrike ?? 0}`;
    }
    return `STK:${ticker}`;
  }

  function rebuildHoldingsFromTradeLog(
    nextTrades: Trade[],
    preservedHoldings: Holding[] = holdings,
  ) {
    type StockLot = { shares: number; cost: number; date: string };

    const preservedByKey = new Map(
      preservedHoldings
        .filter((h) => normalizeTicker(h.ticker))
        .map((h) => [holdingPositionKey(h), h]),
    );
    const lotsByTicker = new Map<string, StockLot[]>();
    const lastTradePriceByTicker = new Map<string, number>();

    const sortedStockTrades = nextTrades
      .filter((trade) => isStockTrade(trade.type) && normalizeTicker(trade.ticker))
      .sort(
        (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
      );

    for (const trade of sortedStockTrades) {
      const ticker = normalizeTicker(trade.ticker);
      const lots = lotsByTicker.get(ticker) ?? [];
      lastTradePriceByTicker.set(ticker, trade.price);

      if (isBuyStockTrade(trade.type)) {
        lots.push({ shares: trade.shares, cost: trade.price, date: trade.date });
        lotsByTicker.set(ticker, lots);
        continue;
      }

      let sharesToSell = trade.shares;
      const remainingLots: StockLot[] = [];
      for (const lot of lots) {
        if (sharesToSell <= 0) {
          remainingLots.push(lot);
          continue;
        }
        const soldFromLot = Math.min(lot.shares, sharesToSell);
        const remainingShares = roundNumber(lot.shares - soldFromLot, 6);
        sharesToSell = roundNumber(sharesToSell - soldFromLot, 6);
        if (remainingShares > 0) {
          remainingLots.push({ ...lot, shares: remainingShares });
        }
      }
      lotsByTicker.set(ticker, remainingLots);
    }

    const stockHoldings = Array.from(lotsByTicker.entries())
      .map(([ticker, lots]) => {
        const activeLots = lots.filter((lot) => lot.shares > 0);
        const shares = roundNumber(activeLots.reduce((sum, lot) => sum + lot.shares, 0), 6);
        if (shares <= 0) return null;

        const totalCost = activeLots.reduce((sum, lot) => sum + lot.shares * lot.cost, 0);
        const averageCost = roundNumber(totalCost / shares, 4);
        const purchaseDate = activeLots.map((lot) => lot.date).sort((a, b) => a.localeCompare(b))[0] ?? todayIsoDate();
        const meta = metadataForTicker(ticker);
        const existing = preservedByKey.get(`STK:${ticker}`);
        const live = liveQuotes[ticker];
        const ta = technicalData[ticker];
        const signal = signalData[ticker];
        const bench = benchCandidates.find((b) => normalizeTicker(b.ticker) === ticker);
        const seed = existing ?? blankHolding();
        const nextHolding: Holding = {
          ...seed,
          id: existing?.id ?? makeTradeId(),
          instrumentType: "Stock",
          optionSide: undefined,
          optionDirection: undefined,
          optionExpiry: undefined,
          optionStrike: undefined,
          ticker,
          name: existing?.name || meta?.name || bench?.name || ticker,
          sleeve: existing?.sleeve ?? meta?.sleeve ?? bench?.sleeveFit ?? "Core",
          sector: meta?.sector || existing?.sector || bench?.sector || "Unclassified",
          shares,
          cost: averageCost,
          price: live?.price ?? existing?.price ?? bench?.price ?? lastTradePriceByTicker.get(ticker) ?? averageCost,
          forgeRank: existing?.forgeRank ?? meta?.rank ?? bench?.rank ?? 999,
          signalScore: signal?.recommendationScore ?? existing?.signalScore ?? meta?.score ?? bench?.signalScore ?? 50,
          upside: signal?.upside ?? existing?.upside ?? bench?.upside ?? 0,
          revisionScore: signal?.recommendationScore ?? existing?.revisionScore ?? bench?.revisionScore ?? 50,
          momentumScore: signal?.momentumScore ?? existing?.momentumScore ?? bench?.momentumScore ?? 50,
          qualityScore: signal?.qualityScore ?? existing?.qualityScore ?? bench?.qualityScore ?? 50,
          dispersion: signal?.dispersion ?? existing?.dispersion ?? bench?.dispersion ?? 0,
          purchaseDate,
          daysHeld: daysHeldFromPurchaseDate(purchaseDate, existing?.daysHeld ?? 0),
          above200dma: ta?.above200dma ?? existing?.above200dma ?? true,
          technicalExtension: ta?.technicalExtension ?? existing?.technicalExtension ?? 0,
          buyZoneLow: ta?.buyZoneLow ?? existing?.buyZoneLow ?? bench?.buyZoneLow ?? 0,
          buyZoneHigh: ta?.buyZoneHigh ?? existing?.buyZoneHigh ?? bench?.buyZoneHigh ?? 0,
          buyAnchor: ta?.buyAnchor ?? existing?.buyAnchor ?? bench?.buyAnchor ?? 0,
          stopLevel: ta?.stopLevel ?? existing?.stopLevel ?? bench?.stopLevel ?? 0,
          trimLow: ta?.trimLow ?? existing?.trimLow ?? bench?.trimLow ?? 0,
          trimHigh: ta?.trimHigh ?? existing?.trimHigh ?? bench?.trimHigh ?? 0,
          taConfidence: ta?.confidence ?? existing?.taConfidence ?? bench?.taConfidence ?? "Manual",
          taNotes: ta?.notes ?? existing?.taNotes ?? bench?.taNotes ?? "Created from Trade Log stock transactions.",
          notes: existing?.notes || bench?.notes || "Created from Trade Log stock transactions.",
        };
        return { ...nextHolding, signalScore: calculateForgeSignalScore(nextHolding) };
      })
      .filter((holding): holding is Holding => holding !== null);

    const optionHoldings = calculateTradeStats(nextTrades).openOptions.map((position) => {
      const ticker = normalizeTicker(position.ticker);
      const key = `OPT:${ticker}:${position.direction}:${position.side}:${position.expiry}:${position.strike}`;
      const existing = preservedByKey.get(key);
      const meta = metadataForTicker(ticker);
      const seed = existing ?? blankHolding();
      const signedPremium = position.direction === "SHORT" ? -position.avgPremium : position.avgPremium;
      const suffix = position.side === "CALL" ? "C" : "P";
      const optionName = `${ticker} ${position.expiry} $${position.strike}${suffix} ${position.direction}`;

      return {
        ...seed,
        id: existing?.id ?? makeTradeId(),
        instrumentType: "Option",
        optionSide: position.side,
        optionDirection: position.direction,
        optionExpiry: position.expiry,
        optionStrike: position.strike,
        ticker,
        name: existing?.name || optionName,
        sleeve: existing?.sleeve ?? meta?.sleeve ?? "Opportunistic",
        sector: "Option Overlay",
        shares: position.contracts * 100,
        cost: signedPremium,
        price: signedPremium,
        forgeRank: existing?.forgeRank ?? meta?.rank ?? 999,
        signalScore: existing?.signalScore ?? meta?.score ?? 50,
        purchaseDate: position.openedDate,
        daysHeld: daysHeldFromPurchaseDate(position.openedDate, existing?.daysHeld ?? 0),
        buyZoneLow: existing?.buyZoneLow ?? 0,
        buyZoneHigh: existing?.buyZoneHigh ?? 0,
        buyAnchor: existing?.buyAnchor ?? 0,
        stopLevel: existing?.stopLevel ?? 0,
        trimLow: existing?.trimLow ?? 0,
        trimHigh: existing?.trimHigh ?? 0,
        taConfidence: existing?.taConfidence ?? "Manual",
        taNotes: existing?.taNotes || "Option position generated from Trade Log.",
        notes: existing?.notes || "Open option position generated from Trade Log. Close or hedge it through the Trade Log.",
      } as Holding;
    });

    const nextHoldings = [...stockHoldings, ...optionHoldings].sort((a, b) => {
      const tickerCompare = a.ticker.localeCompare(b.ticker);
      if (tickerCompare !== 0) return tickerCompare;
      return holdingPositionKey(a).localeCompare(holdingPositionKey(b));
    });

    setHoldings(nextHoldings);
  }

  const tradeStats = useMemo(() => calculateTradeStats(trades), [trades]);

  function submitTrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trade = buildTradeFromForm(tradeForm);
    if (!trade) {
      setTradeMessage("Enter the required fields for this trade type.");
      return;
    }
    const nextTrades = [...trades, trade];
    setTrades(nextTrades);
    rebuildHoldingsFromTradeLog(nextTrades);
    const cashMargin = calculateCashMarginFromTrades(nextTrades);
    setCash(cashMargin.cash);
    setMarginDebt(cashMargin.marginDebt);
    setTradeForm((prev) => ({ ...makeEmptyTradeForm(), date: prev.date }));
    setTradeMessage(`Added: ${describeTrade(trade)}`);
  }

  function deleteTrade(id: string) {
    const nextTrades = trades.filter((trade) => trade.id !== id);
    setTrades(nextTrades);
    rebuildHoldingsFromTradeLog(nextTrades);
    const cashMargin = calculateCashMarginFromTrades(nextTrades);
    setCash(cashMargin.cash);
    setMarginDebt(cashMargin.marginDebt);
  }

  function clearTrades() {
    if (window.confirm("Clear the FORGE trade log from this browser? This will also clear trade-derived holdings.")) {
      setTrades([]);
      setHoldings([]);
      setCash(0);
      setMarginDebt(0);
      setTradeMessage("");
    }
  }

  function renderTradeSpecificInputs() {
    if (isCashTrade(tradeForm.type)) {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Amount</span>
            <input
              className="mt-2 w-full border border-[#E5D8A8] p-3"
              name="amount"
              type="number"
              step="0.01"
              value={tradeForm.amount}
              onChange={updateTradeForm}
            />
          </label>
          {tradeForm.type === "dividend" ? (
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Ticker</span>
              <input
                className="mt-2 w-full border border-[#E5D8A8] p-3 font-black uppercase"
                name="ticker"
                value={tradeForm.ticker}
                onChange={updateTradeForm}
                placeholder="AVGO"
              />
            </label>
          ) : null}
        </div>
      );
    }

    if (isStockTrade(tradeForm.type)) {
      return (
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Ticker</span>
            <input className="mt-2 w-full border border-[#E5D8A8] p-3 font-black uppercase" name="ticker" value={tradeForm.ticker} onChange={updateTradeForm} placeholder="AVGO" />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Shares</span>
            <input className="mt-2 w-full border border-[#E5D8A8] p-3" name="shares" type="number" step="0.0001" value={tradeForm.shares} onChange={updateTradeForm} />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Price</span>
            <input className="mt-2 w-full border border-[#E5D8A8] p-3" name="price" type="number" step="0.01" value={tradeForm.price} onChange={updateTradeForm} />
          </label>
        </div>
      );
    }

    return (
      <div className="grid gap-3 md:grid-cols-5">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Ticker</span>
          <input className="mt-2 w-full border border-[#E5D8A8] p-3 font-black uppercase" name="ticker" value={tradeForm.ticker} onChange={updateTradeForm} placeholder="AVGO" />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Contracts</span>
          <input className="mt-2 w-full border border-[#E5D8A8] p-3" name="contracts" type="number" step="1" value={tradeForm.contracts} onChange={updateTradeForm} />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Expiration</span>
          <input className="mt-2 w-full border border-[#E5D8A8] p-3" name="expiry" type="date" value={tradeForm.expiry} onChange={updateTradeForm} />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Strike</span>
          <input className="mt-2 w-full border border-[#E5D8A8] p-3" name="strike" type="number" step="0.01" value={tradeForm.strike} onChange={updateTradeForm} />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Premium / Price</span>
          <input className="mt-2 w-full border border-[#E5D8A8] p-3" name="price" type="number" step="0.01" value={tradeForm.price} onChange={updateTradeForm} />
        </label>
      </div>
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

  function addBenchCandidate() {
    const nextRank =
      benchCandidates.reduce(
        (max, b) => Math.max(max, Number(b.rank) || 0),
        0,
      ) + 1;
    setBenchCandidates((prev) => [...prev, blankBenchCandidate(nextRank)]);
  }

  function updateBenchCandidate<K extends keyof BenchCandidate>(
    index: number,
    field: K,
    value: BenchCandidate[K],
  ) {
    setBenchCandidates((prev) =>
      prev.map((candidate, i) =>
        i === index ? { ...candidate, [field]: value } : candidate,
      ),
    );
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

  function updateCall<K extends keyof CoveredCall>(
    id: string,
    field: K,
    value: CoveredCall[K],
  ) {
    setOpenCalls((prev) =>
      prev.map((call) =>
        call.id === id ? { ...call, [field]: value } : call,
      ),
    );
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
    setActiveTab("actionItems");
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
            {(Object.keys(TAB_LABELS) as Tab[]).filter((tab) => tab !== "coveredCalls").map((tab) => (
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
                    The FORGE book has not been started. Use the <strong>Bench</strong> and <strong>S&amp;P 500 Screener</strong> tabs to identify candidates, then enter <strong>Buy</strong> trades in the <strong>Trade Log</strong> to create holdings.
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

          {activeTab === "tradeLog" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">Trade Log</h3>
                  <p className="mt-2 text-sm text-[#344054]">
                    Execution ledger for FORGE stock trades, option overlays, deposits, withdrawals, dividends, interest, and fees. Still-open stock and option exposure flows into Holdings; this log is the audit trail for what was actually traded.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearTrades}
                  className="border border-[#E5D8A8] px-4 py-2 text-sm font-black text-[#0D1B2A]"
                >
                  Clear Log
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-5">
                {metricCard("Logged Trades", String(trades.length), `${tradeStats.stockTradeCount} stock / ${tradeStats.optionTradeCount} option`)}
                {metricCard("Cash Impact", formatSignedCurrency(tradeStats.cashImpact), "from logged trades", tradeStats.cashImpact >= 0 ? "text-[#067647]" : "text-[#B42318]")}
                {metricCard("Deposits", formatCurrency(tradeStats.deposits), "external cash in")}
                {metricCard("Withdrawals", formatCurrency(tradeStats.withdrawals), "external cash out")}
                {metricCard("Option Realized", formatSignedCurrency(tradeStats.realizedOptionPnl), "closed option P&L", tradeStats.realizedOptionPnl >= 0 ? "text-[#067647]" : "text-[#B42318]")}
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="border border-[#E5D8A8] p-4">
                  <h4 className="font-black text-[#0D1B2A]">Enter Trade</h4>
                  <form className="mt-4 space-y-4" onSubmit={submitTrade}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Trade Date</span>
                        <input
                          className="mt-2 w-full border border-[#E5D8A8] p-3"
                          name="date"
                          type="date"
                          value={tradeForm.date}
                          onChange={updateTradeForm}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Trade Type</span>
                        <select
                          className="mt-2 w-full border border-[#E5D8A8] bg-white p-3"
                          name="type"
                          value={tradeForm.type}
                          onChange={updateTradeForm}
                        >
                          <option value="deposit">Deposit</option>
                          <option value="withdrawal">Withdrawal</option>
                        <option value="dividend">Dividend Received</option>
                        <option value="interest_expense">Interest Expense</option>
                        <option value="fee">Fee / Expense</option>
                          <option value="buy_stock">Buy Stock</option>
                          <option value="sell_stock">Sell Stock</option>
                          <option value="buy_to_open_call">Buy to Open Call</option>
                          <option value="sell_to_close_call">Sell to Close Call</option>
                          <option value="sell_to_open_call">Sell to Open Call</option>
                          <option value="buy_to_close_call">Buy to Close Call</option>
                          <option value="buy_to_open_put">Buy to Open Put</option>
                          <option value="sell_to_close_put">Sell to Close Put</option>
                          <option value="sell_to_open_put">Sell to Open Put</option>
                          <option value="buy_to_close_put">Buy to Close Put</option>
                        </select>
                      </label>
                    </div>

                    {renderTradeSpecificInputs()}

                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Notes</span>
                      <textarea
                        className="mt-2 w-full border border-[#E5D8A8] p-3"
                        name="notes"
                        rows={3}
                        value={tradeForm.notes}
                        onChange={updateTradeForm}
                        placeholder="Thesis, hedge reason, covered-call rationale, catalyst window, tax note..."
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className="bg-[#C9A84C] px-4 py-2 text-sm font-black text-white"
                      >
                        Add Trade
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTradeForm(makeEmptyTradeForm());
                          setTradeMessage("");
                        }}
                        className="border border-[#E5D8A8] px-4 py-2 text-sm font-black text-[#0D1B2A]"
                      >
                        Reset Form
                      </button>
                    </div>
                    {tradeMessage ? (
                      <div className="text-sm font-bold text-[#344054]">{tradeMessage}</div>
                    ) : null}
                  </form>
                </div>

                <div className="border border-[#E5D8A8] p-4">
                  <h4 className="font-black text-[#0D1B2A]">Open Option Exposure From Log</h4>
                  <p className="mt-2 text-sm text-[#344054]">
                    Uses average premium from logged opens/closes. For live marks, verify in E*TRADE; this is an execution ledger, not a broker statement.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-sm">
                      <thead className="bg-[#0D1B2A] text-white">
                        <tr>
                          {["Ticker", "Side", "Direction", "Expiry", "Strike", "Contracts", "Avg Premium", "Book Value"].map((h) => (
                            <th key={h} className="p-3 text-left text-xs uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tradeStats.openOptions.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-4 text-sm text-[#344054]">No open option exposure logged.</td>
                          </tr>
                        ) : (
                          tradeStats.openOptions.map((position) => (
                            <tr key={position.key} className="border-b border-[#E5D8A8]">
                              <td className="p-3 font-black">{position.ticker}</td>
                              <td className="p-3">{position.side}</td>
                              <td className={position.direction === "LONG" ? "p-3 font-bold text-[#067647]" : "p-3 font-bold text-[#B42318]"}>{position.direction}</td>
                              <td className="p-3">{position.expiry}</td>
                              <td className="p-3">{formatCurrencyTable(position.strike)}</td>
                              <td className="p-3">{position.contracts}</td>
                              <td className="p-3">{formatCurrencyTable(position.avgPremium)}</td>
                              <td className={position.marketValue >= 0 ? "p-3 font-bold text-[#067647]" : "p-3 font-bold text-[#B42318]"}>{formatSignedCurrency(position.marketValue)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-5 border border-[#E5D8A8] p-4">
                <h4 className="font-black text-[#0D1B2A]">Trade History</h4>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-sm">
                    <thead className="bg-[#0D1B2A] text-white">
                      <tr>
                        {["Date", "Type", "Description", "Cash Impact", "Notes", ""].map((h) => (
                          <th key={h} className="p-3 text-left text-xs uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trades.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-sm text-[#344054]">No trades recorded yet.</td>
                        </tr>
                      ) : (
                        [...trades]
                          .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
                          .map((trade) => {
                            const impact = tradeCashImpact(trade);
                            return (
                              <tr key={trade.id} className="border-b border-[#E5D8A8] align-top">
                                <td className="p-3">{trade.date}</td>
                                <td className="p-3 font-bold">{tradeTypeLabel(trade.type)}</td>
                                <td className="p-3 font-black text-[#0D1B2A]">{describeTrade(trade)}</td>
                                <td className={impact >= 0 ? "p-3 font-bold text-[#067647]" : "p-3 font-bold text-[#B42318]"}>{formatSignedCurrency(impact)}</td>
                                <td className="p-3 text-[#344054]">{trade.notes || "—"}</td>
                                <td className="p-3">
                                  <button
                                    type="button"
                                    onClick={() => deleteTrade(trade.id)}
                                    className="text-xs font-black text-[#B42318]"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
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
                    Holdings are generated only from the Trade Log. Use backdated or new stock and option trades to create or change FORGE exposure. Sleeve, sector, shares, cost, and purchase date are derived from logged trades and candidate metadata.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => rebuildHoldingsFromTradeLog(trades)}
                    className="bg-[#C9A84C] px-4 py-2 text-sm font-black text-white"
                  >
                    Rebuild From Trade Log
                  </button>
                </div>
              </div>
              {holdings.length === 0 ? (
                <div className="mt-4 border border-[#E5D8A8] bg-[#F0EBD8] p-4 text-sm text-[#344054]">
                  No holdings generated yet. Go to the <strong>Trade Log</strong> tab and enter stock or option trades. You can backdate existing FORGE positions; Holdings will rebuild from still-open exposure.
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
                          "Qty",
                          "Avg Cost / Premium",
                          "Purchase Date",
                          "Price",
                          "Buy Zone",
                          "Hedge / Call Zone",
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
                        const isOptionHolding = h.instrumentType === "Option";
                        const optionSuffix = h.optionSide === "CALL" ? "C" : "P";
                        const optionLabel = isOptionHolding
                          ? `${h.optionDirection ?? "LONG"} ${h.optionExpiry ?? ""} $${h.optionStrike ?? 0}${optionSuffix}`
                          : "";
                        const displaySleeve = isOptionHolding ? h.optionDirection ?? "Option" : meta?.sleeve ?? h.sleeve;
                        const displaySector = isOptionHolding ? "Option Overlay" : meta?.sector || h.sector || "Unclassified";
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
                        const combinedScore = isOptionHolding
                          ? 0
                          : calculateForgeSignalScore({
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
                              <div className="readonly-cell w-24">
                                <div>{h.ticker}</div>
                                {isOptionHolding ? (
                                  <div className="text-[10px] font-black text-[#C9A84C]">{optionLabel}</div>
                                ) : null}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="readonly-cell w-40">{h.name || metadataForTicker(ticker)?.name || "—"}</div>
                            </td>
                            <td className="p-2">
                              <div className="readonly-cell">{displaySleeve}</div>
                            </td>
                            <td className="p-2">
                              <div className="readonly-cell">{displaySector}</div>
                            </td>
                            <td className="p-2">
                              <div className="readonly-cell w-20">{isOptionHolding ? `${formatMetric(h.shares / 100, 0)} ctr` : formatMetric(h.shares, 0)}</div>
                            </td>
                            <td className="p-2">
                              <div className="readonly-cell w-24">{formatCurrencyTable(h.cost)}</div>
                            </td>
                            <td className="p-2">
                              <div className="readonly-box w-28">{h.purchaseDate || isoDateFromDaysHeld(h.daysHeld) || "—"}</div>
                              {h.ltcg ? (
                                <div className="text-xs font-bold text-[#067647]">LTCG</div>
                              ) : (
                                <div className="text-xs font-bold text-[#B42318]">ST · {Math.max(0, 366 - h.daysHeld)}d</div>
                              )}
                            </td>
                            <td className="p-2">
                              {valueBox(
                                isOptionHolding ? formatCurrencyTable(h.price) : formatCurrencyTable(displayTa.price || h.price),
                                isOptionHolding
                                  ? "TRADE LOG"
                                  : live
                                    ? `LIVE ${formatSignedPercentPoints(live.changePercent)}`
                                    : "STORED",
                                live && !isOptionHolding ? "positive" : "neutral",
                              )}
                            </td>
                            <td className="p-2">
                              {isOptionHolding
                                ? <div className="readonly-cell w-24">—</div>
                                : zoneBox(
                                    displayTa.buyZoneLow,
                                    displayTa.buyZoneHigh,
                                    inBuyZone ? "IN ZONE" : undefined,
                                    inBuyZone ? "positive" : "neutral",
                                  )}
                            </td>
                            <td className="p-2">
                              {isOptionHolding
                                ? <div className="readonly-cell w-24">—</div>
                                : zoneBox(
                                    displayTa.trimLow,
                                    displayTa.trimHigh,
                                    inTrimZone ? "COVER / TRIM" : undefined,
                                    inTrimZone ? "warning" : "neutral",
                                  )}
                            </td>
                            <td className="p-2">
                              {isOptionHolding
                                ? valueBox("Option", h.optionDirection ?? "OPEN", "neutral")
                                : valueBox(
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
                            <td className="p-2 text-xs font-bold text-[#667085]">
                              Trade Log Source
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
                    Clean candidate view. Add or edit potential positions, then use the locked outputs — live price, buy zone, call zone, and combined FORGE Score — to decide what to buy through the Trade Log.
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
              <h3 className="text-xl font-black">Performance & Margin Allocation</h3>
              <p className="mt-2 text-sm text-[#344054]">
                FORGE is tracked as a virtual sleeve inside one master E*TRADE account. Performance uses FORGE holdings, FORGE cash flows, and an assigned margin-interest allocation rather than the brokerage account total alone.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {metricCard("Net Liq", formatCurrency(snapshot.netLiquidationValue), "holdings + cash - margin")}
                {metricCard("Gross P&L", formatCurrency(snapshot.totalPnl), "before assigned financing")}
                {metricCard("Assigned Financing", formatCurrency(snapshot.assignedAnnualFinancingCost), "annualized allocation")}
                {metricCard("Net P&L", formatSignedCurrency(snapshot.netPnlAfterFinancing), "after financing allocation", snapshot.netPnlAfterFinancing >= 0 ? "text-[#067647]" : "text-[#B42318]")}
                {metricCard("Internal Debit", formatCurrency(snapshot.forgeInternalDebit), "gross value - assigned capital")}
                {metricCard("Net Contributions", formatSignedCurrency(snapshot.netContributions), "deposits - withdrawals")}
                {metricCard("Weighted Score", formatMetric(snapshot.weightedForgeScore), "current holdings")}
                {metricCard("Benchmark", "SPY", "FORGE primary yardstick")}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="border border-[#E5D8A8] p-5">
                  <h4 className="font-black text-[#0D1B2A]">Performance Settings</h4>
                  <p className="mt-2 text-sm leading-6 text-[#344054]">
                    Use these fields to allocate master-account margin expense to FORGE when APEX, TITAN, FORGE, and Concentrated sit inside the same E*TRADE account.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Starting FORGE Capital</span>
                      <input className="mt-2 w-full border border-[#E5D8A8] p-3" type="number" value={performanceSettings.startingForgeCapital} onChange={(e) => setPerformanceSettings((p) => ({ ...p, startingForgeCapital: Number(e.target.value) }))} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">FORGE Assigned Equity Capital</span>
                      <input className="mt-2 w-full border border-[#E5D8A8] p-3" type="number" value={performanceSettings.forgeAssignedEquityCapital} onChange={(e) => setPerformanceSettings((p) => ({ ...p, forgeAssignedEquityCapital: Number(e.target.value) }))} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Master Monthly Margin Interest</span>
                      <input className="mt-2 w-full border border-[#E5D8A8] p-3" type="number" value={performanceSettings.masterMonthlyMarginInterest} onChange={(e) => setPerformanceSettings((p) => ({ ...p, masterMonthlyMarginInterest: Number(e.target.value) }))} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Total Strategy Debits</span>
                      <input className="mt-2 w-full border border-[#E5D8A8] p-3" type="number" value={performanceSettings.masterTotalStrategyDebits} onChange={(e) => setPerformanceSettings((p) => ({ ...p, masterTotalStrategyDebits: Number(e.target.value) }))} />
                    </label>
                  </div>
                  <label className="mt-4 flex items-center gap-2 text-sm font-bold text-[#344054]">
                    <input type="checkbox" checked={performanceSettings.allocateMarginByDebitShare} onChange={(e) => setPerformanceSettings((p) => ({ ...p, allocateMarginByDebitShare: e.target.checked }))} />
                    Allocate margin by average debit share
                  </label>
                </div>

                <div className="border border-[#E5D8A8] bg-[#F0EBD8] p-5">
                  <h4 className="font-black text-[#0D1B2A]">Allocation Logic</h4>
                  <div className="mt-4 space-y-3 text-sm text-[#344054]">
                    <div className="flex justify-between border-b border-[#E5D8A8] pb-2"><span>FORGE internal debit</span><strong>{formatCurrency(snapshot.forgeInternalDebit)}</strong></div>
                    <div className="flex justify-between border-b border-[#E5D8A8] pb-2"><span>Total strategy debits</span><strong>{formatCurrency(performanceSettings.masterTotalStrategyDebits)}</strong></div>
                    <div className="flex justify-between border-b border-[#E5D8A8] pb-2"><span>Debit share</span><strong>{performanceSettings.masterTotalStrategyDebits > 0 ? formatPercent(snapshot.forgeInternalDebit / performanceSettings.masterTotalStrategyDebits) : "—"}</strong></div>
                    <div className="flex justify-between border-b border-[#E5D8A8] pb-2"><span>Assigned annual margin cost</span><strong>{formatCurrency(snapshot.assignedAnnualFinancingCost)}</strong></div>
                    <div className="text-xs leading-5">
                      If the allocation fields are blank, the fallback remains the direct FORGE margin-debt estimate: internal margin debt × margin rate.
                    </div>
                  </div>
                </div>
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

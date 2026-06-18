import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

type FinnhubCandle = {
  c?: number[];
  s?: string;
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

const FINNHUB_BASE = "https://finnhub.io/api/v1";

function normalizeTicker(input: string): string {
  return input.trim().toUpperCase();
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function round(value: number | null, digits = 2): number | null {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function fetchFinnhubJson<T>(path: string, token: string): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${FINNHUB_BASE}${path}${separator}token=${encodeURIComponent(token)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Finnhub request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchQuote(symbol: string, token: string): Promise<LiveQuote> {
  const q = await fetchFinnhubJson<FinnhubQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`, token);
  const price = finiteNumber(q.c);
  const asOf = q.t ? new Date(q.t * 1000).toISOString() : new Date().toISOString();

  return {
    ticker: symbol,
    price: round(price),
    change: round(finiteNumber(q.d)),
    changePercent: round(finiteNumber(q.dp)),
    previousClose: round(finiteNumber(q.pc)),
    asOf,
    source: "Finnhub",
  };
}

async function fetchSma(symbol: string, token: string): Promise<{ sma50: number | null; sma200: number | null }> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 370 * 24 * 60 * 60;
  const candle = await fetchFinnhubJson<FinnhubCandle>(
    `/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${now}`,
    token,
  );

  const closes = Array.isArray(candle.c) ? candle.c.filter((x) => Number.isFinite(x)) : [];
  if (candle.s !== "ok" || closes.length === 0) {
    return { sma50: null, sma200: null };
  }

  return {
    sma50: round(average(closes.slice(-50))),
    sma200: round(average(closes.slice(-200))),
  };
}

export async function GET(request: Request) {
  const requestKey = request.headers.get("x-finnhub-key")?.trim();
  const token = requestKey || process.env.FINNHUB_API_KEY;
  if (!token) {
    return NextResponse.json(
      {
        error: "Missing Finnhub API key. Enter one in the Settings tab, or add FINNHUB_API_KEY to .env.local / Vercel environment variables.",
      },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const requestedSymbols = (url.searchParams.get("symbols") ?? "SPY")
    .split(",")
    .map(normalizeTicker)
    .filter(Boolean);

  const symbols = Array.from(new Set(["SPY", ...requestedSymbols])).slice(0, 40);
  const asOf = new Date().toISOString();
  const warnings: string[] = [];

  const quotePairs = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await fetchQuote(symbol, token);
        return [symbol, quote] as const;
      } catch (error) {
        warnings.push(`${symbol}: ${error instanceof Error ? error.message : "quote unavailable"}`);
        return [
          symbol,
          {
            ticker: symbol,
            price: null,
            change: null,
            changePercent: null,
            previousClose: null,
            asOf,
            source: "Unavailable",
          } satisfies LiveQuote,
        ] as const;
      }
    }),
  );

  const quotes = Object.fromEntries(quotePairs) as Record<string, LiveQuote>;

  let spySma50: number | null = null;
  let spySma200: number | null = null;
  try {
    const sma = await fetchSma("SPY", token);
    spySma50 = sma.sma50;
    spySma200 = sma.sma200;
  } catch (error) {
    warnings.push(`SPY SMA: ${error instanceof Error ? error.message : "moving averages unavailable"}`);
  }

  return NextResponse.json({
    asOf,
    provider: requestKey ? "Finnhub / Settings key" : "Finnhub / Server env",
    quotes,
    market: {
      spy: quotes.SPY ?? null,
      spySma50,
      spySma200,
    },
    warnings,
  });
}

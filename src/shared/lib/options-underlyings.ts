import type { Dictionary } from '@/shared/types/api';

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseUnderlyingFromTradingSymbol(tradingSymbol: string): string {
  const clean = tradingSymbol.toUpperCase();
  const match = clean.match(/^([A-Z]+)/);
  return match?.[1] ?? '';
}

export function extractOptionUnderlyings(instruments: Dictionary[]): string[] {
  const unique = new Set<string>();

  instruments.forEach((row) => {
    const instrumentType = toText(row.instrument_type ?? row.segment).toUpperCase();
    if (!instrumentType.includes('OPT')) {
      return;
    }

    const name = toText(row.name).toUpperCase();
    const tradingSymbol = toText(row.tradingsymbol ?? row.symbol);
    const parsedFromSymbol = parseUnderlyingFromTradingSymbol(tradingSymbol);

    const underlying = name || parsedFromSymbol;
    if (underlying) {
      unique.add(underlying);
    }
  });

  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

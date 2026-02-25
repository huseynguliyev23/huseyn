export interface ArbitrageOpportunity {
  id: string;
  coin: string;
  exchangeA: string;
  exchangeB: string;
  priceA: number;
  priceB: number;
  diffPercent: number;
  netProfit: number;
  risk: 'Low' | 'Medium' | 'High';
  transferTime: number; // minutes
}

export interface HistoryItem {
  id: number;
  coin: string;
  exchange_a: string;
  exchange_b: string;
  profit_percent: number;
  profit_amount: number;
  status: string;
  timestamp: string;
}

export interface ExchangeKey {
  id: number;
  exchange: string;
  api_key: string;
}

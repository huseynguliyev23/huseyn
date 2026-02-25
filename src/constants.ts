import { ArbitrageOpportunity } from './types';

export const EXCHANGES = ['Binance', 'Bybit', 'KuCoin', 'OKX'];
export const COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'LINK', 'AVAX', 'MATIC'];

export const generateMockOpportunity = (): ArbitrageOpportunity => {
  const coin = COINS[Math.floor(Math.random() * COINS.length)];
  const exA = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
  let exB = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
  while (exA === exB) {
    exB = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
  }

  const basePrice = coin === 'BTC' ? 65000 : coin === 'ETH' ? 3500 : coin === 'SOL' ? 140 : 10;
  const priceA = basePrice * (1 + (Math.random() - 0.5) * 0.02);
  const priceB = priceA * (1 + (Math.random() - 0.2) * 0.03); // Bias towards profit
  
  const diffPercent = ((priceB - priceA) / priceA) * 100;
  const netProfit = (priceB - priceA) * 0.98; // Subtract 2% for fees/slippage

  return {
    id: Math.random().toString(36).substr(2, 9),
    coin,
    exchangeA: exA,
    exchangeB: exB,
    priceA,
    priceB,
    diffPercent,
    netProfit,
    risk: diffPercent > 2.5 ? 'High' : diffPercent > 1.5 ? 'Medium' : 'Low',
    transferTime: Math.floor(Math.random() * 20) + 2,
  };
};

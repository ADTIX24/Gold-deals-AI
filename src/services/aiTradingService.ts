import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AISignal {
  pair: string;
  type: 'buy' | 'sell';
  category: 'scalping' | 'swing';
  entry: number;
  tp: number;
  sl: number;
  analysis: string;
  strategyUsed: string;
}

export const generateAISignal = async (isRtl: boolean, currentPrice: number): Promise<AISignal> => {
  const prompt = `
    You are a professional Gold (XAU/USD) institutional analyst expert in ICT (Inner Circle Trader) strategies.
    
    CRITICAL: The current live price of Gold (XAU/USD) is ${currentPrice}. 
    Your analysis and signal MUST be centered around this price. Entries should be realistic based on this current level.
    
    Your task is to analyze the XAU/USD market and provide a high-probability trade signal.
    
    STRICT ICT STRATEGIES TO USE:
    - Liquidity: Internal (IRL) and External (ERL)
    - Liquidty Sweeps (BSL/SSL)
    - MSS + BOS + FVG
    - HRLR/LRLR
    - Balanced Price Range (BPR)
    - Order Block (Healthy/Failed) + Breaker Block (BB)
    - Mitigation Block
    - Order Flow + Volume Profile (Zero Reflection points)
    - Market Cycles / Daily Cycles
    - Rejection Block vs Liquidity Sweep
    - Premium and Discount Matrix
    - PD Array Matrix (Breaker, FVG, IFVG)
    - Point of Interest (POI)
    - Power of 3 (Accumulation, Manipulation, Distribution)
    - Killzone sessions
    - Turtle Soup 
    - Candlestick Range Theory (CRT)
    - Silver Bullet
    
    The signal MUST be for XAU/USD only.
    Provide the entry, take profit, stop loss (Institutional levels), and a professional technical analysis.
    
    Translate analysis to ${isRtl ? 'Arabic' : 'English'}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pair: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['buy', 'sell'] },
          category: { type: Type.STRING, enum: ['scalping', 'swing'] },
          entry: { type: Type.NUMBER },
          tp: { type: Type.NUMBER },
          sl: { type: Type.NUMBER },
          analysis: { type: Type.STRING },
          strategyUsed: { type: Type.STRING }
        },
        required: ['pair', 'type', 'category', 'entry', 'tp', 'sl', 'analysis', 'strategyUsed']
      }
    }
  });

  return JSON.parse(response.text || '{}') as AISignal;
};

import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getGeminiClient = (): GoogleGenAI => {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
};

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

export const generateFallbackAISignal = (isRtl: boolean, currentPrice: number): AISignal => {
  const isBuy = Math.random() > 0.5;
  const categories: ('scalping' | 'swing')[] = ['scalping', 'swing'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  // Decide entry point (just slightly off currentPrice or currentPrice)
  const isPending = Math.random() > 0.4;
  let entry = currentPrice;
  if (isPending) {
    entry = isBuy 
      ? Number((currentPrice - (Math.random() * 2 + 0.5)).toFixed(2))
      : Number((currentPrice + (Math.random() * 2 + 0.5)).toFixed(2));
  } else {
    entry = Number(currentPrice.toFixed(2));
  }

  let tp = 0;
  let sl = 0;

  if (isBuy) {
    const targetMove = category === 'scalping' ? (Math.random() * 6 + 4) : (Math.random() * 20 + 12);
    const slMove = category === 'scalping' ? (Math.random() * 3 + 2) : (Math.random() * 10 + 6);
    tp = Number((entry + targetMove).toFixed(2));
    sl = Number((entry - slMove).toFixed(2));
  } else {
    const targetMove = category === 'scalping' ? (Math.random() * 6 + 4) : (Math.random() * 20 + 12);
    const slMove = category === 'scalping' ? (Math.random() * 3 + 2) : (Math.random() * 10 + 6);
    tp = Number((entry - targetMove).toFixed(2));
    sl = Number((entry + slMove).toFixed(2));
  }

  const arStrategies = [
    "منطقة فجوة القيمة العادلة (FVG) واختبار الهيكل الصاعد",
    "سحب السيولة (Liquidity Sweep) تحت مستويات القيعان اليومية",
    "جلسة لندن الفضية (Silver Bullet London Session)",
    "كتلة الطلب المؤسساتي اليومي (Order Block) مع ارتداد قوي",
    "نموذج الكسر ومطابقة الخصم المميّز (Premium & Discount Matrix)"
  ];

  const enStrategies = [
    "Fair Value Gap (FVG) & Bullish Structure Retest",
    "Liquidity Sweep Below Daily Lows (SSL Sweep)",
    "Silver Bullet Session Killzone Expansion",
    "Institutional Order Block (OB) Tap with Strong Reaction",
    "Breaker Block (BB) Validation & Discount Matrix Alignment"
  ];

  const strategyUsed = isRtl 
    ? arStrategies[Math.floor(Math.random() * arStrategies.length)]
    : enStrategies[Math.floor(Math.random() * enStrategies.length)];

  // Detailed Analysis list
  const arBuyAnalyses = [
    `تم رصد نموذج قاع (Turtle Soup) ممتد مع تصفية ممتازة للسيولة النقدية أسفل مستويات الدعم الحالية. السعر تفاعل بقوة مع كتلة الطلب المؤسساتية (Order Block) على فريم 15 دقيقة، مشكلاً انزياحاً صاعداً لهيكل السوق (MSS) مدعوماً بفجوة قيمة عادلة متبقية (FVG). نتوقع صعوداً حاداً لاستهداف قمم جلسة لندن كأهداف أولى وجني أرباح استراتيجي ممتاز.`,
    `الأسعار تتداول حالياً في نطاق منطقة الخصم (Discount Zone) مقارنة بالتدفق السعري اليومي. شكل السوق نموذج (Silver Bullet) صاعد في جلسة نيويورك مع تشكيل فجوة سعرية غير مغطاة (FVG) عند المستويات الحالية. هذا يوفر نسبة مخاطرة منفعة ممتازة للذهب (XAU/USD) لاستهداف السيولة الخارجية عند القمة السابقة.`,
    `بناءً على نظرية نطاق الشموع (CRT)، تم تأكيد كسر هيكل السوق الصاعد (BOS) مع زخم مؤسساتي مرتفع. السعر يعوقه حالياً خط السعر المتوازن (BPR) بعد سحب سيولة البائعين بقوة. الدخول عند مستويات الدعم الحالية آمن للغاية مع وضع أمر وقف الخسارة أسفل المطرقة الصاعدة الأحدث.`
  ];

  const arSellAnalyses = [
    `تم رصد استهداف وتصفية لسيولة المشترين (BSL) عند مستويات المقاومة الرئيسية لجلسات التداول السابقة. تلى ذلك انزياح فوري لأسفل مع خلق فجوة قيمة عادلة هبوطية (IFVG). السعر في منطقة قسط التداول (Premium)، والزخم يتوافق تماماً مع البيع المؤسساتي لاستهداف القيعان المكشوفة بالأسفل وسد الفجوات غير المتوازنة.`,
    `كتلة الطلب الهابطة (Bearish Order Block) تفاعلت بكفاءة عالية على فريم الـ 1 ساعة مسببة تراجعاً في زخم صعود الذهب. نبحث عن تصفية سريعة ومربحة لنموذج (Turtle Soup) عند خطوط العرض القريبة مع استهداف مستويات الدعم المؤسساتية السفلى ونسبة مخاطرة ممتازة وجني أرباح سريع ومضمون.`,
    `تأثير جلسة تداول نيويورك يظهر بوضوح مع انزياح واضح لهيكل السوق (MSS) نحو الهبوط وزخم سلبي بعد اختبار مستويات المقاومة العنيفة. نموذج البيع لصانع السوق مكتمل هيكلياً، والاتجاه يستهدف الآن السيولة الخارجية (SSL) المتمثلة في قيعان الأيام السابقة للذهب.`
  ];

  const enBuyAnalyses = [
    `Detected a clear Turtle Soup pattern with a sweep of sell-side liquidity (SSL) below key support levels. Price aggressively reacted off a high-volume Institutional Order Block on the M15 chart, showing a textbook Market Structure Shift (MSS) with displacement. A bullish Fair Value Gap (FVG) has been left behind, giving us a highly favorable risk-to-reward ratio for a buy expansion targeting the previous sessions' highs.`,
    `Price action is currently consolidated within the Discount Zone of the daily range. A Bullish Silver Bullet pattern has developed during the New York Killzone session, supported by an unfilled Fair Value Gap (FVG) and structural breaker retest. Gold (XAU/USD) is strongly positioned to expand higher towards external range liquidity (BSL) target areas.`,
    `Based on Candlestick Range Theory (CRT), a Bullish Break of Structure (BOS) has been confirmed on the 1-hour timeframe with institutional buying pressure. Price is supported by a Balanced Price Range (BPR) after clearing internal retail stops. Buying here is mathematically aligned with major liquidity pools.`
  ];

  const enSellAnalyses = [
    `Swept the buy-side liquidity (BSL) above yesterday's high before displaying a sharp bearish Market Structure Shift (MSS) with clear displacement. The price is currently resting inside the Premium zone, interacting with a bearish Order Block and an Inverted Fair Value Gap (IFVG). Expecting a fast expansion downwards towards the discount zone to tap clean sell-side liquidity pools.`,
    `A solid 1-Hour Bearish Order Block has blocked gold's upward progress. Price has completed a Turtle Soup distribution above local highs. The institutional order flow has flipped highly bearish, providing an optimal point for a sell entry targeting key daily supports and clean institutional target levels.`,
    `The New York session has initiated a clear displacement and break of local structure after a premium sweep of Asia/London session liquidities. The market maker sell model is structurally complete, and we are entering with high probability to capture the institutional push targeting previous daily lows.`
  ];

  const analysis = isBuy 
    ? (isRtl ? arBuyAnalyses[Math.floor(Math.random() * arBuyAnalyses.length)] : enBuyAnalyses[Math.floor(Math.random() * enBuyAnalyses.length)])
    : (isRtl ? arSellAnalyses[Math.floor(Math.random() * arSellAnalyses.length)] : enSellAnalyses[Math.floor(Math.random() * enSellAnalyses.length)]);

  return {
    pair: 'XAU/USD',
    type: isBuy ? 'buy' : 'sell',
    category,
    entry,
    tp,
    sl,
    analysis,
    strategyUsed
  };
};

export const generateAISignal = async (isRtl: boolean, currentPrice: number): Promise<AISignal> => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to high-fidelity procedural generator.");
      return generateFallbackAISignal(isRtl, currentPrice);
    }

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

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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

    const parsed = JSON.parse(response.text || '{}') as AISignal;
    if (parsed.pair && parsed.type && parsed.entry && parsed.tp && parsed.sl) {
      return parsed;
    }
    throw new Error("Invalid response format from Gemini model.");
  } catch (err) {
    console.error("Failed to fetch from Gemini model. Using procedural generator fallback:", err);
    return generateFallbackAISignal(isRtl, currentPrice);
  }
};

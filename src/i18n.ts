import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "dashboard_title": "XAU GOLD COMMAND",
      "gold": "GOLD",
      "oil": "OIL",
      "nasdaq": "NASDAQ",
      "gann_center": "GANN COMMAND CENTER",
      "signals": "TRADING SIGNALS",
      "scalping": "Scalping",
      "swing": "Swing",
      "entry": "Entry",
      "sl": "SL",
      "tp": "TP",
      "login_telegram": "Login with Telegram",
      "radar_active": "RADAR ACTIVE",
      "market_open": "MARKET OPEN",
      "high_tech_radar": "SQUARE OF 9 RADAR",
      "navigation": {
        "home": "Home",
        "market": "Market",
        "analysis": "Analysis",
        "settings": "Settings"
      }
    }
  },
  ar: {
    translation: {
      "dashboard_title": "مركز قيادة الذهب XAU",
      "gold": "الذهب",
      "oil": "النفط",
      "nasdaq": "ناسداك",
      "gann_center": "مركز قيادة جان",
      "signals": "تنبيهات التداول",
      "scalping": "سكالبينج",
      "swing": "سوينج",
      "entry": "نقطة الدخول",
      "sl": "وقف الخسارة",
      "tp": "جني الأرباح",
      "login_telegram": "تسجيل الدخول بالتيلجرام",
      "radar_active": "الرادار مفعّل",
      "market_open": "السوق مفتوح",
      "high_tech_radar": "رادار مربع الـ 9",
      "navigation": {
        "home": "الرئيسية",
        "market": "السوق",
        "analysis": "التحليل",
        "settings": "الإعدادات"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

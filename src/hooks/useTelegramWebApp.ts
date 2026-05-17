import { useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: { WebApp?: any }
  }
}

export function useTelegramWebApp() {
  const [tg, setTg] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      setTg(window.Telegram.WebApp);
    } else {
      setTg(null);
    }
  }, []);

  return tg;
}

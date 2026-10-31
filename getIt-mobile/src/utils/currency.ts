// Fallback rates from NGN (base currency in database)
const EXCHANGE_RATES: { [key: string]: number } = {
  NGN: 1,
  USD: 1500, // 1 USD = 1500 NGN
  EUR: 1600, // 1 EUR = 1600 NGN
  GBP: 1900, // 1 GBP = 1900 NGN
  CAD: 1100, // 1 CAD = 1100 NGN
  AUD: 1000, // 1 AUD = 1000 NGN
};

interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
}

export const getLocalCurrency = (): CurrencyConfig => {
  try {
    const locale = Intl.NumberFormat().resolvedOptions().locale || 'en-NG';
    const country = locale.split('-')[1] || '';
    
    let code = 'NGN';
    let symbol = '₦';
    
    if (country === 'US') {
      code = 'USD';
      symbol = '$';
    } else if (['GB', 'UK'].includes(country)) {
      code = 'GBP';
      symbol = '£';
    } else if (['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'FI'].includes(country)) {
      code = 'EUR';
      symbol = '€';
    } else if (country === 'CA') {
      code = 'CAD';
      symbol = 'C$';
    } else if (country === 'AU') {
      code = 'AUD';
      symbol = 'A$';
    } else {
      const lang = locale.split('-')[0];
      if (lang === 'en' && country !== 'NG') {
        code = 'USD';
        symbol = '$';
      }
    }
    
    const rate = EXCHANGE_RATES[code] || 1;
    return { code, symbol, rate };
  } catch {
    return { code: 'NGN', symbol: '₦', rate: 1 };
  }
};

export const formatPrice = (priceInBase: number): string => {
  const { symbol, rate } = getLocalCurrency();
  const converted = priceInBase / rate;
  
  if (symbol === '₦') {
    return `₦${Math.round(converted).toLocaleString('en-NG')}`;
  }
  
  return `${symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

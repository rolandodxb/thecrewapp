interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

const COUNTRY_TO_CURRENCY: Record<string, CurrencyInfo> = {
  US: { code: 'USD', symbol: '$', name: 'US Dollar' },
  AE: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  GB: { code: 'GBP', symbol: '£', name: 'British Pound' },
  EU: { code: 'EUR', symbol: '€', name: 'Euro' },
  DE: { code: 'EUR', symbol: '€', name: 'Euro' },
  FR: { code: 'EUR', symbol: '€', name: 'Euro' },
  IT: { code: 'EUR', symbol: '€', name: 'Euro' },
  ES: { code: 'EUR', symbol: '€', name: 'Euro' },
  NL: { code: 'EUR', symbol: '€', name: 'Euro' },
  BE: { code: 'EUR', symbol: '€', name: 'Euro' },
  AT: { code: 'EUR', symbol: '€', name: 'Euro' },
  IE: { code: 'EUR', symbol: '€', name: 'Euro' },
  PT: { code: 'EUR', symbol: '€', name: 'Euro' },
  GR: { code: 'EUR', symbol: '€', name: 'Euro' },
  FI: { code: 'EUR', symbol: '€', name: 'Euro' },
  CA: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AU: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  JP: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  IN: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  SG: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  SA: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  QA: { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal' },
  KW: { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  OM: { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
  BH: { code: 'BHD', symbol: 'ب.د', name: 'Bahraini Dinar' },
  CH: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  CN: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  HK: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  NZ: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  SE: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  NO: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  DK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  PL: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  CZ: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  HU: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  RO: { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  BG: { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  HR: { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
  TR: { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  ZA: { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  BR: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  MX: { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  AR: { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  CL: { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
  CO: { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  MY: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  TH: { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  ID: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  PH: { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  VN: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  KR: { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  TW: { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
  IL: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  EG: { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
  NG: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  KE: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
};

export const CARD_BIN_TO_COUNTRY: Record<string, string> = {
  '4': 'US',
  '5': 'US',
  '3': 'US',
  '6': 'US',
};

export function getCurrencyFromCountry(countryCode: string): CurrencyInfo {
  return COUNTRY_TO_CURRENCY[countryCode] || COUNTRY_TO_CURRENCY['US'];
}

export function detectCurrencyFromCardBIN(bin: string): CurrencyInfo {
  const countryCode = CARD_BIN_TO_COUNTRY[bin.charAt(0)] || 'US';
  return getCurrencyFromCountry(countryCode);
}

export function getAllSupportedCurrencies(): CurrencyInfo[] {
  return Object.values(COUNTRY_TO_CURRENCY);
}

export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const currency = Object.values(COUNTRY_TO_CURRENCY).find(c => c.code === currencyCode);
  if (!currency) {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (!exchangeRates) {
    return amount;
  }

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;

  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = Object.values(COUNTRY_TO_CURRENCY).find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

export function getCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'discover';
  if (/^(?:2131|1800|35)/.test(cleaned)) return 'jcb';
  if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'diners';
  if (/^62/.test(cleaned)) return 'unionpay';

  return 'unknown';
}

export function isCardBrand3DSecureRequired(brand: string): boolean {
  const brands3DSecureRequired = ['mastercard', 'visa', 'amex', 'discover'];
  return brands3DSecureRequired.includes(brand.toLowerCase());
}

export const SUPPORTED_STRIPE_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'AED', 'AUD', 'CAD', 'JPY', 'INR', 'SGD',
  'CHF', 'CNY', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK',
  'HUF', 'RON', 'BGN', 'HRK', 'TRY', 'ZAR', 'BRL', 'MXN', 'MYR',
  'THB', 'IDR', 'PHP', 'VND', 'KRW', 'TWD', 'ILS'
];

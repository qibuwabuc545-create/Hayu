import React from 'react';
import { PaymentCategory } from '../types';

interface PaymentLogoProps {
  name?: string;
  category?: PaymentCategory | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export interface PaymentBrandTheme {
  id: string;
  displayName: string;
  subName?: string;
  category: PaymentCategory;
  primaryColor: string;
  accentBg: string;
  borderClass: string;
  selectedRing: string;
  cardBg: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

/**
 * Returns brand metadata for styling cards, badges, and headers based on payment method name / category
 */
export function getPaymentMethodBrand(name: string = '', category?: string): PaymentBrandTheme {
  const lower = name.toLowerCase();

  // 1. TELEBIRR (ቴሌብር)
  if (lower.includes('telebirr') || lower.includes('ቴሌብር') || lower.includes('ethio telecom')) {
    return {
      id: 'telebirr',
      displayName: 'Telebirr (ቴሌብር)',
      subName: 'Ethio Telecom SuperApp',
      category: 'ethiopian',
      primaryColor: '#00A3E0',
      accentBg: 'bg-[#00A3E0]/10',
      borderClass: 'border-[#00A3E0]/30 hover:border-[#00A3E0]',
      selectedRing: 'ring-2 ring-[#00A3E0] bg-[#00A3E0]/5 border-[#00A3E0]',
      cardBg: 'from-[#00A3E0]/15 to-[#0072CE]/5',
      badgeBg: 'bg-[#00A3E0]/15',
      badgeText: 'text-[#0072CE] font-bold',
      badgeBorder: 'border-[#00A3E0]/30'
    };
  }

  // 2. CBE BIRR (ሲቢኢ ብር)
  if (lower.includes('cbebirr') || lower.includes('cbe birr') || lower.includes('ሲቢኢ ብር')) {
    return {
      id: 'cbebirr',
      displayName: 'CBEbirr Wallet (ሲቢኢ ብር)',
      subName: 'CBE Mobile Money (*847#)',
      category: 'ethiopian',
      primaryColor: '#7B1143',
      accentBg: 'bg-[#7B1143]/10',
      borderClass: 'border-[#7B1143]/30 hover:border-[#7B1143]',
      selectedRing: 'ring-2 ring-[#7B1143] bg-[#7B1143]/5 border-[#7B1143]',
      cardBg: 'from-[#7B1143]/15 to-[#F36F21]/5',
      badgeBg: 'bg-[#7B1143]/15',
      badgeText: 'text-[#7B1143] font-bold',
      badgeBorder: 'border-[#7B1143]/30'
    };
  }

  // 3. CBE ACCOUNT (Commercial Bank of Ethiopia - የኢትዮጵያ ንግድ ባንክ)
  if (lower.includes('cbe') || lower.includes('commercial bank') || lower.includes('ንግድ ባንክ')) {
    return {
      id: 'cbe',
      displayName: 'Commercial Bank of Ethiopia (CBE)',
      subName: 'የኢትዮጵያ ንግድ ባንክ',
      category: 'ethiopian',
      primaryColor: '#5C0632',
      accentBg: 'bg-[#5C0632]/10',
      borderClass: 'border-[#5C0632]/30 hover:border-[#5C0632]',
      selectedRing: 'ring-2 ring-[#5C0632] bg-[#5C0632]/5 border-[#5C0632]',
      cardBg: 'from-[#5C0632]/15 to-[#EAA71D]/10',
      badgeBg: 'bg-[#5C0632]/15',
      badgeText: 'text-[#5C0632] font-bold',
      badgeBorder: 'border-[#5C0632]/30'
    };
  }

  // 4. USDT (Tether)
  if (lower.includes('usdt') || lower.includes('tether')) {
    return {
      id: 'usdt',
      displayName: 'USDT (Tether)',
      subName: 'TRC-20 / ERC-20 Stablecoin',
      category: 'crypto',
      primaryColor: '#26A17B',
      accentBg: 'bg-[#26A17B]/10',
      borderClass: 'border-[#26A17B]/30 hover:border-[#26A17B]',
      selectedRing: 'ring-2 ring-[#26A17B] bg-[#26A17B]/5 border-[#26A17B]',
      cardBg: 'from-[#26A17B]/15 to-[#165B47]/5',
      badgeBg: 'bg-[#26A17B]/15',
      badgeText: 'text-[#165B47] font-bold',
      badgeBorder: 'border-[#26A17B]/30'
    };
  }

  // 5. BITCOIN (BTC)
  if (lower.includes('btc') || lower.includes('bitcoin')) {
    return {
      id: 'btc',
      displayName: 'Bitcoin (BTC)',
      subName: 'Bitcoin Network',
      category: 'crypto',
      primaryColor: '#F7931A',
      accentBg: 'bg-[#F7931A]/10',
      borderClass: 'border-[#F7931A]/30 hover:border-[#F7931A]',
      selectedRing: 'ring-2 ring-[#F7931A] bg-[#F7931A]/5 border-[#F7931A]',
      cardBg: 'from-[#F7931A]/15 to-[#9A5503]/5',
      badgeBg: 'bg-[#F7931A]/15',
      badgeText: 'text-[#9A5503] font-bold',
      badgeBorder: 'border-[#F7931A]/30'
    };
  }

  // 6. ETHEREUM (ETH)
  if (lower.includes('eth') || lower.includes('ethereum')) {
    return {
      id: 'eth',
      displayName: 'Ethereum (ETH)',
      subName: 'ERC-20 Mainnet',
      category: 'crypto',
      primaryColor: '#627EEA',
      accentBg: 'bg-[#627EEA]/10',
      borderClass: 'border-[#627EEA]/30 hover:border-[#627EEA]',
      selectedRing: 'ring-2 ring-[#627EEA] bg-[#627EEA]/5 border-[#627EEA]',
      cardBg: 'from-[#627EEA]/15 to-[#2A3F9D]/5',
      badgeBg: 'bg-[#627EEA]/15',
      badgeText: 'text-[#2A3F9D] font-bold',
      badgeBorder: 'border-[#627EEA]/30'
    };
  }

  // 7. BINANCE PAY
  if (lower.includes('binance')) {
    return {
      id: 'binance',
      displayName: 'Binance Pay',
      subName: 'Zero-Fee Pay ID Transfer',
      category: 'crypto',
      primaryColor: '#F0B90B',
      accentBg: 'bg-[#F0B90B]/10',
      borderClass: 'border-[#F0B90B]/40 hover:border-[#F0B90B]',
      selectedRing: 'ring-2 ring-[#F0B90B] bg-[#F0B90B]/5 border-[#F0B90B]',
      cardBg: 'from-[#F0B90B]/15 to-[#181A20]/5',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900 font-bold',
      badgeBorder: 'border-amber-300'
    };
  }

  // 8. PAYPAL
  if (lower.includes('paypal')) {
    return {
      id: 'paypal',
      displayName: 'PayPal',
      subName: 'Cards & PayPal Balance',
      category: 'mobile',
      primaryColor: '#003087',
      accentBg: 'bg-[#0079C1]/10',
      borderClass: 'border-[#0079C1]/30 hover:border-[#0079C1]',
      selectedRing: 'ring-2 ring-[#0079C1] bg-[#0079C1]/5 border-[#0079C1]',
      cardBg: 'from-[#003087]/15 to-[#0079C1]/5',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-900 font-bold',
      badgeBorder: 'border-sky-300'
    };
  }

  // 9. CASHAPP / VENMO / ZELLE
  if (lower.includes('cashapp') || lower.includes('cash app') || lower.includes('venmo') || lower.includes('zelle')) {
    return {
      id: 'mobile_app',
      displayName: name || 'Mobile Wallet',
      subName: 'Instant Mobile Transfer',
      category: 'mobile',
      primaryColor: '#00D632',
      accentBg: 'bg-[#00D632]/10',
      borderClass: 'border-[#00D632]/30 hover:border-[#00D632]',
      selectedRing: 'ring-2 ring-[#00D632] bg-[#00D632]/5 border-[#00D632]',
      cardBg: 'from-[#00D632]/15 to-[#008F22]/5',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-900 font-bold',
      badgeBorder: 'border-emerald-300'
    };
  }

  // 10. DEFAULT / BANK WIRE
  return {
    id: 'bank',
    displayName: name || 'Bank Wire Transfer',
    subName: category === 'ethiopian' ? 'Ethiopian Financial Institution' : 'Direct Financial Transfer',
    category: (category as PaymentCategory) || 'bank',
    primaryColor: '#1E3A8A',
    accentBg: 'bg-slate-100',
    borderClass: 'border-slate-300 hover:border-slate-500',
    selectedRing: 'ring-2 ring-slate-800 bg-slate-50 border-slate-800',
    cardBg: 'from-slate-100 to-slate-50',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800 font-bold',
    badgeBorder: 'border-slate-300'
  };
}

export const PaymentLogo: React.FC<PaymentLogoProps> = ({
  name = '',
  category,
  size = 'md',
  className = ''
}) => {
  const brand = getPaymentMethodBrand(name, category);

  const dimensionMap = {
    xs: 'w-5 h-5 rounded-md text-[9px]',
    sm: 'w-7 h-7 rounded-lg text-xs',
    md: 'w-9 h-9 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
    xl: 'w-16 h-16 rounded-2xl text-xl'
  };

  const svgSizes = {
    xs: 14,
    sm: 18,
    md: 22,
    lg: 28,
    xl: 38
  }[size];

  // 1. TELEBIRR OFFICIAL LOGO
  if (brand.id === 'telebirr') {
    return (
      <div
        className={`flex items-center justify-center font-bold relative overflow-hidden shadow-xs border select-none transition-transform ${dimensionMap[size]} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #00A3E0 0%, #0072CE 100%)',
          borderColor: '#0085C8',
          color: '#FFFFFF'
        }}
        title="Telebirr (ቴሌብር) - Ethio Telecom"
      >
        <svg
          width={svgSizes}
          height={svgSizes}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Telebirr 't' and 'b' swoop & coin dot */}
          <circle cx="24" cy="24" r="21" fill="white" fillOpacity="0.15" />
          <path
            d="M16 11V31C16 34.3137 18.6863 37 22 37H28C32.4183 37 36 33.4183 36 29C36 24.5817 32.4183 21 28 21H16"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 17H24"
            stroke="#FFD100"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="28" cy="29" r="3.5" fill="#FFD100" />
        </svg>
      </div>
    );
  }

  // 2. COMMERCIAL BANK OF ETHIOPIA (CBE) OFFICIAL LOGO
  if (brand.id === 'cbe') {
    return (
      <div
        className={`flex items-center justify-center font-bold relative overflow-hidden shadow-xs border select-none transition-transform ${dimensionMap[size]} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #5C0632 0%, #7B1143 100%)',
          borderColor: '#420323',
          color: '#FFD700'
        }}
        title="Commercial Bank of Ethiopia (CBE - የኢትዮጵያ ንግድ ባንክ)"
      >
        <svg
          width={svgSizes}
          height={svgSizes}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* CBE Iconic Golden Diamond Emblem */}
          <rect
            x="24"
            y="7"
            width="24"
            height="24"
            transform="rotate(45 24 7)"
            fill="#EAA71D"
            stroke="#FFF2B2"
            strokeWidth="2"
          />
          <rect
            x="24"
            y="13"
            width="15.5"
            height="15.5"
            transform="rotate(45 24 13)"
            fill="#5C0632"
          />
          {/* Inner Golden Monogram */}
          <path
            d="M24 18V30M18 24H30"
            stroke="#FFD700"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 3. CBE BIRR OFFICIAL LOGO
  if (brand.id === 'cbebirr') {
    return (
      <div
        className={`flex items-center justify-center font-bold relative overflow-hidden shadow-xs border select-none transition-transform ${dimensionMap[size]} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #7B1143 0%, #A21858 100%)',
          borderColor: '#5C0632',
          color: '#FFFFFF'
        }}
        title="CBEbirr Wallet (ሲቢኢ ብር)"
      >
        <svg
          width={svgSizes}
          height={svgSizes}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Mobile phone frame with orange/gold pay waves */}
          <rect x="13" y="8" width="22" height="32" rx="4" fill="#F36F21" stroke="white" strokeWidth="2" />
          <circle cx="24" cy="34" r="2" fill="white" />
          <path d="M19 18C20.5 16 23.5 16 25 18M17 22C20 19 24 19 27 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="25" r="2.5" fill="#FFD700" />
        </svg>
      </div>
    );
  }

  // 4. USDT (TETHER) OFFICIAL LOGO
  if (brand.id === 'usdt') {
    return (
      <div
        className={`flex items-center justify-center font-bold relative overflow-hidden shadow-xs border select-none transition-transform ${dimensionMap[size]} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #26A17B 0%, #1A7559 100%)',
          borderColor: '#1D8263',
          color: '#FFFFFF'
        }}
        title="Tether USDT (₮)"
      >
        <svg
          width={svgSizes}
          height={svgSizes}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Tether ₮ Emblem */}
          <ellipse cx="24" cy="27" rx="15" ry="5.5" stroke="white" strokeWidth="3" />
          <path d="M14 14H34M24 14V34" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
          <rect x="19" y="24.5" width="10" height="4.5" fill="#26A17B" />
        </svg>
      </div>
    );
  }

  // 5. BITCOIN (BTC) OFFICIAL LOGO
  if (brand.id === 'btc') {
    return (
      <div
        className={`flex items-center justify-center font-bold relative overflow-hidden shadow-xs border select-none transition-transform ${dimensionMap[size]} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #F7931A 0%, #D87707 100%)',
          borderColor: '#D87707',
          color: '#FFFFFF'
        }}
        title="Bitcoin (BTC - ₿)"
      >
        <svg
          width={svgSizes}
          height={svgSizes}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bitcoin ₿ Tilted Symbol */}
          <circle cx="24" cy="24" r="20" fill="white" fillOpacity="0.15" />
          <path
            d="M20 12V36M24 12V15M24 33V36M17 17H27.5C29.9853 17 32 19.0147 32 21.5C32 23.9853 29.9853 26 27.5 26H17M17 26H28.5C30.9853 26 33 28.0147 33 30.5C33 32.9853 30.9853 35 28.5 35H17"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // 6. ETHEREUM (ETH) OFFICIAL LOGO
  if (brand.id === 'eth') {
    return (
      <div
        className={`flex items-center justify-center font-bold relative overflow-hidden shadow-xs border select-none transition-transform ${dimensionMap[size]} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #4968E5 0%, #304AB8 100%)',
          borderColor: '#304AB8',
          color: '#FFFFFF'
        }}
        title="Ethereum (ETH - Ξ)"
      >
        <svg
          width={svgSizes}
          height={svgSizes}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ethereum 3D Diamond Prism */}
          <path d="M24 6L14 22.5L24 28L34 22.5L24 6Z" fill="white" fillOpacity="0.9" />
          <path d="M24 6L24 28L34 22.5L24 6Z" fill="white" fillOpacity="0.6" />
          <path d="M24 30.5L14 25L24 41L34 25L24 30.5Z" fill="white" fillOpacity="0.9" />
          <path d="M24 30.5L24 41L34 25L24 30.5Z" fill="white" fillOpacity="0.6" />
        </svg>
      </div>
    );
  }

  // 7. BINANCE PAY OFFICIAL LOGO
  if (brand.id === 'binance') {
    return (
      <div
        className={`flex items-center justify-center font-bold relative overflow-hidden shadow-xs border select-none transition-transform ${dimensionMap[size]} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #181A20 0%, #0B0E11 100%)',
          borderColor: '#F0B90B',
          color: '#F0B90B'
        }}
        title="Binance Pay"
      >
        <svg
          width={svgSizes}
          height={svgSizes}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Binance Diamond Geometry */}
          <rect x="24" y="9" width="8" height="8" transform="rotate(45 24 9)" fill="#F0B90B" />
          <rect x="14" y="19" width="8" height="8" transform="rotate(45 14 19)" fill="#F0B90B" />
          <rect x="34" y="19" width="8" height="8" transform="rotate(45 34 19)" fill="#F0B90B" />
          <rect x="24" y="29" width="8" height="8" transform="rotate(45 24 29)" fill="#F0B90B" />
          <rect x="24" y="19" width="6.5" height="6.5" transform="rotate(45 24 19)" fill="#181A20" stroke="#F0B90B" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  // 8. PAYPAL OFFICIAL LOGO
  if (brand.id === 'paypal') {
    return (
      <div
        className={`flex items-center justify-center font-bold relative overflow-hidden shadow-xs border select-none transition-transform ${dimensionMap[size]} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #003087 0%, #0079C1 100%)',
          borderColor: '#004C99',
          color: '#FFFFFF'
        }}
        title="PayPal"
      >
        <svg
          width={svgSizes}
          height={svgSizes}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* PayPal Dual P Monogram */}
          <path
            d="M17 11H27C30.866 11 34 14.134 34 18C34 21.866 30.866 25 27 25H21L18 37H12L17 11Z"
            fill="#0079C1"
          />
          <path
            d="M21 16H31C34.866 16 38 19.134 38 23C38 26.866 34.866 30 31 30H25L22 41H17L21 16Z"
            fill="#00457C"
            fillOpacity="0.8"
          />
          <path
            d="M21 25H27C29 25 31 24 32 23C32.5 24.5 32 26.5 30 28C28.5 29.5 26.5 30 24 30H20L18 37H22L21 25Z"
            fill="#002F6C"
          />
        </svg>
      </div>
    );
  }

  // 9. CASHAPP / VENMO / MOBILE WALLET
  if (brand.id === 'mobile_app') {
    return (
      <div
        className={`flex items-center justify-center font-bold relative overflow-hidden shadow-xs border select-none transition-transform ${dimensionMap[size]} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #00D632 0%, #00A827 100%)',
          borderColor: '#008F22',
          color: '#FFFFFF'
        }}
        title="CashApp / Mobile Money"
      >
        <span className="font-black font-mono text-white text-base sm:text-lg select-none">
          $
        </span>
      </div>
    );
  }

  // 10. DEFAULT / BANK WIRE LOGO
  return (
    <div
      className={`flex items-center justify-center font-bold relative overflow-hidden shadow-xs border select-none transition-transform ${dimensionMap[size]} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        borderColor: '#334155',
        color: '#FFFFFF'
      }}
      title="Bank Wire Transfer / Financial Institution"
    >
      <svg
        width={svgSizes}
        height={svgSizes}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bank Colonnade Building */}
        <path d="M24 9L8 18H40L24 9Z" fill="#E2E8F0" />
        <rect x="11" y="21" width="4" height="13" fill="#E2E8F0" rx="1" />
        <rect x="19" y="21" width="4" height="13" fill="#E2E8F0" rx="1" />
        <rect x="27" y="21" width="4" height="13" fill="#E2E8F0" rx="1" />
        <rect x="34" y="21" width="4" height="13" fill="#E2E8F0" rx="1" />
        <rect x="7" y="36" width="34" height="4" fill="#E2E8F0" rx="1" />
      </svg>
    </div>
  );
};

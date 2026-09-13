import React, { useState, useEffect } from 'react';
import {
  Building2,
  CreditCard,
  Check,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Coins,
  Smartphone,
  Globe,
  QrCode,
  Copy,
  Info
} from 'lucide-react';
import { PaymentSettings, PaymentMethodConfig, PaymentCategory } from '../types';
import { PaymentLogo, getPaymentMethodBrand } from './PaymentLogo';

interface PresetOption {
  category: PaymentCategory;
  name: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  network?: string;
  notes: string;
  badgeLabel: string;
  badgeColor: string;
}

const PRESET_TEMPLATES: PresetOption[] = [
  {
    category: 'ethiopian',
    name: 'Telebirr (ቴሌብር)',
    accountName: 'Ethio Telecom Merchant / Course Hub',
    accountNumber: '0911234567',
    bankName: 'Ethio Telecom Telebirr SuperApp',
    notes: 'Pay via Telebirr App or *127#. Include your Student Name or Email in payment remarks.',
    badgeLabel: '🇪🇹 Telebirr',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300'
  },
  {
    category: 'ethiopian',
    name: 'Commercial Bank of Ethiopia (CBE)',
    accountName: 'Academic Publishing PLC',
    accountNumber: '1000492819401',
    bankName: 'Commercial Bank of Ethiopia (CBE) - Main Branch',
    notes: 'Transfer via CBE Mobile Banking app, CBE Birr, or Bank Branch. Paste the 13-digit TXN Reference ID.',
    badgeLabel: '🇪🇹 CBE Account',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  {
    category: 'ethiopian',
    name: 'CBEbirr Wallet (ሲቢኢ ብር)',
    accountName: 'Academic Portal CBEbirr',
    accountNumber: '0912345678',
    bankName: 'CBEbirr Mobile Wallet (*847#)',
    notes: 'Transfer via CBEbirr wallet or dial *847#. Include student reference.',
    badgeLabel: '🇪🇹 CBEbirr',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300'
  },
  {
    category: 'crypto',
    name: 'USDT (Tether - TRC20)',
    accountName: 'Course Library Treasury',
    accountNumber: 'TX9dJk7P2Wn8vYq6z4bZ8kLqm9RpF3gE7u',
    bankName: 'TRON Network (TRC20)',
    network: 'TRC20',
    notes: 'Send exact USDT amount on TRON (TRC20) network. Paste your transaction hash (TxHash).',
    badgeLabel: '🪙 USDT (TRC20)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    category: 'crypto',
    name: 'Bitcoin (BTC)',
    accountName: 'Academic BTC Vault',
    accountNumber: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    bankName: 'Bitcoin Network',
    network: 'Bitcoin',
    notes: 'Transfer BTC to the address. Access will be unlocked after 1 network confirmation.',
    badgeLabel: '🪙 Bitcoin (BTC)',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  {
    category: 'crypto',
    name: 'Ethereum (ETH)',
    accountName: 'Academic ETH Vault',
    accountNumber: '0x71C8363837F5FB123013000407B372861E43206a',
    bankName: 'Ethereum Mainnet (ERC-20)',
    network: 'ERC-20',
    notes: 'Send ETH on Ethereum mainnet. Paste your transaction hash (TxHash).',
    badgeLabel: '🪙 Ethereum (ETH)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    category: 'crypto',
    name: 'Binance Pay (Pay ID)',
    accountName: 'Academic Books Global',
    accountNumber: '582910482',
    bankName: 'Binance Pay App',
    network: 'Binance Pay',
    notes: 'Instant zero-fee transfer via Binance App > Pay > Send to Pay ID.',
    badgeLabel: '🪙 Binance Pay',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  {
    category: 'bank',
    name: 'Direct Bank Wire Transfer',
    accountName: 'Academic Course Library Ltd',
    accountNumber: '0482910482',
    bankName: 'Global Education Bank (IBAN: US89GLOB9482019482)',
    notes: 'Please add your Student Name/Course in description',
    badgeLabel: '🏦 Bank Wire',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
  },
  {
    category: 'mobile',
    name: 'PayPal / Credit Card',
    accountName: 'University Publications',
    accountNumber: 'payments@academic-courses.edu',
    bankName: 'PayPal Business',
    notes: 'Send as Goods & Services or Direct Invoice payment',
    badgeLabel: '💳 PayPal',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300'
  }
];

export const AdminPaymentSettings: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettings>({
    defaultCurrency: 'USD',
    defaultInstructions: 'Please transfer the exact amount to any of our official verified payment accounts below. Include your transaction ID or reference number in the payment confirmation form. The administrator will inspect the receipt and release the book to your account.',
    methods: []
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/payments/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setSettings(data);
      })
      .catch(err => {
        console.error('Failed to load payment settings:', err);
        setError('Failed to fetch payment configuration');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch('/api/payments/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payment settings');

      setSuccessMsg('Payment settings & receiving accounts updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error saving payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateMethod = (index: number, updates: Partial<PaymentMethodConfig>) => {
    const updated = [...settings.methods];
    updated[index] = { ...updated[index], ...updates };
    setSettings({ ...settings, methods: updated });
  };

  const addMethodFromPreset = (preset: PresetOption) => {
    const newMethod: PaymentMethodConfig = {
      id: `${preset.category}_${Date.now()}`,
      name: preset.name,
      accountName: preset.accountName,
      accountNumber: preset.accountNumber,
      bankName: preset.bankName,
      category: preset.category,
      network: preset.network,
      notes: preset.notes,
      active: true
    };
    setSettings({ ...settings, methods: [...settings.methods, newMethod] });
    setSuccessMsg(`Added preset: ${preset.name}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const addCustomMethod = () => {
    const newMethod: PaymentMethodConfig = {
      id: 'method_' + Date.now(),
      name: 'Custom Payment Method',
      accountName: 'Beneficiary / Account Name',
      accountNumber: 'Account / Wallet Address / Phone',
      bankName: 'Bank or Network Name',
      category: 'other',
      notes: '',
      active: true
    };
    setSettings({ ...settings, methods: [...settings.methods, newMethod] });
  };

  const removeMethod = (index: number) => {
    const updated = settings.methods.filter((_, i) => i !== index);
    setSettings({ ...settings, methods: updated });
  };

  const handleCopyTest = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading payment configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-1 border border-emerald-200">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Admin Receiving Accounts Configuration</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Payment Methods &amp; Official Accounts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Configure Ethiopian mobile money accounts (Telebirr, CBEbirr, CBE Bank), Cryptocurrency accounts (USDT TRC20, Bitcoin, Ethereum, Binance Pay), and international payment channels with official brand styling.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* QUICK PRESET ADD SECTION WITH OFFICIAL LOGOS */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">1-Click Quick Add with Official Brand Logos</h3>
              <p className="text-[11px] text-slate-400">Click any preset to add official Ethiopian or Crypto receiving accounts.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={addCustomMethod}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Custom Account</span>
          </button>
        </div>

        {/* Ethiopian Presets */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <span>🇪🇹 Ethiopian Options (Telebirr, CBE Account, CBEbirr):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESET_TEMPLATES.filter(p => p.category === 'ethiopian').map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => addMethodFromPreset(preset)}
                className="p-3 bg-slate-800/90 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 hover:border-amber-400/60 transition-all text-left shadow-sm flex items-center gap-3 group"
              >
                <PaymentLogo name={preset.name} category={preset.category} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold group-hover:text-amber-300 transition-colors truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {preset.accountName}
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-white flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Crypto Presets */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Coins className="w-3.5 h-3.5" />
            <span>🪙 Crypto Options (USDT, Bitcoin, Ethereum, Binance Pay):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {PRESET_TEMPLATES.filter(p => p.category === 'crypto').map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => addMethodFromPreset(preset)}
                className="p-3 bg-slate-800/90 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 hover:border-emerald-400/60 transition-all text-left shadow-sm flex items-center gap-3 group"
              >
                <PaymentLogo name={preset.name} category={preset.category} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold group-hover:text-emerald-300 transition-colors truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {preset.network || preset.bankName}
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-white flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Standard Presets */}
        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-800/80">
          {PRESET_TEMPLATES.filter(p => p.category === 'bank' || p.category === 'mobile').map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => addMethodFromPreset(preset)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <PaymentLogo name={preset.name} category={preset.category} size="xs" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Global Defaults & Currency */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span>General Payment Instructions &amp; Defaults</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Currency
            </label>
            <select
              value={settings.defaultCurrency}
              onChange={e => setSettings({ ...settings, defaultCurrency: e.target.value })}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ETB">ETB (Br) - Ethiopian Birr (ኢትዮጵያ)</option>
              <option value="USD">USD ($) - United States Dollar</option>
              <option value="USDT">USDT (₮) - Tether USD Crypto</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="BTC">BTC (₿) - Bitcoin</option>
              <option value="ETH">ETH (Ξ) - Ethereum</option>
              <option value="KES">KES (KSh) - Kenyan Shilling</option>
              <option value="NGN">NGN (₦) - Nigerian Naira</option>
              <option value="CAD">CAD ($) - Canadian Dollar</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Supports Ethiopian Birr (ETB), Crypto (USDT/BTC/ETH), and Global Currencies.</p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Student Checkout Guidance
            </label>
            <textarea
              rows={2}
              value={settings.defaultInstructions}
              onChange={e => setSettings({ ...settings, defaultInstructions: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* Active Payment Receiving Accounts */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Active Receiving Accounts &amp; Wallets ({settings.methods.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Each channel is rendered with its official logo on student checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={addCustomMethod}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>

        {settings.methods.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            No payment accounts configured yet. Click one of the quick preset buttons above to add Telebirr, CBE, or Crypto accounts.
          </div>
        ) : (
          <div className="space-y-4">
            {settings.methods.map((method, index) => {
              const brand = getPaymentMethodBrand(method.name, method.category);

              return (
                <div
                  key={method.id || index}
                  className={`p-5 rounded-2xl border transition-all ${
                    method.active ? 'border-slate-200 bg-slate-50/60 shadow-sm' : 'border-slate-200 bg-slate-100/70 opacity-60'
                  }`}
                >
                  {/* Method Header with Official Brand Logo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-3 flex-wrap">
                      <PaymentLogo name={method.name} category={method.category} size="md" />
                      
                      <input
                        type="text"
                        value={method.name}
                        onChange={e => updateMethod(index, { name: e.target.value })}
                        className="font-bold text-sm text-slate-900 bg-white border border-slate-300 focus:border-emerald-500 px-2.5 py-1 rounded-lg focus:outline-none min-w-[200px]"
                        placeholder="e.g. Telebirr, CBE Account, USDT TRC20"
                      />
                      
                      <select
                        value={method.category || 'other'}
                        onChange={e => updateMethod(index, { category: e.target.value as PaymentCategory })}
                        className="text-[11px] font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
                      >
                        <option value="ethiopian">🇪🇹 Ethiopian Method</option>
                        <option value="crypto">🪙 Crypto Wallet</option>
                        <option value="bank">🏦 Bank Account</option>
                        <option value="mobile">📱 Mobile / Digital</option>
                        <option value="other">Other Method</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <input
                          type="checkbox"
                          checked={method.active}
                          onChange={e => updateMethod(index, { active: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Active</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeMethod(index)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove method"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Account / Beneficiary / Wallet Holder Name *
                      </label>
                      <input
                        type="text"
                        value={method.accountName}
                        onChange={e => updateMethod(index, { accountName: e.target.value })}
                        placeholder="e.g. Academic Publications PLC or John Doe"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Account / Phone / Wallet Address / Pay ID *
                        </label>
                        {method.accountNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopyTest(method.accountNumber, method.id)}
                            className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5"
                          >
                            {copiedId === method.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            <span>{copiedId === method.id ? 'Copied' : 'Test Copy'}</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={method.accountNumber}
                        onChange={e => updateMethod(index, { accountNumber: e.target.value })}
                        placeholder="e.g. 0911234567 / 1000492819401 / TX9dJk7P2..."
                        className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Bank Name / Platform / Network
                      </label>
                      <input
                        type="text"
                        value={method.bankName || ''}
                        onChange={e => updateMethod(index, { bankName: e.target.value })}
                        placeholder="e.g. CBE Main Branch / TRON TRC-20 / Telebirr"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* Optional Network for Crypto */}
                    {(method.category === 'crypto' || method.name.toLowerCase().includes('crypto') || method.name.toLowerCase().includes('usdt')) && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Crypto Network Protocol
                        </label>
                        <input
                          type="text"
                          value={method.network || ''}
                          onChange={e => updateMethod(index, { network: e.target.value })}
                          placeholder="e.g. TRC20, ERC20, BEP20, Bitcoin, Solana"
                          className="w-full px-3 py-2 text-xs font-mono text-emerald-700 font-bold rounded-xl border border-emerald-300 bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    )}

                    <div className={method.category === 'crypto' ? 'sm:col-span-2' : 'sm:col-span-2 md:col-span-3'}>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Transfer Instructions / Remarks for Students
                      </label>
                      <input
                        type="text"
                        value={method.notes || ''}
                        onChange={e => updateMethod(index, { notes: e.target.value })}
                        placeholder="e.g. Transfer via Telebirr or CBE Mobile, paste Transaction ID / Reference in receipt form."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </form>
  );
};

import React, { useState } from 'react';
import { User, SubscriptionTier } from '../types';
import { addPayment, saveCurrentUser, updateUserInList } from '../utils/storage';
import { Check, X, CreditCard, Shield, Sparkles, Loader2, Landmark, RefreshCw } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onPlanActivated: (user: User) => void;
  onOpenAuth: () => void;
}

export default function PricingModal({
  isOpen,
  onClose,
  user,
  onPlanActivated,
  onOpenAuth,
}: PricingModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<{ tier: SubscriptionTier; name: string; price: number } | null>(null);
  
  // Checkout form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'form' | 'success'>('selection');
  const [transactionId, setTransactionId] = useState('');

  if (!isOpen) return null;

  // Determine card brand for visual preview
  const getCardBrand = (num: string) => {
    if (num.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(num)) return 'Mastercard';
    if (/^3[47]/.test(num)) return 'American Express';
    return 'Credit Card';
  };

  const handleSelectPlan = (tier: SubscriptionTier, name: string, basePrice: number) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const price = billingPeriod === 'annual' ? basePrice * 12 * 0.8 : basePrice; // 20% discount
    setSelectedPlan({ tier, name, price: Math.round(price) });
    setCheckoutStep('form');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format card number with spaces every 4 digits
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format MM/YY
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      setCardExpiry(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
      alert('Please fill out all card details.');
      return;
    }

    setIsProcessing(true);

    // Simulate payment gateway delay (Stripe)
    setTimeout(() => {
      if (!user || !selectedPlan) return;

      const updatedUser: User = {
        ...user,
        subscriptionTier: selectedPlan.tier,
        premiumUntil: billingPeriod === 'annual' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Save user updates
      saveCurrentUser(updatedUser);
      updateUserInList(updatedUser);

      // Save transaction record
      const transId = `ch_${Math.random().toString(36).substring(2, 11)}`;
      setTransactionId(transId);

      addPayment({
        userId: user.id,
        userEmail: user.email,
        planName: `${selectedPlan.name} ${billingPeriod === 'annual' ? 'Annual' : 'Monthly'}`,
        amount: selectedPlan.price,
        status: 'completed',
        transactionId: transId,
        cardBrand: getCardBrand(cardNumber),
        last4: cardNumber.replace(/\s/g, '').slice(-4),
      });

      setIsProcessing(false);
      setCheckoutStep('success');
      onPlanActivated(updatedUser);
    }, 2000);
  };

  const resetCheckout = () => {
    setSelectedPlan(null);
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
    setCheckoutStep('selection');
  };

  const plans = [
    {
      tier: 'free' as SubscriptionTier,
      name: 'Free Basic',
      price: 0,
      description: 'Ideal for occasional document processing needs.',
      features: [
        '3 free document actions per day',
        'Up to 10 MB maximum file size limit',
        'Direct browser conversions (WASM)',
        'Standard processing queues',
        'Client-side secure execution',
      ],
      cta: 'Current Plan',
      popular: false,
    },
    {
      tier: 'pro' as SubscriptionTier,
      name: 'Pro Member',
      price: 9, // monthly price
      description: 'Perfect for professional designers, developers & creators.',
      features: [
        'Unlimited document & image actions',
        'Up to 150 MB maximum file size limit',
        'High-fidelity PDF to Word converter',
        'Custom layout split & smart compiler',
        'Priority high-speed WASM compiler',
        'Premium customer support (24h)',
      ],
      cta: 'Upgrade to Pro',
      popular: true,
    },
    {
      tier: 'team' as SubscriptionTier,
      name: 'Team Hub',
      price: 25, // monthly price
      description: 'Best for agencies, firms, and multi-member workspaces.',
      features: [
        'Everything included in Pro tier',
        'Access to full Admin Analytics dashboard',
        'Up to 5 team workspace accounts',
        'Bulk file processors (up to 50 concurrent)',
        'Custom format exports',
        'Dedicated account manager',
      ],
      cta: 'Start Team Plan',
      popular: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" id="pricing-modal-overlay">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-50 shadow-2xl border border-slate-200/80 overflow-hidden" id="pricing-modal-content">
        
        {/* Selection View */}
        {checkoutStep === 'selection' && (
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500" /> Professional SaaS Access
                </span>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mt-2">
                  Flexible plans, total privacy
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  All processed documents remain on your device. Secure, lightning fast, and reliable.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                id="close-pricing-modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="flex justify-center mt-8">
              <div className="relative flex items-center rounded-xl bg-slate-200/60 p-1">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                    billingPeriod === 'monthly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  id="toggle-monthly"
                >
                  Monthly billing
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`relative flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                    billingPeriod === 'annual'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  id="toggle-annual"
                >
                  Annual billing
                  <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                    SAVE 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {plans.map((plan) => {
                const isCurrent = user?.subscriptionTier === plan.tier;
                const displayPrice = billingPeriod === 'annual' ? plan.price * 12 * 0.8 : plan.price;
                const formattedPrice = plan.price === 0 ? '$0' : `$${Math.round(displayPrice)}`;

                return (
                  <div
                    key={plan.tier}
                    className={`relative flex flex-col justify-between rounded-2xl p-6 bg-white border transition ${
                      plan.popular
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                        : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                    }`}
                    id={`plan-card-${plan.tier}`}
                  >
                    {plan.popular && (
                      <span className="absolute top-0 -translate-y-1/2 left-6 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                        MOST POPULAR
                      </span>
                    )}

                    <div className="text-left">
                      <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>
                      
                      <div className="flex items-baseline mt-4 mb-5">
                        <span className="text-3xl font-extrabold text-slate-950">{formattedPrice}</span>
                        {plan.price > 0 && (
                          <span className="text-xs text-slate-500 font-medium ml-1">
                            /{billingPeriod === 'annual' ? 'yr' : 'mo'}
                          </span>
                        )}
                      </div>

                      <div className="border-t border-slate-100 my-4" />

                      <ul className="space-y-3">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                            <Check className="h-4 w-4 shrink-0 text-emerald-500 font-bold mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      {isCurrent ? (
                        <div className="w-full text-center rounded-xl bg-slate-50 border border-slate-200 py-3 text-xs font-semibold text-slate-500">
                          Active Current Plan
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan(plan.tier, plan.name, plan.price)}
                          disabled={plan.price === 0}
                          className={`w-full rounded-xl py-3 text-xs font-bold transition shadow-xs ${
                            plan.price === 0
                              ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed'
                              : plan.popular
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'
                          }`}
                          id={`plan-cta-${plan.tier}`}
                        >
                          {plan.cta}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Form View */}
        {checkoutStep === 'form' && selectedPlan && (
          <div className="grid grid-cols-1 md:grid-cols-12 max-h-[90vh]">
            {/* Left summary column */}
            <div className="md:col-span-5 bg-slate-900 text-white p-6 md:p-8 flex flex-col justify-between">
              <div className="text-left">
                <button
                  onClick={resetCheckout}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-6 font-medium transition"
                  id="checkout-back-btn"
                >
                  ← Back to Plans
                </button>
                <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold font-mono">
                  Your Order
                </span>
                <h4 className="text-2xl font-bold tracking-tight text-white mt-1">
                  {selectedPlan.name}
                </h4>
                <p className="text-sm text-slate-400 mt-1">
                  Billing: {billingPeriod === 'annual' ? 'Annual (20% Off)' : 'Monthly'}
                </p>

                <div className="border-t border-slate-800 my-6" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subscription Item</span>
                    <span>1x {selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Billing Term</span>
                    <span>{billingPeriod === 'annual' ? '12 Months' : '1 Month'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-3 border-t border-slate-800/60">
                    <span>Total Due Now</span>
                    <span className="text-indigo-400">${selectedPlan.price}.00</span>
                  </div>
                </div>
              </div>

              <div className="text-left text-xs text-slate-500 border-t border-slate-800 pt-6 mt-6">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                  <Shield className="h-4 w-4 text-emerald-400" /> Encrypted Connection
                </div>
                Payments processed locally using strict secure sandbox modules. No live funds are traded.
              </div>
            </div>

            {/* Right card form column */}
            <div className="md:col-span-7 bg-white p-6 md:p-8 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                id="close-checkout"
              >
                <X className="h-5 w-5" />
              </button>

              <h4 className="text-xl font-bold text-slate-900 text-left mb-2">Simulated Sandbox Payment</h4>
              <p className="text-xs text-slate-500 text-left mb-6">
                Enter any dummy card data to complete activation. (Use Visa card <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-bold font-mono">4242 4242...</code> for realistic success).
              </p>

              {/* Stripe simulated payment form */}
              <form onSubmit={handlePay} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Sarah Jenkins"
                    id="cc-name-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      placeholder="4242 4242 4242 4242"
                      id="cc-number-input"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    {cardNumber.length > 0 && (
                      <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        {getCardBrand(cardNumber)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      placeholder="MM/YY"
                      id="cc-expiry-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      CVV / Code
                    </label>
                    <input
                      type="password"
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      placeholder="123"
                      id="cc-cvv-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-slate-950 flex items-center justify-center gap-2 mt-4"
                  id="pay-submit-btn"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      Contacting simulated Stripe...
                    </>
                  ) : (
                    <>
                      Pay ${selectedPlan.price}.00 Securely
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Success / Receipt View */}
        {checkoutStep === 'success' && selectedPlan && (
          <div className="p-8 max-w-md mx-auto text-center" id="checkout-success-view">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-sm border border-emerald-200/50">
              <Check className="h-7 w-7" />
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              Payment Complete
            </span>

            <h3 className="text-xl font-bold text-slate-900 mt-3">License Activated!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your account has been instantly upgraded to <span className="font-semibold">{selectedPlan.name}</span>.
            </p>

            {/* Simulated PDF / Receipt bill */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mt-6 text-left space-y-2.5 shadow-xs font-mono text-xs">
              <div className="flex justify-between font-bold text-slate-800">
                <span>RECEIPT: PDFSwift Ltd.</span>
                <span className="text-slate-400">#RECEIPT-9922</span>
              </div>
              <div className="border-t border-dashed border-slate-200 my-2" />
              <div className="flex justify-between text-slate-600">
                <span>Tier:</span>
                <span className="font-semibold text-slate-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Charged:</span>
                <span className="font-semibold text-slate-900">${selectedPlan.price}.00</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transaction ID:</span>
                <span className="text-slate-500">{transactionId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status:</span>
                <span className="text-emerald-600 font-bold">PAID SECURE</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition mt-6"
              id="success-done-btn"
            >
              Start Using Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

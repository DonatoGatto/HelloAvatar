'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { billingApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { CreditCard, Zap, FileText, ExternalLink, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PLANS = [
  {
    id: 'FREE', name: 'Free', price: '$0', credits: 20,
    features: ['20 starter credits', '5 videos/month', 'Stock avatars', 'Embed widget'],
    cta: 'Current', disabled: true,
  },
  {
    id: 'STARTER', name: 'Starter', price: '$49/mo', credits: 100,
    features: ['100 credits/month', 'All stock avatars', '1 custom avatar', 'Live chat widget', 'API access'],
    cta: 'Upgrade to Starter', popular: true,
  },
  {
    id: 'PRO', name: 'Pro', price: '$149/mo', credits: 500,
    features: ['500 credits/month', 'Unlimited avatars', 'Priority processing', 'White-label', 'Dedicated support'],
    cta: 'Upgrade to Pro',
  },
];

export default function BillingPage() {
  const { workspace } = useAuthStore();

  const { data: plan } = useQuery({ queryKey: ['billing-plan'], queryFn: billingApi.getPlan });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: billingApi.getInvoices });

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => billingApi.createCheckout({
      plan: planId,
      successUrl: `${window.location.origin}/dashboard/billing?success=true`,
      cancelUrl: `${window.location.origin}/dashboard/billing`,
    }),
    onSuccess: (data) => { window.location.href = data.url; },
  });

  const portalMutation = useMutation({
    mutationFn: () => billingApi.createPortal({ returnUrl: window.location.href }),
    onSuccess: (data) => { window.location.href = data.url; },
  });

  const currentPlan = workspace?.plan || 'FREE';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and credits</p>
      </div>

      {/* Current status */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{workspace?.credits ?? 0}</div>
            <div className="text-sm text-gray-500">Credits remaining</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{currentPlan}</div>
            <div className="text-sm text-gray-500">Current plan</div>
          </div>
        </div>
        {currentPlan !== 'FREE' && (
          <div className="card p-5 flex items-center gap-4">
            <button onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}
              className="btn-secondary w-full gap-2 justify-center">
              <CreditCard className="w-4 h-4" />
              {portalMutation.isPending ? 'Opening...' : 'Manage subscription'}
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Pricing cards */}
      <h2 className="font-semibold text-gray-900 mb-4">Plans</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {PLANS.map((p) => {
          const isCurrent = currentPlan === p.id;
          return (
            <div key={p.id} className={`card p-5 ${p.popular ? 'ring-2 ring-brand-500' : ''} ${isCurrent ? 'bg-gray-50' : ''}`}>
              {p.popular && (
                <div className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">Most Popular</div>
              )}
              <div className="font-bold text-lg text-gray-900">{p.name}</div>
              <div className="text-2xl font-black text-gray-900 mt-1 mb-1">{p.price}</div>
              <div className="text-sm text-gray-500 mb-4">{p.credits} credits/mo</div>
              <ul className="space-y-2 mb-5">
                {p.features.map((f, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isCurrent ? 'bg-gray-200 text-gray-500 cursor-default' :
                  p.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={isCurrent || p.disabled || checkoutMutation.isPending}
                onClick={() => !isCurrent && !p.disabled && checkoutMutation.mutate(p.id)}
              >
                {isCurrent ? 'Current plan' : checkoutMutation.isPending ? 'Loading...' : p.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Credit pricing */}
      <div className="card p-5 mb-8 bg-brand-50 border-brand-200">
        <h3 className="font-semibold text-brand-900 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Credit usage
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm text-brand-700">
          <div className="flex justify-between items-center bg-white rounded-lg px-4 py-2.5">
            <span>1 min video</span><span className="font-bold">1 credit</span>
          </div>
          <div className="flex justify-between items-center bg-white rounded-lg px-4 py-2.5">
            <span>1 min live chat</span><span className="font-bold">1 credit</span>
          </div>
        </div>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Invoice history
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium">${(inv.amount / 100).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${inv.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.hostedUrl && (
                        <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer"
                          className="text-brand-600 hover:underline text-xs flex items-center gap-1 justify-end">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

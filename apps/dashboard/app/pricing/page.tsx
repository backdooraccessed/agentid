import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Check,
  X,
  Zap,
  Building2,
  Rocket,
  ArrowRight,
  Shield,
  Activity,
  Users,
  Headphones,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    description: 'For trying out AgentID',
    price: '$0',
    period: 'forever',
    cta: 'Get Started',
    ctaLink: '/register',
    highlight: false,
    icon: Zap,
    features: [
      { text: '3 agent credentials', included: true },
      { text: '500 verifications/month', included: true },
      { text: 'Public verification API', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Community support', included: true },
      { text: 'Domain verification', included: false },
      { text: 'Webhooks', included: false },
      { text: 'Team members', included: false },
      { text: 'Audit logs', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Pro',
    description: 'For growing teams',
    price: '$29',
    period: '/month',
    cta: 'Start Pro Trial',
    ctaLink: '/register?plan=pro',
    highlight: true,
    badge: 'Most Popular',
    icon: Rocket,
    features: [
      { text: '25 agent credentials', included: true },
      { text: '10,000 verifications/month', included: true },
      { text: 'Public verification API', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Email support', included: true },
      { text: 'Domain verification', included: true },
      { text: 'Webhooks (5)', included: true },
      { text: '5 team members', included: true },
      { text: 'Audit logs (30 days)', included: true },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Business',
    description: 'For scaling organizations',
    price: '$99',
    period: '/month',
    cta: 'Start Business Trial',
    ctaLink: '/register?plan=business',
    highlight: false,
    icon: Building2,
    features: [
      { text: '100 agent credentials', included: true },
      { text: '100,000 verifications/month', included: true },
      { text: 'Public verification API', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Domain verification', included: true },
      { text: 'Unlimited webhooks', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'Audit logs (1 year)', included: true },
      { text: 'Priority support', included: true },
    ],
  },
];

const enterpriseFeatures = [
  { icon: Shield, text: 'Custom credential limits' },
  { icon: Activity, text: 'Unlimited verifications' },
  { icon: Users, text: 'SSO/SAML integration' },
  { icon: Headphones, text: 'Dedicated support' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-black z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl">
            <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black text-sm font-bold">
              A
            </span>
            <span className="text-white">AgentID</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/docs" className="text-white/60 hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/directory" className="text-white/60 hover:text-white transition-colors">
              Directory
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/[0.04]">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-white/70" />
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/70 border border-white/10 mb-4">
            Simple, Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Start free, scale as you grow
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            All plans include our public verification API. Only pay for what you need.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={cn(
                    'relative rounded-2xl border p-8 transition-all',
                    plan.highlight
                      ? 'border-white/30 bg-white/[0.04] scale-105'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  )}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-black">
                      {plan.badge}
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      plan.highlight ? 'bg-white text-black' : 'bg-white/5'
                    )}>
                      <Icon className={cn('h-5 w-5', !plan.highlight && 'text-white/70')} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-sm text-white/50">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-white/50">{plan.period}</span>
                  </div>

                  <Link href={plan.ctaLink}>
                    <Button
                      className={cn(
                        'w-full mb-6 gap-2',
                        !plan.highlight && 'border-white/10 hover:bg-white/[0.04]'
                      )}
                      variant={plan.highlight ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-white/20 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-white/70' : 'text-white/30'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise */}
      <section className="py-16 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Need more?</h2>
            <p className="text-white/60">
              Enterprise plans for large-scale deployments
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/70 border border-white/10 mb-4">
                  Enterprise
                </span>
                <h3 className="text-2xl font-bold mb-4">
                  Custom solutions for your organization
                </h3>
                <p className="text-white/60 mb-6">
                  Get custom limits, dedicated support, SLA guarantees, and enterprise-grade features.
                </p>
                <Link href="mailto:enterprise@agentid.dev">
                  <Button size="lg" className="gap-2">
                    Contact Sales
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {enterpriseFeatures.map((feature, index) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                      <FeatureIcon className="h-5 w-5 text-white/70" />
                      <span className="text-sm font-medium text-white/80">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <FaqItem
              question="What counts as a verification?"
              answer="Each time someone calls our verification API to check one of your credentials, that counts as one verification. Batch verifications count as one verification per credential in the batch."
            />
            <FaqItem
              question="Can I upgrade or downgrade anytime?"
              answer="Yes, you can change your plan at any time. When upgrading, you'll be prorated for the remainder of the billing period. When downgrading, changes take effect at the next billing cycle."
            />
            <FaqItem
              question="What happens if I exceed my limits?"
              answer="We'll notify you when you're approaching your limits. If you exceed them, verifications will still work but you'll need to upgrade to continue issuing new credentials."
            />
            <FaqItem
              question="Is there a free trial for paid plans?"
              answer="Yes, all paid plans come with a 14-day free trial. No credit card required to start."
            />
            <FaqItem
              question="Do you offer discounts for startups or nonprofits?"
              answer="Yes! Contact us at support@agentid.dev with details about your organization and we'll work something out."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white/70" />
            </div>
          </div>
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="text-white/60">
            Start with our free plan and upgrade when you need more.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-white/40">
          <p>&copy; {new Date().getFullYear()} AgentID. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-white/10 pb-6">
      <h3 className="font-semibold mb-2 text-white">{question}</h3>
      <p className="text-white/60">{answer}</p>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
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
  Github,
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
  // Switch to light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.body.classList.add('light-theme');
    document.body.style.setProperty('background-color', '#ffffff', 'important');
    document.body.style.setProperty('background', '#ffffff', 'important');
    document.body.style.setProperty('color', '#000000', 'important');

    return () => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light-theme');
      document.body.style.removeProperty('background-color');
      document.body.style.removeProperty('background');
      document.body.style.removeProperty('color');
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-retro">
      {/* Dotted Background Pattern */}
      <div className="fixed inset-0 dot-pattern pointer-events-none" />

      {/* Header */}
      <header className="relative z-50 border-b-4 border-black bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-black flex items-center justify-center block-shadow-sm group-hover:animate-block-wiggle">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-retro font-bold text-xl uppercase tracking-tight">AgentID</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-retro text-sm uppercase tracking-wider">
            <Link href="/#features" className="hover:underline underline-offset-4 decoration-2">Features</Link>
            <Link href="/marketplace" className="hover:underline underline-offset-4 decoration-2">Marketplace</Link>
            <Link href="/docs" className="hover:underline underline-offset-4 decoration-2">Docs</Link>
            <Link href="/pricing" className="underline underline-offset-4 decoration-2">Pricing</Link>
            <Link href="https://github.com/agentid" className="hover:underline underline-offset-4 decoration-2">
              <Github className="w-5 h-5" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="font-retro font-bold text-sm uppercase px-4 py-2 hover:bg-gray-100 border-2 border-black">
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <button className="font-retro font-bold text-sm uppercase px-4 py-2 bg-black text-white btn-retro">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white block-shadow-sm mb-6">
            <CreditCard className="w-4 h-4" />
            <span className="font-retro text-sm uppercase tracking-wider">Simple Pricing</span>
          </div>
          <h1 className="font-pixel text-5xl md:text-6xl uppercase mb-4">
            Start Free, Scale Up
          </h1>
          <p className="font-retro text-lg text-gray-600 max-w-2xl mx-auto">
            All plans include our public verification API. Only pay for what you need.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={cn(
                    'relative border-4 border-black p-8 transition-all',
                    plan.highlight
                      ? 'bg-gray-50 block-shadow-lg scale-105'
                      : 'bg-white block-shadow block-hover'
                  )}
                >
                  {plan.badge && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center px-4 py-1 bg-black text-white font-retro text-xs uppercase">
                      {plan.badge}
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      'w-12 h-12 border-2 border-black flex items-center justify-center',
                      plan.highlight ? 'bg-black text-white' : 'bg-gray-100'
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-retro font-bold text-lg uppercase">{plan.name}</h3>
                      <p className="font-retro text-sm text-gray-600">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="font-pixel text-5xl">{plan.price}</span>
                    <span className="font-retro text-gray-600">{plan.period}</span>
                  </div>

                  <Link href={plan.ctaLink}>
                    <button
                      className={cn(
                        'w-full px-6 py-4 font-retro font-bold uppercase text-sm flex items-center justify-center gap-2 mb-6 border-4 border-black transition-colors',
                        plan.highlight
                          ? 'bg-black text-white btn-retro'
                          : 'bg-white text-black hover:bg-gray-100'
                      )}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 font-retro text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
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
      <section className="relative py-16 bg-gray-50 border-y-4 border-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-pixel text-4xl uppercase mb-4">Need More?</h2>
            <p className="font-retro text-gray-600">
              Enterprise plans for large-scale deployments
            </p>
          </div>

          <div className="border-4 border-black bg-white p-8 md:p-12 block-shadow">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center px-3 py-1 border-2 border-black font-retro text-xs uppercase mb-4">
                  Enterprise
                </span>
                <h3 className="font-retro font-bold text-2xl uppercase mb-4">
                  Custom Solutions for Your Organization
                </h3>
                <p className="font-retro text-gray-600 mb-6">
                  Get custom limits, dedicated support, SLA guarantees, and enterprise-grade features.
                </p>
                <Link href="mailto:enterprise@agentid.dev">
                  <button className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-retro font-bold uppercase btn-retro">
                    Contact Sales
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {enterpriseFeatures.map((feature, index) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-4 border-2 border-black bg-gray-50">
                      <FeatureIcon className="h-5 w-5" />
                      <span className="font-retro text-sm">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-pixel text-3xl uppercase text-center mb-12">FAQ</h2>

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
      <section className="relative py-16 bg-gray-50 border-t-4 border-black">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="font-pixel text-4xl uppercase">Ready to Get Started?</h2>
          <p className="font-retro text-gray-600">
            Start with our free plan and upgrade when you need more.
          </p>
          <Link href="/register">
            <button className="inline-flex items-center gap-2 px-10 py-5 bg-black text-white font-retro font-bold text-lg uppercase btn-retro">
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t-4 border-black py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-retro font-bold uppercase">AgentID</span>
              </div>
              <p className="font-retro text-sm text-gray-600">
                Trust infrastructure for autonomous AI agents.
              </p>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Product</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><Link href="/docs" className="hover:underline">Documentation</Link></li>
                <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
                <li><Link href="/marketplace" className="hover:underline">Marketplace</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Company</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><Link href="/terms" className="hover:underline">Terms</Link></li>
                <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Connect</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><a href="https://github.com/agentid" className="hover:underline">GitHub</a></li>
                <li><a href="https://twitter.com/agentid" className="hover:underline">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t-2 border-black text-center font-retro text-sm text-gray-600">
            <span className="font-pixel">&copy; 2024 AgentID</span> — Identity for autonomous AI agents
          </div>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b-2 border-black pb-6">
      <h3 className="font-retro font-bold uppercase mb-2">{question}</h3>
      <p className="font-retro text-gray-600">{answer}</p>
    </div>
  );
}

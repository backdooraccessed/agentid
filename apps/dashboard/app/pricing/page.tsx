import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold">
              A
            </span>
            AgentID
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/directory" className="text-muted-foreground hover:text-foreground transition-colors">
              Directory
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
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
          <Badge variant="secondary" className="mb-4">Simple, Transparent Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Start free, scale as you grow
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            All plans include our public verification API. Only pay for what you need.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border ${
                    plan.highlight
                      ? 'border-primary shadow-lg shadow-primary/10 scale-105'
                      : 'border-border'
                  } bg-background p-8`}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {plan.badge}
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.highlight ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>

                  <Link href={plan.ctaLink}>
                    <Button
                      className="w-full mb-6"
                      variant={plan.highlight ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground'}>
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
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Need more?</h2>
            <p className="text-muted-foreground">
              Enterprise plans for large-scale deployments
            </p>
          </div>

          <div className="bg-background rounded-2xl border p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="secondary" className="mb-4">Enterprise</Badge>
                <h3 className="text-2xl font-bold mb-4">
                  Custom solutions for your organization
                </h3>
                <p className="text-muted-foreground mb-6">
                  Get custom limits, dedicated support, SLA guarantees, and enterprise-grade features.
                </p>
                <Link href="mailto:enterprise@agentid.dev">
                  <Button size="lg">
                    Contact Sales
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {enterpriseFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{feature.text}</span>
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
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
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
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AgentID. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b pb-6">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}

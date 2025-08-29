import { Suspense } from "react";
import Link from "next/link";
import PricingCard from "@/components/pricing-card";
import { PricingCardSkeleton } from "@/components/skeletons";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month" as const,
    description: "Perfect for trying out Radar",
    features: [
      { text: "3 radars per month", included: true },
      { text: "10 opinions per radar", included: true },
      { text: "1 refresh per day", included: true },
      { text: "Basic analytics", included: true },
      { text: "Community support", included: true },
      { text: "API access", included: false },
      { text: "Priority support", included: false },
      { text: "Custom integrations", included: false },
      { text: "Team collaboration", included: false },
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    interval: "month" as const,
    description: "For power users and professionals",
    features: [
      { text: "Unlimited radars", included: true },
      { text: "50 opinions per radar", included: true },
      { text: "10 refreshes per day", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Priority support", included: true },
      { text: "API access", included: true },
      { text: "Export data", included: true },
      { text: "Custom integrations", included: false },
      { text: "Up to 3 team members", included: true },
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    interval: "month" as const,
    description: "For teams and organizations",
    features: [
      { text: "Unlimited everything", included: true },
      { text: "Unlimited opinions", included: true },
      { text: "Unlimited refreshes", included: true },
      { text: "Custom analytics", included: true },
      { text: "24/7 dedicated support", included: true },
      { text: "Full API access", included: true },
      { text: "White-label options", included: true },
      { text: "Custom integrations", included: true },
      { text: "Unlimited team members", included: true },
    ],
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="container-wide py-8">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="heading-primary mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-muted max-w-2xl mx-auto">
          Choose the plan that fits your needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
          <button className="px-6 py-2 rounded-md bg-white dark:bg-stone-900 shadow-sm font-medium text-sm transition-all duration-300">
            Monthly
          </button>
          <button className="px-6 py-2 rounded-md text-muted text-sm hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            Yearly
            <span className="ml-1 text-green-600 dark:text-green-400 text-xs">(Save 20%)</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-3 mb-16">
        <Suspense fallback={
          <>
            <PricingCardSkeleton />
            <PricingCardSkeleton />
            <PricingCardSkeleton />
          </>
        }>
          {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </Suspense>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="heading-secondary text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          <div className="card-minimal">
            <h3 className="text-lg font-medium mb-2">What happens when I reach my radar limit?</h3>
            <p className="text-muted">
              When you reach your monthly radar limit, you'll need to wait until the next billing cycle or upgrade your plan to create more radars. Your existing radars will continue to work normally.
            </p>
          </div>

          <div className="card-minimal">
            <h3 className="text-lg font-medium mb-2">Can I change my plan anytime?</h3>
            <p className="text-muted">
              Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll have immediate access to new features. When downgrading, changes take effect at the next billing cycle.
            </p>
          </div>

          <div className="card-minimal">
            <h3 className="text-lg font-medium mb-2">What payment methods do you accept?</h3>
            <p className="text-muted">
              We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. Enterprise customers can also pay by invoice.
            </p>
          </div>

          <div className="card-minimal">
            <h3 className="text-lg font-medium mb-2">Is there a free trial for Pro features?</h3>
            <p className="text-muted">
              Yes! You can try Pro features free for 14 days. No credit card required. After the trial, you'll automatically return to the Free plan unless you choose to upgrade.
            </p>
          </div>

          <div className="card-minimal">
            <h3 className="text-lg font-medium mb-2">Do you offer educational discounts?</h3>
            <p className="text-muted">
              Yes, we offer 50% off Pro plans for students and educators with a valid .edu email address. Contact our support team to get your discount applied.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center mt-16 py-12 border-t divider-light">
        <h3 className="text-2xl font-bold mb-4">
          Still have questions?
        </h3>
        <p className="text-muted mb-6">
          Our team is here to help you choose the right plan.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/contact" className="button-secondary">
            Contact Sales
          </Link>
          <Link href="/docs/pricing" className="button-secondary">
            View Documentation
          </Link>
        </div>
      </div>
    </div>
  );
}
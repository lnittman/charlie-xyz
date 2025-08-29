"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { useSubscription, useUpgradeSubscription } from "@/hooks/use-subscription";
import { Spinner } from "@repo/design/components/spinner";

interface PricingCardProps {
  plan: {
    id: string;
    name: string;
    price: number;
    interval: "month" | "year";
    description: string;
    features: Array<{
      text: string;
      included: boolean;
    }>;
    popular: boolean;
  };
}

export default function PricingCard({ plan }: PricingCardProps) {
  const router = useRouter();
  const { subscription, isLoading } = useSubscription();
  const { upgrade, isUpgrading } = useUpgradeSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const isCurrentPlan = subscription?.plan === plan.id;
  const canUpgrade = !isCurrentPlan && (
    (plan.id === "pro" && subscription?.plan === "free") ||
    (plan.id === "enterprise" && subscription?.plan !== "enterprise")
  );

  const handleSelectPlan = async () => {
    if (isCurrentPlan || isProcessing) return;

    setIsProcessing(true);
    try {
      if (plan.id === "free") {
        // Downgrade handled differently
        router.push("/dashboard?downgrade=true");
      } else {
        // Upgrade flow
        await upgrade({ planId: plan.id });
      }
    } catch (error) {
      console.error("Error selecting plan:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`card-minimal relative h-full flex flex-col ${plan.popular ? 'ring-2 ring-stone-900 dark:ring-stone-50' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-stone-900 dark:bg-stone-50 text-stone-50 dark:text-stone-900 text-sm font-medium rounded-full">
          Most Popular
        </div>
      )}
      
      <div className="text-center pb-6">
        <h3 className="text-2xl font-medium mb-2">{plan.name}</h3>
        <p className="text-muted mb-4">{plan.description}</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">
            {plan.price === 0 ? 'Free' : `$${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span className="text-muted">/{plan.interval}</span>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              {feature.included ? (
                <Check className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 mt-0.5 text-stone-300 dark:text-stone-700 flex-shrink-0" />
              )}
              <span className={`text-sm ${
                feature.included 
                  ? '' 
                  : 'text-muted line-through'
              }`}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
        
        <button
          className={`w-full flex items-center justify-center gap-2 ${
            isCurrentPlan 
              ? 'button-secondary cursor-default' 
              : plan.popular 
                ? 'button-primary' 
                : 'button-secondary'
          }`}
          disabled={isCurrentPlan || isProcessing || isLoading}
          onClick={handleSelectPlan}
        >
          {isProcessing || isUpgrading ? (
            <>
              <Spinner variant="dots" size="sm" />
              <span>Processing...</span>
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : canUpgrade ? (
            'Upgrade'
          ) : plan.id === "free" ? (
            'Downgrade'
          ) : (
            'Get Started'
          )}
        </button>
        
        {plan.id === "enterprise" && (
          <p className="text-center text-sm text-muted mt-4">
            Or <a href="/contact" className="link-subtle">contact sales</a> for custom pricing
          </p>
        )}
      </div>
    </div>
  );
}
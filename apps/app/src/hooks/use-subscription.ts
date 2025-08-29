import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  features: SubscriptionFeatures;
  usage: SubscriptionUsage;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFeatures {
  maxRadars: number;
  maxOpinionsPerRadar: number;
  maxRefreshesPerDay: number;
  advancedAnalytics: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
  teamMembers: number;
}

export interface SubscriptionUsage {
  radarsCreated: number;
  refreshesUsedToday: number;
  apiCallsThisMonth: number;
  storageUsedMB: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: SubscriptionFeatures;
  popular: boolean;
}

export interface UpgradeSubscriptionInput {
  planId: string;
  paymentMethodId?: string;
}

// Fetcher functions
const upgradeSubscription = async (url: string, { arg }: { arg: UpgradeSubscriptionInput }) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  if (!response.ok) throw new Error('Failed to upgrade subscription');
  return response.json();
};

const cancelSubscription = async (url: string) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancelAtPeriodEnd: true }),
  });
  if (!response.ok) throw new Error('Failed to cancel subscription');
  return response.json();
};

// Hook to get current subscription
export function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR<Subscription>(
    '/api/subscription',
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  const isFreePlan = data?.plan === 'free';
  const isProPlan = data?.plan === 'pro';
  const isEnterprisePlan = data?.plan === 'enterprise';
  const canCreateRadar = !data || data.usage.radarsCreated < data.features.maxRadars;
  const canRefresh = !data || data.usage.refreshesUsedToday < data.features.maxRefreshesPerDay;

  return {
    subscription: data,
    isLoading,
    isError: error,
    isFreePlan,
    isProPlan,
    isEnterprisePlan,
    canCreateRadar,
    canRefresh,
    mutate,
  };
}

// Hook to get available pricing plans
export function usePricingPlans() {
  const { data, error, isLoading } = useSWR<PricingPlan[]>(
    '/api/subscription/plans',
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    plans: data || [],
    isLoading,
    isError: error,
  };
}

// Hook to upgrade subscription
export function useUpgradeSubscription() {
  const { trigger, isMutating } = useSWRMutation(
    '/api/subscription/upgrade',
    upgradeSubscription
  );

  return {
    upgrade: trigger,
    isUpgrading: isMutating,
  };
}

// Hook to cancel subscription
export function useCancelSubscription() {
  const { trigger, isMutating } = useSWRMutation(
    '/api/subscription/cancel',
    cancelSubscription
  );

  return {
    cancel: trigger,
    isCanceling: isMutating,
  };
}

// Hook to get billing history
export function useBillingHistory() {
  const { data, error, isLoading } = useSWR<{
    invoices: {
      id: string;
      amount: number;
      currency: string;
      status: 'paid' | 'pending' | 'failed';
      date: string;
      downloadUrl: string;
    }[];
  }>(
    '/api/subscription/billing-history',
    {
      revalidateOnFocus: false,
    }
  );

  return {
    invoices: data?.invoices || [],
    isLoading,
    isError: error,
  };
}

// Hook to check feature availability
export function useFeatureAccess(feature: keyof SubscriptionFeatures) {
  const { subscription, isLoading } = useSubscription();

  const hasAccess = subscription ? subscription.features[feature] : false;
  const isLimited = typeof subscription?.features[feature] === 'number';
  const limit = isLimited ? subscription?.features[feature] as number : null;
  const usage = isLimited && subscription?.usage ? 
    (feature === 'maxRadars' ? subscription.usage.radarsCreated :
     feature === 'maxRefreshesPerDay' ? subscription.usage.refreshesUsedToday :
     0) : 0;
  const remaining = limit ? limit - usage : null;

  return {
    hasAccess,
    isLimited,
    limit,
    usage,
    remaining,
    isLoading,
  };
}
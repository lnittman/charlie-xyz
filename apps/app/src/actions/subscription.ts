'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface UpgradeSubscriptionData {
  planId: string;
  paymentMethodId?: string;
}

export interface UpdatePaymentMethodData {
  paymentMethodId: string;
}

// Server action to upgrade subscription
export async function upgradeSubscription(data: UpgradeSubscriptionData) {
  const { planId, paymentMethodId } = data;

  if (!planId) {
    throw new Error('Plan ID is required');
  }

  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here
      },
      body: JSON.stringify({
        planId,
        paymentMethodId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upgrade subscription');
    }

    const result = await response.json();
    
    revalidatePath('/dashboard');
    revalidatePath('/pricing');
    
    // Redirect to success page or dashboard
    redirect('/dashboard?upgraded=true');
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw new Error('Failed to upgrade subscription. Please try again.');
  }
}

// Server action to cancel subscription
export async function cancelSubscription() {
  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here
      },
      body: JSON.stringify({
        cancelAtPeriodEnd: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    const result = await response.json();
    
    revalidatePath('/dashboard');
    revalidatePath('/pricing');
    
    return { success: true, cancelDate: result.currentPeriodEnd };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription. Please try again.');
  }
}

// Server action to reactivate subscription
export async function reactivateSubscription() {
  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/reactivate`, {
      method: 'POST',
      headers: {
        // Add auth headers here
      },
    });

    if (!response.ok) {
      throw new Error('Failed to reactivate subscription');
    }

    revalidatePath('/dashboard');
    revalidatePath('/pricing');
    
    return { success: true };
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw new Error('Failed to reactivate subscription. Please try again.');
  }
}

// Server action to update payment method
export async function updatePaymentMethod(data: UpdatePaymentMethodData) {
  const { paymentMethodId } = data;

  if (!paymentMethodId) {
    throw new Error('Payment method ID is required');
  }

  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/payment-method`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here
      },
      body: JSON.stringify({
        paymentMethodId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update payment method');
    }

    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw new Error('Failed to update payment method. Please try again.');
  }
}

// Server action to download invoice
export async function downloadInvoice(invoiceId: string) {
  if (!invoiceId) {
    throw new Error('Invoice ID is required');
  }

  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/invoices/${invoiceId}/download`, {
      headers: {
        // Add auth headers here
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    return { success: true, downloadUrl: url };
  } catch (error) {
    console.error('Error downloading invoice:', error);
    throw new Error('Failed to download invoice. Please try again.');
  }
}

// Server action to apply promo code
export async function applyPromoCode(promoCode: string) {
  if (!promoCode) {
    throw new Error('Promo code is required');
  }

  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/promo-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here
      },
      body: JSON.stringify({
        code: promoCode.trim().toUpperCase(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid promo code');
    }

    const result = await response.json();
    
    revalidatePath('/pricing');
    
    return { 
      success: true, 
      discount: result.discount,
      description: result.description 
    };
  } catch (error) {
    console.error('Error applying promo code:', error);
    throw new Error('Failed to apply promo code. Please check the code and try again.');
  }
}
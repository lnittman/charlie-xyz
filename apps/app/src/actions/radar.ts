'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface CreateRadarData {
  topic: string;
  initialPosition?: 'neutral' | 'for' | 'against';
}

export interface UpdateRadarData {
  id: string;
  position?: 'neutral' | 'for' | 'against';
  confidence?: number;
}

// Server action to create a new radar
export async function createRadar(formData: FormData) {
  const topic = formData.get('topic') as string;
  const position = formData.get('position') as 'neutral' | 'for' | 'against' | null;

  if (!topic || topic.trim().length < 3) {
    throw new Error('Topic must be at least 3 characters long');
  }

  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/radars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here
      },
      body: JSON.stringify({
        topic: topic.trim(),
        initialPosition: position || 'neutral',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create radar');
    }

    const radar = await response.json();
    
    revalidatePath('/dashboard');
    revalidatePath('/radar');
    
    redirect(`/radar/${radar.id}`);
  } catch (error) {
    console.error('Error creating radar:', error);
    throw new Error('Failed to create radar. Please try again.');
  }
}

// Server action to update a radar
export async function updateRadar(data: UpdateRadarData) {
  const { id, position, confidence } = data;

  if (!id) {
    throw new Error('Radar ID is required');
  }

  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/radars/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here
      },
      body: JSON.stringify({
        position,
        confidence,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update radar');
    }

    revalidatePath(`/radar/${id}`);
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating radar:', error);
    throw new Error('Failed to update radar. Please try again.');
  }
}

// Server action to delete a radar
export async function deleteRadar(radarId: string) {
  if (!radarId) {
    throw new Error('Radar ID is required');
  }

  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/radars/${radarId}`, {
      method: 'DELETE',
      headers: {
        // Add auth headers here
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete radar');
    }

    revalidatePath('/dashboard');
    revalidatePath('/radar');
    
    redirect('/dashboard');
  } catch (error) {
    console.error('Error deleting radar:', error);
    throw new Error('Failed to delete radar. Please try again.');
  }
}

// Server action to refresh radar opinions
export async function refreshRadar(radarId: string) {
  if (!radarId) {
    throw new Error('Radar ID is required');
  }

  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/radars/${radarId}/refresh`, {
      method: 'POST',
      headers: {
        // Add auth headers here
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh radar');
    }

    const result = await response.json();
    
    revalidatePath(`/radar/${radarId}`);
    
    return result;
  } catch (error) {
    console.error('Error refreshing radar:', error);
    throw new Error('Failed to refresh radar. Please try again.');
  }
}

// Server action to bulk delete radars
export async function bulkDeleteRadars(radarIds: string[]) {
  if (!radarIds || radarIds.length === 0) {
    throw new Error('At least one radar ID is required');
  }

  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/radars/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here
      },
      body: JSON.stringify({ ids: radarIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete radars');
    }

    revalidatePath('/dashboard');
    revalidatePath('/radar');
    
    return { success: true, deletedCount: radarIds.length };
  } catch (error) {
    console.error('Error deleting radars:', error);
    throw new Error('Failed to delete radars. Please try again.');
  }
}
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/backend";
import type { Id } from "@repo/backend/convex/_generated/dataModel";

// Types
export interface CreateRadarInput {
  query: string;
  description?: string;
  category?: string;
  pollInterval?: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL";
  isPublic?: boolean;
  notifications?: boolean;
}

// Define the Radar type based on the schema
export type Radar = {
  _id: Id<"radars">;
  _creationTime: number;
  userId: Id<"users">;
  query: string;
  category?: string;
  description?: string;
  pollInterval: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL";
  notifications: boolean;
  isPublic: boolean;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  lastPolledAt?: number;
  nextPollAt?: number;
  metadata?: any;
};

// Hook to get user's radars
export function useRadarList(status?: "ACTIVE" | "PAUSED" | "ARCHIVED") {
  const radars = useQuery(api.functions.mutations.radars.list, { status });

  return {
    radars: radars || [],
    isLoading: radars === undefined,
  };
}

// Hook to get a single radar
export function useRadar(radarId: Id<"radars"> | null) {
  const radar = useQuery(
    api.functions.mutations.radars.get,
    radarId ? { id: radarId } : "skip"
  );

  return {
    radar,
    isLoading: radar === undefined && radarId !== null,
  };
}

// Hook to create a new radar
export function useCreateRadar() {
  const createRadar = useMutation(api.functions.mutations.radars.create);

  return {
    createRadar,
    // Mutations are always synchronous in Convex
    isCreating: false,
  };
}

// Hook to update a radar
export function useUpdateRadar() {
  const updateRadar = useMutation(api.functions.mutations.radars.update);

  return {
    updateRadar,
    isUpdating: false,
  };
}

// Hook to delete a radar
export function useDeleteRadar() {
  const deleteRadar = useMutation(api.functions.mutations.radars.remove);

  return {
    deleteRadar,
    isDeleting: false,
  };
}

// Hook to trigger manual refresh
export function useRefreshRadar() {
  const refreshRadar = useMutation(api.functions.mutations.radars.triggerRefresh);

  return {
    refreshRadar,
    isRefreshing: false,
  };
}

// Hook to get radar runs (workflow runs)
export function useRadarRuns(radarId: Id<"radars"> | null, limit?: number) {
  const runs = useQuery(
    api.functions.mutations.radars.getRuns,
    radarId ? { radarId, limit } : "skip"
  );

  return {
    runs: runs || [],
    isLoading: runs === undefined && radarId !== null,
  };
}

// Hook to get ping history
export function useRadarPings(radarId: Id<"radars"> | null, limit?: number) {
  const pings = useQuery(
    api.functions.mutations.radars.getPings,
    radarId ? { radarId, limit } : "skip"
  );

  return {
    pings: pings || [],
    isLoading: pings === undefined && radarId !== null,
  };
}

// Hook for current user
export function useCurrentUser() {
  const user = useQuery(api.functions.queries.users.getCurrentUser);

  return {
    user,
    isLoading: user === undefined,
  };
}

// Hook for user preferences
export function useUserPreferences() {
  const updatePreferences = useMutation(api.functions.queries.users.updatePreferences);

  return {
    updatePreferences,
  };
}

// Hook for user interests
export function useUserInterests() {
  const updateInterests = useMutation(api.functions.queries.users.updateInterests);

  return {
    updateInterests,
  };
}

// Hook for onboarding
export function useOnboarding() {
  const completeOnboarding = useMutation(api.functions.queries.users.completeOnboarding);

  return {
    completeOnboarding,
  };
}
// Segment configuration
export const dynamic = 'force-dynamic'; // Auth required
export const revalidate = 30; // Cache for 30 seconds

import Header from "@/components/header";
import { OnboardingProvider } from "@/components/onboarding-provider";
import { ClientLayout } from "@/components/client-layout";
import { SWRProvider } from "@/components/swr-provider";
import { auth } from "@repo/auth/server";
import { currentUser } from "@clerk/nextjs/server";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // Authentication check only - data fetching happens in client components
  let fallback: Record<string, any> = {};
  let hasCompletedOnboarding = false;
  let isNewUser = false;
  
  if (session?.userId) {
    try {
      // Get Clerk user data for initial onboarding check
      const clerkUser = await currentUser();
      if (clerkUser) {
        // Simple new user check based on Clerk creation time
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const userCreatedAt = new Date(clerkUser.createdAt);
        isNewUser = userCreatedAt > fiveMinutesAgo;
        
        // The actual user data and radars will be fetched by Convex hooks in client components
      }
    } catch (error) {
      console.error("Error in authenticated layout:", error);
      // Don't crash the whole app if user sync fails
      // The client-side will handle showing appropriate error UI
    }
  }

  return (
    <ClientLayout>
      <SWRProvider fallback={fallback}>
        <div className="min-h-screen">
          <Header />
          <OnboardingProvider 
            hasCompletedOnboarding={hasCompletedOnboarding}
            isNewUser={isNewUser}
          >
            <main>
              {children}
            </main>
          </OnboardingProvider>
        </div>
      </SWRProvider>
    </ClientLayout>
  );
}
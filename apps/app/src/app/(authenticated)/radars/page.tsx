export const revalidate = 30; // Cache page for 30 seconds

import localFont from 'next/font/local';
import { redirect } from "next/navigation";
import { auth } from "@repo/auth/server";

import { RadarsListWrapper } from "@/components/radars-list-wrapper";
import { PageTransition } from "@/components/page-transition";

const brett = localFont({
  src: '../../../../public/fonts/brett/BrettTrial-Regular.otf',
  display: 'swap',
  variable: '--font-brett',
  weight: '400'
});

export default async function RadarsListPage() {
  const session = await auth();

  if (!session || !session.userId) {
    redirect("/signin");
  }

  // Fetch radars on the server
  // Data fetching happens in client components via Convex
  const radars: any[] = [];

  return (
    <PageTransition>
      <RadarsListWrapper 
        initialRadars={radars}
        userId={session.userId}
        fontClassName={brett.className}
      />
    </PageTransition>
  );
}

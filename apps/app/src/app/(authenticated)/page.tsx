export const revalidate = 60; // Cache page for 60 seconds

import { redirect } from "next/navigation";
import localFont from 'next/font/local';

import { auth } from "@repo/auth/server";

import { PageTransition } from "@/components/page-transition";
import { getSuggestions } from "@/lib/get-suggestions";
import { HomeContent } from "@/components/home-content";

const brett = localFont({
  src: '../../../public/fonts/brett/BrettTrial-Regular.otf',
  display: 'swap',
  variable: '--font-brett',
  weight: '400'
});

export default async function HomePage() {
  const session = await auth();

  if (!session || !session.userId) {
    redirect("/signin");
  }

  // Get suggestions without heavy DB queries
  const suggestions = await getSuggestions(session.userId);

  return (
    <PageTransition>
      <div className="relative h-[calc(100vh-4rem)] overflow-hidden flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-3xl mx-auto">
          <HomeContent 
            suggestions={suggestions} 
            heroFontClass={brett.className}
          />
        </div>
      </div>
    </PageTransition>
  );
}

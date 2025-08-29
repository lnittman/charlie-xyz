import { redirect } from "next/navigation";
import { auth } from "@repo/auth/server";
import { PageTransition } from "@/components/page-transition";
import { InterestsSection } from "@/components/account/interests-section";
import { getUserInterests } from "@/actions/user-preferences";
import { Card } from "@repo/design/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/design/components/tabs";
import { User, Sparkles, CreditCard, Bell } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const { interests } = await getUserInterests();

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-1">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile, preferences, and subscription
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="interests">
                <Sparkles className="w-4 h-4 mr-2" />
                Interests
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="billing">
                <CreditCard className="w-4 h-4 mr-2" />
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Profile Information</h3>
                <p className="text-sm text-muted-foreground">
                  Your profile information is managed through Clerk authentication.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="interests" className="space-y-4">
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium">Your Interests</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select topics you're interested in to get better radar suggestions
                  </p>
                </div>
                <InterestsSection initialInterests={interests} />
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Configure how and when you receive radar updates.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Billing & Subscription</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your subscription and payment methods.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}
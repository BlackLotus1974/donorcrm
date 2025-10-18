import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardOverview from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get user profile with organization
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, organization:organizations(*)')
    .eq('id', data.user.id)
    .single();

  if (!profile?.organization_id) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile.first_name}! Here's what's happening with your donors.
          </p>
        </div>
      </div>

      <DashboardOverview 
        organizationId={profile.organization_id}
        userProfile={profile}
      />
    </div>
  );
}
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default async function DonorsLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get user profile with organization
  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('id', data.user.id)
    .single();

  if (!profile?.organization_id) {
    redirect("/onboarding");
  }

  return (
    <DashboardLayout user={data.user} userProfile={profile}>
      {children}
    </DashboardLayout>
  );
}
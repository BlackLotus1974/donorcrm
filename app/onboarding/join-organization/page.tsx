import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JoinOrganizationForm from "@/components/onboarding/join-organization-form";

export default async function JoinOrganizationPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Check if user already has a profile with organization
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, organization:organizations(*)')
    .eq('id', data.user.id)
    .single();

  // If user already has an organization, redirect to dashboard
  if (profile?.organization_id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-lg w-full">
        <JoinOrganizationForm user={data.user} />
      </div>
    </div>
  );
}
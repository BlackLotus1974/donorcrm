import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DonorDetail from "@/components/donors/donor-detail";

export default async function DonorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Get donor with related data
  const { data: donor } = await supabase
    .from('donors')
    .select(`
      *,
      assigned_user:user_profiles!donors_assigned_to_fkey(
        id,
        first_name,
        last_name,
        title
      ),
      created_user:user_profiles!donors_created_by_fkey(
        id,
        first_name,
        last_name
      ),
      updated_user:user_profiles!donors_updated_by_fkey(
        id,
        first_name,
        last_name
      )
    `)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single();

  if (!donor) {
    notFound();
  }

  // Get users in organization for reassignment
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, role')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('first_name');

  return (
    <DonorDetail 
      donor={donor}
      userProfile={profile}
      availableUsers={users || []}
    />
  );
}
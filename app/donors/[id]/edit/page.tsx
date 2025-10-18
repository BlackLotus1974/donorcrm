import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DonorForm from "@/components/donors/donor-form";

export default async function EditDonorPage({
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

  // Check if user can edit donors
  const canEdit = ['user', 'manager', 'admin'].includes(profile.role);
  if (!canEdit) {
    redirect(`/donors/${id}`);
  }

  // Get donor
  const { data: donor } = await supabase
    .from('donors')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single();

  if (!donor) {
    notFound();
  }

  // Get users in organization for assignment dropdown
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, role')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('first_name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Donor</h1>
          <p className="text-gray-600 mt-1">
            Update {donor.first_name} {donor.last_name}'s information
          </p>
        </div>
      </div>

      <DonorForm 
        organizationId={profile.organization_id}
        availableUsers={users || []}
        userProfile={profile}
        donor={donor}
        mode="edit"
      />
    </div>
  );
}
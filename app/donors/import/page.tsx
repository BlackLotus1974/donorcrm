import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DonorImportWizard from "@/components/donors/donor-import-wizard";

export default async function ImportDonorsPage() {
  const supabase = await createClient();

  const { data, error} = await supabase.auth.getUser();
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

  // Check if user can import donors (manager or admin)
  const canImport = ['manager', 'admin'].includes(profile.role);
  if (!canImport) {
    redirect("/donors");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Donors</h1>
          <p className="text-gray-600 mt-1">
            Upload a CSV or Excel file to bulk import donors
          </p>
        </div>
      </div>

      <DonorImportWizard organizationId={profile.organization_id} />
    </div>
  );
}

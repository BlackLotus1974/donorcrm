import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DonorList from "@/components/donors/donor-list";

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

  // Parse search parameters
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const limit = typeof params.limit === 'string' ? parseInt(params.limit) : 20;
  const search = typeof params.search === 'string' ? params.search : '';
  const status = typeof params.status === 'string' ? params.status.split(',') : undefined;
  const giving_level = typeof params.giving_level === 'string' ? params.giving_level.split(',') : undefined;
  const assigned_to = typeof params.assigned_to === 'string' ? params.assigned_to : undefined;
  const country = typeof params.country === 'string' ? params.country.split(',') : undefined;
  const state = typeof params.state === 'string' ? params.state.split(',') : undefined;
  const city = typeof params.city === 'string' ? params.city.split(',') : undefined;
  const sort_field = typeof params.sort === 'string' ? params.sort : 'name';
  const sort_direction = typeof params.direction === 'string' && ['asc', 'desc'].includes(params.direction)
    ? params.direction as 'asc' | 'desc'
    : 'asc';

  // Check if user can create donors
  const canCreateDonor = ['user', 'manager', 'admin'].includes(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Donors</h1>
          <p className="text-gray-600 mt-1">
            Manage your organization's donor relationships
          </p>
        </div>
      </div>

      <DonorList
        organizationId={profile.organization_id}
        initialFilters={{
          search,
          status,
          giving_level,
          assigned_to,
          country,
          state,
          city,
        }}
        initialPage={page}
        initialLimit={limit}
        initialSort={{
          field: sort_field,
          direction: sort_direction,
        }}
        userProfile={profile}
        canCreateDonor={canCreateDonor}
      />
    </div>
  );
}
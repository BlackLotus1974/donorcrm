import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContextTemplateList from "@/components/context-templates/context-template-list";

export default async function ContextTemplatesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
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
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit) : 20;
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  const scenario_type = typeof searchParams.scenario_type === 'string' ? searchParams.scenario_type.split(',') : undefined;
  const complexity_level = typeof searchParams.complexity_level === 'string' ? searchParams.complexity_level.split(',') : undefined;
  const status = typeof searchParams.status === 'string' ? searchParams.status.split(',') : undefined;
  const is_template = typeof searchParams.is_template === 'string' ? searchParams.is_template === 'true' : undefined;
  const sort_field = typeof searchParams.sort === 'string' ? searchParams.sort : 'updated_at';
  const sort_direction = typeof searchParams.direction === 'string' && ['asc', 'desc'].includes(searchParams.direction)
    ? searchParams.direction as 'asc' | 'desc'
    : 'desc';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Context Templates</h1>
          <p className="text-gray-600 mt-1">
            Create and manage AI context engineering templates for your organization
          </p>
        </div>
      </div>

      <ContextTemplateList
        organizationId={profile.organization_id}
        initialFilters={{
          search,
          scenario_type,
          complexity_level,
          status,
          is_template,
        }}
        initialPage={page}
        initialLimit={limit}
        initialSort={{
          field: sort_field,
          direction: sort_direction,
        }}
        userProfile={profile}
      />
    </div>
  );
}

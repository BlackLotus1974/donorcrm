import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContextTemplateForm from "@/components/context-templates/context-template-form";
import { canPerformAction } from "@/lib/permissions";

export default async function NewTemplatePage() {
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

  // Check if user can create templates
  const canCreate = canPerformAction('create_context_template', profile.role);
  if (!canCreate) {
    redirect('/context-templates');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Template</h1>
          <p className="text-gray-600 mt-1">
            Build a new context engineering template for your organization
          </p>
        </div>
      </div>

      <ContextTemplateForm
        organizationId={profile.organization_id}
        userProfile={profile}
        mode="create"
      />
    </div>
  );
}

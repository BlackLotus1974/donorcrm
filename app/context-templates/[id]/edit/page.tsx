import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContextTemplateForm from "@/components/context-templates/context-template-form";
import { canPerformAction } from "@/lib/permissions";

export default async function EditTemplatePage({
  params,
}: {
  params: { id: string };
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

  // Check if user can edit templates
  const canEdit = canPerformAction('edit_context_template', profile.role);
  if (!canEdit) {
    redirect(`/context-templates/${params.id}`);
  }

  // Get template
  const { data: template } = await supabase
    .from('context_templates')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .single();

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Template</h1>
          <p className="text-gray-600 mt-1">
            Update {template.title}
          </p>
        </div>
      </div>

      <ContextTemplateForm
        organizationId={profile.organization_id}
        userProfile={profile}
        template={template}
        mode="edit"
      />
    </div>
  );
}

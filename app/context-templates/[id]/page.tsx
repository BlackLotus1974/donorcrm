import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContextTemplateDetail from "@/components/context-templates/context-template-detail";

export default async function ContextTemplatePage({
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

  // Get template with related data
  const { data: template } = await supabase
    .from('context_templates')
    .select(`
      *,
      created_user:user_profiles!context_templates_created_by_fkey(
        id,
        first_name,
        last_name,
        avatar_url
      ),
      updated_user:user_profiles!context_templates_updated_by_fkey(
        id,
        first_name,
        last_name,
        avatar_url
      ),
      parent_template:context_templates!context_templates_parent_template_id_fkey(
        id,
        title
      )
    `)
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .single();

  if (!template) {
    notFound();
  }

  // Get collaborators
  const { data: collaborators } = await supabase
    .from('context_template_collaborators')
    .select(`
      *,
      user:user_profiles!context_template_collaborators_user_id_fkey(
        id,
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .eq('template_id', params.id)
    .order('invited_at', { ascending: false });

  // Get version history
  const { data: versions } = await supabase
    .from('context_template_versions')
    .select(`
      *,
      created_user:user_profiles!context_template_versions_created_by_fkey(
        id,
        first_name,
        last_name
      )
    `)
    .eq('template_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <ContextTemplateDetail
      template={template}
      userProfile={profile}
      collaborators={collaborators || []}
      versions={versions || []}
    />
  );
}

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CollaborationView from "@/components/context-templates/collaboration-view";

export default async function CollaborationPage({
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

  // Get collaborators
  const { data: collaborators } = await supabase
    .from('context_template_collaborators')
    .select(`
      *,
      user:user_profiles!context_template_collaborators_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('template_id', params.id)
    .order('invited_at', { ascending: false });

  // Get comments
  const { data: comments } = await supabase
    .from('context_template_comments')
    .select(`
      *,
      created_user:user_profiles!context_template_comments_created_by_fkey(
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('template_id', params.id)
    .order('created_at', { ascending: false });

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
    .order('created_at', { ascending: false });

  // Get organization users for collaborator selection
  const { data: orgUsers } = await supabase
    .from('user_profiles')
    .select('id, organization_id, first_name, last_name, avatar_url, role, is_active, created_at, updated_at')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('first_name');

  return (
    <CollaborationView
      template={template}
      userProfile={profile}
      collaborators={collaborators || []}
      comments={comments || []}
      versions={versions || []}
      organizationUsers={orgUsers || []}
    />
  );
}

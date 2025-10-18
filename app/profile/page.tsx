import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UserProfileForm from "@/components/profile/user-profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, organization:organizations(*)')
    .eq('id', data.user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      <UserProfileForm
        profile={profile}
        userEmail={data.user.email || ''}
      />
    </div>
  );
}

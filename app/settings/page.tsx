import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Building, Users, Shield, CreditCard, Bell, Palette, Globe, Lock, Mail } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
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

  const isAdmin = profile.role === 'admin';

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const settingsCategories = [
    {
      title: "Organization Profile",
      description: "Update your organization's name and information",
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      available: false
    },
    {
      title: "Team Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      available: false
    },
    {
      title: "Security & Privacy",
      description: "Configure authentication and data protection",
      icon: Lock,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
      available: false
    },
    {
      title: "Subscription & Billing",
      description: "Manage your plan and payment information",
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      available: false
    },
    {
      title: "Notifications",
      description: "Configure email and in-app notifications",
      icon: Bell,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      available: false
    },
    {
      title: "Appearance",
      description: "Customize theme and display preferences",
      icon: Palette,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900",
      available: false
    },
    {
      title: "Integrations",
      description: "Connect with third-party services",
      icon: Globe,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900",
      available: false
    },
    {
      title: "Email Templates",
      description: "Customize email communications",
      icon: Mail,
      color: "text-teal-600",
      bgColor: "bg-teal-100 dark:bg-teal-900",
      available: false
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your organization and system preferences
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Access
        </Badge>
      </div>

      {/* Current Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Organization</CardTitle>
          <CardDescription>Your organization information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Organization Name</p>
              <p className="text-lg font-semibold mt-1">{profile.organization?.name || 'Unnamed Organization'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Subscription Plan</p>
              <div className="text-lg font-semibold mt-1">
                <Badge variant="outline">
                  {profile.organization?.subscription_tier || 'Basic'}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-lg font-semibold mt-1">
                {new Date(profile.organization?.created_at || '').toLocaleDateString('en-US')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Banner */}
      <Card className="border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Advanced Settings Coming Soon!
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                We're building comprehensive organization management tools.
                In the meantime, you can manage your personal profile and continue using the core features.
              </p>
              <div className="mt-4 flex gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/profile">
                    <Shield className="h-4 w-4 mr-2" />
                    My Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">
                    <Building className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.title} className="relative overflow-hidden opacity-60">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${category.bgColor}`}>
                    <Icon className={`h-6 w-6 ${category.color}`} />
                  </div>
                  {!category.available && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  Configure
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Available Now Section */}
      <Card>
        <CardHeader>
          <CardTitle>Available Now</CardTitle>
          <CardDescription>Features you can access today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">My Profile</p>
                <p className="text-sm text-gray-500">Update your personal information</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">
                Edit Profile
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Donor Management</p>
                <p className="text-sm text-gray-500">Manage your donor database</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/donors">
                Go to Donors
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

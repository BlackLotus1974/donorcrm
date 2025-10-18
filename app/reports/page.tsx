import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, FileText, Download, Plus } from "lucide-react";
import Link from "next/link";

export default async function ReportsPage() {
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

  const canViewReports = ['viewer', 'user', 'manager', 'admin'].includes(profile.role);

  if (!canViewReports) {
    redirect("/dashboard");
  }

  // Placeholder report types
  const reportTypes = [
    {
      title: "Giving Trends",
      description: "Analyze donation patterns over time",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      available: false
    },
    {
      title: "Donor Retention",
      description: "Track donor retention and lapse rates",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      available: false
    },
    {
      title: "Campaign Performance",
      description: "Measure effectiveness of fundraising campaigns",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      available: false
    },
    {
      title: "Revenue Forecast",
      description: "Project future giving based on historical data",
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      available: false
    },
    {
      title: "Annual Summary",
      description: "Comprehensive year-end donor reports",
      icon: Calendar,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
      available: false
    },
    {
      title: "Custom Reports",
      description: "Build your own reports with custom criteria",
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900",
      available: false
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-gray-600 mt-1">
            Analyze your donor data and fundraising performance
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-2 border-dashed border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                Reports Coming Soon!
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                We're building comprehensive reporting tools to help you analyze your donor data.
                In the meantime, you can export your donor list from the Donors page and analyze it in Excel or your preferred tool.
              </p>
              <div className="mt-4 flex gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/donors">
                    <Users className="h-4 w-4 mr-2" />
                    Browse Donors
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title} className="relative overflow-hidden opacity-60">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  {!report.available && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Now</CardTitle>
          <CardDescription>Export and analyze your data today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Export Donor List</p>
                <p className="text-sm text-gray-500">Download all donors as CSV</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/donors">
                Go to Donors
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Dashboard Statistics</p>
                <p className="text-sm text-gray-500">View key metrics and charts</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

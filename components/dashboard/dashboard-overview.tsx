'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  Users,
  DollarSign,
  TrendingUp,
  Heart,
  Calendar,
  Target,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { donorService } from '@/lib/services/donor-service';
import { organizationService } from '@/lib/services/organization-service';
import { UserProfile } from '@/lib/types';

interface DashboardStats {
  totalDonors: number;
  newDonors: number;
  totalGiving: number;
  averageGift: number;
  givingLevels: Record<string, number>;
}

interface DashboardOverviewProps {
  organizationId: string;
  userProfile: UserProfile;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d084d0'];

const givingTrendData = [
  { month: 'Jan', amount: 12400 },
  { month: 'Feb', amount: 15600 },
  { month: 'Mar', amount: 18900 },
  { month: 'Apr', amount: 16200 },
  { month: 'May', amount: 19800 },
  { month: 'Jun', amount: 22100 },
];

export default function DashboardOverview({ organizationId, userProfile }: DashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orgStats, setOrgStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [organizationId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load donor statistics and organization stats in parallel
      const [donorStats, organizationStats] = await Promise.all([
        donorService.getDonorStats(organizationId),
        organizationService.getOrganizationStats(organizationId),
      ]);

      setStats(donorStats);
      setOrgStats(organizationStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Transform giving levels data for pie chart
  const pieChartData = stats ? Object.entries(stats.givingLevels).map(([level, count]) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: count,
  })) : [];

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-2">{error}</div>
            <Button onClick={loadDashboardData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canCreateDonor = ['user', 'manager', 'admin'].includes(userProfile.role);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalDonors || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(stats?.newDonors || 0)}
              <span className={`ml-1 ${getTrendColor(stats?.newDonors || 0)}`}>
                +{stats?.newDonors || 0} this month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Giving</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalGiving || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Gift</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.averageGift || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Per active donor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(orgStats?.userCount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Team members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Giving Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Giving Trend</CardTitle>
            <CardDescription>Monthly giving over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={givingTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donor Levels Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Donor Levels</CardTitle>
            <CardDescription>Distribution of donors by giving level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {canCreateDonor && (
              <Button asChild className="w-full justify-start">
                <Link href="/donors/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Donor
                </Link>
              </Button>
            )}
            
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/donors?search=">
                <Users className="h-4 w-4 mr-2" />
                Browse All Donors
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/reports">
                <BarChart className="h-4 w-4 mr-2" />
                View Reports
              </Link>
            </Button>

            {userProfile.role === 'admin' && (
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/settings">
                  <Target className="h-4 w-4 mr-2" />
                  Organization Settings
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Donors */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest donor additions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-center text-gray-500 py-8">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Recent activity will appear here</p>
                <p className="text-xs">Add or update donors to see activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Info */}
      {userProfile.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Overview</CardTitle>
            <CardDescription>
              {userProfile.organization?.name} - {userProfile.organization?.subscription_tier || 'Basic'} Plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-sm font-semibold">Total Donors</Label>
                <p className="text-2xl font-bold">{formatNumber(orgStats?.donorCount || 0)}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Team Members</Label>
                <p className="text-2xl font-bold">{formatNumber(orgStats?.userCount || 0)}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Subscription</Label>
                <Badge variant="outline" className="mt-1">
                  {userProfile.organization?.subscription_tier || 'Basic'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for labels
function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium text-gray-700 ${className}`} {...props}>
      {children}
    </label>
  );
}
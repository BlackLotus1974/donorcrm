'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Eye,
  Edit,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  Activity,
  Users,
} from 'lucide-react';
import { contextTemplateService } from '@/lib/services/context-template-service';

interface TemplateAnalyticsProps {
  templateId: string;
}

export default function TemplateAnalytics({ templateId }: TemplateAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [templateId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await contextTemplateService.getAnalytics(templateId);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock data for demonstration (replace with real analytics data)
  const eventData = [
    { name: 'Views', count: analytics?.total_views || 45, icon: Eye, color: '#3b82f6' },
    { name: 'Edits', count: analytics?.total_edits || 12, icon: Edit, color: '#8b5cf6' },
    { name: 'Exports', count: analytics?.total_exports || 8, icon: Download, color: '#10b981' },
    { name: 'Clones', count: analytics?.total_clones || 5, icon: Copy, color: '#f59e0b' },
  ];

  const usageOverTime = [
    { date: '2024-01', views: 12, edits: 3 },
    { date: '2024-02', views: 15, edits: 4 },
    { date: '2024-03', views: 18, edits: 5 },
    { date: '2024-04', views: 22, edits: 6 },
    { date: '2024-05', views: 28, edits: 8 },
    { date: '2024-06', views: 35, edits: 10 },
  ];

  const completionData = [
    { name: 'Completed', value: analytics?.completed_uses || 32, color: '#10b981' },
    { name: 'In Progress', value: analytics?.in_progress_uses || 8, color: '#f59e0b' },
    { name: 'Abandoned', value: analytics?.abandoned_uses || 3, color: '#ef4444' },
  ];

  const avgQualityScore = analytics?.avg_quality_score || 4.2;
  const avgCompletionTime = analytics?.avg_completion_time || 45; // minutes

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {eventData.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold mt-1">{stat.count}</p>
                  </div>
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Quality Score</p>
                <p className="text-xl font-bold">{avgQualityScore.toFixed(1)}/5.0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Completion Time</p>
                <p className="text-xl font-bold">{avgCompletionTime} min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-xl font-bold">
                  {((completionData[0].value / completionData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Usage Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={usageOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="edits"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Completion Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Event Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Event Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eventData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {eventData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { event: 'viewed', user: 'John Doe', time: '2 hours ago', icon: Eye },
              { event: 'edited', user: 'Jane Smith', time: '5 hours ago', icon: Edit },
              { event: 'exported', user: 'Bob Johnson', time: '1 day ago', icon: Download },
              { event: 'cloned', user: 'Alice Williams', time: '2 days ago', icon: Copy },
            ].map((activity, i) => {
              const Icon = activity.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>
                      {' '}
                      <span className="text-gray-600">{activity.event} this template</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

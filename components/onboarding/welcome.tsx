'use client';

import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Heart } from 'lucide-react';
import Link from 'next/link';

interface OnboardingWelcomeProps {
  user: User;
}

export default function OnboardingWelcome({ user }: OnboardingWelcomeProps) {
  const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'there';

  return (
    <div className="max-w-2xl w-full">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Heart className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Donor CRM, {firstName}!
        </h1>
        <p className="text-lg text-gray-600">
          Let's get you set up to start managing your donor relationships
        </p>
      </div>

      <div className="grid gap-6">
        <Link href="/onboarding/create-organization">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary hover:border-primary border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    Create New Organization
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Set up a new organization and start fresh
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  Full admin control over settings and users
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  Import your existing donor data
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  Customize the system for your organization
                </li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        <Link href="/onboarding/join-organization">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary hover:border-primary border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-green-50 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Join Existing Organization</CardTitle>
                  <CardDescription>
                    Join an organization that's already using Donor CRM
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  Get access to existing donor database
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  Collaborate with your team immediately
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  Role-based permissions set by admin
                </li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="outline" asChild>
          <Link href="/auth/login">
            Sign Out
          </Link>
        </Button>
      </div>
    </div>
  );
}
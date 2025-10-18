'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Users, Search, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { organizationService } from '@/lib/services/organization-service';
import { userService } from '@/lib/services/user-service';
import { Organization } from '@/lib/types';

const joinSchema = z.object({
  organizationSlug: z.string().min(1, 'Organization identifier is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  phone: z.string().optional(),
});

type JoinFormData = z.infer<typeof joinSchema>;

interface JoinOrganizationFormProps {
  user: User;
}

export default function JoinOrganizationForm({ user }: JoinOrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundOrganization, setFoundOrganization] = useState<Organization | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      firstName: user.user_metadata?.first_name || '',
      lastName: user.user_metadata?.last_name || '',
    },
  });

  const searchOrganization = async () => {
    const slug = form.getValues('organizationSlug');
    if (!slug) return;

    try {
      setIsSearching(true);
      setSearchError(null);
      setFoundOrganization(null);

      const organization = await organizationService.getOrganizationBySlug(slug);
      
      if (organization) {
        setFoundOrganization(organization);
      } else {
        setSearchError('Organization not found. Please check the identifier and try again.');
      }
    } catch (err) {
      setSearchError('Error searching for organization. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data: JoinFormData) => {
    if (!foundOrganization) {
      setError('Please search for and select an organization first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create user profile with the found organization
      await userService.createProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        title: data.title,
        phone: data.phone,
        organization_id: foundOrganization.id,
      });

      // Note: User role defaults to 'user' - admin will need to change it if needed
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/onboarding">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Join Organization
            </CardTitle>
            <CardDescription>
              Join an existing organization using their organization identifier
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          {/* Organization Search */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Search className="h-5 w-5" />
              Find Organization
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="organizationSlug">
                  Organization Identifier *
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="organizationSlug"
                      {...form.register('organizationSlug')}
                      placeholder="e.g., red-cross-chicago"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          searchOrganization();
                        }
                      }}
                    />
                    {form.formState.errors.organizationSlug && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.organizationSlug.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={searchOrganization}
                    disabled={isSearching || !form.getValues('organizationSlug')}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ask your organization admin for the organization identifier
                </p>
              </div>
              
              {searchError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {searchError}
                </div>
              )}
              
              {foundOrganization && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-green-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {foundOrganization.name}
                      </h4>
                      <p className="text-sm text-green-700">
                        Identifier: {foundOrganization.slug}
                      </p>
                      {foundOrganization.email && (
                        <p className="text-sm text-green-700">
                          Email: {foundOrganization.email}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Found
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {foundOrganization && (
            <>
              <Separator />
              
              {/* User Profile */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="h-5 w-5" />
                  Your Profile
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...form.register('firstName')}
                      placeholder="John"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...form.register('lastName')}
                      placeholder="Doe"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      {...form.register('title')}
                      placeholder="Program Coordinator"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      {...form.register('phone')}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You'll be added as a User with basic permissions. 
                    Your organization admin can update your role and permissions after you join.
                  </p>
                </div>
              </div>
            </>
          )}
          
          <div className="flex gap-3 pt-4">
            {foundOrganization ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Joining...' : `Join ${foundOrganization.name}`}
              </Button>
            ) : (
              <Button
                type="button"
                disabled
                className="flex-1"
              >
                Search for organization first
              </Button>
            )}
            
            <Button
              type="button"
              variant="outline"
              asChild
            >
              <Link href="/onboarding">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
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
import { Building2, User as UserIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { organizationService } from '@/lib/services/organization-service';
import { userService } from '@/lib/services/user-service';
import { toast } from 'sonner';

const organizationSchema = z.object({
  // Organization details
  organizationName: z.string().min(2, 'Organization name is required'),
  taxId: z.string().optional(),
  organizationEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  organizationPhone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  
  // Address
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('US'),
  
  // User profile
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  userPhone: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface CreateOrganizationFormProps {
  user: User;
}

export default function CreateOrganizationForm({ user }: CreateOrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      firstName: user.user_metadata?.first_name || '',
      lastName: user.user_metadata?.last_name || '',
      organizationEmail: user.email || '',
      country: 'US',
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    console.log('✅ onSubmit called - Form submitted!', data);
    try {
      setIsSubmitting(true);

      console.log('Starting organization creation...', data);

      // Create organization
      const organization = await organizationService.createOrganization({
        name: data.organizationName,
        tax_id: data.taxId,
        email: data.organizationEmail,
        phone: data.organizationPhone,
        website: data.website,
        address: {
          line1: data.addressLine1,
          line2: data.addressLine2,
          city: data.city,
          state: data.state,
          postal_code: data.postalCode,
          country: data.country,
        },
      });

      if (!organization) {
        toast.error('Failed to create organization');
        return;
      }

      console.log('Organization created:', organization);

      // Update user profile with organization and admin role
      console.log('Creating user profile...');
      const profile = await userService.createProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        title: data.title,
        phone: data.userPhone,
        organization_id: organization.id,
      });

      console.log('User profile created:', profile);

      if (!profile) {
        toast.error('Failed to create user profile');
        return;
      }

      // Set user as admin since they created the organization
      console.log('Setting user as admin...');
      const updated = await userService.updateProfile({ role: 'admin' });

      console.log('User role updated:', updated);

      if (!updated) {
        toast.error('Failed to set admin role');
        return;
      }

      toast.success('Organization created successfully!');

      // Redirect to dashboard
      console.log('Redirecting to dashboard...');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error during organization creation:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create organization');
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
              <Building2 className="h-5 w-5" />
              Create Your Organization
            </CardTitle>
            <CardDescription>
              Set up your organization profile and create your admin account
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          
          {/* Organization Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="h-5 w-5" />
              Organization Information
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="organizationName">
                  Organization Name *
                </Label>
                <Input
                  id="organizationName"
                  {...form.register('organizationName')}
                  placeholder="Your Organization Name"
                />
                {form.formState.errors.organizationName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.organizationName.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="taxId">Tax ID (EIN)</Label>
                <Input
                  id="taxId"
                  {...form.register('taxId')}
                  placeholder="12-3456789"
                />
              </div>
              
              <div>
                <Label htmlFor="organizationEmail">Email</Label>
                <Input
                  id="organizationEmail"
                  type="email"
                  {...form.register('organizationEmail')}
                  placeholder="contact@organization.org"
                />
                {form.formState.errors.organizationEmail && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.organizationEmail.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="organizationPhone">Phone</Label>
                <Input
                  id="organizationPhone"
                  {...form.register('organizationPhone')}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...form.register('website')}
                  placeholder="https://www.organization.org"
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>
            </div>
            
            {/* Address */}
            <div className="space-y-3">
              <Label>Address</Label>
              <div className="grid grid-cols-1 gap-3">
                <Input
                  {...form.register('addressLine1')}
                  placeholder="Address Line 1"
                />
                <Input
                  {...form.register('addressLine2')}
                  placeholder="Address Line 2"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input
                    {...form.register('city')}
                    placeholder="City"
                  />
                  <Input
                    {...form.register('state')}
                    placeholder="State"
                  />
                  <Input
                    {...form.register('postalCode')}
                    placeholder="ZIP Code"
                  />
                  <Input
                    {...form.register('country')}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* User Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <UserIcon className="h-5 w-5" />
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
                  placeholder="Development Director"
                />
              </div>
              
              <div>
                <Label htmlFor="userPhone">Phone</Label>
                <Input
                  id="userPhone"
                  {...form.register('userPhone')}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Organization'}
            </Button>
            
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
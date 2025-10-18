'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Building, Shield, Calendar, Save } from 'lucide-react';
import { userService } from '@/lib/services/user-service';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserProfileFormProps {
  profile: UserProfile;
  userEmail: string;
}

export default function UserProfileForm({ profile, userEmail }: UserProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      title: profile.title || '',
      department: profile.department || '',
      phone: profile.phone || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);

      const result = await userService.updateProfile(data);

      if (result) {
        toast.success('Profile updated successfully!');
        router.refresh();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'user': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Profile Overview Card */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">{userEmail}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-gray-500" />
              <Badge className={getRoleBadgeColor(profile.role)}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">{profile.organization?.name || 'No Organization'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                Joined {new Date(profile.created_at).toLocaleDateString('en-US')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  {...form.register('first_name')}
                  placeholder="John"
                />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-red-500">{form.formState.errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  {...form.register('last_name')}
                  placeholder="Doe"
                />
                {form.formState.errors.last_name && (
                  <p className="text-sm text-red-500">{form.formState.errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Title and Department */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="Development Director"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  {...form.register('department')}
                  placeholder="Development"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="(555) 123-4567"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

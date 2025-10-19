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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Heart,
  ArrowLeft,
  Save,
  X,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { donorService } from '@/lib/services/donor-service';
import { Donor, DonorFormData, UserProfile, DonorType, DonorStatus, GivingLevel } from '@/lib/types';
import { toast } from 'sonner';

const donorSchema = z.object({
  // Personal Information
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  preferred_name: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  suffix: z.string().nullable().optional(),

  // Contact Information
  email: z.union([z.string().email('Invalid email'), z.literal('')]).nullable().optional(),
  phone: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  address_line1: z.string().nullable().optional(),
  address_line2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country: z.string().default('US'),

  // Professional Information
  employer: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),

  // Donor Specific Fields
  donor_type: z.enum(['individual', 'foundation', 'corporation'] as const).nullable().default('individual'),
  source: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  capacity_rating: z.string().nullable().optional(),
  interest_areas: z.array(z.string()).nullable().optional(),
  giving_level: z.enum(['major', 'mid-level', 'annual', 'lapsed', 'prospect'] as const).nullable().optional(),

  // Communication Preferences
  email_opt_in: z.boolean().default(true),
  phone_opt_in: z.boolean().default(true),
  mail_opt_in: z.boolean().default(true),
  newsletter_opt_in: z.boolean().default(false),

  // Status and Notes
  status: z.enum(['active', 'inactive', 'deceased', 'do_not_contact'] as const).default('active'),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

type DonorFormInput = z.infer<typeof donorSchema>;

interface DonorFormProps {
  organizationId: string;
  availableUsers: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
  }>;
  userProfile: UserProfile;
  donor?: Donor;
  mode?: 'create' | 'edit';
}

export default function DonorForm({
  organizationId,
  availableUsers,
  userProfile,
  donor,
  mode = 'create',
}: DonorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const form = useForm<DonorFormInput>({
    resolver: zodResolver(donorSchema),
    defaultValues: donor
      ? {
          ...donor,
          email_opt_in: donor.communication_preferences?.email ?? true,
          phone_opt_in: donor.communication_preferences?.phone ?? true,
          mail_opt_in: donor.communication_preferences?.mail ?? true,
          newsletter_opt_in: donor.communication_preferences?.newsletter ?? false,
          tags: donor.tags || [],
          interest_areas: donor.interest_areas || [],
        }
      : {
          donor_type: 'individual',
          status: 'active',
          country: 'US',
          email_opt_in: true,
          phone_opt_in: true,
          mail_opt_in: true,
          newsletter_opt_in: false,
          tags: [],
          interest_areas: [],
        },
  });

  const watchedTags = form.watch('tags') || [];
  const watchedInterests = form.watch('interest_areas') || [];

  const onSubmit = async (data: DonorFormInput) => {
    console.log('=== FORM SUBMIT STARTED ===');
    console.log('Mode:', mode);
    console.log('Donor ID:', donor?.id);
    console.log('Form data:', data);

    try {
      setIsSubmitting(true);
      console.log('isSubmitting set to true');

      // Transform form data to DonorFormData
      const donorData: DonorFormData = {
        ...data,
        communication_preferences: {
          email: data.email_opt_in,
          phone: data.phone_opt_in,
          mail: data.mail_opt_in,
          newsletter: data.newsletter_opt_in,
        },
      };

      console.log('Transformed donor data:', donorData);

      let result: Donor | null = null;

      if (mode === 'create') {
        console.log('Calling donorService.createDonor...');
        result = await donorService.createDonor(organizationId, donorData);
        console.log('Create result:', result);
      } else if (donor) {
        console.log('Calling donorService.updateDonor with ID:', donor.id);
        result = await donorService.updateDonor(donor.id, donorData);
        console.log('Update result:', result);
      } else {
        console.error('ERROR: mode is edit but no donor object exists');
      }

      if (result) {
        console.log('Operation successful, showing toast and navigating...');
        toast.success(`Donor ${mode === 'create' ? 'created' : 'updated'} successfully!`);
        // Use router.push for client-side navigation with refresh
        const targetUrl = `/donors/${result.id}`;
        console.log('Navigating to:', targetUrl);
        router.push(targetUrl);
        router.refresh();
      } else {
        console.error('Operation failed: result is null');
        toast.error(`Failed to ${mode} donor. Please check the console for details.`);
      }
    } catch (err) {
      console.error('=== EXCEPTION IN FORM SUBMIT ===');
      console.error('Error type:', err instanceof Error ? 'Error' : typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));
      console.error('Full error:', err);
      toast.error(err instanceof Error ? err.message : `Failed to ${mode} donor`);
    } finally {
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
      console.log('=== FORM SUBMIT ENDED ===');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      const updatedTags = [...watchedTags, newTag.trim()];
      form.setValue('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = watchedTags.filter(tag => tag !== tagToRemove);
    form.setValue('tags', updatedTags);
  };

  const addInterest = () => {
    if (newInterest.trim() && !watchedInterests.includes(newInterest.trim())) {
      const updatedInterests = [...watchedInterests, newInterest.trim()];
      form.setValue('interest_areas', updatedInterests);
      setNewInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    const updatedInterests = watchedInterests.filter(interest => interest !== interestToRemove);
    form.setValue('interest_areas', updatedInterests);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
      console.error('=== FORM VALIDATION ERRORS ===');
      console.error('Error fields:', Object.keys(errors));
      Object.entries(errors).forEach(([field, error]: [string, any]) => {
        console.error(`Field "${field}":`, error?.message || error?.type || 'Unknown error');
        if (error?.message) console.error(`  Message: ${error.message}`);
        if (error?.type) console.error(`  Type: ${error.type}`);
      });

      // Show user-friendly error toast
      const errorFields = Object.keys(errors).join(', ');
      toast.error(`Validation errors in: ${errorFields}`);
    })} className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href={donor ? `/donors/${donor.id}` : '/donors'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Donor' : 'Update Donor'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  {...form.register('first_name')}
                  placeholder="John"
                />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  {...form.register('last_name')}
                  placeholder="Doe"
                />
                {form.formState.errors.last_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="preferred_name">Preferred Name</Label>
              <Input
                id="preferred_name"
                {...form.register('preferred_name')}
                placeholder="Johnny"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="Mr., Mrs., Dr."
                />
              </div>

              <div>
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  id="suffix"
                  {...form.register('suffix')}
                  placeholder="Jr., Sr., III"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="donor_type">Donor Type</Label>
              <Select
                value={form.watch('donor_type')}
                onValueChange={(value) => form.setValue('donor_type', value as DonorType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="john@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  {...form.register('mobile')}
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                {...form.register('address_line1')}
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                {...form.register('address_line2')}
                placeholder="Apt 4B"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="New York"
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...form.register('state')}
                  placeholder="NY"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="postal_code">ZIP Code</Label>
                <Input
                  id="postal_code"
                  {...form.register('postal_code')}
                  placeholder="10001"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...form.register('country')}
                  placeholder="US"
                />
              </div>
            </div>

            {/* Communication Preferences */}
            <div className="space-y-3 pt-4">
              <Label className="text-base">Communication Preferences</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email_opt_in"
                    checked={form.watch('email_opt_in')}
                    onCheckedChange={(checked) => 
                      form.setValue('email_opt_in', Boolean(checked))
                    }
                  />
                  <Label htmlFor="email_opt_in">Email communications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="phone_opt_in"
                    checked={form.watch('phone_opt_in')}
                    onCheckedChange={(checked) => 
                      form.setValue('phone_opt_in', Boolean(checked))
                    }
                  />
                  <Label htmlFor="phone_opt_in">Phone calls</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mail_opt_in"
                    checked={form.watch('mail_opt_in')}
                    onCheckedChange={(checked) => 
                      form.setValue('mail_opt_in', Boolean(checked))
                    }
                  />
                  <Label htmlFor="mail_opt_in">Direct mail</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter_opt_in"
                    checked={form.watch('newsletter_opt_in')}
                    onCheckedChange={(checked) => 
                      form.setValue('newsletter_opt_in', Boolean(checked))
                    }
                  />
                  <Label htmlFor="newsletter_opt_in">Newsletter subscription</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donor Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Donor Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Professional Information */}
            <div>
              <Label htmlFor="employer">Employer</Label>
              <Input
                id="employer"
                {...form.register('employer')}
                placeholder="Company Name"
              />
            </div>

            <div>
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                {...form.register('job_title')}
                placeholder="Chief Executive Officer"
              />
            </div>

            <Separator />

            {/* Donor Classification */}
            <div>
              <Label htmlFor="giving_level">Giving Level</Label>
              <Select
                value={form.watch('giving_level') || 'none'}
                onValueChange={(value) =>
                  form.setValue('giving_level', value !== 'none' ? value as GivingLevel : undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select giving level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No level assigned</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="annual">Annual Donor</SelectItem>
                  <SelectItem value="mid-level">Mid-Level Donor</SelectItem>
                  <SelectItem value="major">Major Donor</SelectItem>
                  <SelectItem value="lapsed">Lapsed Donor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="capacity_rating">Capacity Rating</Label>
              <Input
                id="capacity_rating"
                {...form.register('capacity_rating')}
                placeholder="$1,000 - $5,000"
              />
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                {...form.register('source')}
                placeholder="Website, Event, Referral"
              />
            </div>

            <div>
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select
                value={form.watch('assigned_to') || 'unassigned'}
                onValueChange={(value) =>
                  form.setValue('assigned_to', value !== 'unassigned' ? value : undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as DonorStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                  <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interest Areas */}
            <div>
              <Label>Interest Areas</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add interest area"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addInterest}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {watchedInterests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 p-0 h-auto"
                      onClick={() => removeInterest(interest)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {watchedTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 p-0 h-auto"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Additional notes about this donor..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
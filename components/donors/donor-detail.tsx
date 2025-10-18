'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  User,
  Heart,
  DollarSign,
  Tag,
  MessageSquare,
  Trash2,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Donor, UserProfile } from '@/lib/types';
import { donorService } from '@/lib/services/donor-service';
import { toast } from 'sonner';

interface DonorDetailProps {
  donor: Donor & {
    assigned_user?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      title?: string | null;
    };
    created_user?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
    };
    updated_user?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
    };
  };
  userProfile: UserProfile;
  availableUsers: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
  }>;
}

export default function DonorDetail({ donor, userProfile, availableUsers }: DonorDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = ['user', 'manager', 'admin'].includes(userProfile.role);
  const canDelete = ['manager', 'admin'].includes(userProfile.role);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to deactivate this donor?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const success = await donorService.deleteDonor(donor.id);
      if (success) {
        toast.success('Donor deactivated successfully!');
        router.push('/donors');
      } else {
        toast.error('Failed to deactivate donor');
      }
    } catch (error) {
      toast.error('Failed to deactivate donor');
    } finally {
      setIsDeleting(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'deceased':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'do_not_contact':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'deceased':
        return 'bg-red-100 text-red-800';
      case 'do_not_contact':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGivingLevelColor = (level?: string) => {
    switch (level) {
      case 'major':
        return 'bg-purple-100 text-purple-800';
      case 'mid-level':
        return 'bg-blue-100 text-blue-800';
      case 'annual':
        return 'bg-green-100 text-green-800';
      case 'lapsed':
        return 'bg-orange-100 text-orange-800';
      case 'prospect':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/donors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Donors
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {donor.first_name} {donor.last_name}
              {donor.preferred_name && (
                <span className="text-xl text-gray-500 font-normal">
                  ({donor.preferred_name})
                </span>
              )}
            </h1>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(donor.status)}>
                {getStatusIcon(donor.status)}
                <span className="ml-1 capitalize">{donor.status.replace('_', ' ')}</span>
              </Badge>
              
              {donor.giving_level && (
                <Badge className={getGivingLevelColor(donor.giving_level)}>
                  {donor.giving_level.charAt(0).toUpperCase() + donor.giving_level.slice(1)}
                </Badge>
              )}
              
              <Badge variant="outline">
                {donor.donor_type.charAt(0).toUpperCase() + donor.donor_type.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/donors/${donor.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <DollarSign className="h-4 w-4 mr-2" />
                Record Donation
              </DropdownMenuItem>
              
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deactivating...' : 'Deactivate'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {donor.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <a 
                    href={`mailto:${donor.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {donor.email}
                  </a>
                  <div className="text-xs text-gray-500">
                    Email {donor.communication_preferences?.email ? 'allowed' : 'blocked'}
                  </div>
                </div>
              </div>
            )}

            {donor.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <a 
                    href={`tel:${donor.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {donor.phone}
                  </a>
                  <div className="text-xs text-gray-500">Phone</div>
                </div>
              </div>
            )}

            {donor.mobile && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <a 
                    href={`tel:${donor.mobile}`}
                    className="text-blue-600 hover:underline"
                  >
                    {donor.mobile}
                  </a>
                  <div className="text-xs text-gray-500">Mobile</div>
                </div>
              </div>
            )}

            {(donor.address_line1 || donor.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-sm">
                  {donor.address_line1 && <div>{donor.address_line1}</div>}
                  {donor.address_line2 && <div>{donor.address_line2}</div>}
                  {(donor.city || donor.state || donor.postal_code) && (
                    <div>
                      {donor.city && `${donor.city}, `}
                      {donor.state && `${donor.state} `}
                      {donor.postal_code}
                    </div>
                  )}
                  {donor.country && donor.country !== 'US' && (
                    <div>{donor.country}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Mail {donor.communication_preferences?.mail ? 'allowed' : 'blocked'}
                  </div>
                </div>
              </div>
            )}

            {/* Communication Preferences */}
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">Communication Preferences</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {donor.communication_preferences?.email ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>Email communications</span>
                </div>
                <div className="flex items-center gap-2">
                  {donor.communication_preferences?.phone ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>Phone calls</span>
                </div>
                <div className="flex items-center gap-2">
                  {donor.communication_preferences?.mail ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>Direct mail</span>
                </div>
                <div className="flex items-center gap-2">
                  {donor.communication_preferences?.newsletter ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>Newsletter</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional & Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Professional & Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {donor.employer && (
              <div>
                <Label className="text-sm font-semibold">Employer</Label>
                <p className="text-sm">{donor.employer}</p>
              </div>
            )}

            {donor.job_title && (
              <div>
                <Label className="text-sm font-semibold">Job Title</Label>
                <p className="text-sm">{donor.job_title}</p>
              </div>
            )}

            {donor.capacity_rating && (
              <div>
                <Label className="text-sm font-semibold">Capacity Rating</Label>
                <p className="text-sm">{donor.capacity_rating}</p>
              </div>
            )}

            {donor.source && (
              <div>
                <Label className="text-sm font-semibold">Source</Label>
                <p className="text-sm">{donor.source}</p>
              </div>
            )}

            {donor.assigned_user && (
              <div>
                <Label className="text-sm font-semibold">Assigned To</Label>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {donor.assigned_user.first_name} {donor.assigned_user.last_name}
                    {donor.assigned_user.title && (
                      <span className="text-gray-500 ml-1">
                        ({donor.assigned_user.title})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Interest Areas */}
            {donor.interest_areas && donor.interest_areas.length > 0 && (
              <div>
                <Label className="text-sm font-semibold">Interest Areas</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {donor.interest_areas.map((area) => (
                    <Badge key={area} variant="outline" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {donor.tags && donor.tags.length > 0 && (
              <div>
                <Label className="text-sm font-semibold">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {donor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {donor.notes && (
              <div>
                <Label className="text-sm font-semibold">Notes</Label>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {donor.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Giving History & Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Giving History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Lifetime Giving</Label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(donor.total_lifetime_giving)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Largest Gift</Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(donor.largest_gift_amount)}
                </p>
              </div>
            </div>

            {donor.first_gift_date && (
              <div>
                <Label className="text-sm font-semibold">First Gift</Label>
                <p className="text-sm">
                  {new Date(donor.first_gift_date).toLocaleDateString('en-US')}
                </p>
              </div>
            )}

            {donor.last_gift_date && (
              <div>
                <Label className="text-sm font-semibold">Last Gift</Label>
                <p className="text-sm">
                  {new Date(donor.last_gift_date).toLocaleDateString('en-US')}
                </p>
              </div>
            )}

            <Separator />

            {/* Metadata */}
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>
                  Created {new Date(donor.created_at).toLocaleDateString('en-US')}
                  {donor.created_user && (
                    <span> by {donor.created_user.first_name} {donor.created_user.last_name}</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>
                  Updated {new Date(donor.updated_at).toLocaleDateString('en-US')}
                  {donor.updated_user && (
                    <span> by {donor.updated_user.first_name} {donor.updated_user.last_name}</span>
                  )}
                </span>
              </div>
              
              {donor.external_id && (
                <div className="flex items-center gap-2">
                  <span>External ID: {donor.external_id}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for labels (since we don't have it in shadcn/ui yet)
function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium text-gray-700 ${className}`} {...props}>
      {children}
    </label>
  );
}
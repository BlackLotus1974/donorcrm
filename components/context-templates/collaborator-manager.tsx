'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, MoreVertical, Mail, Check, X, Shield, Eye, Edit, Trash2 } from 'lucide-react';
import { ContextTemplateCollaborator, UserProfile, CollaboratorRole } from '@/lib/types';
import { contextTemplateService } from '@/lib/services/context-template-service';
import { canPerformAction } from '@/lib/permissions';

interface CollaboratorManagerProps {
  templateId: string;
  collaborators: ContextTemplateCollaborator[];
  organizationUsers: UserProfile[];
  currentUserProfile: UserProfile;
  onUpdate: () => void;
}

export default function CollaboratorManager({
  templateId,
  collaborators,
  organizationUsers,
  currentUserProfile,
  onUpdate,
}: CollaboratorManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>('contributor');
  const [permissions, setPermissions] = useState({
    can_view: true,
    can_edit: false,
    can_comment: true,
    can_approve: false,
    can_delete: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageCollaborators = canPerformAction('manage_collaborators', currentUserProfile.role);

  // Filter out users who are already collaborators
  const availableUsers = organizationUsers.filter(
    user => !collaborators.find(c => c.user_id === user.id)
  );

  const handleAddCollaborator = async () => {
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await contextTemplateService.addCollaborator(
        templateId,
        selectedUserId,
        selectedRole,
        permissions
      );

      if (result) {
        setIsAddDialogOpen(false);
        setSelectedUserId('');
        setSelectedRole('contributor');
        setPermissions({
          can_view: true,
          can_edit: false,
          can_comment: true,
          can_approve: false,
          can_delete: false,
        });
        onUpdate();
      } else {
        setError('Failed to add collaborator');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add collaborator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      const success = await contextTemplateService.removeCollaborator(collaboratorId);
      if (success) {
        onUpdate();
      } else {
        alert('Failed to remove collaborator');
      }
    } catch (err) {
      alert('Failed to remove collaborator');
    }
  };

  const handleUpdatePermissions = async (collaboratorId: string, newPermissions: any) => {
    try {
      const success = await contextTemplateService.updateCollaboratorPermissions(
        collaboratorId,
        newPermissions
      );
      if (success) {
        onUpdate();
      } else {
        alert('Failed to update permissions');
      }
    } catch (err) {
      alert('Failed to update permissions');
    }
  };

  const getRoleIcon = (role: CollaboratorRole) => {
    switch (role) {
      case 'owner':
        return <Shield className="h-4 w-4 text-purple-600" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'contributor':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: CollaboratorRole) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'editor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Update permissions when role changes
  const handleRoleChange = (role: CollaboratorRole) => {
    setSelectedRole(role);

    // Set default permissions based on role
    switch (role) {
      case 'owner':
        setPermissions({
          can_view: true,
          can_edit: true,
          can_comment: true,
          can_approve: true,
          can_delete: true,
        });
        break;
      case 'editor':
        setPermissions({
          can_view: true,
          can_edit: true,
          can_comment: true,
          can_approve: false,
          can_delete: false,
        });
        break;
      case 'contributor':
        setPermissions({
          can_view: true,
          can_edit: false,
          can_comment: true,
          can_approve: false,
          can_delete: false,
        });
        break;
      case 'viewer':
        setPermissions({
          can_view: true,
          can_edit: false,
          can_comment: false,
          can_approve: false,
          can_delete: false,
        });
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Collaborators ({collaborators.length})
          </CardTitle>

          {canManageCollaborators && availableUsers.length > 0 && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Collaborator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Collaborator</DialogTitle>
                  <DialogDescription>
                    Invite a team member to collaborate on this template
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user">User *</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select value={selectedRole} onValueChange={handleRoleChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer - View only</SelectItem>
                        <SelectItem value="contributor">Contributor - View & comment</SelectItem>
                        <SelectItem value="editor">Editor - View, edit & comment</SelectItem>
                        <SelectItem value="owner">Owner - Full access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="space-y-2 p-3 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="can_view"
                          checked={permissions.can_view}
                          onCheckedChange={(checked) =>
                            setPermissions(p => ({ ...p, can_view: !!checked }))
                          }
                          disabled
                        />
                        <label htmlFor="can_view" className="text-sm">Can view</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="can_edit"
                          checked={permissions.can_edit}
                          onCheckedChange={(checked) =>
                            setPermissions(p => ({ ...p, can_edit: !!checked }))
                          }
                        />
                        <label htmlFor="can_edit" className="text-sm">Can edit</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="can_comment"
                          checked={permissions.can_comment}
                          onCheckedChange={(checked) =>
                            setPermissions(p => ({ ...p, can_comment: !!checked }))
                          }
                        />
                        <label htmlFor="can_comment" className="text-sm">Can comment</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="can_approve"
                          checked={permissions.can_approve}
                          onCheckedChange={(checked) =>
                            setPermissions(p => ({ ...p, can_approve: !!checked }))
                          }
                        />
                        <label htmlFor="can_approve" className="text-sm">Can approve</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="can_delete"
                          checked={permissions.can_delete}
                          onCheckedChange={(checked) =>
                            setPermissions(p => ({ ...p, can_delete: !!checked }))
                          }
                        />
                        <label htmlFor="can_delete" className="text-sm">Can delete</label>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCollaborator} disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Collaborator'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {collaborators.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No collaborators yet</p>
            {canManageCollaborators && (
              <p className="text-xs mt-1">Add team members to collaborate on this template</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {collaborator.user?.avatar_url ? (
                      <img
                        src={collaborator.user.avatar_url}
                        alt={`${collaborator.user?.first_name || ''} ${collaborator.user?.last_name || ''}`}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {collaborator.user?.first_name?.[0]}
                        {collaborator.user?.last_name?.[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {collaborator.user?.first_name} {collaborator.user?.last_name}
                      </span>
                      <Badge variant={getRoleBadgeVariant(collaborator.role)} className="flex items-center gap-1">
                        {getRoleIcon(collaborator.role)}
                        <span className="capitalize">{collaborator.role}</span>
                      </Badge>
                      {collaborator.accepted_at && (
                        <Badge variant="outline" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Accepted
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {collaborator.user?.email}
                      </span>
                      <span>
                        Invited {new Date(collaborator.invited_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Permissions badges */}
                    <div className="flex gap-1 mt-2">
                      {collaborator.permissions.can_edit && (
                        <Badge variant="outline" className="text-xs">Edit</Badge>
                      )}
                      {collaborator.permissions.can_comment && (
                        <Badge variant="outline" className="text-xs">Comment</Badge>
                      )}
                      {collaborator.permissions.can_approve && (
                        <Badge variant="outline" className="text-xs">Approve</Badge>
                      )}
                      {collaborator.permissions.can_delete && (
                        <Badge variant="outline" className="text-xs">Delete</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {canManageCollaborators && collaborator.role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

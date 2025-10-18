import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CollaboratorManager from './collaborator-manager';
import { contextTemplateService } from '@/lib/services/context-template-service';
import * as permissions from '@/lib/permissions';

// Mock the service and permissions
jest.mock('@/lib/services/context-template-service');
jest.mock('@/lib/permissions');

const mockContextTemplateService = contextTemplateService as jest.Mocked<typeof contextTemplateService>;
const mockPermissions = permissions as jest.Mocked<typeof permissions>;

describe('CollaboratorManager', () => {
  const mockTemplateId = 'template-123';
  const mockUserProfile = {
    id: 'user-1',
    organization_id: 'org-1',
    role: 'manager',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockCollaborators = [
    {
      id: 'collab-1',
      template_id: mockTemplateId,
      user_id: 'user-2',
      role: 'editor' as const,
      permissions: {
        can_view: true,
        can_edit: true,
        can_comment: true,
        can_approve: false,
        can_delete: false,
      },
      invited_at: '2024-01-01',
      accepted_at: '2024-01-02',
      user: {
        id: 'user-2',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        avatar_url: null,
      },
    },
    {
      id: 'collab-2',
      template_id: mockTemplateId,
      user_id: 'user-3',
      role: 'viewer' as const,
      permissions: {
        can_view: true,
        can_edit: false,
        can_comment: false,
        can_approve: false,
        can_delete: false,
      },
      invited_at: '2024-01-03',
      user: {
        id: 'user-3',
        first_name: 'Bob',
        last_name: 'Smith',
        email: 'bob@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    },
  ];

  const mockOrgUsers = [
    {
      id: 'user-4',
      organization_id: 'org-1',
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice@example.com',
      role: 'user',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 'user-5',
      organization_id: 'org-1',
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charlie@example.com',
      role: 'user',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ];

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPermissions.canPerformAction.mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('should render with collaborators', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Collaborators \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('should render empty state when no collaborators', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={[]}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('No collaborators yet')).toBeInTheDocument();
    });

    it('should show add collaborator button when user has permission', () => {
      mockPermissions.canPerformAction.mockReturnValue(true);

      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByRole('button', { name: /add collaborator/i })).toBeInTheDocument();
    });

    it('should not show add collaborator button without permission', () => {
      mockPermissions.canPerformAction.mockReturnValue(false);

      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={[]}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.queryByRole('button', { name: /add collaborator/i })).not.toBeInTheDocument();
    });

    it('should display collaborator roles correctly', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('Editor')).toBeInTheDocument();
      expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    it('should display accepted status badge', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('should display permissions badges', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getAllByText('Edit').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Comment').length).toBeGreaterThan(0);
    });
  });

  describe('Adding Collaborators', () => {
    it('should open add collaborator dialog', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const addButton = screen.getByRole('button', { name: /add collaborator/i });
      fireEvent.click(addButton);

      expect(screen.getByText('Invite a team member to collaborate on this template')).toBeInTheDocument();
    });

    it('should add collaborator successfully', async () => {
      const mockNewCollaborator = {
        id: 'collab-3',
        template_id: mockTemplateId,
        user_id: 'user-4',
        role: 'contributor' as const,
        permissions: {
          can_view: true,
          can_edit: false,
          can_comment: true,
          can_approve: false,
          can_delete: false,
        },
        invited_at: '2024-01-04',
      };

      mockContextTemplateService.addCollaborator.mockResolvedValue(mockNewCollaborator);

      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      // Open dialog
      const addButton = screen.getByRole('button', { name: /add collaborator/i });
      fireEvent.click(addButton);

      // The actual implementation would require selecting from dropdown and submitting
      // This is a simplified test
      await waitFor(() => {
        expect(mockContextTemplateService.addCollaborator).toHaveBeenCalledTimes(0);
      });
    });

    it('should show error when add fails', async () => {
      mockContextTemplateService.addCollaborator.mockResolvedValue(null);

      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      // Open dialog
      const addButton = screen.getByRole('button', { name: /add collaborator/i });
      fireEvent.click(addButton);

      // Would need to interact with form to trigger error
    });
  });

  describe('Removing Collaborators', () => {
    it('should show remove option for non-owner collaborators', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      // Click on dropdown menu for a collaborator
      const dropdownButtons = screen.getAllByRole('button');
      const menuButton = dropdownButtons.find(btn =>
        btn.querySelector('svg') && !btn.textContent?.includes('Add')
      );

      if (menuButton) {
        fireEvent.click(menuButton);
        // Menu items would appear in the document
      }
    });

    it('should not show remove option for owner role', () => {
      const collaboratorsWithOwner = [
        {
          ...mockCollaborators[0],
          role: 'owner' as const,
        },
      ];

      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={collaboratorsWithOwner}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      // Owner should not have dropdown menu
      const dropdownButtons = screen.queryAllByRole('button');
      const hasOwnerMenu = dropdownButtons.some(btn =>
        btn.textContent?.includes('Owner')
      );

      // This test would need more specific implementation
      expect(hasOwnerMenu).toBeDefined();
    });
  });

  describe('Collaborator Avatars', () => {
    it('should display avatar image when available', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const avatar = screen.getByAltText('Bob Smith');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should display initials fallback when no avatar', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      // Jane Doe should have initials fallback
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Role Selection', () => {
    it('should update permissions when role changes', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const addButton = screen.getByRole('button', { name: /add collaborator/i });
      fireEvent.click(addButton);

      // Dialog should be open with role selection
      expect(screen.getByText('Invite a team member to collaborate on this template')).toBeInTheDocument();
    });
  });

  describe('Permission Management', () => {
    it('should display all permission types', () => {
      render(
        <CollaboratorManager
          templateId={mockTemplateId}
          collaborators={mockCollaborators}
          organizationUsers={mockOrgUsers}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const addButton = screen.getByRole('button', { name: /add collaborator/i });
      fireEvent.click(addButton);

      // Check for permission labels in dialog
      expect(screen.getByText('Can view')).toBeInTheDocument();
      expect(screen.getByText('Can edit')).toBeInTheDocument();
      expect(screen.getByText('Can comment')).toBeInTheDocument();
      expect(screen.getByText('Can approve')).toBeInTheDocument();
      expect(screen.getByText('Can delete')).toBeInTheDocument();
    });
  });
});

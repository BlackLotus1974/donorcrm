import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CommentThread from './comment-thread';
import { contextTemplateService } from '@/lib/services/context-template-service';

// Mock the service
jest.mock('@/lib/services/context-template-service');

const mockContextTemplateService = contextTemplateService as jest.Mocked<typeof contextTemplateService>;

describe('CommentThread', () => {
  const mockTemplateId = 'template-123';
  const mockUserProfile = {
    id: 'user-1',
    organization_id: 'org-1',
    role: 'user',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockComments = [
    {
      id: 'comment-1',
      template_id: mockTemplateId,
      parent_comment_id: null,
      content: 'This is a top-level comment',
      component_path: null,
      line_number: null,
      is_resolved: false,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      created_by: 'user-2',
      created_user: {
        id: 'user-2',
        first_name: 'Jane',
        last_name: 'Doe',
        avatar_url: null,
      },
    },
    {
      id: 'comment-2',
      template_id: mockTemplateId,
      parent_comment_id: 'comment-1',
      content: 'This is a reply',
      component_path: null,
      line_number: null,
      is_resolved: false,
      created_at: '2024-01-01T11:00:00Z',
      updated_at: '2024-01-01T11:00:00Z',
      created_by: 'user-3',
      created_user: {
        id: 'user-3',
        first_name: 'Bob',
        last_name: 'Smith',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    },
    {
      id: 'comment-3',
      template_id: mockTemplateId,
      parent_comment_id: null,
      content: 'Resolved comment',
      component_path: null,
      line_number: null,
      is_resolved: true,
      resolved_at: '2024-01-02T12:00:00Z',
      resolved_by: 'user-1',
      created_at: '2024-01-01T12:00:00Z',
      updated_at: '2024-01-02T12:00:00Z',
      created_by: 'user-2',
      created_user: {
        id: 'user-2',
        first_name: 'Jane',
        last_name: 'Doe',
        avatar_url: null,
      },
    },
  ];

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render comment form', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={[]}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByPlaceholderText('Add a general comment...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /post comment/i })).toBeInTheDocument();
    });

    it('should render with component path placeholder', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={[]}
          componentPath="components.instructions"
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByPlaceholderText('Add a comment about this component...')).toBeInTheDocument();
    });

    it('should render comments list', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('This is a top-level comment')).toBeInTheDocument();
      expect(screen.getByText('Resolved comment')).toBeInTheDocument();
    });

    it('should render empty state when no comments', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={[]}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('No comments yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to add a comment')).toBeInTheDocument();
    });

    it('should render nested replies', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('This is a reply')).toBeInTheDocument();
    });

    it('should show resolved badge for resolved comments', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('Resolved')).toBeInTheDocument();
    });
  });

  describe('Adding Comments', () => {
    it('should disable post button when textarea is empty', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={[]}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const postButton = screen.getByRole('button', { name: /post comment/i });
      expect(postButton).toBeDisabled();
    });

    it('should enable post button when textarea has content', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={[]}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText('Add a general comment...');
      fireEvent.change(textarea, { target: { value: 'New comment' } });

      const postButton = screen.getByRole('button', { name: /post comment/i });
      expect(postButton).not.toBeDisabled();
    });

    it('should call service when posting comment', async () => {
      const mockNewComment = {
        id: 'comment-4',
        template_id: mockTemplateId,
        content: 'New comment',
        is_resolved: false,
        created_at: '2024-01-03T10:00:00Z',
        created_by: 'user-1',
      };

      mockContextTemplateService.addComment.mockResolvedValue(mockNewComment);

      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={[]}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText('Add a general comment...');
      fireEvent.change(textarea, { target: { value: 'New comment' } });

      const postButton = screen.getByRole('button', { name: /post comment/i });
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(mockContextTemplateService.addComment).toHaveBeenCalledWith(
          mockTemplateId,
          'New comment',
          undefined
        );
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('should clear textarea after posting', async () => {
      const mockNewComment = {
        id: 'comment-4',
        template_id: mockTemplateId,
        content: 'New comment',
        is_resolved: false,
        created_at: '2024-01-03T10:00:00Z',
        created_by: 'user-1',
      };

      mockContextTemplateService.addComment.mockResolvedValue(mockNewComment);

      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={[]}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText('Add a general comment...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'New comment' } });

      const postButton = screen.getByRole('button', { name: /post comment/i });
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });
  });

  describe('Replying to Comments', () => {
    it('should show reply button for top-level comments', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const replyButtons = screen.getAllByRole('button', { name: /reply/i });
      expect(replyButtons.length).toBeGreaterThan(0);
    });

    it('should open reply form when reply button clicked', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const replyButton = screen.getAllByRole('button', { name: /reply/i })[0];
      fireEvent.click(replyButton);

      expect(screen.getByPlaceholderText('Write your reply...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /post reply/i })).toBeInTheDocument();
    });

    it('should cancel reply form', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const replyButton = screen.getAllByRole('button', { name: /reply/i })[0];
      fireEvent.click(replyButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText('Write your reply...')).not.toBeInTheDocument();
    });
  });

  describe('Resolving Comments', () => {
    it('should show resolve button for unresolved comments', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getAllByRole('button', { name: /resolve/i }).length).toBeGreaterThan(0);
    });

    it('should show unresolve button for resolved comments', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByRole('button', { name: /unresolve/i })).toBeInTheDocument();
    });

    it('should call service when resolving comment', async () => {
      mockContextTemplateService.resolveComment.mockResolvedValue(true);

      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const resolveButton = screen.getAllByRole('button', { name: /^resolve$/i })[0];
      fireEvent.click(resolveButton);

      await waitFor(() => {
        expect(mockContextTemplateService.resolveComment).toHaveBeenCalledWith(
          'comment-1',
          true
        );
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Comment Display', () => {
    it('should display user avatars', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const avatar = screen.getByAltText('Bob Smith');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should display initials for users without avatars', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getAllByText('JD').length).toBeGreaterThan(0);
    });

    it('should display user names', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('should display relative timestamps', () => {
      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={mockComments}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      // The formatDate function should create relative time strings
      // This test would need to be more specific based on current time
      expect(screen.getAllByText(/ago|Just now/i).length).toBeGreaterThan(0);
    });
  });

  describe('Component Path Filtering', () => {
    it('should filter comments by component path', () => {
      const commentsWithPath = [
        ...mockComments,
        {
          id: 'comment-4',
          template_id: mockTemplateId,
          parent_comment_id: null,
          content: 'Component-specific comment',
          component_path: 'components.instructions',
          line_number: null,
          is_resolved: false,
          created_at: '2024-01-03T10:00:00Z',
          updated_at: '2024-01-03T10:00:00Z',
          created_by: 'user-1',
          created_user: {
            id: 'user-1',
            first_name: 'Test',
            last_name: 'User',
            avatar_url: null,
          },
        },
      ];

      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={commentsWithPath}
          componentPath="components.instructions"
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('Component-specific comment')).toBeInTheDocument();
      expect(screen.queryByText('This is a top-level comment')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show alert when adding comment fails', async () => {
      mockContextTemplateService.addComment.mockResolvedValue(null);
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      render(
        <CommentThread
          templateId={mockTemplateId}
          comments={[]}
          currentUserProfile={mockUserProfile}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText('Add a general comment...');
      fireEvent.change(textarea, { target: { value: 'New comment' } });

      const postButton = screen.getByRole('button', { name: /post comment/i });
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to add comment');
      });

      alertSpy.mockRestore();
    });
  });
});

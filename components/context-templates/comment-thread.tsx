'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Reply, Check, X, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContextTemplateComment, UserProfile } from '@/lib/types';
import { contextTemplateService } from '@/lib/services/context-template-service';

interface CommentThreadProps {
  templateId: string;
  comments: ContextTemplateComment[];
  componentPath?: string;
  currentUserProfile: UserProfile;
  onUpdate: () => void;
}

export default function CommentThread({
  templateId,
  comments,
  componentPath,
  currentUserProfile,
  onUpdate,
}: CommentThreadProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter comments by component path
  const filteredComments = componentPath
    ? comments.filter(c => c.component_path === componentPath)
    : comments.filter(c => !c.component_path); // Show general comments if no component path

  // Group comments into threads
  const topLevelComments = filteredComments.filter(c => !c.parent_comment_id);
  const commentReplies = (parentId: string) =>
    filteredComments.filter(c => c.parent_comment_id === parentId);

  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;

    try {
      setIsSubmitting(true);
      const result = await contextTemplateService.addComment(
        templateId,
        newCommentText.trim(),
        componentPath
      );

      if (result) {
        setNewCommentText('');
        onUpdate();
      } else {
        alert('Failed to add comment');
      }
    } catch (err) {
      alert('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return;

    try {
      setIsSubmitting(true);
      const result = await contextTemplateService.addComment(
        templateId,
        replyText.trim(),
        componentPath,
        parentCommentId
      );

      if (result) {
        setReplyText('');
        setReplyToComment(null);
        onUpdate();
      } else {
        alert('Failed to add reply');
      }
    } catch (err) {
      alert('Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      const success = await contextTemplateService.resolveComment(commentId, resolved);
      if (success) {
        onUpdate();
      } else {
        alert('Failed to update comment');
      }
    } catch (err) {
      alert('Failed to update comment');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const CommentItem = ({ comment, isReply = false }: { comment: ContextTemplateComment; isReply?: boolean }) => {
    const replies = commentReplies(comment.id);
    const showReplyForm = replyToComment === comment.id;

    return (
      <div className={`${isReply ? 'ml-8 mt-2' : ''}`}>
        <Card className={`${comment.is_resolved ? 'bg-green-50 border-green-200' : ''}`}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {comment.created_user?.avatar_url ? (
                    <img
                      src={comment.created_user.avatar_url}
                      alt={`${comment.created_user?.first_name || ''} ${comment.created_user?.last_name || ''}`}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                      {comment.created_user?.first_name?.[0]}
                      {comment.created_user?.last_name?.[0]}
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.created_user?.first_name} {comment.created_user?.last_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                    {comment.is_resolved && (
                      <Badge variant="default" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                    {comment.line_number && (
                      <Badge variant="outline" className="text-xs">
                        Line {comment.line_number}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    {!isReply && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setReplyToComment(comment.id)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    )}

                    {!comment.is_resolved ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-green-600"
                        onClick={() => handleResolveComment(comment.id, true)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleResolveComment(comment.id, false)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Unresolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => {
                      // In a full implementation, you'd call a delete service method
                      alert('Delete functionality would be implemented here');
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Reply Form */}
            {showReplyForm && (
              <div className="mt-3 ml-10">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddReply(comment.id)}
                    disabled={isSubmitting || !replyText.trim()}
                  >
                    {isSubmitting ? 'Posting...' : 'Post Reply'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyToComment(null);
                      setReplyText('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nested Replies */}
        {replies.length > 0 && (
          <div className="space-y-2 mt-2">
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-semibold">
              {componentPath ? 'Component Comments' : 'General Comments'}
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={componentPath ? 'Add a comment about this component...' : 'Add a general comment...'}
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleAddComment}
              disabled={isSubmitting || !newCommentText.trim()}
              size="sm"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      {topLevelComments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Be the first to add a comment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topLevelComments
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
        </div>
      )}
    </div>
  );
}

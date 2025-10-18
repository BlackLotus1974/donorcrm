'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, MessageSquare, History, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { ContextTemplate, ContextTemplateCollaborator, ContextTemplateComment, ContextTemplateVersion, UserProfile } from '@/lib/types';
import CollaboratorManager from './collaborator-manager';
import CommentThread from './comment-thread';
import VersionHistory from './version-history';
import TemplateAnalytics from './template-analytics';
import { useRealtimeCollaboration } from '@/lib/hooks/use-realtime-collaboration';
import PresenceIndicator from './presence-indicator';
import RealtimeNotifications from './realtime-notifications';

interface CollaborationViewProps {
  template: ContextTemplate;
  userProfile: UserProfile;
  collaborators: ContextTemplateCollaborator[];
  comments: ContextTemplateComment[];
  versions: ContextTemplateVersion[];
  organizationUsers: UserProfile[];
}

export default function CollaborationView({
  template,
  userProfile,
  collaborators: initialCollaborators,
  comments: initialComments,
  versions: initialVersions,
  organizationUsers,
}: CollaborationViewProps) {
  const router = useRouter();
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [comments, setComments] = useState(initialComments);
  const [versions, setVersions] = useState(initialVersions);

  // Real-time collaboration
  const {
    activeUsers,
    realtimeEvents,
    clearEvents,
  } = useRealtimeCollaboration({
    templateId: template.id,
    currentUser: userProfile,
    enabled: true,
  });

  const handleUpdate = () => {
    router.refresh();
  };

  const handleDismissEvent = (event: any) => {
    // Remove dismissed event
    clearEvents();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href={`/context-templates/${template.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Template
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold">Collaboration</h1>
            <p className="text-gray-600 mt-1">{template.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PresenceIndicator activeUsers={activeUsers} maxDisplayed={5} />

          <Button asChild>
            <Link href={`/context-templates/${template.id}/edit`}>Edit Template</Link>
          </Button>
        </div>
      </div>

      {/* Real-time Notifications */}
      <RealtimeNotifications
        events={realtimeEvents}
        onDismiss={handleDismissEvent}
        onClear={clearEvents}
      />

      {/* Tabs */}
      <Tabs defaultValue="collaborators" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collaborators">
            <Users className="h-4 w-4 mr-2" />
            Collaborators
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="versions">
            <History className="h-4 w-4 mr-2" />
            Versions ({versions.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Collaborators Tab */}
        <TabsContent value="collaborators" className="mt-6">
          <CollaboratorManager
            templateId={template.id}
            collaborators={collaborators}
            organizationUsers={organizationUsers}
            currentUserProfile={userProfile}
            onUpdate={handleUpdate}
          />
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="mt-6">
          <div className="space-y-6">
            {/* General Comments */}
            <div>
              <h2 className="text-lg font-semibold mb-4">General Comments</h2>
              <CommentThread
                templateId={template.id}
                comments={comments}
                currentUserProfile={userProfile}
                onUpdate={handleUpdate}
              />
            </div>

            {/* Component-Specific Comments */}
            <div className="grid gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Component Comments</h2>
                <div className="grid gap-4">
                  {[
                    { path: 'components.instructions', label: 'Instructions' },
                    { path: 'components.user_prompt', label: 'User Prompt' },
                    { path: 'components.state_history', label: 'State/History' },
                    { path: 'components.long_term_memory', label: 'Long-term Memory' },
                    { path: 'components.retrieved_information', label: 'Retrieved Information' },
                    { path: 'components.available_tools', label: 'Available Tools' },
                    { path: 'components.structured_output', label: 'Structured Output' },
                  ].map(({ path, label }) => {
                    const componentComments = comments.filter(c => c.component_path === path);
                    if (componentComments.length === 0) return null;

                    return (
                      <details key={path} className="group">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100">
                            <span className="font-medium">{label}</span>
                            <span className="text-sm text-gray-600">
                              {componentComments.length} comment{componentComments.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </summary>
                        <div className="mt-4 pl-4">
                          <CommentThread
                            templateId={template.id}
                            comments={comments}
                            componentPath={path}
                            currentUserProfile={userProfile}
                            onUpdate={handleUpdate}
                          />
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions" className="mt-6">
          <VersionHistory
            templateId={template.id}
            versions={versions}
            currentVersion={template.version}
            currentUserProfile={userProfile}
            onRestore={handleUpdate}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <TemplateAnalytics templateId={template.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

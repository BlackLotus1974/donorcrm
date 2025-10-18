'use client';

import { useEffect, useState } from 'react';
import { RealtimeEvent } from '@/lib/services/realtime-collaboration-service';
import { Card } from '@/components/ui/card';
import { X, MessageSquare, UserPlus, FileText, GitBranch, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RealtimeNotificationsProps {
  events: RealtimeEvent[];
  onDismiss: (event: RealtimeEvent) => void;
  onClear: () => void;
}

export default function RealtimeNotifications({
  events,
  onDismiss,
  onClear,
}: RealtimeNotificationsProps) {
  const [visibleEvents, setVisibleEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    // Only show most recent 3 events
    setVisibleEvents(events.slice(0, 3));

    // Auto-dismiss events after 5 seconds
    const timers = events.slice(0, 3).map((event, index) =>
      setTimeout(() => {
        onDismiss(event);
      }, 5000 + index * 500) // Stagger dismissals
    );

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [events]);

  const getEventIcon = (type: RealtimeEvent['type']) => {
    switch (type) {
      case 'comment_added':
        return <MessageSquare className="h-4 w-4" />;
      case 'comment_resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'collaborator_added':
        return <UserPlus className="h-4 w-4" />;
      case 'template_updated':
        return <FileText className="h-4 w-4" />;
      case 'version_created':
        return <GitBranch className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: RealtimeEvent['type']) => {
    switch (type) {
      case 'comment_added':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'comment_resolved':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'collaborator_added':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'template_updated':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'version_created':
        return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getEventMessage = (event: RealtimeEvent): string => {
    switch (event.type) {
      case 'comment_added':
        return `New comment: "${event.data.content?.substring(0, 50)}${event.data.content?.length > 50 ? '...' : ''}"`;
      case 'comment_resolved':
        return `Comment resolved`;
      case 'collaborator_added':
        return `${event.data.user_name} was added as a collaborator`;
      case 'template_updated':
        return `Template was updated`;
      case 'version_created':
        return `New version ${event.data.version} created`;
      default:
        return 'Update occurred';
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 5) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  if (visibleEvents.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {visibleEvents.map((event) => (
        <Card
          key={`${event.timestamp}-${event.type}`}
          className={`p-3 border shadow-lg animate-in slide-in-from-right ${getEventColor(event.type)}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getEventIcon(event.type)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {getEventMessage(event)}
              </p>
              <p className="text-xs opacity-70 mt-1">
                {formatTimeAgo(event.timestamp)}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-6 w-6 p-0"
              onClick={() => onDismiss(event)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      ))}

      {events.length > 3 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="text-xs"
          >
            Clear all ({events.length - 3} more)
          </Button>
        </div>
      )}
    </div>
  );
}

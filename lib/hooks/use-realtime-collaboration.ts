import { useEffect, useState, useCallback, useRef } from 'react';
import {
  realtimeCollaborationService,
  PresenceUser,
  TypingUser,
  CursorPosition,
  RealtimeEvent,
} from '@/lib/services/realtime-collaboration-service';
import { UserProfile } from '@/lib/types';

interface UseRealtimeCollaborationOptions {
  templateId: string;
  currentUser: UserProfile;
  enabled?: boolean;
}

export function useRealtimeCollaboration({
  templateId,
  currentUser,
  enabled = true,
}: UseRealtimeCollaborationOptions) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert UserProfile to PresenceUser
  const presenceUser: PresenceUser = {
    user_id: currentUser.id,
    first_name: currentUser.first_name || '',
    last_name: currentUser.last_name || '',
    avatar_url: currentUser.avatar_url,
    last_active: new Date().toISOString(),
  };

  // Subscribe to presence
  useEffect(() => {
    if (!enabled) return;

    const channel = realtimeCollaborationService.subscribeToPresence(
      templateId,
      presenceUser,
      (users) => {
        // Filter out current user from active users
        setActiveUsers(users.filter(u => u.user_id !== currentUser.id));
      }
    );

    return () => {
      realtimeCollaborationService.unsubscribe(`template:${templateId}:presence`);
    };
  }, [templateId, currentUser.id, enabled]);

  // Subscribe to events
  useEffect(() => {
    if (!enabled) return;

    const channel = realtimeCollaborationService.subscribeToEvents(
      templateId,
      (event) => {
        // Don't show events from current user
        if (event.user_id !== currentUser.id) {
          setRealtimeEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
        }
      }
    );

    return () => {
      realtimeCollaborationService.unsubscribe(`template:${templateId}:events`);
    };
  }, [templateId, currentUser.id, enabled]);

  // Subscribe to cursors
  useEffect(() => {
    if (!enabled) return;

    const channel = realtimeCollaborationService.subscribeToCursors(
      templateId,
      (cursorMap) => {
        // Filter out current user's cursor
        const filteredCursors = new Map(cursorMap);
        filteredCursors.delete(currentUser.id);
        setCursors(filteredCursors);
      }
    );

    return () => {
      realtimeCollaborationService.unsubscribe(`template:${templateId}:cursors`);
    };
  }, [templateId, currentUser.id, enabled]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!enabled) return;

    const channel = realtimeCollaborationService.subscribeToTyping(
      templateId,
      (users) => {
        // Filter out current user
        setTypingUsers(users.filter(u => u.user_id !== currentUser.id));
      }
    );

    return () => {
      realtimeCollaborationService.unsubscribe(`template:${templateId}:typing`);
    };
  }, [templateId, currentUser.id, enabled]);

  // Update presence (which component user is viewing)
  const updatePresence = useCallback(async (componentPath?: string) => {
    if (!enabled) return;

    await realtimeCollaborationService.updatePresence(templateId, {
      user_id: currentUser.id,
      first_name: currentUser.first_name || '',
      last_name: currentUser.last_name || '',
      avatar_url: currentUser.avatar_url,
      viewing_component: componentPath,
    });
  }, [templateId, currentUser.id, enabled]);

  // Broadcast cursor position
  const broadcastCursor = useCallback(async (x: number, y: number, componentPath?: string) => {
    if (!enabled) return;

    await realtimeCollaborationService.broadcastCursor(templateId, {
      user_id: currentUser.id,
      x,
      y,
      component_path: componentPath,
    });
  }, [templateId, currentUser.id, enabled]);

  // Start typing indicator
  const startTyping = useCallback(async (componentPath?: string) => {
    if (!enabled) return;

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const typingUser: TypingUser = {
      user_id: currentUser.id,
      first_name: currentUser.first_name || '',
      last_name: currentUser.last_name || '',
      component_path: componentPath,
      typing_at: new Date().toISOString(),
    };

    await realtimeCollaborationService.broadcastTyping(templateId, typingUser, true);

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [templateId, currentUser.id, enabled]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!enabled) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const typingUser: TypingUser = {
      user_id: currentUser.id,
      first_name: currentUser.first_name || '',
      last_name: currentUser.last_name || '',
      typing_at: new Date().toISOString(),
    };

    await realtimeCollaborationService.broadcastTyping(templateId, typingUser, false);
  }, [templateId, currentUser.id, enabled]);

  // Broadcast an event
  const broadcastEvent = useCallback(async (
    type: RealtimeEvent['type'],
    data: any
  ) => {
    if (!enabled) return;

    await realtimeCollaborationService.broadcastEvent(templateId, {
      type,
      data,
      user_id: currentUser.id,
    });
  }, [templateId, currentUser.id, enabled]);

  // Clear old events
  const clearEvents = useCallback(() => {
    setRealtimeEvents([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    activeUsers,
    typingUsers,
    cursors,
    realtimeEvents,
    isConnected: enabled && activeUsers.length >= 0,

    // Actions
    updatePresence,
    broadcastCursor,
    startTyping,
    stopTyping,
    broadcastEvent,
    clearEvents,
  };
}

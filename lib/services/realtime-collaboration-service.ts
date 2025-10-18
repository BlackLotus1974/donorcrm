import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  viewing_component?: string;
  cursor_position?: { x: number; y: number };
  last_active: string;
}

export interface TypingUser {
  user_id: string;
  first_name: string;
  last_name: string;
  component_path?: string;
  typing_at: string;
}

export interface CursorPosition {
  user_id: string;
  x: number;
  y: number;
  component_path?: string;
}

export interface RealtimeEvent {
  type: 'comment_added' | 'comment_resolved' | 'collaborator_added' | 'template_updated' | 'version_created';
  data: any;
  user_id: string;
  timestamp: string;
}

export class RealtimeCollaborationService {
  private supabase = createClient();
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to template presence (who's currently viewing)
   */
  subscribeToPresence(
    templateId: string,
    currentUser: PresenceUser,
    onPresenceChange: (users: PresenceUser[]) => void
  ): RealtimeChannel {
    const channelName = `template:${templateId}:presence`;

    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUser.user_id,
        },
      },
    });

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as PresenceUser[];
        onPresenceChange(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            ...currentUser,
            last_active: new Date().toISOString(),
          });
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Update current user's presence (e.g., which component they're viewing)
   */
  async updatePresence(
    templateId: string,
    updates: Partial<PresenceUser>
  ): Promise<void> {
    const channelName = `template:${templateId}:presence`;
    const channel = this.channels.get(channelName);

    if (channel) {
      await channel.track({
        ...updates,
        last_active: new Date().toISOString(),
      });
    }
  }

  /**
   * Subscribe to real-time events (comments, updates, etc.)
   */
  subscribeToEvents(
    templateId: string,
    onEvent: (event: RealtimeEvent) => void
  ): RealtimeChannel {
    const channelName = `template:${templateId}:events`;

    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase.channel(channelName);

    // Subscribe to broadcast messages
    channel
      .on('broadcast', { event: 'realtime_event' }, ({ payload }) => {
        onEvent(payload as RealtimeEvent);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Broadcast an event to all subscribers
   */
  async broadcastEvent(
    templateId: string,
    event: Omit<RealtimeEvent, 'timestamp'>
  ): Promise<void> {
    const channelName = `template:${templateId}:events`;
    const channel = this.channels.get(channelName);

    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'realtime_event',
        payload: {
          ...event,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Subscribe to cursor positions
   */
  subscribeToCursors(
    templateId: string,
    onCursorMove: (cursors: Map<string, CursorPosition>) => void
  ): RealtimeChannel {
    const channelName = `template:${templateId}:cursors`;
    const cursors = new Map<string, CursorPosition>();

    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        const cursor = payload as CursorPosition;
        cursors.set(cursor.user_id, cursor);
        onCursorMove(new Map(cursors));
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Broadcast cursor position
   */
  async broadcastCursor(
    templateId: string,
    cursor: CursorPosition
  ): Promise<void> {
    const channelName = `template:${templateId}:cursors`;
    const channel = this.channels.get(channelName);

    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: cursor,
      });
    }
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(
    templateId: string,
    onTypingChange: (typingUsers: TypingUser[]) => void
  ): RealtimeChannel {
    const channelName = `template:${templateId}:typing`;
    const typingUsers = new Map<string, TypingUser>();

    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'typing_start' }, ({ payload }) => {
        const user = payload as TypingUser;
        typingUsers.set(user.user_id, user);
        onTypingChange(Array.from(typingUsers.values()));
      })
      .on('broadcast', { event: 'typing_stop' }, ({ payload }) => {
        const userId = payload.user_id;
        typingUsers.delete(userId);
        onTypingChange(Array.from(typingUsers.values()));
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Broadcast typing status
   */
  async broadcastTyping(
    templateId: string,
    user: TypingUser,
    isTyping: boolean
  ): Promise<void> {
    const channelName = `template:${templateId}:typing`;
    const channel = this.channels.get(channelName);

    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: isTyping ? 'typing_start' : 'typing_stop',
        payload: isTyping ? user : { user_id: user.user_id },
      });
    }
  }

  /**
   * Subscribe to database changes for comments
   */
  subscribeToComments(
    templateId: string,
    onCommentChange: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `template:${templateId}:comments`;

    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'context_template_comments',
          filter: `template_id=eq.${templateId}`,
        },
        onCommentChange
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to database changes for collaborators
   */
  subscribeToCollaborators(
    templateId: string,
    onCollaboratorChange: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `template:${templateId}:collaborators`;

    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'context_template_collaborators',
          filter: `template_id=eq.${templateId}`,
        },
        onCollaboratorChange
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to database changes for template versions
   */
  subscribeToVersions(
    templateId: string,
    onVersionChange: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `template:${templateId}:versions`;

    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'context_template_versions',
          filter: `template_id=eq.${templateId}`,
        },
        onVersionChange
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Singleton instance
export const realtimeCollaborationService = new RealtimeCollaborationService();

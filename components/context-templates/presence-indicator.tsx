'use client';

import { PresenceUser } from '@/lib/services/realtime-collaboration-service';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users, Eye, Edit } from 'lucide-react';

interface PresenceIndicatorProps {
  activeUsers: PresenceUser[];
  maxDisplayed?: number;
}

export default function PresenceIndicator({
  activeUsers,
  maxDisplayed = 5,
}: PresenceIndicatorProps) {
  if (activeUsers.length === 0) {
    return null;
  }

  const displayedUsers = activeUsers.slice(0, maxDisplayed);
  const remainingCount = activeUsers.length - maxDisplayed;

  // Generate color for each user (consistent per user)
  const getUserColor = (userId: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitials = (user: PresenceUser): string => {
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  const formatLastActive = (lastActive: string): string => {
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Active indicator */}
      <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-green-700">
          {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'} active
        </span>
      </div>

      {/* User avatars */}
      <div className="flex -space-x-2">
        {displayedUsers.map((user) => (
          <TooltipProvider key={user.user_id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:scale-110 transition-transform ${getUserColor(
                    user.user_id
                  )}`}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(user)
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {user.first_name} {user.last_name}
                  </p>
                  {user.viewing_component && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Eye className="h-3 w-3" />
                      <span>Viewing: {user.viewing_component.replace('components.', '')}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    {formatLastActive(user.last_active)}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {remainingCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:scale-110 transition-transform">
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="space-y-1">
                  {activeUsers.slice(maxDisplayed).map((user) => (
                    <p key={user.user_id} className="text-xs">
                      {user.first_name} {user.last_name}
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

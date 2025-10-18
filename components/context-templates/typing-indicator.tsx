'use client';

import { TypingUser } from '@/lib/services/realtime-collaboration-service';
import { MessageSquare } from 'lucide-react';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  componentPath?: string;
}

export default function TypingIndicator({
  typingUsers,
  componentPath,
}: TypingIndicatorProps) {
  // Filter typing users for specific component if provided
  const filteredUsers = componentPath
    ? typingUsers.filter(u => u.component_path === componentPath)
    : typingUsers.filter(u => !u.component_path);

  if (filteredUsers.length === 0) {
    return null;
  }

  const formatTypingText = (): string => {
    const names = filteredUsers.map(u => u.first_name);

    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
    } else {
      return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing...`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
      <MessageSquare className="h-4 w-4 text-blue-600" />
      <span className="text-sm text-blue-700 font-medium">
        {formatTypingText()}
      </span>
      <div className="flex gap-1">
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

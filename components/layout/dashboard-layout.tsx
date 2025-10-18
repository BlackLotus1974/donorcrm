'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  Heart,
  BarChart3,
  Settings,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Building,
  Bell,
  Search,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/types';
import { canPerformAction } from '@/lib/permissions';
import { ThemeSwitcher } from '@/components/theme-switcher';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  requiredRoles?: string[];
  badge?: string;
}

const navigation: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard 
  },
  { 
    name: 'Donors', 
    href: '/donors', 
    icon: Users 
  },
  { 
    name: 'Campaigns', 
    href: '/campaigns', 
    icon: Heart,
    requiredRoles: ['manager', 'admin']
  },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: BarChart3 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    requiredRoles: ['manager', 'admin']
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  userProfile: UserProfile;
}

export default function DashboardLayout({ children, user, userProfile }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const filteredNavigation = navigation.filter(item => {
    if (!item.requiredRoles) return true;
    return item.requiredRoles.includes(userProfile.role);
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-lg">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <span className="font-semibold">Donor CRM</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {filteredNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center gap-2 px-4">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Donor CRM</span>
          </div>
          
          {/* Organization Info */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Building className="h-4 w-4 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile.organization?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {userProfile.organization?.subscription_tier || 'Basic'} Plan
                </p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-2">
              {filteredNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile.first_name} {userProfile.last_name}
                </p>
                <Badge className={`text-xs ${getRoleColor(userProfile.role)}`}>
                  {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Breadcrumb or page title could go here */}
          <div className="flex flex-1 items-center gap-x-4">
            <div className="flex-1" />
            
            {/* Quick actions */}
            <div className="flex items-center gap-2">
              {canPerformAction('create_donor', userProfile.role) && (
                <Button size="sm" asChild>
                  <Link href="/donors/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Donor
                  </Link>
                </Button>
              )}
              
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              
              <ThemeSwitcher />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="h-3 w-3 text-primary" />
                    </div>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">
                        {userProfile.first_name} {userProfile.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  
                  {userProfile.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/settings/organization">
                        <Building className="h-4 w-4 mr-2" />
                        Organization Settings
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
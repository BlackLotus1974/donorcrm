import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { canAccessRoute, PUBLIC_ROUTES } from "../permissions";
import { UserProfile } from "../types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if this is a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Handle unauthenticated users
  if (!user) {
    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // For authenticated users, get their profile and organization info
  let userProfile: UserProfile | null = null;
  
  if (!isPublicRoute) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', user.id)
        .single();

      userProfile = profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If we can't fetch profile, redirect to create one
      if (pathname !== '/onboarding') {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }
  }

  // Handle authenticated users accessing auth routes
  if (user && pathname.startsWith('/auth') && !pathname.includes('/confirm')) {
    const url = request.nextUrl.clone();
    // Redirect based on whether user has completed onboarding
    if (userProfile?.organization_id) {
      url.pathname = "/dashboard";
    } else {
      url.pathname = "/onboarding";
    }
    return NextResponse.redirect(url);
  }

  // Check route permissions for authenticated users on protected routes
  if (user && !isPublicRoute && userProfile) {
    const hasOrganization = !!userProfile.organization_id;
    const { canAccess, redirectTo } = canAccessRoute(pathname, userProfile.role, hasOrganization);

    if (!canAccess && redirectTo) {
      const url = request.nextUrl.clone();
      url.pathname = redirectTo;
      return NextResponse.redirect(url);
    }
  }

  // Handle root path redirect for authenticated users
  if (user && pathname === '/') {
    const url = request.nextUrl.clone();
    if (userProfile?.organization_id) {
      url.pathname = "/dashboard";
    } else {
      url.pathname = "/onboarding";
    }
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

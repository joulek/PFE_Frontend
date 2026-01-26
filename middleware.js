import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("token")?.value || null;
  const role = req.cookies.get("role")?.value || null; // ADMIN / RECRUITER / CANDIDATE

  const isLogin = pathname.startsWith("/login");

  const isAdminPath = pathname.startsWith("/admin");
  const isRecruiterPath = pathname.startsWith("/recruiter");

  // 1) إذا موش connecté و داخل zone protégée
  if ((isAdminPath || isRecruiterPath) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2) إذا connecté و يمشي login
  if (isLogin && token) {
    // redirect حسب role
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (role === "RECRUITER") {
      return NextResponse.redirect(new URL("/recruiter/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/jobs", req.url));
  }

  // 3) حماية admin
  if (isAdminPath && token && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/404", req.url));
  }

  // 4) حماية recruiter
  if (isRecruiterPath && token && (role !== "RECRUITER" && role !== "ADMIN")) {
    return NextResponse.redirect(new URL("/404", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/recruiter/:path*"],
};

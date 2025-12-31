import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdminPage = nextUrl.pathname.startsWith("/admin")
      const isOnProfilePage = nextUrl.pathname.startsWith("/profile")
      
      if (isOnAdminPage) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isOnProfilePage) {
        if (isLoggedIn) return true
        return false
      }
      return true
    },
  },
} satisfies NextAuthConfig


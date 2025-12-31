import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import bcrypt from "bcryptjs"
import { loginSchema } from "@/lib/validation"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const validated = loginSchema.parse(credentials);
          
          const user = await prisma.user.findUnique({
            where: { email: validated.email },
          });

          if (!user || !user.password) {
            return null;
          }

          const isValid = await bcrypt.compare(validated.password, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // Agregar staffRole a la sesión si está disponible
        if (token.staffRole) {
          (session.user as any).staffRole = token.staffRole;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        // Obtener staffRole del usuario
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { staffRole: true },
        });
        if (dbUser) {
          token.staffRole = dbUser.staffRole;
        }
      }
      // Si es OAuth, actualizar el usuario en la base de datos si es necesario
      if (account?.provider === 'google' && user) {
        // El adapter ya maneja esto, pero asegurémonos de tener el ID
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt", // Usar JWT para que funcione con Credentials y OAuth
  },
  pages: {
    signIn: "/login",
  },
})


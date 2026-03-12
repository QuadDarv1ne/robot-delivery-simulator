import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import { randomBytes, randomUUID } from "crypto"
import type { DefaultSession } from "next-auth"

// Extend NextAuth session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      group?: string | null
    } & DefaultSession["user"]
  }
  
  interface User {
    id: string
    role: string
    group?: string | null
    avatar?: string | null
  }
}

// Simple password hashing (in production use bcrypt)
function hashPassword(password: string): string {
  // Using a simple hash for demo - in production use bcrypt
  return Buffer.from(password).toString('base64')
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        action: { label: "Action", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const action = credentials.action || 'login'

        if (action === 'register') {
          // Register new user
          const existingUser = await db.user.findUnique({
            where: { email: credentials.email }
          })

          if (existingUser) {
            throw new Error("Пользователь уже существует")
          }

          const newUser = await db.user.create({
            data: {
              email: credentials.email,
              name: credentials.name || credentials.email.split('@')[0],
              password: hashPassword(credentials.password),
              role: 'student'
            }
          })

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
          }
        }

        // Login existing user
        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        if (!verifyPassword(credentials.password, user.password)) {
          return null
        }

        // Update last active
        await db.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          group: user.group
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    generateSessionToken: () => {
      return randomUUID?.() ?? randomBytes(32).toString("hex")
    }
  },
  pages: {
    signIn: "/",
    error: "/"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
        token.group = (user as any).group
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
        (session.user as any).group = token.group as string
      }
      return session
    }
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`)
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "robot-simulator-secret-key-2024"
}

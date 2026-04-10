import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export interface AuthUser {
  id: string
  name: string
  role: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Mode 1: Check environment variable credentials
          const envCredentials = process.env.NEXTAUTH_CREDENTIALS
          if (envCredentials) {
            const credentialPairs = envCredentials.split(',')
            for (const pair of credentialPairs) {
              const [username, hashedPassword] = pair.split(':')
              if (username.trim() === credentials.username) {
                const isValid = await compare(credentials.password, hashedPassword.trim())
                if (isValid) {
                  return {
                    id: username,
                    name: username,
                    role: 'admin'
                  }
                }
              }
            }
          }

          // Mode 2: Check database
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          })

          if (!user) {
            return null
          }

          const isValid = await compare(credentials.password, user.password)
          if (!isValid) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.role = (user as AuthUser).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || (() => {
    console.warn('NEXTAUTH_SECRET not set, generating random secret')
    return require('crypto').randomBytes(32).toString('hex')
  })(),
}

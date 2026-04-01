import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: { params: { prompt: "select_account" } },
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) return null;

        // Social-only account — no password set yet
        if (!user.password) {
          throw new Error("NO_PASSWORD");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // Block login if email not verified
        if (!user.emailVerified) {
          throw new Error("NOT_VERIFIED");
        }

        return user;
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    // ── OAuth sign-in: handle account linking ─────────────────────────────────
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;

      const providerName = account.provider; // "google"
      const email = user.email?.toLowerCase().trim();

      if (!email) return "/auth/login?error=OAuthNoEmail";

      const existing = await prisma.user.findUnique({ where: { email } });

      if (!existing) {
        // New user — PrismaAdapter creates User + Account, provider tagged in jwt callback
        return true;
      }

      // Check if this OAuth account is already linked
      const linkedAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider:          providerName,
            providerAccountId: account.providerAccountId,
          },
        },
      });

      if (linkedAccount) {
        // Already linked — sign in normally
        user.id    = existing.id;
        user.name  = existing.name  ?? user.name;
        user.image = existing.image ?? user.image;
        return true;
      }

      // Link this provider to the existing account
      await prisma.account.create({
        data: {
          userId:            existing.id,
          type:              account.type,
          provider:          providerName,
          providerAccountId: account.providerAccountId,
          access_token:      account.access_token  ?? null,
          refresh_token:     account.refresh_token ?? null,
          expires_at:        account.expires_at    ?? null,
          token_type:        account.token_type    ?? null,
          scope:             account.scope         ?? null,
          id_token:          account.id_token      ?? null,
          session_state:     (account.session_state as string) ?? null,
        },
      });

      if (!existing.providers.includes(providerName)) {
        await prisma.user.update({
          where: { id: existing.id },
          data:  { providers: { push: providerName } },
        });
      }

      // Point this sign-in at the existing user
      user.id    = existing.id;
      user.name  = existing.name  ?? user.name;
      user.image = existing.image ?? user.image;

      return true;
    },

    // ── JWT: ensure id + providers are always set ─────────────────────────────
    async jwt({ token, user, account, trigger }) {
      if (user) token.id = user.id;

      if (account && token.id) {
        const providerName = account.provider;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { providers: true },
        });

        if (dbUser) {
          const toAdd = providerName === "credentials" ? "email" : providerName;
          if (!dbUser.providers.includes(toAdd)) {
            await prisma.user.update({
              where: { id: token.id as string },
              data:  { providers: { push: toAdd } },
            });
            token.providers = [...dbUser.providers, toAdd];
          } else {
            token.providers = dbUser.providers;
          }
        }
      }

      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { providers: true },
        });
        token.providers = dbUser?.providers ?? [];
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id        = token.id        as string;
        session.user.providers = token.providers as string[] | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error:  "/auth/login",
  },
};

import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

export interface SessionData {
  userId?: string;
}

// Ne pas valider SESSION_SECRET au chargement du module : l'étape de build Next.js importe
// ce fichier sans .env réel (build image Docker). iron-session échoue au premier appel réel
// si le secret est absent/trop court — c'est-à-dire au runtime, jamais au build.
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "",
  cookieName: "budget_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

import { getIronSession } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";
import { sessionOptions, type SessionData } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const isLoggedIn = Boolean(session.userId);
  const isLoginPage = request.nextUrl.pathname === "/login";

  // Ne redirige que dans un sens (non connecté -> /login). L'inverse (connecté -> /) n'est pas
  // fait ici : le cookie ne peut pas être invalidé depuis un composant serveur si la session
  // pointe vers un utilisateur qui n'existe plus (base re-seedée) — /login doit rester
  // accessible dans ce cas, se reconnecter écrase simplement l'ancien cookie.
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)"],
};

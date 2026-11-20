import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (antigo middleware). Camada barata e rápida — a verificação real de sessão acontece
 * em cada página e Server Action do painel (requireAdmin), consultando o banco.
 *  1. /admin sem cookie de sessão → redireciona para o login.
 *  2. Requisições POST de Server Actions sem cabeçalho Origin são recusadas (o Next apenas
 *     avisa nesse caso; aqui endurecemos a proteção contra CSRF).
 */
const ADMIN_COOKIES = ["__Host-nv_admin", "nv_admin"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === "POST" && req.headers.has("next-action")) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!origin || !host || new URL(origin).host !== host) {
      return new NextResponse("Origem inválida", { status: 403 });
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const hasSession = ADMIN_COOKIES.some((c) => req.cookies.has(c));
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/((?!_next/static|_next/image|media|brand|api/webhooks|favicon|icon|apple-icon|manifest).*)"],
};

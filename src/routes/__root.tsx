import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useCarousel } from "@/lib/store";
import { toast } from "sonner";

import appCss from "../styles.css?url";

function clearLocalStateAndReload() {
  try {
    localStorage.removeItem("carousel-brand-v1");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") window.location.reload();
}

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">Si è verificato un errore inatteso</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Qualcosa è andato storto durante il caricamento dell'app. Puoi riprovare oppure pulire i dati locali e ricaricare.
        </p>
        {isDev && error?.message && (
          <pre className="mt-4 overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Riprova
          </button>
          <button
            onClick={clearLocalStateAndReload}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Pulisci dati locali e ricarica
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Vai alla home
          </Link>
        </div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Carousel Generator" },
      { name: "description", content: "Crea caroselli Instagram con template editoriali, multilingua, brand persistente ed export PNG 1080×1350." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Carousel Generator" },
      { property: "og:description", content: "Genera caroselli editoriali multilingua, esporta PNG 1080×1350." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  // Client-side rehydrate of persisted brand + presets (skipHydration is true in store).
  useEffect(() => {
    let restored = false;
    try {
      restored = !!localStorage.getItem("carousel-brand-v1");
    } catch {
      /* ignore */
    }
    void useCarousel.persist.rehydrate()?.then(() => {
      if (restored) {
        toast.success("Brand ripristinato dalla sessione precedente", {
          duration: 3000,
        });
      }
    });
  }, []);

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

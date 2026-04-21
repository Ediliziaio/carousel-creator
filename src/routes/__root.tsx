import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useCarousel } from "@/lib/store";
import { toast } from "sonner";

import appCss from "../styles.css?url";

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

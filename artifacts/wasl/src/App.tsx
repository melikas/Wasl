import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import {
  useGetSession,
  getGetSessionQueryKey,
} from "@workspace/api-client-react";
import { type AppLanguage } from "@/lib/i18n";
import { LanguageProvider } from "@/lib/language-context";

import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useClerk,
  useAuth,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";

import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import Feed from "@/pages/feed";
import Alerts from "@/pages/alerts";
import Documents from "@/pages/documents";
import Profile from "@/pages/profile";
import Agent from "@/pages/agent";
import Onboarding from "@/pages/onboarding";

import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from "wouter";
import { Button } from "./components/ui/button";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "hsl(211 60% 16%)", // navy
    fontFamily: "var(--font-sans)",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
  },
};

const demoCredentials = {
  username: "fatima_demo",
  email: "fatima.demo@example.com",
  password: "WaslDemoAccount2026!",
};

function DemoCredentialsCard() {
  const clerk = useClerk();
  const [, setLocation] = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInToDemo = async () => {
    if (!clerk.loaded || !clerk.client) return;

    setIsSigningIn(true);
    setError(null);
    try {
      const tokenResponse = await fetch(
        `${basePath}/api/demo/sign-in-token`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!tokenResponse.ok) {
        throw new Error("Demo sign-in token unavailable");
      }
      const { token } = (await tokenResponse.json()) as { token?: string };
      if (!token) {
        throw new Error("Demo sign-in token missing");
      }

      const result = await clerk.client.signIn.create({
        strategy: "ticket",
        ticket: token,
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        setError(
          "Demo sign-in could not be completed without verification.",
        );
        return;
      }

      await clerk.setActive({ session: result.createdSessionId });
      setLocation("/");
    } catch {
      setError(
        "Demo sign-in could not be completed. Please try the email and password manually.",
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <aside className="w-full max-w-[440px] rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 text-left shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
        Try the demo
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Use the button below to enter with the shared Fatima account. This
        password flow does not require a verification code.
      </p>
      <Button
        type="button"
        className="mt-4 w-full"
        onClick={signInToDemo}
        disabled={!clerk.loaded || isSigningIn}
      >
        {isSigningIn ? "Signing in…" : "Sign in to the demo"}
      </Button>
      {error ? (
        <p className="mt-3 text-sm leading-5 text-destructive">{error}</p>
      ) : null}
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Username</dt>
          <dd className="select-all rounded-md bg-background px-2 py-1 font-mono font-semibold text-foreground">
            {demoCredentials.username}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Email if requested</dt>
          <dd className="select-all rounded-md bg-background px-2 py-1 font-mono text-xs font-semibold text-foreground">
            {demoCredentials.email}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Password</dt>
          <dd className="select-all rounded-md bg-background px-2 py-1 font-mono font-semibold text-foreground">
            {demoCredentials.password}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        This is a shared demo account. Do not save private information or
        upload personal documents.
      </p>
    </aside>
  );
}

const queryClient = new QueryClient();

// Helps user's webview stay up-to-date when the signed-in user changes by invalidating the QueryClient cache.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ThemeController({ children }: { children: ReactNode }) {
  const { data: session } = useGetSession();

  useEffect(() => {
    const lang = session?.user?.preferredLanguage || "en";
    if (lang === "ar" || lang === "fa") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = lang;
    } else if (lang === "fr") {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "fr";
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
    }
  }, [session?.user?.preferredLanguage]);

  return (
    <LanguageProvider
      language={(session?.user?.preferredLanguage || "en") as AppLanguage}
    >
      {children}
    </LanguageProvider>
  );
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function LandingPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 text-center">
      <img
        src={`${basePath}/logo.png`}
        alt="Wasl Logo"
        className="w-24 h-24 mb-6 bg-white rounded-full p-2 shadow-lg"
      />
      <h1 className="text-4xl font-bold text-primary mb-4">Welcome to Wasl</h1>
      <p className="text-xl text-muted-foreground max-w-md mb-8">
        A private, culturally-aware care-coordination platform for everyday
        support.
      </p>
      <div className="flex gap-4">
        <Button
          size="lg"
          onClick={() => setLocation("/sign-in")}
          className="h-14 px-8 text-lg rounded-full"
        >
          Sign In
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setLocation("/sign-up")}
          className="h-14 px-8 text-lg rounded-full border-2"
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isSignedIn } = useAuth();
  const {
    data: session,
    isLoading,
    isError,
  } = useGetSession({
    query: { enabled: !!isSignedIn, queryKey: getGetSessionQueryKey() },
  });

  // If user is authenticated via Clerk but no session on backend (or 404), route to onboarding.
  return (
    <>
      <Show when="signed-in">
        {isLoading ? (
          <div className="min-h-[100dvh] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isError || !(session?.user as any)?.onboardingComplete ? (
          <Redirect to="/onboarding" />
        ) : (
          <Layout>
            <Home />
          </Layout>
        )}
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function AppRouter() {
  const { isSignedIn } = useAuth();
  const {
    data: session,
    isLoading,
    isError,
  } = useGetSession({
    query: { enabled: !!isSignedIn, queryKey: getGetSessionQueryKey() },
  });

  return (
    <RoutedErrorBoundary>
      <ThemeController>
        <Switch>
          <Route path="/sign-in/*?">
            <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-4 py-8">
              <SignIn
                routing="path"
                path={`${basePath}/sign-in`}
                signUpUrl={`${basePath}/sign-up`}
                fallbackRedirectUrl="/"
              />
              <DemoCredentialsCard />
            </div>
          </Route>
          <Route path="/sign-up/*?">
            <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
              <SignUp
                routing="path"
                path={`${basePath}/sign-up`}
                signInUrl={`${basePath}/sign-in`}
                fallbackRedirectUrl="/onboarding"
              />
            </div>
          </Route>

          <Route path="/" component={HomeRedirect} />

          <Route path="/onboarding">
            <Show when="signed-in">
              <Onboarding />
            </Show>
            <Show when="signed-out">
              <Redirect to="/" />
            </Show>
          </Route>

          {/* Protected routes wrapped in Layout */}
          <Route>
            <Show when="signed-in">
              {isLoading ? (
                <div className="min-h-[100dvh] flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : isError || !(session?.user as any)?.onboardingComplete ? (
                <Redirect to="/onboarding" />
              ) : (
                <Layout>
                  <Switch>
                    <Route path="/calendar" component={Calendar} />
                    <Route path="/feed" component={Feed} />
                    <Route path="/alerts" component={Alerts} />
                    <Route path="/documents" component={Documents} />
                    <Route path="/profile" component={Profile} />
                    <Route path="/agent" component={Agent} />
                    <Route path="/chat"><Redirect to="/feed?chat=open" /></Route>
                    <Route path="/permissions"><Redirect to="/profile" /></Route>
                    <Route component={NotFound} />
                  </Switch>
                </Layout>
              )}
            </Show>
            <Show when="signed-out">
              <Redirect to="/" />
            </Show>
          </Route>
        </Switch>
      </ThemeController>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [location, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;

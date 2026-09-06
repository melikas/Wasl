import { Link, useLocation } from "wouter";
import { Home, Calendar, Activity, Bell, Files } from "lucide-react";
import { useGetSession, useListAlerts } from "@workspace/api-client-react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAppTranslation } from "@/lib/language-context";
import { useClerk } from "@clerk/react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: session } = useGetSession();
  const { data: alerts } = useListAlerts();
  const { t } = useAppTranslation();
  const { signOut } = useClerk();

  // Keep focused flows free from the app navigation chrome.
  const isAgent = location === "/agent";
  const isOnboarding = location === "/onboarding";

  if (isAgent || isOnboarding) {
    return (
      <div className="min-h-[100dvh] bg-background w-full">{children}</div>
    );
  }

  const unreadAlerts =
    alerts?.filter((a) => a.urgency === "urgent").length || 0;

  // Role checks for tabs
  const role = session?.user?.role || "";
  const isDemoUser = session?.user?.username === "fatima_demo";
  const canSeeFeed =
    isDemoUser || role === "circle_lead" || role === "amanah_partner";
  const canSeeDocs =
    isDemoUser ||
    role === "circle_lead" ||
    role === "amanah_partner" ||
    role === "nurse";

  return (
    <div className="min-h-[100dvh] bg-background w-full flex flex-col pb-24 font-sans text-foreground">
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Wasl Logo"
              className="h-10 w-10 object-contain rounded-full bg-white p-1"
            />
            <h1 className="text-xl font-bold text-primary">Wasl</h1>
          </Link>
          <div className="flex items-center gap-4">
            {session?.user && (
              <Link href="/profile" className="rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                  <AvatarFallback className="bg-primary/5 text-primary text-xs">
                    {session.user.avatarInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border pb-safe">
        <div className="flex items-center justify-around h-20 max-w-3xl mx-auto px-2">
          <NavItem
            href="/"
            icon={<Home />}
            label={t("Home")}
            isActive={location === "/"}
          />
          <NavItem
            href="/calendar"
            icon={<Calendar />}
            label={t("Calendar")}
            isActive={location === "/calendar"}
          />
          {canSeeFeed && (
            <NavItem
              href="/feed"
              icon={<Activity />}
              label={t("Feed")}
              isActive={location === "/feed"}
            />
          )}
          <NavItem
            href="/alerts"
            icon={<Bell />}
            label={t("Alerts")}
            isActive={location === "/alerts"}
            badge={unreadAlerts > 0 ? unreadAlerts : undefined}
          />
          {canSeeDocs && (
            <NavItem
              href="/documents"
              icon={<Files />}
              label={t("Documents")}
              isActive={location === "/documents"}
            />
          )}
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  isActive,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-col items-center justify-center h-full space-y-1 px-3 relative ${isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-2 -right-3 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
            {badge}
          </span>
        )}
      </div>
      <span className="w-full truncate text-center text-[11px] sm:text-sm">
        {label}
      </span>
    </Link>
  );
}

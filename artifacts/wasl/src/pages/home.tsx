import { useGetDashboard } from "@workspace/api-client-react";
import { Clock, Mic } from "lucide-react";
import { Link } from "wouter";
import { useAppTranslation } from "@/lib/language-context";
import { formatTodayPlan } from "@/lib/i18n";

export default function Home() {
  const { data: dashboard, isLoading } = useGetDashboard();
  const { language, t } = useAppTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-24 bg-muted rounded-2xl"></div>
        <div className="h-64 bg-muted rounded-[3rem]"></div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="relative z-0 flex min-h-[calc(100dvh-12rem)] flex-col gap-6 pt-4 sm:pt-6">
      <div className="shrink-0 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
          {dashboard.greeting}
        </h1>
        <p className="text-lg text-muted-foreground font-medium flex items-center justify-center gap-2">
          <Clock className="w-5 h-5" /> {dashboard.prayerName}{" "}
          {t("Prayer time in")}{" "}
          {dashboard.prayerCountdown}
        </p>
      </div>

      <div className="flex min-h-[280px] flex-1 flex-col justify-center px-2 pb-4 sm:px-8">
        <Link
          href="/agent"
          className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-[3rem] bg-primary p-8 text-primary-foreground shadow-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="rounded-full bg-secondary/20 p-8 shadow-inner">
            <Mic className="h-16 w-16 text-secondary" />
          </div>
          <span className="text-3xl font-bold tracking-tight">
            {t("Talk to Wasl")}
          </span>
        </Link>
      </div>

      {dashboard.todayTasks.length > 0 && (
        <div className="text-center">
          <Link
            href="/calendar"
            className="inline-flex items-center justify-center rounded-full bg-secondary/15 px-6 py-3 text-secondary-foreground font-bold hover:bg-secondary/25 transition-colors"
          >
            {formatTodayPlan(dashboard.todayTasks.length, language)}
          </Link>
        </div>
      )}
    </div>
  );
}

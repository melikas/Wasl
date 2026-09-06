import { useListAlerts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Alerts() {
  const { data: alerts, isLoading } = useListAlerts();

  if (isLoading) {
    return <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-muted rounded-2xl" />
      <div className="h-32 bg-muted rounded-2xl" />
    </div>;
  }

  const urgentAlerts = alerts?.filter(a => a.urgency === 'urgent') || [];
  const standardAlerts = alerts?.filter(a => a.urgency !== 'urgent') || [];

  return (
    <div className="space-y-6">
      <div className="py-2">
        <h1 className="text-3xl font-bold text-primary mb-2">Alerts</h1>
        <p className="text-muted-foreground text-lg">Action items requiring your attention.</p>
      </div>

      {alerts?.length === 0 ? (
        <div className="text-center p-12 bg-muted rounded-3xl">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">You're all caught up</h3>
          <p className="text-muted-foreground">No pending alerts.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {urgentAlerts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Urgent Action Needed
              </h2>
              {urgentAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} isUrgent />
              ))}
            </div>
          )}

          {standardAlerts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary">FYI & Reminders</h2>
              {standardAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, isUrgent = false }: { alert: any, isUrgent?: boolean }) {
  return (
    <Card className={isUrgent ? 'border-destructive/50 bg-destructive/5' : ''}>
      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className={`text-xl font-bold mb-1 ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
            {alert.title}
          </h3>
          <p className="text-muted-foreground text-base mb-2">{alert.detail}</p>
          <p className="text-sm font-medium text-foreground/70">Due: {formatDate(alert.dueAt)}</p>
        </div>
        <Button variant={isUrgent ? 'destructive' : 'secondary'} className="rounded-xl shrink-0">
          Acknowledge
        </Button>
      </CardContent>
    </Card>
  );
}

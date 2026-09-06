import { useState } from "react";
import {
  useListTasks,
  useUpdateTask,
  getListTasksQueryKey,
  getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  ListTodo,
  MapPin,
  Pill,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { CreateDrawer } from "@/components/calendar/create-drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isTomorrow,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export default function Calendar() {
  const { data: tasks, isLoading } = useListTasks();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState("tasks");

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-12 bg-muted rounded-full w-full mb-6" />
        <div className="h-28 bg-muted rounded-3xl" />
        <div className="h-28 bg-muted rounded-3xl" />
        <div className="h-28 bg-muted rounded-3xl" />
      </div>
    );
  }

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "not_assigned" : "done";
    updateTask.mutate(
      { id, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          // Update cache locally instead of invalidating to prevent jumpy UI
          queryClient.setQueryData(getListTasksQueryKey(), (oldTasks: any) => {
            if (!oldTasks) return oldTasks;
            return oldTasks.map((t: any) =>
              t.id === id ? { ...t, status: newStatus } : t,
            );
          });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardQueryKey(),
          });
        },
      },
    );
  };

  const formatTaskTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };

  const getDayLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMM d");
  };

  // Group tasks by day label
  const groupedTasks =
    tasks?.reduce(
      (acc, task) => {
        const label = getDayLabel(task.dueAt);
        if (!acc[label]) acc[label] = [];
        acc[label].push(task);
        return acc;
      },
      {} as Record<string, typeof tasks>,
    ) || {};

  const sortedTasks = [...(tasks || [])].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  );
  const monthAnchor = sortedTasks.length
    ? new Date(sortedTasks[0].dueAt)
    : new Date();
  const monthDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthAnchor)),
    end: endOfWeek(endOfMonth(monthAnchor)),
  });

  const taskList =
    tasks?.length === 0 ? (
      <EmptyCalendar />
    ) : (
      Object.entries(groupedTasks).map(([dayLabel, dayTasks]) => (
        <div key={dayLabel} className="space-y-4">
          <h2 className="text-lg font-bold text-primary/80 pl-2">{dayLabel}</h2>
          <div className="space-y-3">
            {dayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => handleToggleStatus(task.id, task.status)}
                timeLabel={formatTaskTime(task.dueAt)}
              />
            ))}
          </div>
        </div>
      ))
    );

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Area */}
      <div className="sticky top-[72px] z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 pb-3 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full flex-shrink-0 h-12 w-12 border-2"
          >
            <SlidersHorizontal className="h-5 w-5 text-primary" />
          </Button>

          <div className="flex-1">
            <Select value={view} onValueChange={setView}>
              <SelectTrigger className="w-full h-12 rounded-full border-2 bg-transparent text-base font-bold text-primary flex justify-center gap-2">
                <ArrowUpDown className="h-4 w-4 opacity-50" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendar">Calendar</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => setCreateOpen(true)}
            size="icon"
            className="rounded-full flex-shrink-0 h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="space-y-8 flex-1 pt-2">
        {view === "tasks" && taskList}

        {view === "schedule" &&
          (sortedTasks.length === 0 ? (
            <EmptyCalendar />
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTasks).map(([dayLabel, dayTasks]) => (
                <section key={dayLabel}>
                  <h2 className="text-2xl font-bold text-primary mb-5">
                    {dayLabel}
                  </h2>
                  <div className="relative ml-4 border-l-2 border-secondary/35 space-y-6">
                    {dayTasks
                      .sort(
                        (a, b) =>
                          new Date(a.dueAt).getTime() -
                          new Date(b.dueAt).getTime(),
                      )
                      .map((task) => (
                        <div key={task.id} className="relative pl-7">
                          <span className="absolute -left-[7px] top-3 h-3 w-3 rounded-full bg-secondary ring-4 ring-background" />
                          <p className="text-sm font-bold text-secondary mb-2">
                            {formatTaskTime(task.dueAt)}
                          </p>
                          <TaskCard
                            task={task}
                            onToggle={() =>
                              handleToggleStatus(task.id, task.status)
                            }
                            timeLabel={format(new Date(task.dueAt), "MMM d")}
                          />
                        </div>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          ))}

        {view === "calendar" && (
          <div className="space-y-7">
            <section className="rounded-[1.75rem] bg-card border-2 border-border/60 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-semibold text-secondary">
                    Circle calendar
                  </p>
                  <h2 className="text-2xl font-bold text-primary">
                    {format(monthAnchor, "MMMM yyyy")}
                  </h2>
                </div>
                <CalendarIcon className="h-7 w-7 text-primary" />
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="py-2 text-xs font-bold text-muted-foreground"
                    >
                      {day}
                    </div>
                  ),
                )}
                {monthDays.map((day) => {
                  const dayTasks = sortedTasks.filter((task) =>
                    isSameDay(new Date(task.dueAt), day),
                  );
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-16 rounded-xl p-1.5 border ${isToday(day) ? "border-secondary bg-secondary/10" : "border-transparent"} ${!isSameMonth(day, monthAnchor) ? "opacity-35" : ""}`}
                    >
                      <span className="text-sm font-semibold">
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 flex justify-center gap-1 flex-wrap">
                        {dayTasks.slice(0, 3).map((task) => (
                          <span
                            key={task.id}
                            title={task.title}
                            className={`h-2 w-2 rounded-full ${task.status === "done" ? "bg-muted-foreground" : task.urgency === "urgent" ? "bg-destructive" : "bg-secondary"}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <div>
              <h2 className="text-xl font-bold text-primary mb-4">
                This month
              </h2>
              {taskList}
            </div>
          </div>
        )}
      </div>

      <CreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function EmptyCalendar() {
  return (
    <div className="text-center p-10 bg-muted/30 rounded-[2rem] border-2 border-dashed border-border/50 mt-10">
      <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CalendarIcon className="w-10 h-10 text-secondary" />
      </div>
      <h3 className="text-xl font-bold text-primary mb-2">
        No tasks scheduled
      </h3>
      <p className="text-muted-foreground text-sm">
        Tap the + button to create a task, appointment, or reminder.
      </p>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  timeLabel,
}: {
  task: any;
  onToggle: () => void;
  timeLabel: string;
}) {
  const isDone = task.status === "done";
  const isAppointment = task.label?.toLowerCase() === "appointment";
  const isMedication = task.label?.toLowerCase() === "medication";

  // Choose icon based on label
  let Icon = ListTodo;
  if (isAppointment) Icon = MapPin;
  if (isMedication) Icon = Pill;

  return (
    <Card
      className={`rounded-[1.5rem] border-2 transition-all ${isDone ? "opacity-60 bg-muted/20 border-transparent shadow-none" : "shadow-sm hover:shadow-md border-border/50"}`}
    >
      <CardContent className="p-4 flex gap-4">
        <button
          onClick={onToggle}
          className="mt-1 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 rounded-full h-8 w-8 flex items-center justify-center"
        >
          {isDone ? (
            <CheckCircle2 className="w-8 h-8 text-secondary" />
          ) : (
            <Circle className="w-8 h-8" />
          )}
        </button>

        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3
              className={`text-lg font-bold truncate ${isDone ? "line-through text-muted-foreground" : "text-primary"}`}
            >
              {task.title}
            </h3>
            <span className="text-sm font-semibold text-primary/60 whitespace-nowrap">
              {timeLabel}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-auto">
            <Badge
              variant="outline"
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1.5 ${
                isMedication
                  ? "bg-primary/5 text-primary border-primary/20"
                  : isAppointment
                    ? "bg-secondary/10 text-secondary-foreground border-secondary/30"
                    : "bg-muted text-muted-foreground border-border/50"
              }`}
            >
              <Icon className="w-3 h-3" />
              {task.label || "Task"}
            </Badge>

            {task.assigneeName && (
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-full pr-3 pl-1 py-1 border border-border/50 ml-auto">
                <Avatar className="w-5 h-5 border border-background">
                  <AvatarFallback className="text-[9px] bg-primary text-primary-foreground font-bold">
                    {task.assigneeName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-muted-foreground">
                  {task.assigneeName}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

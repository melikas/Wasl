import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Clock, Pill, Stethoscope, CheckCircle2, ChevronRight, X, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateTask, getListTasksQueryKey, getGetDashboardQueryKey, useListUsers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Schemas ---

const baseSchema = {
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  visibleToAll: z.boolean().default(true),
  assigneeId: z.string().optional(),
};

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  ...baseSchema,
});

const medicationSchema = z.object({
  medicationType: z.string().min(1, "Medication type is required"),
  dosage: z.string().min(1, "Dosage is required"),
  ...baseSchema,
});

const appointmentSchema = z.object({
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  ...baseSchema,
});

type ViewState = "options" | "task" | "medication" | "appointment";

interface CreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDrawer({ open, onOpenChange }: CreateDrawerProps) {
  const [view, setView] = React.useState<ViewState>("options");

  // Reset view when opened
  React.useEffect(() => {
    if (open) {
      setView("options");
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        {view === "options" && <OptionsView onSelect={setView} />}
        {view === "task" && <TaskFormView onBack={() => setView("options")} onClose={() => onOpenChange(false)} />}
        {view === "medication" && <MedicationFormView onBack={() => setView("options")} onClose={() => onOpenChange(false)} />}
        {view === "appointment" && <AppointmentFormView onBack={() => setView("options")} onClose={() => onOpenChange(false)} />}
      </DrawerContent>
    </Drawer>
  );
}

function OptionsView({ onSelect }: { onSelect: (v: ViewState) => void }) {
  return (
    <div className="pb-8">
      <DrawerHeader className="relative border-b border-border/50 pb-4">
        <DrawerTitle className="text-center text-xl font-bold text-primary">Coordinate Care Tasks</DrawerTitle>
        <DrawerDescription className="text-center text-base mt-2">
          Pick from one of the following three options
        </DrawerDescription>
        <DrawerClose asChild>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </DrawerClose>
      </DrawerHeader>
      
      <div className="p-4 space-y-3 mt-2">
        <OptionCard 
          icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
          title="Create a task"
          description="Add a simple task for yourself or to share when needed."
          onClick={() => onSelect("task")}
        />
        <OptionCard 
          icon={<Pill className="h-6 w-6 text-primary" />}
          title="Set medication reminder"
          description="Schedule a reminder to take or give medication on time."
          onClick={() => onSelect("medication")}
        />
        <OptionCard 
          icon={<Stethoscope className="h-6 w-6 text-primary" />}
          title="Add appointment reminder"
          description="Set a reminder to keep upcoming appointments organized."
          onClick={() => onSelect("appointment")}
        />
      </div>
      
      <div className="px-4 mt-6">
        <DrawerClose asChild>
          <Button variant="outline" className="w-full rounded-full h-12 text-base font-semibold border-2">
            Cancel
          </Button>
        </DrawerClose>
      </div>
    </div>
  );
}

function OptionCard({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 transition-colors text-left"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-lg text-primary truncate">{title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-tight">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

// --- Form Views ---

function useCreateHelper(onClose: () => void) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createTask = useCreateTask();

  const submit = (data: any, type: string) => {
    // Combine date and time
    const [year, month, day] = data.date.split('-');
    const [hours, minutes] = data.time.split(':');
    const dueAt = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes)).toISOString();

    createTask.mutate({
      data: {
        title: data.title,
        description: data.description || '',
        label: data.label,
        caregiverNeeded: false,
        assigneeUserId: data.assigneeId && data.assigneeId !== "me" ? parseInt(data.assigneeId) : undefined,
        urgency: "normal",
        dueAt,
        isEvent: data.isEvent,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: `${type} added successfully.` });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        onClose();
      },
      onError: () => {
        toast({ title: "Error", description: `Failed to create ${type.toLowerCase()}.`, variant: "destructive" });
      }
    });
  };

  return { submit, isPending: createTask.isPending };
}

function TaskFormView({ onBack, onClose }: { onBack: () => void, onClose: () => void }) {
  const { submit, isPending } = useCreateHelper(onClose);
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      visibleToAll: true,
      assigneeId: "me",
    }
  });

  const onSubmit = (values: z.infer<typeof taskSchema>) => {
    submit({
      title: values.title,
      description: values.description,
      label: "Task",
      isEvent: false,
      assigneeId: values.assigneeId,
      date: values.date,
      time: values.time,
      visibleToAll: values.visibleToAll,
    }, "Task");
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <FormHeader title="Task" onBack={onBack} />
      <div className="p-4 overflow-y-auto flex-1">
        <Form {...form}>
          <form id="task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Enter task title" className="rounded-2xl h-14 text-lg border-2 px-4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input type="date" className="rounded-2xl h-14 pl-11 border-2" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input type="time" className="rounded-2xl h-14 pl-11 border-2" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <p className="text-xs text-muted-foreground px-2 -mt-2">
              *Time shown in your local timezone.
            </p>

            <AssigneeSelect form={form} />

            <FormField control={form.control} name="visibleToAll" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-2xl border-2 p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Visible to everyone</FormLabel>
                  <FormDescription>Visible to all members of the team</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold ml-1">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Write your description here." 
                    className="min-h-[120px] rounded-2xl border-2 p-4 resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </form>
        </Form>
      </div>
      <div className="p-4 border-t bg-background">
        <Button 
          type="submit" 
          form="task-form" 
          className="w-full h-14 rounded-full text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function MedicationFormView({ onBack, onClose }: { onBack: () => void, onClose: () => void }) {
  const { submit, isPending } = useCreateHelper(onClose);
  const form = useForm<z.infer<typeof medicationSchema>>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      medicationType: "",
      dosage: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "20:00",
      visibleToAll: true,
      assigneeId: "me",
    }
  });

  const onSubmit = (values: z.infer<typeof medicationSchema>) => {
    submit({
      title: values.medicationType,
      description: `Dosage: ${values.dosage}`,
      label: "Medication",
      isEvent: false,
      assigneeId: values.assigneeId,
      date: values.date,
      time: values.time,
      visibleToAll: values.visibleToAll,
    }, "Medication Reminder");
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <FormHeader title="Medication Reminder" onBack={onBack} />
      <div className="p-4 overflow-y-auto flex-1">
        <Form {...form}>
          <form id="med-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField control={form.control} name="medicationType" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold ml-1 text-primary">Medication Type <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Ex. Fluoxetine, Aspirin, etc." className="rounded-2xl h-14 text-base border-2 px-4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="dosage" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold ml-1 text-primary">Amount per dosage <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Ex. 1x 5mg tablet, 30mL" className="rounded-2xl h-14 text-base border-2 px-4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold ml-1 text-primary">Start Date <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" className="rounded-2xl h-14 px-4 border-2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold ml-1 text-primary">Reminder Time <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="time" className="rounded-2xl h-14 px-4 border-2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <AssigneeSelect form={form} />

            <FormField control={form.control} name="visibleToAll" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-2xl border-2 p-4 mt-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Visible to everyone</FormLabel>
                  <FormDescription>Visible to all members of the team</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />
          </form>
        </Form>
      </div>
      <div className="p-4 border-t bg-background">
        <Button 
          type="submit" 
          form="med-form" 
          className="w-full h-14 rounded-full text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save Reminder"}
        </Button>
      </div>
    </div>
  );
}

function AppointmentFormView({ onBack, onClose }: { onBack: () => void, onClose: () => void }) {
  const { submit, isPending } = useCreateHelper(onClose);
  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      description: "",
      location: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      visibleToAll: true,
      assigneeId: "me",
    }
  });

  const onSubmit = (values: z.infer<typeof appointmentSchema>) => {
    submit({
      title: values.description,
      description: `Location: ${values.location}`,
      label: "Appointment",
      isEvent: true,
      assigneeId: values.assigneeId,
      date: values.date,
      time: values.time,
      visibleToAll: values.visibleToAll,
    }, "Appointment Reminder");
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <FormHeader title="Appointment Reminder" onBack={onBack} />
      <div className="p-4 overflow-y-auto flex-1">
        <Form {...form}>
          <form id="appt-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold ml-1 text-primary">Brief Description <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Dr. Smith Checkup" className="rounded-2xl h-14 text-base border-2 px-4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <AssigneeSelect form={form} />

            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold ml-1 text-primary">Appointment Location <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Clinic name or address" className="rounded-2xl h-14 text-base border-2 px-4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold ml-1 text-primary">Date <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" className="rounded-2xl h-14 px-4 border-2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold ml-1 text-primary">Time <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="time" className="rounded-2xl h-14 px-4 border-2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="visibleToAll" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-2xl border-2 p-4 mt-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Visible to everyone</FormLabel>
                  <FormDescription>Visible to all members of the team</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />
          </form>
        </Form>
      </div>
      <div className="p-4 border-t bg-background">
        <Button 
          type="submit" 
          form="appt-form" 
          className="w-full h-14 rounded-full text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Next"}
        </Button>
      </div>
    </div>
  );
}

function FormHeader({ title, onBack }: { title: string, onBack: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-primary font-semibold -ml-2">
        <ChevronRight className="h-5 w-5 rotate-180 mr-1" />
        Back
      </Button>
      <h3 className="font-bold text-lg text-primary absolute left-1/2 -translate-x-1/2">{title}</h3>
      <div className="w-16" /> {/* Spacer for centering */}
    </div>
  );
}

function AssigneeSelect({ form }: { form: any }) {
  const { data: users } = useListUsers();

  return (
    <FormField control={form.control} name="assigneeId" render={({ field }) => (
      <FormItem>
        <FormLabel className="text-base font-bold ml-1 text-primary">Send Notification To:</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="rounded-2xl h-14 text-base border-2 px-4">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="me">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">ME</div>
                No One - It's for me
              </div>
            </SelectItem>
            {users?.map(user => (
              <SelectItem key={user.id} value={user.id.toString()}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold">
                    {user.avatarInitials || user.preferredName.substring(0,2).toUpperCase()}
                  </div>
                  {user.preferredName}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )} />
  );
}

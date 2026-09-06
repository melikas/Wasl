import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getGetProfileQueryKey,
  getGetSessionQueryKey,
  useGetPendingOnboarding,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<string | null>(null);
  const [preferredName, setPreferredName] = useState("");
  const [language, setLanguage] = useState<"en" | "fr" | "ar" | "fa">("en");

  const [greetingStyle, setGreetingStyle] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("");
  const [modestyPersonalCare, setModestyPersonalCare] = useState(false);
  const [modestyMedicalVisits, setModestyMedicalVisits] = useState(false);
  const [modestyTransport, setModestyTransport] = useState(false);
  const [prayerRemindersEnabled, setPrayerRemindersEnabled] = useState(true);

  const [availabilitySummary, setAvailabilitySummary] = useState("");

  const [notificationPrayer, setNotificationPrayer] = useState(true);
  const [notificationAlerts, setNotificationAlerts] = useState(true);
  const [notificationReminders, setNotificationReminders] = useState(true);
  const [notificationTaskComplete, setNotificationTaskComplete] =
    useState(true);
  const [notificationArrivals, setNotificationArrivals] = useState(true);

  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pendingData, isLoading: isPendingLoading } = useGetPendingOnboarding();

  const handleNext = () => {
    if (step === 1 && pendingData?.role) {
      setRole(pendingData.role);
      if (pendingData.preferredName && !preferredName) {
        setPreferredName(pendingData.preferredName);
      }
      setStep(3); // skip role selection
    } else {
      setStep((s) => s + 1);
    }
  };
  
  const handleBack = () => {
    if (step === 3 && pendingData?.role) {
      setStep(1); // go back to start
    } else {
      setStep((s) => s - 1);
    }
  };

  const complete = async () => {
    if (
      !role ||
      !preferredName.trim() ||
      (role === "circle_lead" && !greetingStyle)
    )
      return;
    setIsPending(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        credentials: "include", // Was using same-origin, changing to include or relying on proxy
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          preferredName: preferredName.trim(),
          language,
          greetingStyle,
          dietaryPreference,
          modestyPersonalCare,
          modestyMedicalVisits,
          modestyTransport,
          prayerRemindersEnabled,
          notificationPrayer,
          notificationAlerts,
          notificationReminders,
          notificationTaskComplete,
          notificationArrivals,
          availabilitySummary: availabilitySummary.trim(),
          contact: getContactInfo(),
        }),
      });
       if (!response.ok) {
         const errorBody = await response.json().catch(() => null);
         throw new Error(errorBody?.error || "Onboarding failed");
       }

      await Promise.all([
         queryClient.refetchQueries({ queryKey: getGetSessionQueryKey() }),
         queryClient.refetchQueries({ queryKey: getGetProfileQueryKey() }),
      ]);
      toast({ title: "Your Wasl profile is ready" });
      setLocation("/");
    } catch {
      toast({
        title: "We couldn't finish setup",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const getContactInfo = () => {
    if (!user) return "";
    if (user.primaryEmailAddress) return user.primaryEmailAddress.emailAddress;
    if (user.primaryPhoneNumber) return user.primaryPhoneNumber.phoneNumber;
    return user.username || "";
  };

  return (
    <div className="flex min-h-[100dvh] w-full max-w-lg flex-col items-center justify-center overflow-x-hidden px-4 py-12 mx-auto space-y-8">
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300 w-full text-center">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Wasl Logo"
            className="w-24 h-24 mx-auto bg-white rounded-full p-2 shadow-lg mb-6"
          />
          <h1 className="text-4xl font-bold text-primary">Welcome to Wasl</h1>
          <p className="text-xl text-muted-foreground">
            Your private circle for culturally-aware care coordination.
          </p>
          <Button
            onClick={handleNext}
            disabled={isPendingLoading}
            size="lg"
            className="w-full h-16 text-lg mt-8 rounded-full shadow-lg gap-2"
          >
            {isPendingLoading ? "Loading..." : "Get Started"} <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300 w-full">
          <h2 className="text-3xl font-bold text-primary mb-2 text-center">
            What is your role?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 text-center">
            This helps Wasl set up your dashboard correctly.
          </p>

          <div className="grid gap-4 text-left">
            <RoleCard
              title="Circle Lead"
              desc="I am the elder receiving care."
              selected={role === "circle_lead"}
              onClick={() => setRole("circle_lead")}
            />
            <RoleCard
              title="Family Companion"
              desc="I am coordinating or providing care."
              selected={role === "amanah_partner"}
              onClick={() => setRole("amanah_partner")}
            />
            <RoleCard
              title="Professional Partner"
              desc="I am a nurse or external provider."
              selected={role === "nurse"}
              onClick={() => setRole("nurse")}
            />
            <RoleCard
              title="Community Volunteer"
              desc="I am a community companion."
              selected={role === "companion"}
              onClick={() => setRole("companion")}
            />
          </div>

          <Button
            disabled={!role}
            onClick={handleNext}
            size="lg"
            className="w-full h-16 text-lg mt-8 rounded-full shadow-lg gap-2"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300 w-full text-left">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 font-semibold text-primary"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>

          <div>
            <h2 className="text-3xl font-bold text-primary mb-2">
              Account Profile
            </h2>
            <p className="text-lg text-muted-foreground">
              Confirm your basic details.
            </p>
          </div>

          <div className="rounded-xl bg-muted/60 p-4 mb-4">
            <p className="text-sm text-muted-foreground">Account</p>
            <p className="font-bold">{getContactInfo()}</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="preferred-name">Preferred name</Label>
            <Input
              id="preferred-name"
              value={preferredName}
              onChange={(event) => setPreferredName(event.target.value)}
              placeholder="For example, Fatima"
              className="h-14 text-lg"
              autoFocus
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="signup-language">Preferred language</Label>
            <select
              id="signup-language"
              className="flex h-14 w-full rounded-xl border-2 border-input bg-card px-4 text-base"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as "en" | "fr" | "ar" | "fa")
              }
            >
              <option value="en">English</option>
              <option value="fr">Français (French)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="fa">فارسی (Persian)</option>
            </select>
          </div>
          <Button
            disabled={!preferredName.trim()}
            onClick={handleNext}
            size="lg"
            className="w-full h-16 text-lg rounded-full shadow-lg gap-2"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 4 && role === "circle_lead" && (
        <div className="space-y-8 animate-in slide-in-from-right fade-in duration-300 w-full text-left">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 font-semibold text-primary"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>

          <div>
            <h2 className="text-3xl font-bold text-primary mb-2">
              What Matters to Me
            </h2>
            <p className="text-lg text-muted-foreground">
              Your cultural and personal preferences.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="greeting-style" className="text-base">
              Greeting Style <span className="text-destructive">*</span>
            </Label>
            <select
              id="greeting-style"
              className="flex h-14 w-full rounded-xl border-2 border-input bg-card px-4 text-base"
              value={greetingStyle}
              onChange={(event) => setGreetingStyle(event.target.value)}
            >
              <option value="" disabled>
                Select a greeting style...
              </option>
              <option value="salam">Salam / Cultural Greeting</option>
              <option value="neutral">Neutral Professional</option>
              <option value="name_only">First Name Only</option>
            </select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="dietary" className="text-base">
              Dietary Requirements
            </Label>
            <Input
              id="dietary"
              value={dietaryPreference}
              onChange={(event) => setDietaryPreference(event.target.value)}
              placeholder="e.g. Halal only, low sodium, no nuts"
              className="h-14 text-base"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <Label className="text-base font-bold">Modesty & Comfort</Label>

            <div className="flex items-center justify-between gap-4">
              <Label
                className="flex-1 cursor-pointer font-normal"
                htmlFor="mod-pc"
              >
                Require same-gender assistance for personal care
              </Label>
              <Switch
                id="mod-pc"
                checked={modestyPersonalCare}
                onCheckedChange={setModestyPersonalCare}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label
                className="flex-1 cursor-pointer font-normal"
                htmlFor="mod-mv"
              >
                Require same-gender provider for medical visits if possible
              </Label>
              <Switch
                id="mod-mv"
                checked={modestyMedicalVisits}
                onCheckedChange={setModestyMedicalVisits}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label
                className="flex-1 cursor-pointer font-normal"
                htmlFor="mod-tr"
              >
                Require same-gender assistance for transport/walking
              </Label>
              <Switch
                id="mod-tr"
                checked={modestyTransport}
                onCheckedChange={setModestyTransport}
              />
            </div>
          </div>

          <Button
            disabled={!greetingStyle}
            onClick={handleNext}
            size="lg"
            className="w-full h-16 text-lg rounded-full shadow-lg gap-2"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 4 && role !== "circle_lead" && (
        <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300 w-full text-left">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 font-semibold text-primary"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>

          <div>
            <h2 className="text-3xl font-bold text-primary mb-2">
              Availability
            </h2>
            <p className="text-lg text-muted-foreground">
              When and how can you help?
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="availability" className="text-base">
              Your Schedule
            </Label>
            <Textarea
              id="availability"
              value={availabilitySummary}
              onChange={(e) => setAvailabilitySummary(e.target.value)}
              placeholder="e.g. Tuesday/Friday mornings for visits, weekends for transport"
              className="min-h-[120px] text-base rounded-xl resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Wasl will use this to suggest tasks that fit your schedule.
            </p>
          </div>

          <Button
            disabled={!availabilitySummary.trim()}
            onClick={handleNext}
            size="lg"
            className="w-full h-16 text-lg rounded-full shadow-lg gap-2 mt-8"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300 w-full text-left">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 font-semibold text-primary"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>

          <div>
            <h2 className="text-3xl font-bold text-primary mb-2">
              Notifications
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose what you want to hear about.
            </p>
          </div>

          <div className="space-y-5 pt-4">
            {role === "circle_lead" && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <Label
                    className="flex-1 cursor-pointer text-base font-normal"
                    htmlFor="notif-pray"
                  >
                    Prayer time reminders
                  </Label>
                  <Switch
                    id="notif-pray"
                    checked={notificationPrayer}
                    onCheckedChange={setNotificationPrayer}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label
                    className="flex-1 cursor-pointer text-base font-normal"
                    htmlFor="notif-arr"
                  >
                    Arrivals & Pickups
                  </Label>
                  <Switch
                    id="notif-arr"
                    checked={notificationArrivals}
                    onCheckedChange={setNotificationArrivals}
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between gap-4">
              <Label
                className="flex-1 cursor-pointer text-base font-normal"
                htmlFor="notif-alert"
              >
                Urgent alerts & changes
              </Label>
              <Switch
                id="notif-alert"
                checked={notificationAlerts}
                onCheckedChange={setNotificationAlerts}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label
                className="flex-1 cursor-pointer text-base font-normal"
                htmlFor="notif-rem"
              >
                Task reminders
              </Label>
              <Switch
                id="notif-rem"
                checked={notificationReminders}
                onCheckedChange={setNotificationReminders}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label
                className="flex-1 cursor-pointer text-base font-normal"
                htmlFor="notif-tc"
              >
                Task completions
              </Label>
              <Switch
                id="notif-tc"
                checked={notificationTaskComplete}
                onCheckedChange={setNotificationTaskComplete}
              />
            </div>
          </div>

          <Button
            disabled={isPending}
            onClick={complete}
            size="lg"
            className="w-full h-16 text-lg rounded-full shadow-lg gap-2 mt-8"
          >
            {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
            Complete Setup
          </Button>
        </div>
      )}
    </div>
  );
}

function RoleCard({
  title,
  desc,
  selected,
  onClick,
}: {
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all border-2 ${selected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-transparent hover:border-border"}`}
      onClick={onClick}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-xl mb-1">{title}</h3>
          <p className="text-muted-foreground">{desc}</p>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? "border-primary bg-primary text-white" : "border-muted-foreground"}`}
        >
          {selected && <Check className="w-4 h-4" />}
        </div>
      </CardContent>
    </Card>
  );
}

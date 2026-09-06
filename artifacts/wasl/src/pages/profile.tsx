import { useEffect, useState } from "react";
import {
  useGetProfile,
  useGetSession,
  useUpdateProfile,
  useListUsers,
  useInviteUser,
  useUpdateUser,
  getGetProfileQueryKey,
  getGetSessionQueryKey,
  getGetDashboardQueryKey,
  getListUsersQueryKey,
  type ProfileInput,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { User, Settings, Save, Users, Plus, ShieldCheck, Mail, LogOut, Check } from "lucide-react";
import { useClerk } from "@clerk/react";

export default function Profile() {
  const { data: profile, isLoading } = useGetProfile();
  const { data: session } = useGetSession();
  const { data: users } = useListUsers();
  
  const updateProfile = useUpdateProfile();
  const updateUser = useUpdateUser();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [localProfile, setLocalProfile] = useState<ProfileInput | null>(null);
  
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("amanah_partner");
  const inviteUser = useInviteUser();

  useEffect(() => {
    if (profile) setLocalProfile(profile);
  }, [profile, session?.user.id]);

  const handleSave = () => {
    if (!localProfile) return;
    updateProfile.mutate(
      { data: localProfile },
      {
        onSuccess: () => {
          toast({ title: "Preferences saved successfully" });
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        },
        onError: () => {
          toast({
            title: "Preferences were not saved",
            description: "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim() || !inviteRole) return;
    inviteUser.mutate({ data: { email: inviteEmail, preferredName: inviteName, role: inviteRole as any } }, {
      onSuccess: () => {
        toast({ title: "Invitation sent successfully" });
        setInviteOpen(false);
        setInviteEmail("");
        setInviteName("");
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
      onError: () => toast({ title: "Failed to send invitation", variant: "destructive" })
    });
  };

  const toggleManageMembers = (userId: number, current: boolean) => {
    updateUser.mutate({ id: userId, data: { canManageMembers: !current } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }),
      onError: () => toast({ title: "Could not update user", variant: "destructive" })
    });
  };

  const handleChange = <K extends keyof ProfileInput>(
    key: K,
    value: ProfileInput[K],
  ) => {
    setLocalProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveField = <K extends keyof ProfileInput>(
    key: K,
    value: ProfileInput[K],
  ) => {
    if (!localProfile) return;
    const next = { ...localProfile, [key]: value };
    setLocalProfile(next);

    updateProfile.mutate(
      { data: next },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
           queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          toast({
            title:
              key === "preferredLanguage"
                ? "Language updated"
                : "Preference saved",
          });
        },
        onError: () =>
          toast({ title: "Change was not saved", variant: "destructive" }),
      },
    );
  };

  if (isLoading || !localProfile || !session) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="h-[400px] bg-muted rounded-2xl" />
      </div>
    );
  }

  const isCircleLead = session.user.role === "circle_lead";
  const canManage = isCircleLead || (session.user as any).canManageMembers;

  return (
    <div className="space-y-6 pb-6">
      <div className="py-2 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Member Hub</h1>
          <p className="text-muted-foreground text-lg">Your profile and circle access.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => signOut({ redirectUrl: "/" })} className="text-muted-foreground hover:text-foreground">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" /> Circle Members
          </CardTitle>
          <CardDescription>
            The people in {session.circleName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {users?.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border shadow-sm">
                    <AvatarFallback>{u.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-sm">{u.preferredName} {u.id === session.user.id && "(You)"}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{u.role.replace("_", " ")} {u.isPending && "(Pending)"}</p>
                  </div>
                </div>
                {canManage && isCircleLead && u.id !== session.user.id && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`manage-${u.id}`} className="text-xs text-muted-foreground">Can Invite</Label>
                    <Switch id={`manage-${u.id}`} checked={!!u.canManageMembers} onCheckedChange={() => toggleManageMembers(u.id, !!u.canManageMembers)} />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {canManage && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mt-2 gap-2" variant="outline"><Plus className="w-4 h-4" /> Invite Member</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleInvite}>
                  <DialogHeader>
                    <DialogTitle>Invite new member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Name</Label>
                      <Input required value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Display name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <select required value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <option value="amanah_partner">Family Companion (Amanah Partner)</option>
                        <option value="nurse">Professional Partner (Nurse)</option>
                        <option value="companion">Community Volunteer (Companion)</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={inviteUser.isPending}>Send Invitation</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-secondary" /> Identity
          </CardTitle>
          <CardDescription>
            The details entered when your Wasl profile was created
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl bg-muted/60 p-4">
            <p className="text-sm text-muted-foreground">Account / Contact</p>
            <p className="font-bold">
              {(session.user as any).contact || session.user.name}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Role</p>
            <p className="font-bold capitalize">
              {session.user.role.replace("_", " ")}
            </p>
          </div>
          <div className="space-y-3">
            <Label>Preferred Name</Label>
            <Input
              value={localProfile.preferredName}
              onChange={(e) => handleChange("preferredName", e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Language Preference</Label>
            <select
              className="flex h-14 w-full rounded-xl border-2 border-input bg-transparent px-4 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={
                session.user.preferredLanguage ?? localProfile.preferredLanguage
              }
              onChange={(e) =>
                saveField(
                  "preferredLanguage",
                  e.target.value as ProfileInput["preferredLanguage"],
                )
              }
            >
              <option value="en">English</option>
              <option value="fr">Français (French)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="fa">فارسی (Persian)</option>
            </select>
          </div>

          {isCircleLead && (
            <>
              <div className="space-y-3">
                <Label>Greeting Style</Label>
                <select
                  className="flex h-14 w-full rounded-xl border-2 border-input bg-transparent px-4 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={localProfile.greetingStyle}
                  onChange={(e) =>
                    handleChange(
                      "greetingStyle",
                      e.target.value as ProfileInput["greetingStyle"],
                    )
                  }
                >
                  <option value="salam">Salam / Cultural Greeting</option>
                  <option value="neutral">Neutral Professional</option>
                  <option value="name_only">First Name Only</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label>Dietary Requirements</Label>
                <Input
                  value={localProfile.dietaryPreference}
                  onChange={(e) =>
                    handleChange("dietaryPreference", e.target.value)
                  }
                  placeholder="e.g. Halal only, low sodium"
                />
              </div>
            </>
          )}

          {!isCircleLead && (
            <div className="space-y-3">
              <Label>Your Schedule</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-xl border-2 border-input bg-transparent px-4 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                value={(localProfile as any).availabilitySummary || ""}
                onChange={(e) =>
                  handleChange(
                    "availabilitySummary" as keyof ProfileInput,
                    e.target.value as any,
                  )
                }
                placeholder="e.g. Tuesday/Friday mornings for visits..."
              />
              <p className="text-sm text-muted-foreground">
                Wasl will use this to suggest tasks that fit your schedule.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isCircleLead && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-secondary" /> Modesty & Comfort
            </CardTitle>
            <CardDescription>
              Your preferences for personal care and visits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <Label
                className="flex-1 cursor-pointer"
                htmlFor="modesty-personal"
              >
                Require same-gender assistance for personal care
              </Label>
              <Switch
                id="modesty-personal"
                checked={localProfile.modestyPersonalCare}
                onCheckedChange={(v) => handleChange("modestyPersonalCare", v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label
                className="flex-1 cursor-pointer"
                htmlFor="modesty-medical"
              >
                Require same-gender provider for medical visits if possible
              </Label>
              <Switch
                id="modesty-medical"
                checked={localProfile.modestyMedicalVisits}
                onCheckedChange={(v) => handleChange("modestyMedicalVisits", v)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-secondary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isCircleLead && (
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1 cursor-pointer" htmlFor="notif-prayer">
                Prayer time reminders
              </Label>
              <Switch
                id="notif-prayer"
                checked={localProfile.notificationPrayer}
                onCheckedChange={(v) => handleChange("notificationPrayer", v)}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <Label className="flex-1 cursor-pointer" htmlFor="notif-alerts">
              Urgent alerts & changes
            </Label>
            <Switch
              id="notif-alerts"
              checked={localProfile.notificationAlerts}
              onCheckedChange={(v) => handleChange("notificationAlerts", v)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="flex-1 cursor-pointer" htmlFor="notif-task">
              Task completions
            </Label>
            <Switch
              id="notif-task"
              checked={localProfile.notificationTaskComplete}
              onCheckedChange={(v) =>
                handleChange("notificationTaskComplete", v)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-secondary" /> My Access Details
          </CardTitle>
          <CardDescription>
            What you can view in this circle based on your role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="font-medium">Financial Documents</span>
              {(profile as any).permissions?.canViewFinancial ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-muted-foreground">No Access</span>}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="font-medium">Legal Documents</span>
              {(profile as any).permissions?.canViewLegal ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-muted-foreground">No Access</span>}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="font-medium">Health Notes & Vitals</span>
              {(profile as any).permissions?.canViewHealthNotes ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-muted-foreground">No Access</span>}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="font-medium">Real-time Location</span>
              {(profile as any).permissions?.canViewLocation ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-muted-foreground">No Access</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={updateProfile.isPending}
        size="lg"
        className="w-full text-lg h-16 shadow-lg hover:shadow-xl transition-shadow gap-2"
      >
        <Save className="w-6 h-6" />{" "}
        {updateProfile.isPending ? "Saving..." : "Save My Preferences"}
      </Button>
    </div>
  );
}

import { Router, type IRouter } from "express";
import * as api from "@workspace/api-zod";
import { addFeed, currentUser, readState, writeState } from "../lib/wasl-store";
import { clerkClient, getAuth } from "@clerk/express";

const router: IRouter = Router();
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

const parseId = (value: string | string[] | undefined) =>
  Number(Array.isArray(value) ? value[0] : value);
const userFor = (state: any, id: number | null | undefined) =>
  state.users.find((u: any) => u.id === id);
const normalizeEmail = (email: string | null | undefined) =>
  email?.trim().toLowerCase() || null;
const demoCredentials = {
  username: "fatima_demo",
  email: "fatima.demo@example.com",
  password: "WaslDemoAccount2026!",
};
const getVerifiedPrimaryEmail = async (clerkUserId: string) => {
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = clerkUser.primaryEmailAddress;
  if (!email || email.verification?.status !== "verified") return null;
  return normalizeEmail(email.emailAddress);
};

const ensureDemoUser = async () => {
  const byEmail = await clerkClient.users.getUserList({
    emailAddress: [demoCredentials.email],
    limit: 10,
  });
  let clerkUser = byEmail.data[0];

  if (!clerkUser) {
    const byUsername = await clerkClient.users.getUserList({
      username: [demoCredentials.username],
      limit: 10,
    });
    clerkUser = byUsername.data[0];
  }

  if (!clerkUser) {
    clerkUser = await clerkClient.users.createUser({
      emailAddress: [demoCredentials.email],
      username: demoCredentials.username,
      password: demoCredentials.password,
      firstName: "Fatima",
      lastName: "Demo",
    });
  }

  const state = await readState();
  let member = state.users.find(
    (user: any) =>
      user.username === demoCredentials.username ||
      normalizeEmail(user.email) === demoCredentials.email,
  );

  if (!member) {
    const nextId =
      Math.max(0, ...state.users.map((user: any) => Number(user.id) || 0)) + 1;
    member = {
      id: nextId,
      clerkUserId: clerkUser.id,
      email: demoCredentials.email,
      name: "Fatima Demo",
      username: demoCredentials.username,
      preferredName: "Fatima",
      role: "companion",
      preferredLanguage: "en",
      avatarInitials: "FA",
      availabilitySummary: "Available for the shared demo",
      onboardingComplete: true,
    };
    state.users.push(member);
    await writeState(state);
  } else if (member.clerkUserId !== clerkUser.id) {
    member.clerkUserId = clerkUser.id;
    await writeState(state);
  }

  return clerkUser.id;
};

router.post("/demo/sign-in-token", async (_req, res) => {
  try {
    const demoUserId = await ensureDemoUser();
    const signInToken = await clerkClient.signInTokens.createSignInToken({
      userId: demoUserId,
      expiresInSeconds: 60,
    });
    res.json({ token: signInToken.token });
  } catch (error) {
    console.error(
      "Demo sign-in token creation failed",
      error instanceof Error ? error.message : "Unknown Clerk error",
    );
    res.status(503).json({ error: "Demo sign-in is temporarily unavailable" });
  }
});

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
};

router.get("/session", requireAuth, async (req: any, res: any) => {
  const s = await readState();
  try {
    const user = currentUser(s, req.userId);
    const parsedSession = api.GetSessionResponse.parse({
      user,
      circleName: "Fatima’s Wasl Circle",
    });
    res.json({
      ...parsedSession,
      user: {
        ...parsedSession.user,
        contact: user.contact,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (e) {
    res.status(404).json({ error: "User not onboarded" });
  }
});

router.get("/onboarding/pending", requireAuth, async (req: any, res: any) => {
  const s = await readState();
  try {
    const email = await getVerifiedPrimaryEmail(req.userId);
    const pending = email
      ? s.users.find(
          (u: any) => normalizeEmail(u.email) === email && u.isPending,
        )
      : undefined;
    if (pending) {
      return res.json({ role: pending.role, preferredName: pending.preferredName });
    }
  } catch {
    // A user without a readable verified email can still use first-lead bootstrap.
  }
  res.json({ role: null, preferredName: null });
});

router.post("/onboarding", requireAuth, async (req: any, res: any) => {
  const body = req.body;
  const s = await readState();
  const existingUser = s.users.find(
    (u: any) => u.clerkUserId === req.userId,
  );
  if (existingUser) {
    // The final onboarding action is safe to retry after a network timeout or
    // a stale client redirect. Treat an already-associated user as success.
    existingUser.onboardingComplete = true;
    existingUser.isPending = false;
    await writeState(s);
    return res.json({ success: true, user: existingUser });
  }

  let email: string | null = null;
  try {
    email = await getVerifiedPrimaryEmail(req.userId);
  } catch {
    // First Circle Lead bootstrap can proceed without an email address.
  }

  let user = email
    ? s.users.find(
        (u: any) => normalizeEmail(u.email) === email && u.isPending,
      )
    : undefined;
  const hasCircleLead = s.users.some(
    (u: any) => u.role === "circle_lead" && u.clerkUserId && !u.isPending,
  );

  if (user) {
    // Associate with existing seed user or pending invite
    user.clerkUserId = req.userId;
    user.preferredName = body.preferredName;
    user.preferredLanguage = body.language || "en";
    user.avatarInitials = body.preferredName.substring(0, 2).toUpperCase() || "U";
    if (body.availabilitySummary) user.availabilitySummary = body.availabilitySummary;
    if (body.contact) user.contact = body.contact;
    user.onboardingComplete = true;
    user.isPending = false;
  } else {
    const bootstrapUser = s.users.find(
      (u: any) =>
        u.role === "circle_lead" && !u.clerkUserId && !u.isPending,
    );
    if (body.role !== "circle_lead" || hasCircleLead || !bootstrapUser) {
      return res.status(403).json({ error: "You must be invited to join this circle" });
    }
    bootstrapUser.clerkUserId = req.userId;
    bootstrapUser.email = email || undefined;
    bootstrapUser.name = body.preferredName;
    bootstrapUser.preferredName = body.preferredName;
    bootstrapUser.preferredLanguage = body.language || "en";
    bootstrapUser.avatarInitials =
      body.preferredName.substring(0, 2).toUpperCase() || "U";
    bootstrapUser.availabilitySummary = body.availabilitySummary || "";
    bootstrapUser.contact = body.contact || email || "";
    bootstrapUser.onboardingComplete = true;
    bootstrapUser.canManageMembers = true;
    bootstrapUser.isPending = false;
    user = bootstrapUser;
  }

  if (user.role === "circle_lead") {
    s.profile = {
      preferredName: user.preferredName,
      preferredLanguage: user.preferredLanguage,
      greetingStyle: body.greetingStyle || "salam",
      dietaryPreference: body.dietaryPreference || "",
      modestyPersonalCare: body.modestyPersonalCare ?? false,
      modestyMedicalVisits: body.modestyMedicalVisits ?? false,
      modestyTransport: body.modestyTransport ?? false,
      prayerRemindersEnabled: body.prayerRemindersEnabled ?? true,
      notificationPrayer: body.notificationPrayer ?? true,
      notificationAlerts: body.notificationAlerts ?? true,
      notificationReminders: body.notificationReminders ?? true,
      notificationTaskComplete: body.notificationTaskComplete ?? true,
      notificationArrivals: body.notificationArrivals ?? true,
    };
  }

  await writeState(s);
  res.json({ success: true, user });
});

router.post("/session", requireAuth, async (req: any, res: any) => {
  const body = api.SwitchSessionBody.parse(req.body);
  const s = await readState();

  try {
    const selected = currentUser(s, req.userId);
    if (body.preferredLanguage)
      selected.preferredLanguage = body.preferredLanguage;
    if (selected.role === "circle_lead" && body.preferredLanguage)
      s.profile.preferredLanguage = body.preferredLanguage;
    await writeState(s);
    const parsedSession = api.SwitchSessionResponse.parse({
      user: selected,
      circleName: "Fatima’s Wasl Circle",
    });
    res.json({
      ...parsedSession,
      user: {
        ...parsedSession.user,
        contact: selected.contact,
        onboardingComplete: selected.onboardingComplete,
      },
    });
  } catch (e) {
    res.status(404).json({ error: "User not found" });
  }
});

router.get("/dashboard", requireAuth, async (req: any, res: any) => {
  const s = await readState();
  const u = currentUser(s, req.userId);
  const localizedName =
    ["ar", "fa"].includes(u.preferredLanguage) &&
    u.preferredName.trim().toLowerCase() === "fatima"
      ? "فاطیما"
      : u.preferredName;
  const words = {
    en: {
      salam: "As-salamu alaykum",
      welcome: "Welcome",
      prayer: "Asr",
      countdown: "in 1 hr 42 min",
    },
    fr: {
      salam: "As-salamu alaykum",
      welcome: "Bienvenue",
      prayer: "Asr",
      countdown: "dans 1 h 42 min",
    },
    ar: {
      salam: "السلام عليكم",
      welcome: "مرحبًا",
      prayer: "العصر",
      countdown: "بعد ساعة و42 دقيقة",
    },
    fa: {
      salam: "السلام علیکم",
      welcome: "خوش آمدید",
      prayer: "عصر",
      countdown: "۱ ساعت و ۴۲ دقیقه دیگر",
    },
  }[u.preferredLanguage];
  const greeting =
    s.profile.greetingStyle === "salam"
      ? `${words.salam}، ${localizedName}`
      : `${words.welcome}، ${localizedName}`;
  const today = new Date().toDateString();
  const todayTasks = s.tasks.filter(
    (t) => new Date(t.dueAt).toDateString() === today && t.status !== "done",
  );
  const locale = { en: "en-CA", fr: "fr-CA", ar: "ar-CA", fa: "fa-IR" }[
    u.preferredLanguage
  ];
  res.json(
    api.GetDashboardResponse.parse({
      greeting,
      todayLabel: new Date().toLocaleDateString(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      prayerName: words.prayer,
      prayerCountdown: words.countdown,
      todayTasks,
      openAlerts: s.tasks.filter(
        (t) => t.status === "not_assigned" || t.urgency === "urgent",
      ).length,
      circleMemberCount: s.users.length,
    }),
  );
});

router.get("/users", requireAuth, async (_req, res) => {
  const s = await readState();
  res.json(api.ListUsersResponse.parse(s.users));
});

router.post("/users/invite", requireAuth, async (req: any, res: any) => {
  const body = api.InviteUserBody.parse(req.body);
  const s = await readState();
  const u = currentUser(s, req.userId);

  if (u.role !== "circle_lead" && !u.canManageMembers) {
    return res.status(403).json({ error: "Only authorized members can invite users" });
  }

  if (body.role === "circle_lead") {
    return res.status(403).json({ error: "Cannot invite another circle_lead" });
  }

  const email = normalizeEmail(body.email);
  if (!email || !body.preferredName.trim()) {
    return res.status(400).json({ error: "A valid email address is required" });
  }
  if (
    s.users.some(
      (member: any) => normalizeEmail(member.email) === email,
    )
  ) {
    return res.status(409).json({ error: "This email is already a member or has a pending invitation" });
  }

  try {
    await clerkClient.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role: body.role,
        preferredName: body.preferredName.trim(),
      },
      ignoreExisting: false,
      notify: true,
    });
  } catch {
    return res.status(400).json({ error: "Failed to create invitation in Auth provider" });
  }

  const user = {
    id: Math.max(...s.users.map((x) => x.id), 0) + 1,
    email,
    name: body.preferredName.trim(),
    username: body.preferredName.toLowerCase().replace(/[^a-z0-9_]/g, "") || `user_${Date.now()}`,
    preferredName: body.preferredName.trim(),
    role: body.role,
    preferredLanguage: "en",
    avatarInitials: body.preferredName.substring(0, 2).toUpperCase() || "U",
    availabilitySummary: "",
    isPending: true,
  };
  s.users.push(user as any);

  // Set default permissions for the new user based on role
  s.permissions.push({
    userId: user.id,
    userName: user.preferredName,
    role: user.role,
    canViewFinancial: user.role === "amanah_partner",
    canViewLegal: user.role === "amanah_partner",
    canViewHealthNotes: user.role === "amanah_partner" || user.role === "nurse",
    canViewLocation: user.role === "amanah_partner",
  });

  await writeState(s);
  res.json(api.InviteUserResponse.parse(user));
});

router.patch("/users/:id", requireAuth, async (req: any, res: any) => {
  const body = api.UpdateUserBody.parse(req.body);
  const s = await readState();
  const u = currentUser(s, req.userId);

  if (u.role !== "circle_lead" && !u.canManageMembers) {
    return res.status(403).json({ error: "Only authorized members can modify member roles and permissions" });
  }

  const target = s.users.find(x => x.id === parseId(req.params.id));
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }

  if (target.role === "circle_lead") {
    return res.status(400).json({ error: "Cannot modify the circle lead" });
  }

  if (body.role !== undefined) {
    target.role = body.role as any;
    const permissions = s.permissions.find((permission) => permission.userId === target.id);
    if (permissions) {
      permissions.role = target.role;
      permissions.canViewFinancial = target.role === "amanah_partner";
      permissions.canViewLegal = target.role === "amanah_partner";
      permissions.canViewHealthNotes =
        target.role === "amanah_partner" || target.role === "nurse";
      permissions.canViewLocation = target.role === "amanah_partner";
    } else {
      s.permissions.push({
        userId: target.id,
        userName: target.preferredName,
        role: target.role,
        canViewFinancial: target.role === "amanah_partner",
        canViewLegal: target.role === "amanah_partner",
        canViewHealthNotes:
          target.role === "amanah_partner" || target.role === "nurse",
        canViewLocation: target.role === "amanah_partner",
      });
    }
  }
  if (body.canManageMembers !== undefined) {
    // Only circle lead can grant member management
    if (u.role !== "circle_lead") {
      return res.status(403).json({ error: "Only Circle Lead can delegate member management" });
    }
    target.canManageMembers = body.canManageMembers;
  }

  await writeState(s);
  res.json(api.UpdateUserResponse.parse(target));
});

router.get("/tasks", requireAuth, async (req: any, res: any) => {
  const s = await readState();
  const u = currentUser(s, req.userId);
  const tasks = ["nurse", "companion"].includes(u.role)
    ? s.tasks.filter((t) => t.assigneeUserId === u.id)
    : s.tasks;
  res.json(api.ListTasksResponse.parse(tasks));
});

router.get("/tasks/:id", requireAuth, async (req: any, res: any) => {
  const s = await readState();
  const task = s.tasks.find((t) => t.id === parseId(req.params.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(api.GetTaskResponse.parse(task));
});

router.post("/tasks", requireAuth, async (req: any, res: any) => {
  const body = api.CreateTaskBody.parse(req.body);
  const s = await readState();
  const u = currentUser(s, req.userId);
  const assigned = userFor(s, body.assigneeUserId);
  const task = {
    id: s.nextTaskId++,
    ...body,
    assigneeUserId: body.assigneeUserId ?? null,
    assigneeName: assigned?.preferredName ?? null,
    status: "not_assigned",
    comments: [],
  };
  s.tasks.push(task);
  addFeed(
    s,
    u,
    `${u.preferredName} created ${task.title}.`,
    "status_change",
    task.urgency === "urgent",
    task.id,
  );
  await writeState(s);
  res.status(201).json(api.CreateTaskResponse.parse(task));
});

router.patch("/tasks/:id", requireAuth, async (req: any, res: any) => {
  const body = api.UpdateTaskBody.parse(req.body);
  const s = await readState();
  const task = s.tasks.find((t) => t.id === parseId(req.params.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const u = currentUser(s, req.userId);
  Object.assign(task, body);
  if ("assigneeUserId" in body)
    task.assigneeName = userFor(s, body.assigneeUserId)?.preferredName ?? null;
  if (body.status === "in_progress" && !task.assigneeUserId) {
    task.assigneeUserId = u.id;
    task.assigneeName = u.preferredName;
  }
  addFeed(
    s,
    u,
    `${u.preferredName} ${body.status === "in_progress" ? "claimed" : "updated"} ${task.title}.`,
    "status_change",
    false,
    task.id,
  );
  await writeState(s);
  res.json(api.UpdateTaskResponse.parse(task));
});

router.post("/tasks/:id/comments", requireAuth, async (req: any, res: any) => {
  const body = api.AddCommentBody.parse(req.body);
  const s = await readState();
  const task = s.tasks.find((t) => t.id === parseId(req.params.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const u = currentUser(s, req.userId);
  task.comments.push({
    id: s.nextCommentId++,
    authorName: u.preferredName,
    body: body.body,
    createdAt: new Date().toISOString(),
  });
  await writeState(s);
  res.status(201).json(api.AddCommentResponse.parse(task));
});

router.post("/tasks/:id/handoff", requireAuth, async (req: any, res: any) => {
  const body = api.CompleteTaskBody.parse(req.body);
  const s = await readState();
  const task = s.tasks.find((t) => t.id === parseId(req.params.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const u = currentUser(s, req.userId);
  task.status = "done";
  task.handoff = {
    authorName: u.preferredName,
    ...body,
    createdAt: new Date().toISOString(),
  };
  addFeed(
    s,
    u,
    `${u.preferredName} completed ${task.title}. ${body.whatHappened} Next: ${body.whatsNext}`,
    "status_change",
    false,
    task.id,
  );
  await writeState(s);
  res.json(api.CompleteTaskResponse.parse(task));
});

router.get("/feed", requireAuth, async (req: any, res: any) => {
  const s = await readState();
  const u = currentUser(s, req.userId);
  if (!["circle_lead", "amanah_partner"].includes(u.role)) {
    return res.status(403).json({ error: "No access to feed" });
  }
  res.json(api.ListFeedResponse.parse(s.feed));
});

router.post("/feed", requireAuth, async (req: any, res: any) => {
  const body = api.CreateFeedNoteBody.parse(req.body);
  const s = await readState();
  const u = currentUser(s, req.userId);
  addFeed(s, u, body.body, "manual_note", body.isUrgent);
  await writeState(s);
  res.status(201).json(api.CreateFeedNoteResponse.parse(s.feed[0]));
});

router.get("/alerts", requireAuth, async (_req, res) => {
  const s = await readState();
  const alerts = s.tasks
    .filter((t) => t.status === "not_assigned" || t.urgency === "urgent")
    .sort((a, b) => (a.urgency === "urgent" ? -1 : 1))
    .map((t) => ({
      id: t.id,
      title: t.title,
      detail:
        t.status === "not_assigned" ? "Needs someone to help" : "Marked urgent",
      urgency: t.urgency,
      dueAt: t.dueAt,
      kind: "task",
    }));
  res.json(api.ListAlertsResponse.parse(alerts));
});

router.get("/documents", requireAuth, async (req: any, res: any) => {
  const s = await readState();
  const u = currentUser(s, req.userId);
  let docs = s.documents;
  if (["nurse", "companion"].includes(u.role)) {
    const p = s.permissions.find((x) => x.userId === u.id);
    docs = docs.filter(
      (d) =>
        !(
          (d.category === "legal" && !p?.canViewLegal) ||
          (d.category === "financial" && !p?.canViewFinancial)
        ),
    );
  }
  res.json(api.ListDocumentsResponse.parse(docs));
});

router.post("/documents", requireAuth, async (req: any, res: any) => {
  const body = api.CreateDocumentBody.parse(req.body);
  const s = await readState();
  const u = currentUser(s, req.userId);
  const doc = {
    id: s.nextDocumentId++,
    ...body,
    uploadedAt: new Date().toISOString(),
    uploaderName: u.preferredName,
  };
  s.documents.unshift(doc);
  await writeState(s);
  res.status(201).json(api.CreateDocumentResponse.parse(doc));
});

router.get("/permissions", requireAuth, async (req: any, res: any) => {
  const s = await readState();
  const u = currentUser(s, req.userId);
  if (u.role !== "circle_lead") {
    res.status(403).json({ error: "You cannot view circle permissions" });
    return;
  }
  res.json(api.ListPermissionsResponse.parse(s.permissions));
});

router.patch("/permissions", requireAuth, async (req: any, res: any) => {
  const body = api.UpdatePermissionBody.parse(req.body);
  const s = await readState();
  const u = currentUser(s, req.userId);
  if (u.role !== "circle_lead") {
    res
      .status(403)
      .json({ error: "Only the Circle Lead can change permissions" });
    return;
  }
  const grant = s.permissions.find((p) => p.userId === body.userId);
  Object.assign(grant, body);
  await writeState(s);
  res.json(api.UpdatePermissionResponse.parse(grant));
});

router.get("/profile", requireAuth, async (req: any, res: any) => {
  const s = await readState();
  const u = currentUser(s, req.userId);
  const permissions = s.permissions.find(p => p.userId === u.id);
  
  if (u.role === "circle_lead") {
    res.json({
      ...api.GetProfileResponse.parse(s.profile),
      availabilitySummary: u.availabilitySummary,
      permissions: permissions || {
        userId: u.id,
        userName: u.preferredName,
        role: u.role,
        canViewFinancial: true,
        canViewLegal: true,
        canViewHealthNotes: true,
        canViewLocation: true
      },
    });
  } else {
    res.json({
      ...api.GetProfileResponse.parse({
        preferredName: u.preferredName,
        preferredLanguage: u.preferredLanguage,
        greetingStyle: "salam",
        dietaryPreference: "",
        modestyPersonalCare: false,
        modestyMedicalVisits: false,
        modestyTransport: false,
        prayerRemindersEnabled: false,
        notificationPrayer: false,
        notificationAlerts: true,
        notificationReminders: true,
        notificationTaskComplete: true,
        notificationArrivals: false,
      }),
      availabilitySummary: u.availabilitySummary,
      permissions: permissions || {
        userId: u.id,
        userName: u.preferredName,
        role: u.role,
        canViewFinancial: u.role === "amanah_partner",
        canViewLegal: u.role === "amanah_partner",
        canViewHealthNotes: u.role === "amanah_partner" || u.role === "nurse",
        canViewLocation: u.role === "amanah_partner"
      },
    });
  }
});

router.patch("/profile", requireAuth, async (req: any, res: any) => {
  const body = req.body;
  const s = await readState();
  const u = currentUser(s, req.userId);

  if (u.role === "circle_lead") {
    s.profile = api.UpdateProfileBody.parse(body);
    u.preferredName = body.preferredName;
    u.preferredLanguage = body.preferredLanguage;
    if (body.availabilitySummary !== undefined)
      u.availabilitySummary = body.availabilitySummary;
    await writeState(s);
    res.json({
      ...api.UpdateProfileResponse.parse(s.profile),
      availabilitySummary: u.availabilitySummary,
    });
  } else {
    u.preferredName = body.preferredName;
    u.preferredLanguage = body.preferredLanguage;
    if (body.availabilitySummary !== undefined)
      u.availabilitySummary = body.availabilitySummary;
    await writeState(s);
    res.json({
      ...api.UpdateProfileResponse.parse({
        preferredName: u.preferredName,
        preferredLanguage: u.preferredLanguage,
        greetingStyle: "salam",
        dietaryPreference: "",
        modestyPersonalCare: false,
        modestyMedicalVisits: false,
        modestyTransport: false,
        prayerRemindersEnabled: false,
        notificationPrayer: false,
        notificationAlerts: body.notificationAlerts ?? true,
        notificationReminders: body.notificationReminders ?? true,
        notificationTaskComplete: body.notificationTaskComplete ?? true,
        notificationArrivals: false,
      }),
      availabilitySummary: u.availabilitySummary,
    });
  }
});

router.get("/messages", requireAuth, async (req: any, res: any) => {
  const s = await readState();
  const u = currentUser(s, req.userId);
  if (!["circle_lead", "amanah_partner"].includes(u.role)) {
    return res.status(403).json({ error: "No access to chat" });
  }
  res.json(api.ListMessagesResponse.parse(s.messages));
});

router.post("/messages", requireAuth, async (req: any, res: any) => {
  const body = api.SendMessageBody.parse(req.body);
  const s = await readState();
  const user = currentUser(s, req.userId);
  if (!["circle_lead", "amanah_partner"].includes(user.role)) {
    return res.status(403).json({ error: "No access to chat" });
  }
  const message = {
    id: s.nextMessageId++,
    authorUserId: user.id,
    authorName: user.preferredName,
    authorUsername: user.username,
    authorInitials: user.avatarInitials,
    body: body.body.trim(),
    createdAt: new Date().toISOString(),
  };
  s.messages.push(message);
  await writeState(s);
  res.status(201).json(api.SendMessageResponse.parse(message));
});

router.post("/agent/draft", requireAuth, async (req: any, res: any) => {
  const body = api.DraftAgentTaskBody.parse(req.body);
  const s = await readState();
  const u = currentUser(s, req.userId);
  const lower = body.message.toLowerCase();
  if (
    /(chest pain|can't breathe|cannot breathe|overdose|dose|diagnos)/.test(
      lower,
    )
  ) {
    res.json(
      api.DraftAgentTaskResponse.parse({
        message: `${u.preferredName}, I can’t assess symptoms or advise on dosage. Please contact your nurse or doctor. If this may be an emergency, call local emergency services now.`,
        draft: null,
      }),
    );
    return;
  }
  if (
    !process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
    !process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  ) {
    res.status(503).json({
      error: "Wasl Companion is unavailable until OpenAI is configured.",
    });
    return;
  }
  const { openai } = await import("@workspace/integrations-openai-ai-server");
  const languageNames = {
    en: "English",
    fr: "French",
    ar: "Arabic",
    fa: "Persian (Farsi)",
  };
  const systemPrompt = `You are the Wasl Companion, a warm, respectful assistant helping an elder coordinate everyday support. Respond entirely in ${languageNames[u.preferredLanguage]}. Address the user as ${u.preferredName}; greeting style is ${s.profile.greetingStyle}. Reflect Ihsan: patient, kind, concise, dignified, never patronizing. Never give medical diagnosis, dosage advice, or triage. Always create a draft only and ask for explicit confirmation. Current members and mentionable usernames: ${s.users.map((x) => `${x.id}: ${x.preferredName} @${x.username} (${x.role}) — ${x.availabilitySummary}`).join("; ")}. Existing tasks: ${s.tasks
    .filter((t) => t.status !== "done")
    .map((t) => `${t.title}, ${t.dueAt}, ${t.assigneeName ?? "unassigned"}`)
    .join(
      "; ",
    )}. Today is ${new Date().toISOString()}. Choose a matching helper only when their availability fits. Return strict JSON with message and draft. draft is null only when clarification is necessary. A non-null draft must have title, description, label, caregiverNeeded, assigneeUserId, urgency (low|normal|urgent), dueAt ISO string, isEvent.`;
  const completion = await openai.chat.completions.create({
    model: "gpt-5.6-luna",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: body.message },
    ],
    response_format: { type: "json_object" },
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) {
    res.status(502).json({ error: "Wasl Companion did not return a response" });
    return;
  }
  const reply = JSON.parse(content);
  if (reply.draft?.assigneeUserId != null)
    reply.draft.assigneeUserId = Number(reply.draft.assigneeUserId);
  if (reply.draft?.caregiverNeeded != null)
    reply.draft.caregiverNeeded = Boolean(reply.draft.caregiverNeeded);
  if (reply.draft?.isEvent != null)
    reply.draft.isEvent = Boolean(reply.draft.isEvent);
  res.json(api.DraftAgentTaskResponse.parse(reply));
});

export default router;

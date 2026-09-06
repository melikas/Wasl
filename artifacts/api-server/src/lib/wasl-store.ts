import { db, waslStateTable } from "@workspace/db";
import { eq } from "drizzle-orm";

type Role = "circle_lead" | "amanah_partner" | "nurse" | "companion";
type Status = "not_assigned" | "in_progress" | "done";
type Urgency = "low" | "normal" | "urgent";

export interface WaslUser {
  id: number;
  clerkUserId?: string;
  email?: string;
  name: string;
  username: string;
  preferredName: string;
  role: Role;
  preferredLanguage: "en" | "fr" | "ar" | "fa";
  avatarInitials: string;
  availabilitySummary: string;
  contact?: string;
  onboardingComplete?: boolean;
  canManageMembers?: boolean;
  isPending?: boolean;
}

interface WaslState {
  currentUserId: number;
  nextTaskId: number;
  nextFeedId: number;
  nextDocumentId: number;
  nextCommentId: number;
  nextMessageId: number;
  users: WaslUser[];
  tasks: any[];
  feed: any[];
  documents: any[];
  permissions: any[];
  profile: any;
  messages: any[];
}

const future = (days: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const initialState = (): WaslState => {
  const users: WaslUser[] = [
    {
      id: 1,
      name: "Fatima El-Mansouri",
      username: "fatima",
      preferredName: "Fatima",
      role: "circle_lead",
      preferredLanguage: "en",
      avatarInitials: "FM",
      availabilitySummary: "At home most days",
    },
    {
      id: 2,
      name: "Omar El-Mansouri",
      username: "omar",
      preferredName: "Omar",
      role: "amanah_partner",
      preferredLanguage: "en",
      avatarInitials: "OM",
      availabilitySummary: "Thu afternoons · Transport & errands",
    },
    {
      id: 3,
      name: "Layla El-Mansouri",
      username: "layla",
      preferredName: "Layla",
      role: "amanah_partner",
      preferredLanguage: "fr",
      avatarInitials: "LM",
      availabilitySummary: "Mon/Wed evenings · Calls & visits",
    },
    {
      id: 4,
      name: "Nadia Rahman",
      username: "nadia",
      preferredName: "Nadia",
      role: "nurse",
      preferredLanguage: "en",
      avatarInitials: "NR",
      availabilitySummary: "Tue/Fri mornings · Medical visits",
    },
    {
      id: 5,
      name: "Yusuf Ali",
      username: "yusuf",
      preferredName: "Yusuf",
      role: "companion",
      preferredLanguage: "ar",
      avatarInitials: "YA",
      availabilitySummary: "Fri afternoons · Visits & community",
    },
  ];
  return {
    currentUserId: 1,
    nextTaskId: 9,
    nextFeedId: 8,
    nextDocumentId: 5,
    nextCommentId: 3,
    nextMessageId: 4,
    users,
    tasks: [
      {
        id: 1,
        title: "Morning medication",
        description: "Take morning tablets with breakfast.",
        label: "Medication",
        caregiverNeeded: false,
        assigneeUserId: 1,
        assigneeName: "Fatima",
        status: "not_assigned",
        urgency: "normal",
        dueAt: future(0, 9),
        isEvent: false,
        comments: [],
      },
      {
        id: 2,
        title: "Family check-in call",
        description: "Weekly call with Layla.",
        label: "Family",
        caregiverNeeded: true,
        assigneeUserId: 3,
        assigneeName: "Layla",
        status: "in_progress",
        urgency: "normal",
        dueAt: future(0, 18),
        isEvent: true,
        comments: [
          {
            id: 1,
            authorName: "Layla",
            body: "I’ll call right after Maghrib, inshaAllah.",
            createdAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: 3,
        title: "Nurse home visit",
        description: "Routine wellness visit with Nadia.",
        label: "Medical appointment",
        caregiverNeeded: true,
        assigneeUserId: 4,
        assigneeName: "Nadia",
        status: "not_assigned",
        urgency: "normal",
        dueAt: future(2, 10),
        isEvent: true,
        comments: [],
      },
      {
        id: 4,
        title: "Grocery run",
        description: "Milk, dates, lentils, and fresh bread.",
        label: "Grocery",
        caregiverNeeded: true,
        assigneeUserId: 2,
        assigneeName: "Omar",
        status: "done",
        urgency: "low",
        dueAt: future(-1, 15),
        isEvent: false,
        comments: [],
        handoff: {
          authorName: "Omar",
          whatHappened: "Groceries delivered and put away.",
          whatsNext: "More milk may be needed next week.",
          whoShouldKnow: "Fatima and Layla",
          createdAt: new Date().toISOString(),
        },
      },
      {
        id: 5,
        title: "Jumu'ah community lunch",
        description: "Community lunch at Al-Rawdah Mosque.",
        label: "Community event",
        caregiverNeeded: true,
        assigneeUserId: 5,
        assigneeName: "Yusuf",
        status: "not_assigned",
        urgency: "low",
        dueAt: future(5, 13),
        isEvent: true,
        comments: [],
      },
      {
        id: 6,
        title: "Review phone settings",
        description: "Increase text size and check emergency contacts.",
        label: "Tech help",
        caregiverNeeded: true,
        assigneeUserId: null,
        assigneeName: null,
        status: "not_assigned",
        urgency: "normal",
        dueAt: future(3, 16),
        isEvent: false,
        comments: [],
      },
      {
        id: 7,
        title: "Lease renewal question",
        description: "Review landlord’s renewal notice.",
        label: "Legal",
        caregiverNeeded: true,
        assigneeUserId: 3,
        assigneeName: "Layla",
        status: "in_progress",
        urgency: "urgent",
        dueAt: future(1, 12),
        isEvent: false,
        comments: [
          {
            id: 2,
            authorName: "Layla",
            body: "@Omar I’ll summarize the letter tonight.",
            createdAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: 8,
        title: "Balcony plant care",
        description: "Water herbs and trim mint.",
        label: "Home",
        caregiverNeeded: false,
        assigneeUserId: 1,
        assigneeName: "Fatima",
        status: "done",
        urgency: "low",
        dueAt: future(-2, 11),
        isEvent: false,
        comments: [],
      },
    ],
    feed: [
      {
        id: 1,
        type: "device_signal",
        body: "Fatima’s phone location: en route home",
        isUrgent: false,
        authorName: null,
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
        taskId: null,
      },
      {
        id: 2,
        type: "status_change",
        body: "Omar completed Grocery run. Groceries delivered and put away.",
        isUrgent: false,
        authorName: "Omar",
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        taskId: 4,
      },
      {
        id: 3,
        type: "manual_note",
        body: "Fatima is looking forward to Friday’s community lunch.",
        isUrgent: false,
        authorName: "Layla",
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        taskId: null,
      },
      {
        id: 4,
        type: "status_change",
        body: "Nadia was assigned to Nurse home visit.",
        isUrgent: false,
        authorName: "Fatima",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        taskId: 3,
      },
      {
        id: 5,
        type: "manual_note",
        body: "Please review the lease renewal question by tomorrow.",
        isUrgent: true,
        authorName: "Fatima",
        createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
        taskId: 7,
      },
      {
        id: 6,
        type: "status_change",
        body: "Layla started Lease renewal question.",
        isUrgent: false,
        authorName: "Layla",
        createdAt: new Date(Date.now() - 30 * 3600000).toISOString(),
        taskId: 7,
      },
      {
        id: 7,
        type: "manual_note",
        body: "Nadia confirmed the wellness visit for Tuesday morning.",
        isUrgent: false,
        authorName: "Nadia",
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        taskId: 3,
      },
    ],
    documents: [
      {
        id: 1,
        fileName: "Medication-list.pdf",
        category: "medical",
        uploadedAt: future(-7, 9),
        uploaderName: "Fatima",
      },
      {
        id: 2,
        fileName: "Lease-renewal.pdf",
        category: "legal",
        uploadedAt: future(-4, 14),
        uploaderName: "Layla",
      },
      {
        id: 3,
        fileName: "Benefits-summary.pdf",
        category: "financial",
        uploadedAt: future(-12, 11),
        uploaderName: "Omar",
      },
      {
        id: 4,
        fileName: "Health-card.jpg",
        category: "identification",
        uploadedAt: future(-30, 10),
        uploaderName: "Fatima",
      },
    ],
    permissions: users
      .filter((u) => u.id !== 1)
      .map((u) => ({
        userId: u.id,
        userName: u.preferredName,
        role: u.role,
        canViewFinancial: u.role === "amanah_partner",
        canViewLegal: u.role === "amanah_partner",
        canViewHealthNotes: u.role === "amanah_partner" || u.role === "nurse",
        canViewLocation: u.role === "amanah_partner",
      })),
    profile: {
      preferredName: "Fatima",
      preferredLanguage: "en",
      greetingStyle: "salam",
      dietaryPreference: "Halal; prefers mild food",
      modestyPersonalCare: false,
      modestyMedicalVisits: true,
      modestyTransport: true,
      prayerRemindersEnabled: true,
      notificationPrayer: true,
      notificationAlerts: true,
      notificationReminders: true,
      notificationTaskComplete: true,
      notificationArrivals: true,
    },
    messages: [
      {
        id: 1,
        authorUserId: 3,
        authorName: "Layla",
        authorUsername: "layla",
        authorInitials: "LM",
        body: "Salam everyone, I’ll call Fatima after Maghrib.",
        createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: 2,
        authorUserId: 2,
        authorName: "Omar",
        authorUsername: "omar",
        authorInitials: "OM",
        body: "Thank you @layla. I can handle tomorrow’s pharmacy trip.",
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 3,
        authorUserId: 1,
        authorName: "Fatima",
        authorUsername: "fatima",
        authorInitials: "FM",
        body: "Jazakum Allah khayran.",
        createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
      },
    ],
  };
};

export async function readState(): Promise<WaslState> {
  const [row] = await db
    .select()
    .from(waslStateTable)
    .where(eq(waslStateTable.id, 1));
  if (row) {
    const state = row.data as WaslState;
    state.users.forEach((user) => {
      user.username ||= user.name
        .split(" ")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
    });
    state.messages ||= [];
    state.nextMessageId ||=
      state.messages.reduce((max, message) => Math.max(max, message.id), 0) + 1;
    return state;
  }
  const state = initialState();
  await db
    .insert(waslStateTable)
    .values({ id: 1, data: state })
    .onConflictDoNothing();
  const [persisted] = await db
    .select()
    .from(waslStateTable)
    .where(eq(waslStateTable.id, 1));
  return (persisted?.data as WaslState | undefined) ?? state;
}

export async function writeState(state: WaslState): Promise<void> {
  await db
    .update(waslStateTable)
    .set({ data: state })
    .where(eq(waslStateTable.id, 1));
}

export function currentUser(state: WaslState, clerkUserId: string): WaslUser {
  const user = state.users.find((u) => u.clerkUserId === clerkUserId);
  if (!user) {
    throw new Error("User not onboarded");
  }
  return user;
}

export function addFeed(
  state: WaslState,
  user: WaslUser,
  body: string,
  type = "status_change",
  isUrgent = false,
  taskId: number | null = null,
) {
  state.feed.unshift({
    id: state.nextFeedId++,
    type,
    body,
    isUrgent,
    authorName: user.preferredName,
    createdAt: new Date().toISOString(),
    taskId,
  });
}

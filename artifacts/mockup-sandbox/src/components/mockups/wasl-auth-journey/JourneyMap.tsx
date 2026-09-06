import React from "react";
import "./_group.css";

const phases = [
  { n:"01", title:"First launch · language & trust", tone:"gold", items:["English · Français · العربية · فارسی","Arabic / Persian preview RTL","Larger text + voice guidance shortcuts","Sign in / Create account","Privacy reassurance + emergency-service disclaimer"] },
  { n:"02", title:"Identity · verify gently", tone:"navy", items:["Sign in: phone + country code → 6-digit code","Invalid / expired code errors + resend countdown","Remembered device (optional)","Email + password alternate · forgot password","Passkey / biometric (future-friendly secondary)","After credentials: MFA required for Care Coordinator + Nurse","Success: resume saved step or Home"] },
  { n:"03", title:"Create account · no health questions", tone:"mint", items:["Phone → 6-digit SMS verification","Legal name · preferred name · optional email","Password show / hide; 12+ chars, number, symbol","Terms + Privacy acceptance","Separate express consent for sensitive care information","Do not ask health details at this stage"] },
  { n:"04", title:"Role & circle path", tone:"gold", items:["Circle Lead — older adult; normally creates","Amanah Partner — family / trusted person; normally joins","Nurse / Professional Partner — assigned work only","Companion — community helper; assigned work only","Care Coordinator = Amanah responsibility flag, not identity","New Wasl Circle or invitation? Explain access plainly"] },
  { n:"05", title:"Circle setup or join", tone:"navy", items:["New: circle name · city / timezone","One or two Circle Leads","Invite trusted members now or later","Join: code / link → inviter, circle, role, data-access preview","Accept or Decline; never silently grant access"] },
];
const shared = ["Preferred name / form of address","Greeting: Salam-based · neutral · name only · custom","Pronouns optional · preferred language","Call · video · text · in-person channels","Availability windows + Do Not Disturb","Relationship to Circle Lead for non-elders","Avatar optional"];
const roleDetails = {
  "Circle Lead": ["What Matters to Me (all optional; Prefer not to answer)","Origin culture / country · halal / diet / allergies / low-salt + free text","Prayer reminders + calculation method / madhhab only when enabled","Community interests · communication style · assistance categories without diagnosis","Modesty by task: bathing, dressing, mobility, medical visits, transport","Same gender only · any gender · ask each time · no preference","Dress / cover preparation · visiting hours / presence preferences","Editable anytime; only relevant fields travel with a task"],
  "Amanah Partner": ["Relationship · Care Coordinator toggle + plain explanation","Help modes · weekly availability · task categories","Permission request review; financial / legal access never defaulted"],
  "Nurse / Professional": ["Organization optional · professional role","License / employee ID optional for demo","Shift / availability · care categories · required MFA setup","Assigned-task-only default; review precisely shared preferences + health-adjacent information","No default legal / financial access"],
  "Companion": ["Affiliation optional (mosque / community / neighbor)","Transport capability optional · availability · task categories","Assigned-task-only access · accept code of conduct","No health / legal / financial access"],
};
const finalPhases = [
  { title:"08 · Safety & accessibility", items:["Visual / hearing / dexterity preferences","Text size: Standard · Large · Extra large","Screen reader / voice guidance · reduced motion","Emergency contact: name / relationship / phone (optional, recommended)","Persistent: Wasl coordinates care and reminders; it does not provide medical advice or emergency response."] },
  { title:"09 · Notifications", items:["Channels: Push · SMS · Email · In-app","Categories: Prayer times · Alerts · Reminders · Task completions · Arrivals / pickups · Circle messages · Daily summary","Quiet hours; urgent alerts override only with explicit choice","System permission prompt only after choosing Push"] },
  { title:"10 · Optional wearable", items:["Clear Skip for now","Device type; exact data: location / health signals","Purpose, who can see it, when sharing is active","Three separate, unselected consents: connect · location · health signals","Revoke anytime"] },
  { title:"11 · Permissions & authority", items:["Who can grant / revoke: Circle Lead · designated Care Coordinator · both","Capacity-sensitive wording; no assumptions","Category review: tasks / calendar · preferences · medication reminders · health notes · location / wearable · handoff notes · legal docs · financial docs","Sensitive categories off unless explicitly granted","Circle Lead / authorized coordinator completes; invited roles review and accept shared items","Audit promise: “You can see who viewed this and when.”"] },
  { title:"12 · Review → ready", items:["Summary groups: Account · Circle · Preferences · Availability · Notifications · Permissions · Optional connections","Edit on every group · Finish setup","Autosave + resume later · progress indicator · Back every step · Skip only optional questions","Confirmation: “Your Wasl Circle is ready”","Two-step orientation: Talk to Wasl → invite / meet your circle → Go to Home"] },
];

function Pill({children, tone="navy"}:{children:React.ReactNode;tone?:string}) {
  return <span className={`w-pill w-pill-${tone}`}>{children}</span>;
}
function Phase({p}:{p:{n?:string;title:string;tone?:string;items:string[]}}) {
  return <section className="w-phase wasl-rise">
    <div className={`w-phase-num ${p.tone || "navy"}`}>{p.n}</div>
    <div><h3>{p.title}</h3><ul>{p.items.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
  </section>;
}
export function JourneyMap() {
  return <main className="wasl-journey w-map">
    <header className="w-map-head">
      <div className="w-brand"><img src="/__mockup/images/wasl-logo.png" alt="Wasl" /><div><strong>Wasl</strong><span>AUTH JOURNEY BLUEPRINT</span></div></div>
      <div className="w-head-note">A dignified path from first hello<br/><b>to a ready, trusted circle.</b></div>
    </header>
    <div className="w-map-intro">
      <div><p className="w-kicker">PRODUCT LOGIC · V1.0</p><h1>Care begins with<br/><em>being heard.</em></h1><p className="w-lede">A complete first-launch journey designed for elders, families, nurses, and community companions. Every question earns its place, every permission is visible, and every pause is safe.</p></div>
      <div className="w-legend"><span><i className="dot gold"/>choice / consent</span><span><i className="dot navy"/>required checkpoint</span><span><i className="dot mint"/>role-specific path</span><span><i className="dot coral"/>optional / can skip</span></div>
    </div>
    <div className="w-flowbar"><span>LAUNCH</span><b>→</b><span>IDENTITY</span><b>→</b><span>ROLE</span><b>→</b><span>CIRCLE</span><b>→</b><span>SETUP</span><b>→</b><span>REVIEW</span><b>→</b><span>HOME</span></div>
    <div className="w-grid">{phases.map(p=><Phase key={p.n} p={p}/>)}</div>
    <div className="w-branch-title"><Pill tone="gold">SHARED SETUP</Pill><h2>One calm foundation, then a role-aware path</h2><p>Autosave after each step. Back is always available. Skip is reserved for optional questions; resume returns to the saved step.</p></div>
    <div className="w-shared"><div className="w-shared-label"><span>06</span><h3>Personal setup</h3><p>Everyone chooses how Wasl speaks and reaches them.</p></div><div className="w-chip-list">{shared.map(x=><Pill key={x} tone="mint">{x}</Pill>)}</div></div>
    <div className="w-role-grid">{Object.entries(roleDetails).map(([role,items],idx)=><article key={role} className={`w-role role-${idx}`}><div className="w-role-head"><span>0{idx+1}</span><div><h3>{role}</h3><p>{idx===0?"Personal preferences stay personal.":idx===1?"Trust is a responsibility, not a title.":idx===2?"Precision, MFA, and assigned work.":"A helpful presence, with narrow access."}</p></div></div><ul>{items.map(x=><li key={x}>{x}</li>)}</ul></article>)}</div>
    <div className="w-grid w-final">{finalPhases.map((p,i)=><Phase key={p.title} p={{...p,n:String(i+8).padStart(2,"0"),tone:i===3?"gold":i===1?"mint":"navy"}}/>)}</div>
    <footer className="w-footer"><div><b>Wasl</b><span>Care connected, with dignity.</span></div><p>Privacy-first by design · culturally adaptive by choice · never rushed.</p><div className="w-outcome"><strong>OUTCOME</strong><span>Your Wasl Circle is ready → Home</span></div></footer>
  </main>;
}
export default JourneyMap;
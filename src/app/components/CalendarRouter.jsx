"use client";
// components/CalendarRouter.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Reçoit initialType depuis le Server Component (page.jsx) → pas de race
// condition avec replaceState, le type est connu dès le premier render.
// ─────────────────────────────────────────────────────────────────────────────

import GoogleCalendarWithInterview     from "./GoogleCalendarWithInterview";
import GoogleCalendarWithInterviewNord from "./GoogleCalendarWithInterviewNord";
import GoogleCalendarWithInterviewDGA  from "./GoogleCalendarWithInterviewDGA";

export default function CalendarRouter({ initialType }) {
  if (initialType === "entretien_dga")  return <GoogleCalendarWithInterviewDGA />;
  if (initialType === "entretien_nord") return <GoogleCalendarWithInterviewNord />;
  return <GoogleCalendarWithInterview />;
}
// app/candidat/confirm-dga-interview/[id]/page.jsx
import CandidatConfirmDgaInterview from "./CandidatConfirmDgaInterview";

// APRÈS
export default async function Page({ params }) {
  const { id } = await params;
  return <CandidatConfirmDgaInterview id={id} />;
}
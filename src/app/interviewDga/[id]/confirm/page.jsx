// app/interviewDga/[id]/confirm/page.jsx
import DgaConfirmInterview from "./DgaConfirmInterview";

export default async function Page({ params }) {
  const { id } = await params;
  return <DgaConfirmInterview id={id} />;
}
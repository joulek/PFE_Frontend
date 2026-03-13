"use client";

import { useParams } from "next/navigation";
import ResponsableRescheduleCalendar from "../../../components/responsable/ResponsableRescheduleCalendar";

export default function Page() {
  const { token } = useParams();

  return (
    <div className="min-h-screen w-full bg-[#F6FFF7] dark:bg-[#050B14] overflow-x-hidden">
      <div className="w-full px-0 py-4">
        <ResponsableRescheduleCalendar token={token} />
      </div>
    </div>
  );
}
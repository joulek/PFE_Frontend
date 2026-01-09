"use client";

import { use } from "react";
import { useState } from "react";
import StepUploadCV from "./steps/StepUploadCV";
import StepManual from "./steps/StepManual";

export default function ApplyPage({ params }) {
  const { jobId } = use(params); // Next 15

  const [step, setStep] = useState(1);
  const [parsedCV, setParsedCV] = useState(null);
  const [cvFileUrl, setCvFileUrl] = useState(null);
  const [candidatureId, setCandidatureId] = useState(null);

  return (
    <div className="max-w-3xl mx-auto py-10">
      {step === 1 && (
        <StepUploadCV
          jobId={jobId}
          onParsed={(data) => {
            // 🔑 توحيد البيانات
            setParsedCV(data.extracted ?? data.parsed);
            setCvFileUrl(data.cvFileUrl);
            setCandidatureId(data.candidatureId);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <StepManual
          jobId={jobId}
          candidatureId={candidatureId}
          parsedCV={parsedCV}
          cvFileUrl={cvFileUrl}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  );
}

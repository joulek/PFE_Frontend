"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import StepUploadCV from "./steps/StepUploadCV";
import StepManual from "./steps/StepManual";
import StepReview from "./steps/StepReview";

export default function ApplyPage() {
  const { jobId } = useParams(); // ✅ CORRECT
  const [candidatureId, setCandidatureId] = useState(null);


  const [step, setStep] = useState(1);
  const [parsedCV, setParsedCV] = useState(null);
  const [cvFileUrl, setCvFileUrl] = useState(null);
  const [manual, setManual] = useState(null);

  return (
    <div className="min-h-screen bg-green-50 px-6 py-10">

      {/* ===== STEPPER ===== */}
      <div className="flex justify-center gap-6 mb-10">
        <Step label="Upload CV" active={step >= 1} />
        <Step label="Vérification" active={step >= 2} />
        <Step label="Confirmation" active={step >= 3} />
      </div>

      {/* ===== STEP 1 ===== */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow p-10">
          <StepUploadCV
            jobId={jobId}
            onParsed={(data) => {
              setParsedCV(data.extracted ?? data.parsed);
              setCvFileUrl(data.cvFileUrl);
              setCandidatureId(data.candidatureId);
              setStep(2);
            }}
          />
        </div>
      )}

      {/* ===== STEP 2 (FULL WIDTH) ===== */}
      {step === 2 && (
        <StepManual
          parsedCV={parsedCV}
          cvFileUrl={cvFileUrl}
          onBack={() => setStep(1)}
          onSubmit={(data) => {
            setParsedCV(data);
            setStep(3);
          }}
        />
      )}


      {/* ===== STEP 3 ===== */}
      {step === 3 && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow p-10">
          <StepReview
            candidatureId={candidatureId}   // ✅ ICI
            parsed={parsedCV}
            manual={manual}
            cvFileUrl={cvFileUrl}
          />

        </div>
      )}
    </div>
  );
}

/* ===== STEPPER ===== */

function Step({ label, active }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center
        ${active ? "bg-green-600 text-white" : "bg-gray-300 text-gray-500"}`}
      >
        ✓
      </div>
      <span className="text-xs mt-2">{label}</span>
    </div>
  );
}

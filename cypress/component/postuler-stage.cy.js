// cypress/component/postuler-stage.cy.jsx

import React from "react";
import * as nextNavigation from "next/navigation";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StagePostulerPage from "../../src/app/jobs/[jobId]/postuler/page";
import * as jobApi from "../../src/app/services/job.api";
import * as applicationApi from "../../src/app/services/application.api";

let mockRouter;

/* ───────── helpers ───────── */

function mountPage() {

  // ✅ FIX 1 : matcher TOUS les cas (jobId + id)
  cy.stub(nextNavigation, "useParams").callsFake(() => ({
    jobId: "job-123",
    id: "job-123",
  }));

  cy.stub(nextNavigation, "useRouter").returns(mockRouter);

  cy.mount(
    <AppRouterContext.Provider value={mockRouter}>
      <StagePostulerPage />
    </AppRouterContext.Provider>
  );
}

/* ═════════ TESTS COMPOSANT ═════════ */

describe("StagePostulerPage (Component)", () => {

  beforeEach(() => {

    mockRouter = {
      push: cy.stub().as("push"),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
    };

    // mock job
    cy.stub(jobApi, "getJobById").callsFake(() =>
      Promise.resolve({
        data: {
          _id: "job-123",
          titre: "Stage PFE Développement Web",
        },
      })
    );

    // mock submit (success par défaut)
    cy.stub(applicationApi, "applyToStage").callsFake(() =>
      Promise.resolve({ data: { message: "OK" } })
    );

  });

  /* ───────── UI ───────── */

  it("affiche le formulaire", () => {
    mountPage();

    cy.contains("Postuler pour ce stage").should("exist");
    cy.contains("Prénom").should("exist");
    cy.contains("Nom").should("exist");
    cy.contains("Email").should("exist");
    cy.contains("Téléphone").should("exist");
    cy.contains("Lettre de motivation").should("exist");

    cy.contains("Envoyer ma candidature").should("exist");
  });



  /* ───────── Validation ───────── */

  it("affiche erreur si formulaire vide", () => {
    mountPage();

    cy.contains("Envoyer ma candidature").click();

    cy.contains("Le prénom et le nom sont obligatoires").should("exist");
  });

  it("affiche erreur email invalide", () => {
    mountPage();

    cy.get("input[placeholder='Votre prénom']").type("Ahmed");
    cy.get("input[placeholder='Votre nom']").type("Ben Ali");
    cy.get("input[type='email']").type("bad-email");

    cy.contains("Envoyer ma candidature").click();

    cy.contains("Email invalide").should("exist");
  });

  /* ───────── Interaction simple ───────── */

  it("permet de remplir les champs", () => {
    mountPage();

    cy.get("input[placeholder='Votre prénom']").type("Ahmed")
      .should("have.value", "Ahmed");

    cy.get("textarea").type("Motivation")
      .should("have.value", "Motivation");
  });



});
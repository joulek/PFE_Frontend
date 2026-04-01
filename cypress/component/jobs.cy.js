import React from "react";
import { mount } from "cypress/react";

import JobsPage from "../../src/app/recruiter/jobs/page";
import DeleteJobModal from "../../src/app/recruiter/jobs/DeleteJobModal";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

describe("Jobs Components - Tests", () => {

  let mockRouter;

  const mockJobs = [
    {
      _id: "1",
      titre: "Développeur React",
      lieu: "Sfax",
      status: "CONFIRMEE",
      typeOffre: "EMPLOI",
      dateCloture: "2099-12-31",
      createdAt: "2026-01-01",
    },
    {
      _id: "2",
      titre: "Stage PFE IA",
      lieu: "Tunis",
      status: "EN_ATTENTE",
      typeOffre: "STAGE",
      dateCloture: "2099-12-31",
      createdAt: "2026-01-01",
    }
  ];

  const mockUsers = [
    {
      _id: "u1",
      nom: "Ben Ali",
      prenom: "Ahmed",
      email: "ahmed@test.com"
    }
  ];

  beforeEach(() => {

    mockRouter = {
      push: cy.stub(),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
    };

    // 🔥 BLOQUER TOUTES LES APIs
    cy.intercept("GET", "**/jobs/all*", {
      statusCode: 200,
      body: mockJobs
    });

    cy.intercept("GET", "**/jobs*", {
      statusCode: 200,
      body: mockJobs
    });

    cy.intercept("GET", "**/users*", {
      statusCode: 200,
      body: mockUsers
    });

  });

  function mountPage() {
    mount(
      <AppRouterContext.Provider value={mockRouter}>
        <JobsPage />
      </AppRouterContext.Provider>
    );
  }

  // ===============================
  it("affiche les offres (FAKE DATA)", () => {
    mountPage();

    cy.contains("Développeur React", { timeout: 8000 }).should("exist");
    cy.contains("Stage PFE IA").should("exist");
  });

  // ===============================
  it("ouvre modal création", () => {
    mountPage();

    cy.get("[data-cy=add-job-btn]").click();

    cy.get("[data-cy=job-modal]").should("exist");
  });

  // ===============================
  it("filtre les stages", () => {
    mountPage();

    cy.contains("Stages").click();

    cy.contains("Stage PFE IA").should("exist");
    cy.contains("Développeur React").should("not.exist");
  });

  // ===============================
  it("Delete modal fonctionne", () => {
    const onConfirm = cy.stub();

    mount(
      <DeleteJobModal
        open={true}
        job={{ titre: "Test Job" }}
        onClose={() => {}}
        onConfirm={onConfirm}
      />
    );

    cy.get("[data-cy=confirm-delete]").click();

    cy.wrap(onConfirm).should("have.been.calledOnce");
  });

});
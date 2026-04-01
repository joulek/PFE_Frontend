import React from "react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import CandidaturesUnifiedPage from "../../src/app/recruiter/candidatures/page";

describe("CandidaturesUnifiedPage", () => {

  const mockRouter = {
    push: () => {},
    replace: () => {},
    refresh: () => {},
    prefetch: () => {},
  };

  // ✅ IMPORTANT : ici
  const mockOffres = [
    {
      _id: "1",
      fullName: "Ahmed Ben Ali",
      email: "ahmed@test.com",
      telephone: "12345678",
      createdAt: "2026-01-01",
      jobOffer: { titre: "Développeur React" },
      status: "EN_ATTENTE",
    }
  ];

  const mockSpontanees = [
    {
      _id: "2",
      fullName: "Sarra Trabelsi",
      email: "sarra@test.com",
      telephone: "98765432",
      createdAt: "2026-01-02",
      posteRecherche: "Designer UI",
      status: "RETENU",
      type: "EMPLOYE",
    }
  ];

  it("affiche les candidatures", () => {

    cy.intercept("GET", "**/candidatures/with-job", {
      statusCode: 200,
      body: mockOffres
    }).as("getOffres");

    cy.intercept("GET", "**/applications/spontaneous", {
      statusCode: 200,
      body: mockSpontanees
    }).as("getSpont");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <CandidaturesUnifiedPage />
      </AppRouterContext.Provider>
    );

    // attendre chargement API
    cy.wait("@getOffres");
    cy.wait("@getSpont");

    cy.contains("Liste des Candidatures").should("exist");
    cy.contains("Ahmed Ben Ali").should("exist");
    cy.contains("Sarra Trabelsi").should("exist");
  });


  it("filtre les candidatures avec la recherche", () => {

  cy.intercept("GET", "**/candidatures/with-job", {
    body: mockOffres
  });

  cy.intercept("GET", "**/applications/spontaneous", {
    body: mockSpontanees
  });

  cy.mount(
    <AppRouterContext.Provider value={mockRouter}>
      <CandidaturesUnifiedPage />
    </AppRouterContext.Provider>
  );

  cy.wait(500);

  cy.get("input").type("Ahmed");

  cy.contains("Ahmed Ben Ali").should("exist");
  cy.contains("Sarra Trabelsi").should("not.exist");
});


it("change les tabs correctement", () => {

  cy.intercept("GET", "**/candidatures/with-job", {
    body: mockOffres
  });

  cy.intercept("GET", "**/applications/spontaneous", {
    body: mockSpontanees
  });

  cy.mount(
    <AppRouterContext.Provider value={mockRouter}>
      <CandidaturesUnifiedPage />
    </AppRouterContext.Provider>
  );

  cy.wait(500);

  cy.contains("Offres").click();

  cy.contains("Ahmed Ben Ali").should("exist");
  cy.contains("Sarra Trabelsi").should("not.exist");
});
});
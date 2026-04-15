import RecruitmentTrackingPage from "../../src/app/recruiter/tracking/page";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

describe("RecruitmentTrackingPage - Component", () => {

  beforeEach(() => {
    window.localStorage.setItem("token", "fake-token");
  });

  it("affiche les données du tracking", () => {

    const mockRouter = {
      push: cy.stub(),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.intercept("GET", "**/jobs/tracking", {
      statusCode: 200,
      body: {
        data: [
          {
            _id: "1",
            titre: "Développeur React",
            lieu: "Sfax",
            nombrePostes: 2,
            departement: "IT",
            societe: "Optylab",
            agence: "Agence 1",
            sexe: "H",
            typeDiplome: "Ingénieur",
            status: "VALIDEE",
            dateCloture: "2024-01-10",
            motif: "Urgent",
            createdByUser: "Admin",
            createdByEmail: "admin@test.com",
            createdAt: "2024-01-01T10:00:00Z",
          },
        ],
      },
    }).as("getTracking");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <RecruitmentTrackingPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getTracking");

    cy.contains("Suivi des Recrutements").should("be.visible");
    cy.contains("Développeur React").should("be.visible");
    cy.contains("Sfax").should("be.visible");
  });

  it("recherche fonctionne", () => {

    const mockRouter = {
      push: cy.stub(),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.intercept("GET", "**/jobs/tracking", {
      statusCode: 200,
      body: {
        data: [
          { _id: "1", titre: "React Dev" },
          { _id: "2", titre: "Python Dev" },
        ],
      },
    }).as("getTracking");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <RecruitmentTrackingPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getTracking");

    cy.get("input[placeholder*='Rechercher']")
      .type("React");

    cy.contains("React Dev").should("be.visible");
    cy.contains("Python Dev").should("not.exist");
  });

  it("export CSV fonctionne", () => {

    const mockRouter = {
      push: cy.stub(),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.intercept("GET", "**/jobs/tracking", {
      statusCode: 200,
      body: { data: [] },
    }).as("getTracking");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <RecruitmentTrackingPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getTracking");

    cy.contains("Exporter Excel").click();
  });

  it("affiche message si aucune offre", () => {

    const mockRouter = {
      push: cy.stub(),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.intercept("GET", "**/jobs/tracking", {
      statusCode: 200,
      body: { data: [] },
    }).as("getTracking");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <RecruitmentTrackingPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getTracking");

    cy.contains("Aucune offre trouvée.").should("be.visible");
  });

  it("redirige vers login si pas de token", () => {

    window.localStorage.removeItem("token");

    const mockRouter = {
      push: cy.stub().as("push"),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <RecruitmentTrackingPage />
      </AppRouterContext.Provider>
    );

    cy.get("@push").should("have.been.calledWith", "/login");
  });

});
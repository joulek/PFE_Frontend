import ComparisonsListPage from "../../src/app/recruiter/comparisons_list/page";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

describe("ComparisonsListPage - Component", () => {

  beforeEach(() => {
    window.localStorage.setItem("token", "fake-token");
  });

  it("affiche les comparaisons", () => {

    const mockRouter = {
      push: cy.stub(),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [
        {
          _id: "1",
          title: "Candidat A vs Candidat B",
          candidateNames: ["Candidat A", "Candidat B"],
          jobTitle: "Développeur",
          createdByName: "Admin",
          createdAt: "2024-01-01T10:00:00Z",
        },
      ],
    }).as("getComparisons");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <ComparisonsListPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getComparisons");

    cy.contains("Comparaisons IA").should("be.visible");
    cy.contains("Candidat A vs Candidat B").should("be.visible");
  });

  it("affiche état vide", () => {

    const mockRouter = {
      push: cy.stub(),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [],
    }).as("getComparisons");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <ComparisonsListPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getComparisons");

    cy.contains("Aucune comparaison").should("be.visible");
  });

  it("ouvre le modal de suppression", () => {

    const mockRouter = {
      push: cy.stub(),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [
        {
          _id: "1",
          title: "Test comparaison",
          candidateNames: ["A", "B"],
        },
      ],
    }).as("getComparisons");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <ComparisonsListPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getComparisons");

    // Le bouton poubelle est le 3e bouton (index 2) :
    // index 0 = "Nouvelle comparaison", index 1 = "Détails", index 2 = bouton trash
    cy.get("button").eq(2).click();

    cy.contains("Supprimer cette comparaison ?").should("be.visible");
  });

  it("supprime une comparaison", () => {

    const mockRouter = {
      push: cy.stub(),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [
        {
          _id: "1",
          title: "Test comparaison",
          candidateNames: ["A", "B"],
        },
      ],
    }).as("getComparisons");

    cy.intercept("DELETE", "**/api/interviews/comparisons/1", {
      statusCode: 200,
      body: {},
    }).as("deleteComparison");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <ComparisonsListPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getComparisons");

    // Ouvrir le modal de suppression
    cy.get("button").eq(2).click();

    // Attendre que le modal soit visible, puis cliquer sur le bouton de confirmation
    cy.contains("Supprimer cette comparaison ?").should("be.visible");
    cy.contains("button", "Supprimer").click();

    cy.wait("@deleteComparison");

    cy.contains("Test comparaison").should("not.exist");
  });

  it("redirige vers création comparaison", () => {

    const mockRouter = {
      push: cy.stub().as("push"),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [],
    }).as("getComparisons");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <ComparisonsListPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getComparisons");

    cy.contains("Nouvelle comparaison").click();

    cy.get("@push").should(
      "have.been.calledWith",
      "/recruiter/list_interview"
    );
  });

  it("redirige vers détails comparaison", () => {

    const mockRouter = {
      push: cy.stub().as("push"),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [
        {
          _id: "1",
          title: "Comparaison test",
          candidateNames: ["A", "B"],
        },
      ],
    }).as("getComparisons");

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <ComparisonsListPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getComparisons");

    cy.contains("Détails").click();

    cy.get("@push").should(
      "have.been.calledWith",
      "/recruiter/compare_interviews/1"
    );
  });

});
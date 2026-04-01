// cypress/component/spontaneous-application.cy.jsx

import React from "react";
import * as nextNavigation from "next/navigation";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import SpontaneousApplicationPage from "../../src/app/jobs/spontaneous/page";
import * as applicationApi from "../../src/app/services/application.api";

let mockRouter;

/* ───────── helper ───────── */

function mountPage() {
  cy.stub(nextNavigation, "useRouter").returns(mockRouter);

  cy.mount(
    <AppRouterContext.Provider value={mockRouter}>
      <SpontaneousApplicationPage />
    </AppRouterContext.Provider>
  );
}

/* ═════════ TESTS ═════════ */

describe("SpontaneousApplicationPage (Component)", () => {

  beforeEach(() => {

    mockRouter = {
      push: cy.stub().as("push"),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
    };

    // mock API succès par défaut
    cy.stub(applicationApi, "createSpontaneousApplication").callsFake(() =>
      Promise.resolve({ data: { message: "OK" } })
    );
  });

  /* ───────── UI ───────── */

  it("affiche le formulaire", () => {
    mountPage();

    cy.contains("Candidature spontanée").should("exist");
    cy.contains("Prénom").should("exist");
    cy.contains("Nom").should("exist");
    cy.contains("Email").should("exist");
    cy.contains("Téléphone").should("exist");
    cy.contains("Poste recherché").should("exist");
    cy.contains("Envoyer ma candidature").should("exist");
  });

  /* ───────── validation ───────── */

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

  it("affiche erreur si poste recherché manquant", () => {
    mountPage();

    cy.get("input[placeholder='Votre prénom']").type("Ahmed");
    cy.get("input[placeholder='Votre nom']").type("Ben Ali");
    cy.get("input[type='email']").type("ahmed@test.com");
    cy.get("input[placeholder='+216 XX XXX XXX']").type("12345678");

    cy.contains("Envoyer ma candidature").click();

    cy.contains("Le poste recherché est obligatoire").should("exist");
  });

  /* ───────── upload ───────── */

  it("affiche le fichier uploadé", () => {
    mountPage();

    cy.get("input[type='file']").selectFile({
      contents: Cypress.Buffer.from("file"),
      fileName: "cv.pdf",
      mimeType: "application/pdf",
    }, { force: true });

    cy.contains("cv.pdf").should("exist");
  });

  it("supprime le fichier", () => {
    mountPage();

    cy.get("input[type='file']").selectFile({
      contents: Cypress.Buffer.from("file"),
      fileName: "cv.pdf",
      mimeType: "application/pdf",
    }, { force: true });

    cy.contains("cv.pdf").should("exist");

    cy.get("button[type='button']").click();

    cy.contains("cv.pdf").should("not.exist");
  });



});
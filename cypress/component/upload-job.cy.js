import React from "react";
import StepUploadCV from "../../src/app/jobs/[jobId]/apply/steps/StepUploadCV";

// ─── helpers ────────────────────────────────────────────────────────────────
const buildPdfFile = (name = "mon-cv.pdf") =>
  new File(["dummy pdf content"], name, { type: "application/pdf" });

const mount = (props = {}) => {
  const defaults = {
    jobId: "job-123",
    onParsed: cy.stub().as("onParsed"),
    ...props,
  };
  cy.mount(<StepUploadCV {...defaults} />);
};

// ─── mock API ────────────────────────────────────────────────────────────────
// On stub le module avant chaque test qui en a besoin
const mockUploadSuccess = (payload = {}) => {
  cy.stub(
    require("../../../../services/application.api"),
    "uploadCvToJob"
  )
    .as("uploadCvToJob")
    .resolves({
      extracted: { nom: "Jean Dupont", email: "jean@test.com" },
      cvFileUrl: "https://cdn.example.com/cv.pdf",
      candidatureId: "cand-42",
      ...payload,
    });
};

const mockUploadError = (message = "Erreur serveur") => {
  cy.stub(
    require("../../../../services/application.api"),
    "uploadCvToJob"
  )
    .as("uploadCvToJob")
    .rejects(new Error(message));
};

// ────────────────────────────────────────────────────────────────────────────

describe("StepUploadCV — rendu initial", () => {
  beforeEach(() => mount());

  it("affiche le titre de l'étape 1", () => {
    cy.get("[data-cy=apply-step1-title]")
      .should("be.visible")
      .and("contain", "Étape 1");
  });

  it("affiche le sous-titre", () => {
    cy.get("[data-cy=apply-step1-subtitle]")
      .should("be.visible")
      .and("contain", "extraites automatiquement");
  });

  it("affiche la zone d'upload", () => {
    cy.get("[data-cy=upload-card]").should("be.visible");
  });

  it("affiche le bouton Soumettre le CV", () => {
    cy.get("[data-cy=submit-cv-btn]")
      .should("be.visible")
      .and("contain", "Soumettre le CV")
      .and("not.be.disabled");
  });

  it("n'affiche pas de nom de fichier au départ", () => {
    cy.get("[data-cy=selected-file-name]").should("not.exist");
  });

  it("n'affiche pas d'erreur au départ", () => {
    cy.get("[data-cy=upload-error]").should("not.exist");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("StepUploadCV — sélection d'un fichier", () => {
  beforeEach(() => mount());

  it("affiche le nom du fichier sélectionné", () => {
    cy.get("[data-cy=cv-input]").selectFile(
      { contents: Cypress.Buffer.from("pdf"), fileName: "cv-test.pdf", mimeType: "application/pdf" },
      { force: true }
    );
    cy.get("[data-cy=selected-file-name]")
      .should("be.visible")
      .and("contain", "cv-test.pdf");
  });

  it("efface l'erreur quand on sélectionne un fichier", () => {
    // déclencher une erreur d'abord
    cy.get("[data-cy=submit-cv-btn]").click();
    cy.get("[data-cy=upload-error]").should("be.visible");

    cy.get("[data-cy=cv-input]").selectFile(
      { contents: Cypress.Buffer.from("pdf"), fileName: "cv.pdf", mimeType: "application/pdf" },
      { force: true }
    );
    cy.get("[data-cy=upload-error]").should("not.exist");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("StepUploadCV — soumission sans fichier", () => {
  beforeEach(() => mount());

  it("affiche un message d'erreur si aucun fichier n'est sélectionné", () => {
    cy.get("[data-cy=submit-cv-btn]").click();
    cy.get("[data-cy=upload-error]")
      .should("be.visible")
      .and("contain", "PDF");
  });

  it("ne déclenche pas onParsed si aucun fichier", () => {
    cy.get("[data-cy=submit-cv-btn]").click();
    cy.get("@onParsed").should("not.have.been.called");
  });
});


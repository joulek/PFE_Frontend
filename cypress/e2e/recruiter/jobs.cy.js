describe("ADMIN - Gestion des offres", () => {

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  // =========================================================
  // 1. LISTE DES OFFRES
  // =========================================================
  it("Afficher la liste des offres", () => {

    cy.intercept("GET", "**/jobs/all", {
      statusCode: 200,
      body: {
        data: [
          {
            _id: "1",
            titre: "Développeur React",
            status: "EN_ATTENTE",
            typeOffre: "EMPLOI",
            dateCloture: "2026-12-31"
          }
        ]
      }
    }).as("getJobs");

    cy.visit("/recruiter/jobs");

    cy.wait("@getJobs");

    cy.contains("Développeur React").should("exist");
    cy.contains("En attente").should("exist");

  });

  // =========================================================
  // 2. CREATION OFFRE
  // =========================================================
  it("Créer une offre", () => {

    cy.intercept("POST", "**/jobs", {
      statusCode: 201,
      body: { message: "created" }
    }).as("createJob");

    cy.visit("/recruiter/jobs");

    cy.get("[data-cy=add-job-btn]").click();

    cy.get("[data-cy=input-titre]").type("Offre Admin Test");
    cy.get("[data-cy=input-description]").type("Description test");
    cy.get("[data-cy=input-lieu]").type("Sfax");
    cy.get("[data-cy=input-dateCloture]").type("2026-12-31");

    cy.contains("Enregistrer").click();

    cy.wait("@createJob");

  });

  // =========================================================
  // 3. VALIDER OFFRE
  // =========================================================
  it("Valider une offre EN_ATTENTE", () => {

    cy.intercept("GET", "**/jobs/1", {
      statusCode: 200,
      body: {
        data: {
          _id: "1",
          titre: "Test",
          status: "EN_ATTENTE"
        }
      }
    }).as("getJob");

    cy.intercept("POST", "**/jobs/1/validate", {
      statusCode: 200
    }).as("validateJob");

    cy.visit("/recruiter/jobs/1");

    cy.wait("@getJob");

    cy.contains("Valider").click();

    cy.wait("@validateJob");

  });

  // =========================================================
  // 4. PUBLIER OFFRE
  // =========================================================
  it("Publier une offre VALIDEE", () => {

    cy.intercept("GET", "**/jobs/1", {
      statusCode: 200,
      body: {
        data: {
          _id: "1",
          titre: "Test",
          status: "VALIDEE"
        }
      }
    }).as("getJob");

    cy.intercept("POST", "**/jobs/1/confirm", {
      statusCode: 200
    }).as("confirmJob");

    cy.visit("/recruiter/jobs/1");

    cy.wait("@getJob");

    cy.contains("Publier").click();

    cy.wait("@confirmJob");

  });

  // =========================================================
  // 5. REJETER OFFRE
  // =========================================================
  it("Rejeter une offre", () => {

    cy.intercept("GET", "**/jobs/1", {
      statusCode: 200,
      body: {
        data: {
          _id: "1",
          titre: "Test",
          status: "EN_ATTENTE"
        }
      }
    }).as("getJob");

    cy.intercept("POST", "**/jobs/1/reject", {
      statusCode: 200
    }).as("rejectJob");

    cy.visit("/recruiter/jobs/1");

    cy.wait("@getJob");

    cy.contains("Rejeter").click();

    cy.contains("Confirmer").click();

    cy.wait("@rejectJob");

  });

  // =========================================================
  // 6. SUPPRESSION (MODAL)
  // =========================================================
  it("Supprimer une offre avec modal", () => {

    cy.intercept("GET", "**/jobs/1", {
      statusCode: 200,
      body: {
        data: {
          _id: "1",
          titre: "Offre à supprimer",
          status: "EN_ATTENTE"
        }
      }
    }).as("getJob");

    cy.intercept("DELETE", "**/jobs/1", {
      statusCode: 200
    }).as("deleteJob");

    cy.visit("/recruiter/jobs/1");

    cy.wait("@getJob");

    cy.get("[data-cy=delete-job-btn]").click();

    // modal exist (IMPORTANT 🔥)
    cy.get("[data-cy=delete-modal]").should("exist");

    cy.get("[data-cy=confirm-delete]").click();

    cy.wait("@deleteJob");

  });

  // =========================================================
  // 7. BADGES STATUS
  // =========================================================
  it("Afficher les bons badges", () => {

    cy.intercept("GET", "**/jobs/1", {
      statusCode: 200,
      body: {
        data: {
          _id: "1",
          titre: "Test",
          status: "CONFIRMEE"
        }
      }
    }).as("getJob");

    cy.visit("/recruiter/jobs/1");

    cy.wait("@getJob");

    cy.contains("Publiée").should("exist");

  });

});
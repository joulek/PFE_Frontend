describe("Candidature - Step 1 Upload + Step 2 Vérification", () => {
  const jobId = "69612594fa71bdcfbe479de5";

  beforeEach(() => {
    cy.visit(`http://localhost:3000/jobs/${jobId}/apply`);
  });

  it("Affiche correctement la page Étape 1", () => {
    cy.get('[data-cy="apply-step1-title"]').should(
      "contain",
      "Étape 1 — Upload du CV"
    );

    cy.get('[data-cy="apply-step1-subtitle"]').should(
      "contain",
      "Les informations seront extraites automatiquement"
    );

    cy.get('[data-cy="upload-card"]').should("exist");
    cy.get('[data-cy="submit-cv-btn"]').should("exist");
  });

  it("Affiche une erreur si on clique sur Soumettre sans choisir un fichier", () => {
    cy.get('[data-cy="submit-cv-btn"]').click();

    cy.get('[data-cy="upload-error"]')
      .should("exist")
      .and("contain", "Veuillez sélectionner un CV au format PDF.");
  });

  it("Upload CV avec intercept API + passe à l’étape 2", () => {
    cy.intercept("POST", `**/api/applications/${jobId}/cv`, {
      statusCode: 200,
      body: {
        candidatureId: "fake_candidature_id_123",
        cvFileUrl: "/uploads/cvs/test.pdf",
        extracted: {
          nom: "Test User",
          email: "test.user@gmail.com",
          telephone: "+216 99 999 999",
          adresse: "Sfax",
          titre_poste: "Développeur",
          profil: "Profil test",
          competences: {
            langages_programmation: ["React", "Node.js"],
            frameworks: ["Next.js"],
            outils: ["Git"],
            bases_donnees: ["MongoDB"],
            autres: [],
          },
          formation: [
            {
              diplome: "Licence Informatique",
              etablissement: "ISET Sfax",
              periode: "2021 - 2024",
            },
          ],
          experience_professionnelle: [],
          projets: [],
          certifications: [],
          langues: [],
          activites: ["Sport"],
          reseaux_sociaux: {
            linkedin: "linkedin.com/in/test",
            github: "github.com/test",
          },
        },
      },
    }).as("uploadCV");

    cy.get('[data-cy="cv-input"]').selectFile("cypress/fixtures/test.pdf", {
      force: true,
    });

    cy.get('[data-cy="selected-file-name"]').should("contain", "test.pdf");

    cy.get('[data-cy="submit-cv-btn"]').click();

    cy.wait("@uploadCV");

    cy.contains("Étape 2 — Vérification & Complément").should("exist");
    cy.contains("Informations personnelles").should("exist");
  });

  it("Navigation Step 2 : Continuer puis Retour", () => {
    cy.intercept("POST", `**/api/applications/${jobId}/cv`, {
      statusCode: 200,
      body: {
        candidatureId: "fake_candidature_id_123",
        cvFileUrl: "/uploads/cvs/test.pdf",
        extracted: {
          nom: "Test User",
          email: "test.user@gmail.com",
          telephone: "+216 99 999 999",
          adresse: "Sfax",
          titre_poste: "Développeur",
          profil: "Profil test",
          competences: { all: ["React"] },
          formation: [],
          experience_professionnelle: [],
          projets: [],
          certifications: [],
          langues: [],
          activites: [],
          reseaux_sociaux: {},
        },
      },
    }).as("uploadCV");

    cy.get('[data-cy="cv-input"]').selectFile("cypress/fixtures/test.pdf", {
      force: true,
    });

    cy.get('[data-cy="submit-cv-btn"]').click();
    cy.wait("@uploadCV");

    cy.contains("Étape 2 — Vérification & Complément").should("exist");

    cy.contains("Continuer →").click();
    cy.contains("Profil / Résumé").should("exist");

    cy.contains("← Retour").click();
    cy.contains("Informations personnelles").should("exist");
  });

  it("Flow complet : Upload -> Step2 -> Dernière section -> Envoyer candidature", () => {
    // 1) Upload CV => Step2
    cy.intercept("POST", `**/api/applications/${jobId}/cv`, {
      statusCode: 200,
      body: {
        candidatureId: "fake_candidature_id_123",
        cvFileUrl: "/uploads/cvs/test.pdf",
        extracted: {
          nom: "Test User",
          email: "test.user@gmail.com",
          telephone: "+216 99 999 999",
          adresse: "Sfax",
          titre_poste: "Développeur",
          profil: "Profil test",
          competences: { all: ["React", "Node.js"] },
          formation: [
            {
              diplome: "Licence Informatique",
              etablissement: "ISET Sfax",
              periode: "2021 - 2024",
            },
          ],
          experience_professionnelle: [],
          projets: [],
          certifications: [],
          langues: [],
          activites: ["Sport"],
          reseaux_sociaux: {
            linkedin: "linkedin.com/in/test",
            github: "github.com/test",
          },
        },
      },
    }).as("uploadCV");

    cy.get('[data-cy="cv-input"]').selectFile("cypress/fixtures/test.pdf", {
      force: true,
    });

    cy.get('[data-cy="submit-cv-btn"]').click();
    cy.wait("@uploadCV");

    cy.contains("Étape 2 — Vérification & Complément").should("exist");

    // 2) Intercept SUBMIT FINAL (URL CORRECTE)
    cy.intercept(
      "POST",
      "**/api/applications/fake_candidature_id_123/confirm",
      {
        statusCode: 200,
        body: { message: "OK" },
      }
    ).as("submitCandidature");

    // 3) Aller à la dernière section (9 sections => 8 clicks)
    for (let i = 0; i < 8; i++) {
      cy.contains("Continuer →").click();
    }

    cy.contains("Activités / Intérêts").should("exist");

    // 4) Cliquer Envoyer
    cy.contains("Envoyer ma candidature →").click();

    // 5) Vérifier l'appel API final
    cy.wait("@submitCandidature");

    // 6) Vérifier message succès
    cy.contains("Votre candidature a été envoyée avec succès").should("exist");
  });
});

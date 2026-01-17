describe("Candidature - Step 1 Upload + Step 2 Vérification", () => {
  const jobId = "69612594fa71bdcfbe479de5";

  beforeEach(() => {
    cy.visit(`http://localhost:3000/jobs/${jobId}/apply`);
  });

  it("Flow complet : Upload -> Step2 -> Dernière section -> Envoyer candidature (avec nouveaux champs)", () => {
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

          personal_info: {
            date_naissance: "01/01/2000",
            lieu_naissance: "Tunis",
            numero_cin: "12345678",
            cin_delivree_le: "01/01/2018",
            cin_delivree_a: "Sfax",
            code_postal: "3000",
            permis_conduire: "Non",
            date_obtention_permis: "",
            situation_familiale: "Célibataire",
            nombre_enfants: "",
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

    // 2) Intercept SUBMIT FINAL
    cy.intercept(
      "POST",
      "**/api/applications/fake_candidature_id_123/confirm",
      {
        statusCode: 200,
        body: { message: "OK" },
      }
    ).as("submitCandidature");

    // 3) Test permis
    cy.contains("Permis de conduire").should("exist");
    cy.contains("Oui").click();
    cy.contains("Date d’obtention du permis").should("exist");

    // 4) Aller à la dernière section (click jusqu’à disparition de Continuer)
    const goNext = () => {
      cy.get("body").then(($body) => {
        if ($body.find('button:contains("Continuer →")').length > 0) {
          cy.contains("Continuer →").click();
          goNext();
        }
      });
    };

    goNext();

    // 5) Vérifier qu'on est à la fin
    cy.contains("Envoyer ma candidature →").should("exist");

    // 6) Envoyer
    cy.contains("Envoyer ma candidature →").click();

    // 7) Vérifier l'appel API final
    cy.wait("@submitCandidature");

    // 8) Message succès
    cy.contains("Votre candidature a été envoyée avec succès").should("exist");
  });
});

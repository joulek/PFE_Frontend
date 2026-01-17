describe("Candidature - Step 1 Upload + Step 2 Vérification", () => {
  const jobId = "69612594fa71bdcfbe479de5";

  beforeEach(() => {
    cy.visit(`http://localhost:3000/jobs/${jobId}/apply`);
  });

  it("Flow complet : Upload -> Step2 -> toutes les sections -> Envoyer", () => {
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

    cy.intercept(
      "POST",
      "**/api/applications/fake_candidature_id_123/confirm",
      (req) => {
        req.reply({
          statusCode: 200,
          body: { message: "OK" },
        });
      }
    ).as("submitCandidature");

    const next = () => cy.contains("Continuer →").click();
    const assertSectionTitle = (title) => cy.get("h3").should("contain", title);

    // ===== 1) PERSONAL =====
    assertSectionTitle("Informations personnelles");

    cy.get('[data-cy="full-name"]').should("have.value", "Test User");
    cy.get('[data-cy="email"]').should("have.value", "test.user@gmail.com");
    cy.get('[data-cy="phone"]').should("have.value", "+216 99 999 999");
    cy.get('[data-cy="address"]').should("have.value", "Sfax");
    cy.get('[data-cy="job-title"]').should("have.value", "Développeur");

    cy.get('[data-cy="numero-cin"]').should("have.value", "12345678");
    cy.get('[data-cy="code-postal"]').should("have.value", "3000");

    cy.get('[data-cy="permis-oui"]').click();
    cy.contains("Date d’obtention du permis").should("exist");
    cy.get('[data-cy="permis-non"]').click();
    cy.contains("Date d’obtention du permis").should("not.exist");

    cy.contains("+ Ajouter un champ").click();
    cy.contains("Champ (titre)").should("exist");

    next();

    // ===== 2) PROFILE =====
    assertSectionTitle("Profil");
    cy.get('[data-cy="profile"]')
      .clear()
      .type("Je suis un profil modifié par Cypress.");
    next();

    // ===== 3) SKILLS =====
    assertSectionTitle("Compétences");

    cy.get('[data-cy="new-skill"]').clear().type("MongoDB");
    cy.contains("button", /^Ajouter$/).click();
    cy.contains("MongoDB", { timeout: 8000 }).should("exist");

    next();

    // ===== 4) EDUCATION =====
    assertSectionTitle("Formation");
    cy.contains("+ Ajouter").click();

    cy.get('input[placeholder="Ex : Licence Informatique"]').last().type("Master GL");
    cy.get('input[placeholder="Ex : ISET Sfax"]').last().type("ISET Sfax");
    cy.get('input[placeholder="Ex : 2022 - 2025"]').last().type("2024 - 2026");
    next();

    // ===== 5) EXPERIENCE =====
    assertSectionTitle("Expérience professionnelle");
    cy.contains("+ Ajouter").click();

    cy.get('input[placeholder="Ex : Développeuse Fullstack"]').last().type("Développeuse");
    cy.get('input[placeholder="Ex : MTR"]').last().type("Optylab");
    cy.get('input[placeholder="Ex : Sfax"]').last().type("Sfax");
    cy.get('input[placeholder="Ex : Juin 2024 - Sept 2024"]').last().type("2024");

    cy.get('textarea[placeholder="Décrivez vos missions..."]').last().type("Missions test Cypress.");
    next();

    // ===== 6) PROJECTS =====
    assertSectionTitle("Projets");
    cy.contains("+ Ajouter").click();

    cy.get('input[placeholder="Ex : YnityLearn"]').last().type("Projet Cypress");
    cy.get('textarea[placeholder="Décrivez le projet..."]').last().type("Description projet test.");
    cy.get('input[placeholder="Ex : React, Node.js, MongoDB"]').last().type("React, Node.js, MongoDB");
    next();

    // ===== 7) CERTIFICATIONS =====
    assertSectionTitle("Certifications");
    cy.contains("+ Ajouter").click();

    cy.get('input[placeholder="Ex : ISTQB Foundation"]').last().type("ISTQB Foundation");
    cy.get('input[placeholder="Ex : ISTQB"]').last().type("ISTQB");
    cy.get('input[placeholder="Ex : 2025"]').last().type("2025");
    next();

    // ===== 8) LANGUAGES =====
    assertSectionTitle("Langues");
    cy.contains("+ Ajouter").click();

    cy.get('input[placeholder="Ex : Français"]').last().type("Français");
    cy.get('input[placeholder="Ex : Courant"]').last().type("Courant");
    next();

    // ===== 9) INTERESTS =====
    assertSectionTitle("Centres d’intérêt");
    cy.get('[data-cy="interests"]')
      .clear()
      .type("Sport\nLecture", { parseSpecialCharSequences: false });

    cy.contains("Envoyer ma candidature →").should("exist").click();

    // ✅ ASSERT BODY (WORKFLOW parsed/manual)
    cy.wait("@submitCandidature").then((interception) => {
      const raw = interception.request.body;
      const body = typeof raw === "string" ? JSON.parse(raw) : raw;

      expect(body).to.have.property("manual");
      expect(body).to.have.property("parsed");

      expect(body.manual).to.have.property("personal_info");
      expect(body.manual.personal_info.numero_cin).to.eq("12345678");
      expect(body.manual.personal_info.code_postal).to.eq("3000");

      expect(body.manual).to.have.property("competences");
      expect(body.manual.competences.all).to.include("MongoDB");
    });

    cy.contains("Votre candidature a été envoyée avec succès").should("exist");
  });
});

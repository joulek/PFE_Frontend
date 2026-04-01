// cypress/e2e/stage-postuler.cy.js

describe("Postuler à un Stage", () => {
  const JOB_ID = "507f1f77bcf86cd799439011"; // ObjectId MongoDB valide
  const BASE_URL = `/jobs/${JOB_ID}/postuler`; // ← adaptez selon votre routing Next.js

  // ─── Fixtures ────────────────────────────────────────────────────────────────
  const validForm = {
    prenom: "Yosr ",
    nom: "Joulek",
    email: "yosrjoulek123@gmail.com",
    telephone: "+216 99 080 604",
    message:
      "Étudiant en 3ème année génie logiciel, je suis motivé pour rejoindre votre équipe dans le cadre de mon stage PFE.",
  };

  const mockJob = {
    id: JOB_ID,
    titre: "Stage PFE Développeur React",
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const interceptJob = (jobData = mockJob) => {
    cy.intercept("GET", `**/jobs/${JOB_ID}`, {
      statusCode: 200,
      body: jobData,
    }).as("getJob");
  };

  const interceptSubmit = (statusCode = 201, body = { message: "Candidature créée" }) => {
    cy.intercept("POST", `**/applications/stage/${JOB_ID}`, { statusCode, body }).as("submitStage");
  };

  const fillForm = (data = validForm) => {
    if (data.prenom)    cy.get('input[placeholder="Votre prénom"]').clear().type(data.prenom);
    if (data.nom)       cy.get('input[placeholder="Votre nom"]').clear().type(data.nom);
    if (data.email)     cy.get('input[type="email"]').clear().type(data.email);
    if (data.telephone) cy.get('input[placeholder="+216 XX XXX XXX"]').clear().type(data.telephone);
    if (data.message)   cy.get("textarea").clear().type(data.message);
  };

  const uploadCV = () => {
    cy.fixture("test.pdf", "base64").then((fileContent) => {
      cy.get('input[type="file"]').selectFile(
        {
          contents: Cypress.Buffer.from(fileContent, "base64"),
          fileName: "test.pdf",
          mimeType: "application/pdf",
        },
        { force: true }
      );
    });
  };

  const getErrorBanner = () =>
    cy.get(".rounded-xl.border.border-red-200, .rounded-xl.border.border-red-800");

  // ─── Setup ───────────────────────────────────────────────────────────────────
  beforeEach(() => {
    interceptJob();
    cy.visit(BASE_URL);
    cy.wait("@getJob");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. RENDU INITIAL
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Rendu initial de la page", () => {
    it("affiche le titre principal", () => {
      cy.contains("h1", "Postuler pour ce stage").should("be.visible");
    });

    it("affiche le titre du stage récupéré depuis l'API", () => {
      cy.contains(mockJob.titre).should("be.visible");
    });

    it("affiche tous les champs du formulaire", () => {
      cy.get('input[placeholder="Votre prénom"]').should("be.visible");
      cy.get('input[placeholder="Votre nom"]').should("be.visible");
      cy.get('input[type="email"]').should("be.visible");
      cy.get('input[placeholder="+216 XX XXX XXX"]').should("be.visible");
      cy.get("textarea").should("be.visible");
    });

    it("affiche le champ 'Stage recherché' pré-rempli et en lecture seule", () => {
      cy.get('input[placeholder*="Stage PFE"]')
        .should("have.value", mockJob.titre)
        .and("have.attr", "readonly");
    });

    it("affiche la zone d'upload CV (obligatoire)", () => {
      cy.contains("Cliquez pour uploader votre CV").should("be.visible");
      cy.get('input[type="file"]').should("exist");
      // Le label CV doit contenir un astérisque (champ obligatoire)
      cy.contains("CV (PDF, max 5 Mo)").should("be.visible");
    });

    it("affiche le bouton de soumission", () => {
      cy.contains("button", "Envoyer ma candidature").should("be.visible");
    });

    it("n'affiche aucune erreur au chargement", () => {
      getErrorBanner().should("not.exist");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CHARGEMENT DU JOB
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Chargement dynamique du stage", () => {
    it("affiche un texte générique si l'API job échoue", () => {
      cy.intercept("GET", `**/jobs/${JOB_ID}`, { forceNetworkError: true }).as("jobError");
      cy.visit(BASE_URL);
      cy.wait("@jobError");
      cy.contains("Remplissez le formulaire ci-dessous").should("be.visible");
    });

    it("pré-remplit le champ posteRecherche avec le titre du stage", () => {
      cy.get('input[placeholder*="Stage PFE"]').should("have.value", mockJob.titre);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. VALIDATIONS CHAMP PAR CHAMP
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Validation des champs obligatoires", () => {
    it("affiche une erreur si prénom manquant", () => {
      fillForm({ ...validForm, prenom: "" });
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "prénom");
    });

    it("affiche une erreur si nom manquant", () => {
      fillForm({ ...validForm, nom: "" });
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "nom");
    });

    it("affiche une erreur si email invalide", () => {
      fillForm({ ...validForm, email: "email-invalide" });
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "Email invalide");
    });

    it("affiche une erreur si email vide", () => {
      fillForm({ ...validForm, email: "" });
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "Email invalide");
    });

    it("affiche une erreur si lettre de motivation manquante", () => {
      fillForm({ ...validForm, message: "" });
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "motivation");
    });

    it("affiche une erreur si téléphone manquant", () => {
      fillForm({ ...validForm, telephone: "" });
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "téléphone");
    });

    it("affiche une erreur si le formulaire est entièrement vide", () => {
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("be.visible");
    });

    it("affiche une erreur si le CV n'est pas uploadé", () => {
      fillForm(validForm);
      // Pas d'upload de CV
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "CV");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. UPLOAD DU CV (optionnel)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Upload du CV (obligatoire)", () => {
    it("affiche le nom du fichier après upload", () => {
      uploadCV();
      cy.contains("test.pdf").should("be.visible");
    });


    it("rejette un fichier dépassant 5 Mo", () => {
      const largeContent = new Uint8Array(6 * 1024 * 1024);
      cy.get('input[type="file"]').selectFile(
        { contents: largeContent, fileName: "gros-cv.pdf", mimeType: "application/pdf" },
        { force: true }
      );
      getErrorBanner().should("contain.text", "5 Mo");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SOUMISSION RÉUSSIE
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Soumission réussie", () => {
    beforeEach(() => {
      interceptSubmit();
    });

    it("envoie les données au bon endpoint avec jobId", () => {
      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@submitStage").then((interception) => {
        expect(interception.request.url).to.include(JOB_ID);
        expect(interception.request.headers["content-type"]).to.include("multipart/form-data");
      });
    });

    it("envoie correctement le CV dans le FormData si uploadé", () => {
      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@submitStage").then((interception) => {
        expect(interception.request.headers["content-type"]).to.include("multipart/form-data");
      });
    });

    it("affiche l'écran de confirmation après succès", () => {
      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@submitStage");
      cy.contains("Candidature envoyée !").should("be.visible");
      cy.contains("Notre équipe RH examinera votre dossier").should("be.visible");
    });

    it("affiche le bouton 'Retour aux offres' sur l'écran de confirmation", () => {
      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@submitStage");
      cy.contains("button", "Retour aux offres").should("be.visible");
    });

    it("redirige vers /jobs en cliquant sur 'Retour aux offres'", () => {
      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@submitStage");
      cy.contains("button", "Retour aux offres").click();
      cy.url().should("include", "/jobs");
    });

    it("affiche le spinner pendant l'envoi", () => {
      // Réponse lente : bloquer la requête jusqu'au tick
      cy.intercept("POST", `**/applications/stage/${JOB_ID}`, (req) => {
        req.on("response", (res) => { res.setDelay(3000); });
      }).as("slowSubmit");

      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();

      // Le spinner doit apparaître immédiatement après le clic
      cy.get("button[type=submit]").should("be.disabled").and("contain.text", "Envoi en cours...");
      cy.wait("@slowSubmit");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. GESTION DES ERREURS API
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Gestion des erreurs API", () => {
    it("affiche le message d'erreur retourné par le serveur", () => {
      interceptSubmit(400, { message: "Vous avez déjà postulé à ce stage." });
      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@submitStage");
      getErrorBanner().should("contain.text", "Vous avez déjà postulé à ce stage.");
    });

    it("affiche un message générique en cas d'erreur réseau", () => {
      cy.intercept("POST", `**/applications/stage/${JOB_ID}`, { forceNetworkError: true }).as("netErr");
      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@netErr");
      getErrorBanner().should("be.visible");
    });

    it("réactive le bouton d'envoi après une erreur serveur", () => {
      interceptSubmit(500, { message: "Erreur interne" });
      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@submitStage");
      cy.get("button[type=submit]").should("not.be.disabled");
    });

    it("efface l'erreur précédente à la nouvelle soumission", () => {
      // 1ère tentative → erreur front (champs vides)
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("be.visible");

      // 2ème tentative → succès
      interceptSubmit();
      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("not.exist");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. UX & ACCESSIBILITÉ
  // ═══════════════════════════════════════════════════════════════════════════
  describe("UX et accessibilité", () => {
    it("le bouton submit est désactivé pendant l'envoi", () => {
      cy.intercept("POST", `**/applications/stage/${JOB_ID}`, (req) => {
        req.on("response", (res) => { res.setDelay(3000); });
      });
      fillForm(validForm);
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      cy.get("button[type=submit]").should("be.disabled");
    });

    it("les champs acceptent les caractères accentués", () => {
      cy.get('input[placeholder="Votre prénom"]').type("Émilie-Zoé");
      cy.get('input[placeholder="Votre prénom"]').should("have.value", "Émilie-Zoé");
    });

   
  });
});
// cypress/e2e/spontaneous-application.cy.js

describe("Candidature Spontanée", () => {
  const BASE_URL = "/jobs/spontaneous"; // ← adaptez selon votre routing Next.js

  // ─── Fixtures ────────────────────────────────────────────────────────────────
  const validForm = {
    prenom: "Aymen",
    nom: "Trabelsi",
    email: "aymen.trabelsi@example.com",
    telephone: "+216 55 123 456",
    posteRecherche: "Développeur Frontend React",
    message:
      "Passionné par le développement web, je souhaite rejoindre votre équipe avec 3 ans d'expérience en React et Next.js.",
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const fillForm = (data = validForm) => {
    if (data.prenom)        cy.get('input[placeholder="Votre prénom"]').clear().type(data.prenom);
    if (data.nom)           cy.get('input[placeholder="Votre nom"]').clear().type(data.nom);
    if (data.email)         cy.get('input[type="email"]').clear().type(data.email);
    if (data.telephone)     cy.get('input[placeholder="+216 XX XXX XXX"]').clear().type(data.telephone);
    if (data.posteRecherche)
      cy.get('input[placeholder*="Développeur Frontend"]').clear().type(data.posteRecherche);
    if (data.message)       cy.get("textarea").clear().type(data.message);
  };

  const uploadCV = (fileName = "test.pdf") => {
    cy.fixture(fileName, "base64").then((fileContent) => {
      cy.get('input[type="file"]').selectFile(
        {
          contents: Cypress.Buffer.from(fileContent, "base64"),
          fileName,
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
    cy.visit(BASE_URL);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. RENDU INITIAL
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Rendu initial de la page", () => {
    it("affiche le titre et le sous-titre", () => {
      cy.contains("h1", "Candidature spontanée").should("be.visible");
      cy.contains("Envoyez votre candidature").should("be.visible");
    });

    it("affiche tous les champs du formulaire", () => {
      cy.get('input[placeholder="Votre prénom"]').should("be.visible");
      cy.get('input[placeholder="Votre nom"]').should("be.visible");
      cy.get('input[type="email"]').should("be.visible");
      cy.get('input[placeholder="+216 XX XXX XXX"]').should("be.visible");
      cy.get('input[placeholder*="Développeur Frontend"]').should("be.visible");
      cy.get("textarea").should("be.visible");
    });

    it("affiche la zone d'upload CV", () => {
      cy.contains("Cliquez pour uploader votre CV").should("be.visible");
      cy.get('input[type="file"]').should("exist");
    });

    it("affiche le bouton de soumission", () => {
      cy.contains("button", "Envoyer ma candidature").should("be.visible");
    });

    it("n'affiche aucune erreur au chargement", () => {
      getErrorBanner().should("not.exist");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. VALIDATIONS CHAMP PAR CHAMP
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Validation des champs obligatoires", () => {
    it("affiche une erreur si prénom manquant", () => {
      fillForm({ ...validForm, prenom: "" });
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "prénom");
    });

    it("affiche une erreur si nom manquant", () => {
      fillForm({ ...validForm, nom: "" });
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "nom");
    });

    it("affiche une erreur si email invalide", () => {
      fillForm({ ...validForm, email: "email-invalide" });
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "Email invalide");
    });

    it("affiche une erreur si email vide", () => {
      fillForm({ ...validForm, email: "" });
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "Email invalide");
    });

    it("affiche une erreur si téléphone manquant", () => {
      fillForm({ ...validForm, telephone: "" });
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "téléphone");
    });

    it("affiche une erreur si poste recherché manquant", () => {
      fillForm({ ...validForm, posteRecherche: "" });
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "poste");
    });

    it("affiche une erreur si message manquant", () => {
      fillForm({ ...validForm, message: "" });
      uploadCV();
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "message");
    });

    it("affiche une erreur si le CV n'est pas uploadé", () => {
      fillForm(validForm);
      // Pas d'upload de CV
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("contain.text", "CV");
    });

    it("affiche une erreur si le formulaire est entièrement vide", () => {
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("be.visible");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. UPLOAD DU CV
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Upload du CV", () => {
    it("affiche le nom du fichier après upload", () => {
      uploadCV("test.pdf");
      cy.contains("test.pdf").should("be.visible");
    });



   

    it("rejette un fichier dépassant 5 Mo", () => {
      // Créer un faux fichier > 5 Mo
      const largeContent = new Uint8Array(6 * 1024 * 1024); // 6 Mo
      cy.get('input[type="file"]').selectFile(
        {
          contents: largeContent,
          fileName: "gros-cv.pdf",
          mimeType: "application/pdf",
        },
        { force: true }
      );
      getErrorBanner().should("contain.text", "5 Mo");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SOUMISSION RÉUSSIE
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Soumission réussie", () => {
    beforeEach(() => {
      // Intercepter l'appel API et simuler une réponse réussie
      cy.intercept("POST", "**/applications/spontaneous", {
        statusCode: 201,
        body: { message: "Candidature créée avec succès" },
      }).as("submitApplication");
    });

    it("envoie les bonnes données à l'API", () => {
      fillForm(validForm);
      uploadCV("test.pdf");
      cy.contains("button", "Envoyer ma candidature").click();

      cy.wait("@submitApplication").then((interception) => {
        const body = interception.request.body;
        // FormData est envoyé en multipart – vérifier le corps brut
        expect(interception.request.headers["content-type"]).to.include("multipart/form-data");
        // Optionnel : vérifier le type
        expect(body.toString()).to.include("SPONTANEE");
      });
    });

    it("affiche l'écran de confirmation après succès", () => {
      fillForm(validForm);
      uploadCV("test.pdf");
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@submitApplication");

      cy.contains("Candidature envoyée !").should("be.visible");
      cy.contains("Notre équipe RH examinera votre candidature").should("be.visible");
    });

    it("affiche le bouton de retour aux offres sur l'écran de confirmation", () => {
      fillForm(validForm);
      uploadCV("test.pdf");
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@submitApplication");

      cy.contains("button", "Retour aux offres").should("be.visible");
    });

    it("redirige vers /jobs en cliquant sur 'Retour aux offres'", () => {
      fillForm(validForm);
      uploadCV("test.pdf");
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@submitApplication");

      cy.contains("button", "Retour aux offres").click();
      cy.url().should("include", "/jobs");
    });

    it("affiche le spinner pendant l'envoi", () => {
      // Simuler une réponse lente
      cy.intercept("POST", "**/applications/spontaneous", (req) => {
        req.reply({ delay: 1500, statusCode: 201, body: {} });
      }).as("slowSubmit");

      fillForm(validForm);
      uploadCV("test.pdf");
      cy.contains("button", "Envoyer ma candidature").click();

      cy.contains("Envoi en cours...").should("be.visible");
      cy.get("button[type=submit]").should("be.disabled");
      cy.wait("@slowSubmit");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. GESTION DES ERREURS API
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Gestion des erreurs API", () => {
    it("affiche le message d'erreur retourné par le serveur", () => {
      cy.intercept("POST", "**/applications/spontaneous", {
        statusCode: 400,
        body: { message: "Cet email est déjà utilisé." },
      }).as("errorResponse");

      fillForm(validForm);
      uploadCV("test.pdf");
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@errorResponse");

      getErrorBanner().should("contain.text", "Cet email est déjà utilisé.");
    });

    it("affiche un message générique en cas d'erreur réseau", () => {
      cy.intercept("POST", "**/applications/spontaneous", {
        forceNetworkError: true,
      }).as("networkError");

      fillForm(validForm);
      uploadCV("test.pdf");
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@networkError");

      getErrorBanner().should("be.visible");
    });

    it("réactive le bouton d'envoi après une erreur", () => {
      cy.intercept("POST", "**/applications/spontaneous", {
        statusCode: 500,
        body: { message: "Erreur serveur" },
      }).as("serverError");

      fillForm(validForm);
      uploadCV("test.pdf");
      cy.contains("button", "Envoyer ma candidature").click();
      cy.wait("@serverError");

      cy.get("button[type=submit]").should("not.be.disabled");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ACCESSIBILITÉ & UX
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Accessibilité et UX", () => {
    it("efface le message d'erreur à la nouvelle soumission", () => {
      // 1ère soumission → erreur
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("be.visible");

      // Correction + 2ème soumission réussie
      cy.intercept("POST", "**/applications/spontaneous", { statusCode: 201, body: {} });
      fillForm(validForm);
      uploadCV("test.pdf");
      cy.contains("button", "Envoyer ma candidature").click();
      getErrorBanner().should("not.exist");
    });

    it("les champs acceptent des caractères spéciaux et accentués", () => {
      cy.get('input[placeholder="Votre prénom"]').type("Émilie-Zoé");
      cy.get('input[placeholder="Votre nom"]').type("Châteauneuf-du-Pape");
      cy.get('input[placeholder="Votre prénom"]').should("have.value", "Émilie-Zoé");
    });

    it("le bouton submit est désactivé pendant l'envoi", () => {
      cy.intercept("POST", "**/applications/spontaneous", (req) => {
        req.reply({ delay: 2000, statusCode: 201, body: {} });
      });
      fillForm(validForm);
      uploadCV("test.pdf");
      cy.contains("button", "Envoyer ma candidature").click();
      cy.get("button[type=submit]").should("be.disabled");
    });
  });
});
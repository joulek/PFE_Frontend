// =============================================================
// FICHES DE RENSEIGNEMENT - Tests Cypress
// =============================================================

// ---------------------------------------------------------
// LISTE DES FICHES
// ---------------------------------------------------------
describe("Fiches de renseignement - LISTE", () => {

    beforeEach(() => {
        cy.loginAsAdmin();

        cy.intercept("GET", "**/fiches", {
            statusCode: 200,
            body: [
                { _id: "1", title: "Fiche Dev", description: "Test fiche" }
            ]
        }).as("getFiches");

        cy.visit("/recruiter/fiche-renseignement");
        cy.wait("@getFiches");
    });

    it("Affiche les fiches existantes", () => {
        cy.contains("Fiche Dev").should("exist");
        cy.contains("Test fiche").should("exist");
    });

    it("Affiche le bouton Nouvelle fiche", () => {
        cy.contains("Nouvelle fiche").should("exist");
    });

});

// ---------------------------------------------------------
// CRÉER UNE FICHE
// ---------------------------------------------------------
describe("Créer fiche renseignement", () => {

    beforeEach(() => {
        cy.loginAsAdmin();

        cy.intercept("POST", "**/fiches", {
            statusCode: 201,
            body: { message: "created" }
        }).as("createFiche");

        cy.visit("/recruiter/fiche-renseignement/create");
    });

    it("Crée une fiche simple avec titre, description et une question", () => {
        // ✅ Exclure les checkboxes → cibler uniquement les champs texte
        cy.get("input[type='text'], input:not([type])")
            .not("[disabled]")
            .first()
            .clear()
            .type("Fiche TEST");

        cy.get("textarea")
            .first()
            .clear()
            .type("Description TEST");

        cy.get("input[placeholder='Libellé de la question']")
            .first()
            .type("Question 1");

        cy.contains("Enregistrer la fiche").click();

        cy.wait("@createFiche");
    });

});

// ---------------------------------------------------------
// MODIFIER UNE FICHE
// ---------------------------------------------------------
describe("Modifier fiche renseignement", () => {

    beforeEach(() => {
        cy.loginAsAdmin();

        cy.intercept("GET", "**/fiches/1", {
            statusCode: 200,
            body: {
                _id: "1",
                title: "Fiche Dev",
                description: "Desc",
                questions: []
            }
        }).as("getFiche");

        cy.intercept("PUT", "**/fiches/1", {
            statusCode: 200,
            body: { message: "updated" }
        }).as("updateFiche");

        cy.visit("/recruiter/fiche-renseignement/1");
        cy.wait("@getFiche");
    });

    it("Modifie le titre de la fiche et enregistre", () => {
        // ✅ Même correction : exclure les checkboxes
        cy.get("input[type='text'], input:not([type])")
            .not("[disabled]")
            .first()
            .clear()
            .type("Fiche modifiée");

        cy.contains("Enregistrer la fiche").click();

        cy.wait("@updateFiche");
    });

});


// ---------------------------------------------------------
// NAVIGATION
// ---------------------------------------------------------
describe("Navigation fiche", () => {

    beforeEach(() => {
        cy.loginAsAdmin();

        cy.intercept("GET", "**/fiches", {
            statusCode: 200,
            body: []
        }).as("getFiches");

        cy.visit("/recruiter/fiche-renseignement");
        cy.wait("@getFiches");
    });

    it("Clique sur Nouvelle fiche → redirige vers /create", () => {
        cy.contains("Nouvelle fiche").click();
        cy.url().should("include", "/create");
    });

});
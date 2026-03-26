describe("Gestion des responsables métier", () => {

    beforeEach(() => {
        cy.loginAsAdmin();

        cy.intercept("GET", "**/users").as("getUsers");

        cy.visit("/utilisateurs");

        cy.wait("@getUsers");

        cy.contains("Liste des responsables métier").should("be.visible");
    });

    // =========================
    // ✅ RECHERCHE
    // =========================
    it("Recherche un responsable", () => {

        cy.get('input[placeholder*="Rechercher"]')
            .clear()
            .type("baya");

        cy.wait(800);

        cy.get("tbody").invoke("text").then((text) => {
            expect(text.toLowerCase()).to.include("baya");
        });
    });

    // =========================
    // ✅ MODIFIER
    // =========================
    it("Modifie un responsable", () => {

        cy.get("tbody tr").first().within(() => {
            cy.get('button[title="Modifier"]').click();
        });

        cy.contains("Modifier le responsable").should("be.visible");

        cy.get('input[type="text"]').eq(1)
            .clear()
            .type("Updated");

        cy.contains("Enregistrer").click();

        cy.contains("Modifier le responsable").should("not.exist");
    });

    // =========================
    // ✅ SUPPRESSION (FIX FINAL)
    // =========================
    // =========================
    // ✅ SUPPRESSION 
    // =========================
    it("Supprime un responsable", () => {
        // Re-intercept BEFORE triggering the delete
        cy.intercept("GET", "**/users").as("getUsersAfterDelete");

        cy.get("tbody tr").first().within(() => {
            cy.get('button[title="Supprimer"]').click();
        });

        cy.contains("Confirmer la suppression ?").should("be.visible");

        // Click the RED delete button inside the modal, not any "Supprimer" text
        cy.get('.rounded-full.bg-red-600').click();

        // Wait for modal to close
        cy.contains("Confirmer la suppression ?", { timeout: 10000 })
            .should("not.exist");

        // Wait for list refresh
        cy.wait("@getUsersAfterDelete");
    });

    // =========================
    // ✅ AJOUT
    // =========================
    it("Ajoute un responsable", () => {

        cy.contains("Ajouter un responsable").click();

        const email = `test${Date.now()}@gmail.com`;

        cy.get('input[type="text"]').eq(1).type("Test");
        cy.get('input[type="text"]').eq(2).type("User");

        cy.get('input[type="email"]').type(email);

        cy.get("select").select(0);

        cy.contains("Enregistrer").click();

        cy.wait("@getUsers");

        cy.contains("Compte créé", { timeout: 10000 }).should("be.visible");
    });

    // =========================
    // ✅ VALIDATION
    // =========================
    it("Valide les champs obligatoires", () => {

        cy.contains("Ajouter un responsable").click();

        cy.contains("Enregistrer").click();

        cy.get("input:invalid").should("have.length.at.least", 1);
    });

});
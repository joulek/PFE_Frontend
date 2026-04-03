import GestionResponsableMetierPage from "../../src/app/utilisateurs/page";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

describe("GestionActeursInternesPage - Component", () => {

    let mockRouter;

    beforeEach(() => {
        mockRouter = {
            push: cy.stub(),
            replace: cy.stub(),
            refresh: cy.stub(),
            prefetch: cy.stub(),
            back: cy.stub(),
            forward: cy.stub(),
        };

        window.localStorage.setItem("token", "fake-token");
        window.localStorage.setItem("user", JSON.stringify({ role: "ADMIN" }));

        cy.intercept("GET", "**/users", {
            statusCode: 200,
            body: [
                {
                    _id: "u1",
                    prenom: "Alice",
                    nom: "Dupont",
                    email: "alice@test.com",
                    role: "ASSISTANTE_RH",
                    poste: "RH",
                    passwordSet: true,
                },
                {
                    _id: "u2",
                    prenom: "Bob",
                    nom: "Martin",
                    email: "bob@test.com",
                    role: "DGA",
                    poste: "Directeur",
                    passwordSet: false,
                },
            ],
        }).as("getUsers");

        cy.intercept("GET", "**/roles", {
            statusCode: 200,
            body: [
                { _id: "r1", name: "ASSISTANTE_RH" },
                { _id: "r2", name: "DGA" },
            ],
        }).as("getRoles");

        cy.intercept("GET", "**/employees**", {
            statusCode: 200,
            body: {
                employees: [
                    { _id: "e1", fullName: "Alice Dupont", poste: "RH" },
                    { _id: "e2", fullName: "Bob Martin", poste: "Directeur" },
                ],
            },
        }).as("getEmployees");

        cy.intercept("POST", "**/users", {
            statusCode: 201,
            body: { message: "created" },
        }).as("createUser");

        cy.intercept("PATCH", "**/users/**", {
            statusCode: 200,
        }).as("updateUser");

        cy.intercept("DELETE", "**/users/**", {
            statusCode: 200,
        }).as("deleteUser");
    });

    function mountPage() {
        cy.mount(
            <AppRouterContext.Provider value={mockRouter}>
                <GestionResponsableMetierPage />
            </AppRouterContext.Provider>
        );

        cy.wait(["@getRoles", "@getEmployees", "@getUsers"]);
        cy.contains("alice@test.com").should("exist");
    }

    // =========================
    // ✅ LISTE
    // =========================
    it("affiche la liste des acteurs internes", () => {
        mountPage();

        cy.contains("Liste des acteurs internes").should("exist");
        cy.contains("alice@test.com").should("exist");
        cy.contains("bob@test.com").should("exist");
    });

    // =========================
    // ✅ RECHERCHE
    // =========================
    it("filtre via la recherche", () => {
        mountPage();

        cy.get("input[placeholder*='Rechercher']")
            .type("alice");

        cy.contains("alice@test.com").should("exist");
        cy.contains("bob@test.com").should("not.exist");
    });

    // =========================
    // ✅ MODAL AJOUT
    // =========================
    it("ouvre le modal d'ajout", () => {
        mountPage();

        cy.contains("Ajouter un acteur").click();

        cy.contains("Ajouter un acteur interne").should("exist");
        cy.contains("Email professionnel").should("exist");
    });



    // =========================
    // ✅ EDIT
    // =========================
    it("modifie un acteur", () => {
        mountPage();

        cy.get("button[aria-label='Modifier']").first().click();

        cy.contains("Modifier l'acteur").should("exist");

        cy.get("input[type='email']")
            .clear()
            .type("updated@test.com");

        cy.contains("Enregistrer").click();

        cy.wait("@updateUser");
    });

    // =========================
    // ✅ DELETE
    // =========================
    it("supprime un acteur", () => {
        mountPage();

        cy.get("button[aria-label='Supprimer']").first().click();

        cy.contains("Confirmer la suppression ?").should("exist");

        cy.contains("button", "Supprimer").click();

        cy.wait("@deleteUser");

        cy.contains("Confirmer la suppression ?").should("not.exist");
    });

    // =========================
    // ✅ CANCEL DELETE
    // =========================
    it("annule suppression", () => {
        mountPage();

        cy.get("button[aria-label='Supprimer']").first().click();

        cy.contains("Annuler").click();

        cy.contains("Confirmer la suppression ?").should("not.exist");
    });

});
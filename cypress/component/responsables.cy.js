import GestionResponsableMetierPage from "../../src/app/utilisateurs/page";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

describe("GestionResponsableMetierPage - Component", () => {
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

        // ✅ Mock auth
        window.localStorage.setItem("token", "fake-token");
        window.localStorage.setItem("user", JSON.stringify({ role: "ADMIN" }));

        // ✅ Intercept GET /users
        cy.intercept("GET", "**/users", {
            statusCode: 200,
            body: [
                {
                    _id: "u1",
                    prenom: "Alice",
                    nom: "Dupont",
                    email: "alice@test.com",
                    role: "RH",
                    poste: "Chargée RH",
                    passwordSet: true,
                },
                {
                    _id: "u2",
                    prenom: "Bob",
                    nom: "Martin",
                    email: "bob@test.com",
                    role: "ADMIN",
                    poste: "Directeur",
                    passwordSet: false,
                },
            ],
        }).as("getUsers");

        // ✅ Intercept GET /roles
        cy.intercept("GET", "**/roles", {
            statusCode: 200,
            body: [
                { _id: "r1", name: "ADMIN" },
                { _id: "r2", name: "RH" },
            ],
        }).as("getRoles");

        // ✅ Intercept GET /employees
        cy.intercept("GET", "**/employees**", {
            statusCode: 200,
            body: {
                employees: [
                    { _id: "e1", fullName: "Alice Dupont", poste: "Chargée RH", matricule: "M001", cin: "C001" },
                    { _id: "e2", fullName: "Bob Martin", poste: "Directeur", matricule: "M002", cin: "C002" },
                ],
            },
        }).as("getEmployees");

        // ✅ Intercept POST /users/admin/create
        cy.intercept("POST", "**/users/admin/create", {
            statusCode: 201,
            body: { _id: "u3", email: "nouveau@test.com" },
        }).as("createUser");

        // ✅ Intercept PATCH /users/:id
        cy.intercept("PATCH", "**/users/**", {
            statusCode: 200,
            body: { _id: "u1", email: "alice@test.com" },
        }).as("updateUser");

        // ✅ Intercept DELETE /users/:id
        cy.intercept("DELETE", "**/users/**", {
            statusCode: 200,
            body: { message: "Supprimé" },
        }).as("deleteUser");
    });

    // Helper : monter et attendre que les données soient rendues
    function mountAndWait() {
        cy.mount(
            <AppRouterContext.Provider value={mockRouter}>
                <GestionResponsableMetierPage />
            </AppRouterContext.Provider>
        );
        cy.wait(["@getRoles", "@getEmployees", "@getUsers"]);
        cy.contains("alice@test.com", { timeout: 6000 }).should("exist");
    }

    // ============================
    // TEST 1 : affichage liste
    // ============================
    it("affiche la liste des responsables", () => {
        cy.mount(
            <AppRouterContext.Provider value={mockRouter}>
                <GestionResponsableMetierPage />
            </AppRouterContext.Provider>
        );

        cy.wait(["@getRoles", "@getEmployees", "@getUsers"]);

        cy.contains("Liste des responsables métier").should("exist");
        cy.contains("alice@test.com", { timeout: 6000 }).should("exist");
        cy.contains("bob@test.com").should("exist");
    });

    // ============================
    // TEST 2 : badges statut
    // ============================
    it("affiche les badges Actif et En attente", () => {
        mountAndWait();

        cy.contains("Actif").should("exist");
        cy.contains("En attente").should("exist");
    });

    // ============================
    // TEST 3 : recherche
    // ============================
    it("filtre les responsables via la recherche", () => {
        mountAndWait();

        cy.get("input[placeholder*='Rechercher']").type("alice");

        cy.contains("alice@test.com").should("exist");
        cy.contains("bob@test.com").should("not.exist");
    });

    // ============================
    // TEST 4 : ouvrir modal ajout
    // ============================
    it("ouvre le modal d'ajout", () => {
        mountAndWait();

        cy.contains("button", "Ajouter un responsable").click();

        cy.contains("Ajouter un responsable métier").should("exist");
        cy.contains("Email professionnel").should("exist");
        cy.contains("Un email d'activation sera envoyé automatiquement").should("exist");
    });

    // ============================
    // TEST 5 : ajouter un responsable
    // ============================
    it("ajoute un responsable et affiche le message de succès", () => {
        mountAndWait();

        cy.contains("button", "Ajouter un responsable").click();

        // Remplir le formulaire
        cy.get("input[placeholder*='Auto depuis']").should("exist"); // poste readonly
        cy.contains("label", "Prénom").siblings("input").type("Charlie");
        cy.contains("label", "Nom").siblings("input").type("Dupuis");
        cy.get("input[type='email']").type("charlie@test.com");

        cy.contains("button", "Enregistrer").click();

        // Vérifier la requête POST
        cy.wait("@createUser").its("request.body").should("include", {
            prenom: "Charlie",
            nom: "Dupuis",
            email: "charlie@test.com",
        });

        cy.contains("Compte créé", { timeout: 6000 }).should("exist");
        cy.contains("charlie@test.com").should("exist");
    });

    // ============================
    // TEST 6 : ouvrir modal edit
    // ============================
    it("ouvre le modal de modification", () => {
        mountAndWait();

        cy.get("button[aria-label='Modifier']").first().click();

        cy.contains("Modifier le responsable").should("exist");
        // Les champs sont pré-remplis avec les données d'Alice
        cy.get("input[type='email']").should("have.value", "alice@test.com");
        cy.contains("label", "Prénom").siblings("input").should("have.value", "Alice");
    });

    // ============================
    // TEST 7 : modifier un responsable
    // ============================
    it("modifie un responsable", () => {
        mountAndWait();

        cy.get("button[aria-label='Modifier']").first().click();
        cy.contains("Modifier le responsable").should("exist");

        cy.get("input[type='email']").clear().type("alice.updated@test.com");
        cy.contains("button", "Enregistrer").click();

        cy.wait("@updateUser").its("request.body").should("include", {
            email: "alice.updated@test.com",
        });
    });

    // ============================
    // TEST 8 : ouvrir modal suppression
    // ============================
    it("ouvre la modale de confirmation de suppression", () => {
        mountAndWait();

        cy.get("button[aria-label='Supprimer']").first().click();

        cy.contains("Confirmer la suppression ?").should("exist");
        cy.contains("alice@test.com").should("exist");
    });

    // ============================
    // TEST 9 : supprimer un responsable
    // ============================
    it("supprime un responsable après confirmation", () => {
        mountAndWait();

        cy.get("button[aria-label='Supprimer']").first().click();
        cy.contains("Confirmer la suppression ?").should("exist");

        cy.get("button.bg-red-600").contains("Supprimer").click();

        cy.wait("@deleteUser");
        // La modale se ferme
        cy.contains("Confirmer la suppression ?").should("not.exist");
    });

    // ============================
    // TEST 10 : annuler la suppression
    // ============================
    it("annule la suppression", () => {
        mountAndWait();

        cy.get("button[aria-label='Supprimer']").first().click();
        cy.contains("Confirmer la suppression ?").should("exist");

        cy.contains("button", "Annuler").click();

        cy.contains("Confirmer la suppression ?").should("not.exist");
        // deleteUser ne doit PAS avoir été appelé
        cy.get("@deleteUser.all").should("have.length", 0);
    });

    // ============================
    // TEST 11 : fermer modal via Annuler
    // ============================
    it("ferme le modal d'ajout via Annuler", () => {
        mountAndWait();

        cy.contains("button", "Ajouter un responsable").click();
        cy.contains("Ajouter un responsable métier").should("exist");

        cy.contains("button", "Annuler").click();

        cy.contains("Ajouter un responsable métier").should("not.exist");
    });

   
});
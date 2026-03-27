import GestionRolesPage from "../../src/app/roles/page";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

describe("GestionRolesPage - Component", () => {
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

    // ✅ mock auth
    window.localStorage.setItem("token", "fake-token");
    window.localStorage.setItem(
      "user",
      JSON.stringify({ role: "ADMIN" })
    );

    // ✅ CORRECTION PRINCIPALE : cy.intercept au lieu de cy.stub sur le module
    // Le stub module ne fonctionne pas car role.api utilise une instance axios
    cy.intercept("GET", "**/roles", {
      statusCode: 200,
      body: [
        { _id: "1", name: "ADMIN" },
        { _id: "2", name: "RH" },
      ],
    }).as("getRoles");

    cy.intercept("POST", "**/roles", {
      statusCode: 201,
      body: { _id: "3", name: "DEV" },
    }).as("createRole");

    cy.intercept("PUT", "**/roles/**", {
      statusCode: 200,
      body: { _id: "1", name: "SUPER_ADMIN" },
    }).as("updateRole");

    cy.intercept("DELETE", "**/roles/**", {
      statusCode: 200,
      body: { message: "Supprimé" },
    }).as("deleteRole");
  });

  // Helper : monter et attendre que les rôles soient rendus
  function mountAndWait() {
    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <GestionRolesPage />
      </AppRouterContext.Provider>
    );
    // Attendre la réponse HTTP ET le rendu dans le DOM
    cy.wait("@getRoles");
    cy.contains("ADMIN", { timeout: 6000 }).should("exist");
  }

  // ============================
  // ✅ TEST 1 : affichage
  // ============================
  it("affiche la liste des rôles", () => {
    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <GestionRolesPage />
      </AppRouterContext.Provider>
    );

    cy.wait("@getRoles");
    cy.contains("Liste des rôles").should("exist");
    cy.contains("ADMIN").should("exist");
    cy.contains("RH").should("exist");
  });

  // ============================
  // ✅ TEST 2 : recherche
  // ============================
  it("filtre les rôles via recherche", () => {
    mountAndWait();

    cy.get("input[placeholder*='Rechercher']").type("admin");
    cy.contains("ADMIN").should("exist");
    cy.contains("RH").should("not.exist");
  });

  // ============================
  // ✅ TEST 3 : ouvrir modal ajout
  // ============================
  it("ouvre le modal d'ajout", () => {
    mountAndWait();

    cy.contains("button", "Ajouter un rôle").click();
    cy.contains("Ajouter un rôle").should("exist");
    cy.contains("Nom du rôle").should("exist");
  });

  // ============================
  // ✅ TEST 4 : ajouter rôle
  // ============================
  it("ajoute un rôle", () => {
    mountAndWait();

    cy.contains("button", "Ajouter un rôle").click();
    cy.get("input[placeholder*='ex']").type("DEV");
    cy.contains("button", "Enregistrer").click();

    // ✅ Vérifier la requête POST avec le bon body
    cy.wait("@createRole").its("request.body").should("deep.equal", { name: "DEV" });
    cy.contains("Rôle ajouté avec succès").should("exist");
  });

  // ============================
  // ✅ TEST 5 : ouvrir modal edit
  // ============================
  it("ouvre le modal edit", () => {
    mountAndWait();

    cy.get("button[aria-label='Modifier']").first().click();
    cy.contains("Modifier le rôle").should("exist");
  });

  // ============================
  // ✅ TEST 6 : modifier rôle
  // ============================
  it("modifie un rôle", () => {
    mountAndWait();

    cy.get("button[aria-label='Modifier']").first().click();
    cy.contains("Modifier le rôle").should("exist");

    cy.get("input[placeholder*='ex']").clear().type("SUPER_ADMIN");
    cy.contains("button", "Enregistrer").click();

    // ✅ Vérifier la requête PUT avec le bon body
    cy.wait("@updateRole").its("request.body").should("deep.equal", { name: "SUPER_ADMIN" });
    cy.contains("Rôle modifié avec succès").should("exist");
  });

  // ============================
  // ✅ TEST 7 : supprimer rôle
  // ============================
  it("supprime un rôle", () => {
    mountAndWait();

    cy.get("button[aria-label='Supprimer']").first().click();

    // ✅ Cliquer sur le bouton rouge de confirmation dans la modale
    cy.contains("Supprimer le rôle").should("exist");
    cy.get("button.bg-red-500, button.bg-red-600").contains("Supprimer").click();

    // ✅ Vérifier que la requête DELETE a bien été envoyée
    cy.wait("@deleteRole");
    cy.contains("Rôle supprimé").should("exist");
  });
});
// cypress/e2e/gestion-roles.cy.js

const API_URL = "http://localhost:5000";

// ─────────────────────────────────────────────
// Helpers API
// ─────────────────────────────────────────────
function creerRole(nomRole, token) {
  return cy.request({
    method: "POST",
    url: `${API_URL}/roles`,
    headers: { Authorization: `Bearer ${token}` },
    body: { name: nomRole },
    failOnStatusCode: false,
  });
}

function supprimerRole(nomRole, token) {
  return cy.request({
    method: "GET",
    url: `${API_URL}/roles`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  }).then((res) => {
    const role = res.body.find?.((r) => r.name === nomRole);
    if (role?._id || role?.id) {
      cy.request({
        method: "DELETE",
        url: `${API_URL}/roles/${role._id || role.id}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
    }
  });
}

// ─────────────────────────────────────────────
// Helpers UI
// ─────────────────────────────────────────────
function getAddModal() {
  return cy.contains("h2", "Ajouter un rôle")
    .should("be.visible")
    .closest("div.relative.z-10");
}

function getEditModal() {
  return cy.contains("h2", "Modifier le rôle")
    .should("be.visible")
    .closest("div.relative.z-10");
}

function getDeleteModal() {
  return cy.contains("h2", "Supprimer le rôle")
    .should("be.visible")
    .closest("div.relative.z-10");
}

// ─────────────────────────────────────────────
// TESTS CRUD
// ─────────────────────────────────────────────
describe("Gestion des rôles - CRUD complet", () => {
  const ROLE_TEST = "TEST_ROLE_CYPRESS";
  const ROLE_TEST_UPDATED = "TEST_ROLE_CYPRESS_UPDATED";

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.window().then((win) => {
      const token = win.localStorage.getItem("token");

      supprimerRole(ROLE_TEST, token);
      supprimerRole(ROLE_TEST_UPDATED, token);
    });

    cy.visit("/roles");
    cy.get("h1").should("contain", "Liste des rôles");
  });

  // ───────────────
  // AFFICHAGE
  // ───────────────
  it("doit afficher la page correctement", () => {
    cy.get("table").should("be.visible");
    cy.get('input[placeholder*="Rechercher un rôle"]').should("be.visible");
    cy.contains("button", "Ajouter un rôle").should("be.visible");
  });

  // ───────────────
  // AJOUT
  // ───────────────
  it("doit ajouter un rôle", () => {
    cy.contains("button", "Ajouter un rôle").click();

    getAddModal().within(() => {
      cy.get('input[placeholder="ex : HR_MANAGER"]')
        .clear()
        .type(ROLE_TEST);

      cy.contains("button", "Enregistrer").click();
    });

    cy.contains("Rôle ajouté avec succès").should("be.visible");

    cy.contains("span", new RegExp(`^${ROLE_TEST}$`))
      .should("be.visible");
  });

  // ───────────────
  // RECHERCHE
  // ───────────────
  it("doit rechercher un rôle", () => {
    cy.window().then((win) => {
      return creerRole(ROLE_TEST, win.localStorage.getItem("token"));
    });

    cy.reload();

    cy.get('input[placeholder*="Rechercher un rôle"]')
      .clear()
      .type(ROLE_TEST);

    cy.contains("span", new RegExp(`^${ROLE_TEST}$`))
      .should("be.visible");

    cy.get('input[placeholder*="Rechercher un rôle"]')
      .clear()
      .type("INEXISTANT");

    cy.contains("span", new RegExp(`^${ROLE_TEST}$`))
      .should("not.exist");
  });

  // ───────────────
  // MODIFICATION
  // ───────────────
  it("doit modifier un rôle", () => {
    cy.window().then((win) => {
      return creerRole(ROLE_TEST, win.localStorage.getItem("token"));
    });

    cy.reload();

    cy.contains("span", new RegExp(`^${ROLE_TEST}$`))
      .parents("tr")
      .find('button[aria-label="Modifier"]')
      .click();

    getEditModal().within(() => {
      cy.get('input[placeholder="ex : IT_MANAGER"]')
        .clear()
        .type(ROLE_TEST_UPDATED);

      cy.contains("button", "Enregistrer").click();
    });

    cy.contains("Rôle modifié avec succès").should("be.visible");

    // 🔥 IMPORTANT
    cy.get('input[placeholder*="Rechercher un rôle"]').clear();

    cy.reload();

    cy.contains("span", new RegExp(`^${ROLE_TEST_UPDATED}$`))
      .should("be.visible");

    cy.contains("span", new RegExp(`^${ROLE_TEST}$`))
      .should("not.exist");
  });

  // ───────────────
  // SUPPRESSION
  // ───────────────
  it("doit supprimer un rôle", () => {
    cy.window().then((win) => {
      return creerRole(ROLE_TEST_UPDATED, win.localStorage.getItem("token"));
    });

    cy.reload();

    cy.contains("span", new RegExp(`^${ROLE_TEST_UPDATED}$`))
      .parents("tr")
      .find('button[aria-label="Supprimer"]')
      .click();

    getDeleteModal().within(() => {
      cy.contains("button", "Supprimer").click();
    });

    cy.contains("Rôle supprimé").should("be.visible");

    cy.reload();

    cy.contains("span", new RegExp(`^${ROLE_TEST_UPDATED}$`))
      .should("not.exist");
  });
});

// ─────────────────────────────────────────────
// TESTS SÉCURITÉ
// ─────────────────────────────────────────────
describe("Gestion des rôles - Sécurité", () => {
  it("redirige si non connecté", () => {
    cy.clearAppSession();
    cy.visit("/roles");
    cy.url().should("include", "/login");
  });

  it("refuse accès rôle non autorisé", () => {
    cy.visit("/login");

    cy.window().then((win) => {
      win.localStorage.setItem("token", "fake-token");
      win.localStorage.setItem("user", JSON.stringify({ role: "RECRUTEUR" }));
    });

    cy.visit("/roles");

    cy.url().then((url) => {
      if (url.includes("/roles")) {
        cy.contains("Ajouter un rôle").should("not.exist");
      } else {
        cy.url().should("match", /login|unauthorized|dashboard/);
      }
    });
  });
});
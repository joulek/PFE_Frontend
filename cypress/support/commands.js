/// <reference types="cypress" />

const API_URL = "http://localhost:5000";

// ======================================================
// ✅ LOGIN ADMIN (TOKEN + SESSION)
// ======================================================
Cypress.Commands.add("loginAsAdmin", () => {
  const email = "admin@optylab.tn";
  const role = "ADMIN";

  cy.session("admin-session", () => {
    cy.task("generateToken", { role, email }).then((token) => {

      // 👉 stocker token comme ton app attend
      window.localStorage.setItem("token", token);

      // 👉 si ton app utilise autre clé
      window.localStorage.setItem("user", JSON.stringify({
        email,
        role,
      }));

      // 👉 mock login API (optionnel mais utile)
      cy.intercept("POST", `${API_URL}/users/login`, {
        statusCode: 200,
        body: {
          token,
          user: { email, role },
        },
      }).as("login");

    });
  });

  // ⚠️ important après session
  cy.visit("/utilisateurs");
});


// ======================================================
// ✅ LOGIN RESPONSABLE METIER
// ======================================================
Cypress.Commands.add("loginAsResponsable", () => {
  const email = "responsable@optylab.tn";
  const role = "RESPONSABLE_METIER";

  cy.session("responsable-session", () => {
    cy.task("generateToken", { role, email }).then((token) => {

      window.localStorage.setItem("token", token);

      window.localStorage.setItem("user", JSON.stringify({
        email,
        role,
      }));

    });
  });

  cy.visit("/utilisateurs");
});


// ======================================================
// ✅ LOGOUT
// ======================================================
Cypress.Commands.add("logout", () => {
  window.localStorage.clear();
  cy.visit("/login");
});


// ======================================================
// ✅ HELPER SELECTOR (BEST PRACTICE)
// ======================================================
Cypress.Commands.add("getByTestId", (testId) => {
  return cy.get(`[data-testid="${testId}"]`);
});


// ======================================================
// ✅ WAIT API GENERIQUE
// ======================================================
Cypress.Commands.add("waitForUsers", () => {
  cy.intercept("GET", `${API_URL}/users`).as("getUsers");
  cy.wait("@getUsers");
});


// ======================================================
// ✅ CLICK SAFE (évite problème hidden)
// ======================================================
Cypress.Commands.add("clickVisible", (selector) => {
  cy.get(selector)
    .should("exist")
    .scrollIntoView()
    .should("be.visible")
    .click();
});


// ======================================================
// ✅ FILL INPUT SAFE
// ======================================================
Cypress.Commands.add("typeInput", (selector, value) => {
  cy.get(selector)
    .should("be.visible")
    .clear()
    .type(value);
});


// ======================================================
// ✅ CONFIRM MODAL (SUPPRESSION)
// ======================================================
Cypress.Commands.add("confirmDelete", () => {
  cy.contains("Confirmer la suppression").should("be.visible");
  cy.contains("Supprimer").click();
});


// ======================================================
// ✅ WAIT UI UPDATE (fallback)
// ======================================================
Cypress.Commands.add("waitUI", (time = 500) => {
  cy.wait(time);
});
/// <reference types="cypress" />

const API_URL = "http://localhost:5000";

// ======================================================
// ✅ LOGIN ADMIN (TOKEN + SESSION)
// ======================================================
Cypress.Commands.add("loginAsAdmin", () => {
  const email = "joulekyosr123@gmail.com";
  const role = "ADMIN";

  cy.session("admin-session", () => {
    cy.task("generateToken", { role, email }).then((token) => {

      cy.window().then((win) => {
        win.localStorage.setItem("token", token);
        win.localStorage.setItem("user", JSON.stringify({ email, role }));
      });

      // ✅ 🔥 LE FIX CRITIQUE
      cy.setCookie("role", role);
      cy.setCookie("token", token);

    });
  });
});


// ======================================================
// ✅ LOGIN RESPONSABLE METIER
// ======================================================
Cypress.Commands.add("loginAsResponsable", () => {
  const email = "joulekrebah@gmail.com";
  const role = "RESPONSABLE_METIER";

  cy.session("responsable-session", () => {
    cy.task("generateToken", { role, email }).then((token) => {

      cy.window().then((win) => {
        win.localStorage.setItem("token", token);
        win.localStorage.setItem("user", JSON.stringify({
          email,
          role,
        }));
      });

      // 🔥 IMPORTANT (comme admin)
      cy.setCookie("role", role);
      cy.setCookie("token", token);

    });
  });
});




// ======================================================
// ✅ LOGIN RESPONSABLE RH NORD
// ======================================================
Cypress.Commands.add("loginAsRHNord", () => {
  const email = "ynitylearn@gmail.com";
  const role = "RESPONSABLE_RH_NORD";

  cy.session("rh-nord-session", () => {
    cy.task("generateToken", { role, email }).then((token) => {

      cy.window().then((win) => {
        win.localStorage.setItem("token", token);
        win.localStorage.setItem("user", JSON.stringify({
          email,
          role,
        }));
      });

      cy.setCookie("role", role);
      cy.setCookie("token", token);

    });
  });
});





// ======================================================
// ✅ LOGIN RESPONSABLE RH OPTYLAB
// ======================================================
Cypress.Commands.add("loginAsRHOPTYLAB", () => {
  const email = "rim12rimh@gmail.com";
  const role = "RESPONSABLE_RH_OPTYLAB";

  cy.session("rh-optylab-session", () => {
    cy.task("generateToken", { role, email }).then((token) => {

      cy.window().then((win) => {
        win.localStorage.setItem("token", token);
        win.localStorage.setItem("user", JSON.stringify({
          email,
          role,
        }));
      });

      cy.setCookie("role", role);
      cy.setCookie("token", token);

    });
  });
});


// ======================================================
// ✅ LOGOUT
// ======================================================
Cypress.Commands.add("logout", () => {
  cy.window().then((win) => {
    win.localStorage.clear();
  });
  cy.visit("/login");
});


// ======================================================
// ✅ HELPER SELECTOR
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
// ✅ CLICK SAFE
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
  cy.get('[data-cy="confirm-delete"]').should("be.visible").click();
});


// ======================================================
// ✅ WAIT UI UPDATE
// ======================================================
Cypress.Commands.add("waitUI", (time = 500) => {
  cy.wait(time);
});
import LoginPage from "../../src/app/(auth)/login/page";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import * as authApi from "../../src/app/services/auth.api";

describe("LoginPage - Component", () => {
  let mockRouter;

  beforeEach(() => {
    mockRouter = {
      push: cy.stub().as("push"),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    // stub par défaut pour éviter erreurs
    cy.stub(authApi, "login").resolves({
      data: {
        token: "fake-token",
        user: { role: "ADMIN" },
      },
    });

    cy.stub(authApi, "forgotPassword").resolves({ status: 200 });
  });

  // ============================
  // ✅ TEST 1
  // ============================
  it("affiche le formulaire login", () => {
    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <LoginPage />
      </AppRouterContext.Provider>
    );

    cy.contains("Connexion").should("exist");
    cy.get('input[type="email"]').should("exist");
    cy.get('input[type="password"]').should("exist");
    cy.contains("Se connecter").should("exist");
  });

  // ============================
  // ✅ TEST 2
  // ============================
  it("permet de saisir email et password", () => {
    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <LoginPage />
      </AppRouterContext.Provider>
    );

    cy.get('input[type="email"]').first().type("admin@test.com");
    cy.get('input[type="password"]').first().type("123456");

    cy.get('input[type="email"]').first().should("have.value", "admin@test.com");
    cy.get('input[type="password"]').first().should("have.value", "123456");
  });


  // ============================
  // ✅ TEST 5 (TOGGLE PASSWORD)
  // ============================
  it("affiche le mot de passe", () => {
    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <LoginPage />
      </AppRouterContext.Provider>
    );

    cy.get('input[type="password"]').first().type("123456");

    cy.get('button').first().click();

    cy.get('input[type="text"]').should("exist");
  });

  // ============================
  // ✅ TEST 6 (FORGOT PASSWORD)
  // ============================
  it("affiche le formulaire mot de passe oublié", () => {
    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <LoginPage />
      </AppRouterContext.Provider>
    );

    cy.contains("Mot de passe oublié").click();

    cy.contains("Envoyer").should("exist");
  });

});
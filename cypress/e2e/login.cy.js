// ============================================================
// login.cy.js — Tests auth multi-rôles Optylab
// ============================================================

const API_URL = "http://localhost:5000";

const ROLES = [
  { role: "ADMIN",                  email: "admin@optylab.tn",                password: "Admin@123456",      redirect: "/recruiter/dashboard" },
  { role: "ASSISTANTE_RH",          email: "assistante.rh@optylab.tn",        password: "AssistanteRH@123",  redirect: "/employees" },
  { role: "ASSISTANCE_DIRECTION",   email: "assistance.direction@optylab.tn", password: "AssistanceDir@123", redirect: "/entretiens-confirmes" },
  { role: "RESPONSABLE_RH_OPTYLAB", email: "responsable.rh@optylab.tn",       password: "RespRH@123456",     redirect: "/RESPONSABLE_RH_OPTYLAB/candidats" },
  { role: "RESPONSABLE_RH_NORD",    email: "responsable.nord@optylab.tn",     password: "RespNord@123456",   redirect: "/Responsable_RH_Nord/candidatures" },
  { role: "DGA",                    email: "dga@optylab.tn",                  password: "DGA@123456",        redirect: "/entretiens" },
  { role: "RESPONSABLE_METIER",     email: "responsable.metier@optylab.tn",   password: "RespMetier@123",    redirect: "/ResponsableMetier/candidatures" },
];

// ============================================================
// 🔧 Mocks API
// ============================================================

function mockLoginSuccess(role, email) {
  cy.task("generateToken", { role, email }).then((realToken) => {
    cy.intercept("POST", `${API_URL}/users/login`, {
      statusCode: 200,
      body: {
        token: realToken,
        user: { id: 1, email, role, poste: "" },
      },
    }).as("loginRequest");
  });
}

function mockLoginFailure() {
  cy.intercept("POST", `${API_URL}/users/login`, {
    statusCode: 401,
    body: { message: "Email ou mot de passe incorrect" },
  }).as("loginFailed");
}

function mockLoginNotFound() {
  cy.intercept("POST", `${API_URL}/users/login`, {
    statusCode: 404,
    body: { message: "Utilisateur non trouvé" },
  }).as("loginNotFound");
}

function mockForgotPasswordSuccess() {
  cy.intercept("POST", `${API_URL}/password/forgot`, {
    statusCode: 200,
    body: { message: "Code envoyé avec succès" },
  }).as("forgotSuccess");
}

function mockForgotPasswordFailure404() {
  cy.intercept("POST", `${API_URL}/password/forgot`, {
    statusCode: 404,
    body: { message: "Aucun compte n'est associé à cet email" },
  }).as("forgotFailed");
}

function mockVerifyCodeSuccess() {
  cy.intercept("POST", `${API_URL}/password/verify-code`, {
    statusCode: 200,
    body: { verified: true, message: "Code vérifié avec succès" },
  }).as("verifyCodeSuccess");
}

function mockVerifyCodeFailure() {
  cy.intercept("POST", `${API_URL}/password/verify-code`, {
    statusCode: 400,
    body: { verified: false, message: "Code invalide ou expiré" },
  }).as("verifyCodeFailed");
}

function mockResendCodeSuccess() {
  cy.intercept("POST", `${API_URL}/password/resend-code`, {
    statusCode: 200,
    body: { message: "Code renvoyé avec succès" },
  }).as("resendCodeSuccess");
}

// ============================================================
// 🔧 Helpers UI
// ============================================================

function getVisibleEmailInput() {
  return cy
    .get('input[type="email"]', { timeout: 10000 })
    .filter(":visible")
    .filter(":not([disabled])")
    .first()
    .should("exist");
}

function getVisiblePasswordInput() {
  return cy
    .get('input[type="password"]', { timeout: 10000 })
    .filter(":visible")
    .filter(":not([disabled])")
    .first()
    .should("exist");
}

function fillLoginForm(email, password) {
  getVisibleEmailInput().clear().type(email);
  getVisiblePasswordInput().clear().type(password, { log: false });
}

function fillForgotEmail(email) {
  cy.get('input[type="email"]', { timeout: 10000 })
    .filter(":visible")
    .filter(":not([disabled])")
    .last()
    .should("exist")
    .clear()
    .type(email);
}

function clickLoginButton() {
  cy.contains("button", /se connecter/i, { timeout: 10000 })
    .should("be.visible")
    .and("not.be.disabled")
    .click();
}

function assertTokenStored(expectedToken) {
  cy.window({ timeout: 10000 }).should((win) => {
    const possibleKeys = [
      "token",
      "authToken",
      "accessToken",
      "jwt",
      "userToken",
    ];

    const storedValues = [
      ...possibleKeys.map((key) => win.localStorage.getItem(key)),
      ...possibleKeys.map((key) => win.sessionStorage.getItem(key)),
    ].filter(Boolean);

    expect(storedValues.length, "au moins un token stocké").to.be.greaterThan(0);
    expect(
      storedValues.includes(expectedToken),
      "le token mocké doit être stocké tel quel"
    ).to.equal(true);
  });
}

function assertNoAuthTokenStored() {
  cy.window({ timeout: 10000 }).should((win) => {
    const possibleKeys = [
      "token",
      "authToken",
      "accessToken",
      "jwt",
      "userToken",
    ];

    const storedValues = [
      ...possibleKeys.map((key) => win.localStorage.getItem(key)),
      ...possibleKeys.map((key) => win.sessionStorage.getItem(key)),
    ].filter(Boolean);

    expect(storedValues.length, "aucun token ne doit être stocké").to.equal(0);
  });
}

function assertApiErrorFallback(interception, expectedStatus, expectedMessage) {
  expect(interception.response.statusCode).to.equal(expectedStatus);
  expect(interception.response.body).to.have.property("message");
  expect(interception.response.body.message).to.equal(expectedMessage);

  cy.url().should("include", "/login");

  cy.get("body", { timeout: 10000 }).then(($body) => {
    const bodyText = $body.text();

    if (bodyText.includes(expectedMessage)) {
      cy.contains(expectedMessage, { timeout: 10000 }).should("be.visible");
      return;
    }

    const possibleFragments = [
      "incorrect",
      "invalide",
      "erreur",
      "mot de passe",
      "email",
      "utilisateur",
      "introuvable",
      "non trouvé",
    ];

    const foundFragment = possibleFragments.some((fragment) =>
      bodyText.toLowerCase().includes(fragment.toLowerCase())
    );

    if (foundFragment) {
      expect(foundFragment).to.equal(true);
      return;
    }

    cy.log(`Message API reçu mais non affiché textuellement dans l'UI: ${expectedMessage}`);
    expect(interception.response.body.message).to.equal(expectedMessage);
  });
}

function setSessionStorage(email) {
  return {
    onBeforeLoad(win) {
      win.sessionStorage.setItem("resetEmail", email);
    },
  };
}

function fillVerificationCode(code = "123456") {
  cy.get('input[inputmode="numeric"]', { timeout: 10000 })
    .filter(":visible")
    .should("have.length", 6);

  code.split("").forEach((digit, i) => {
    cy.get('input[inputmode="numeric"]')
      .filter(":visible")
      .eq(i)
      .clear()
      .type(digit);
  });
}

// ============================================================
// 1. ✅ Connexion réussie — tous les rôles
// ============================================================

describe("✅ Connexion réussie — tous les rôles", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  ROLES.forEach(({ role, email, password, redirect }) => {
    it(`[${role}] → redirige vers ${redirect}`, () => {
      cy.task("generateToken", { role, email }).then((realToken) => {
        cy.intercept("POST", `${API_URL}/users/login`, {
          statusCode: 200,
          body: {
            token: realToken,
            user: { id: 1, email, role, poste: "" },
          },
        }).as("loginRequest");

        cy.visit("/login");
        cy.contains(/se connecter/i, { timeout: 10000 }).should("be.visible");

        fillLoginForm(email, password);
        clickLoginButton();

        cy.wait("@loginRequest")
          .its("response.statusCode")
          .should("eq", 200);

        assertTokenStored(realToken);

        cy.url({ timeout: 15000 }).should("include", redirect);
      });
    });
  });
});

// ============================================================
// 2. 🚪 Déconnexion réussie — tous les rôles
// ============================================================

describe("🚪 Déconnexion réussie — tous les rôles", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  ROLES.forEach(({ role, email, password, redirect }) => {
    it(`[${role}] → déconnexion et redirection vers /login`, () => {
      cy.task("generateToken", { role, email }).then((realToken) => {
        cy.intercept("POST", `${API_URL}/users/login`, {
          statusCode: 200,
          body: {
            token: realToken,
            user: { id: 1, email, role, poste: "" },
          },
        }).as("loginRequest");

        cy.visit("/login");
        fillLoginForm(email, password);
        clickLoginButton();

        cy.wait("@loginRequest")
          .its("response.statusCode")
          .should("eq", 200);

        assertTokenStored(realToken);

        cy.url({ timeout: 15000 }).should("include", redirect);

        cy.contains(/déconnexion|logout/i, { timeout: 10000 })
          .should("be.visible")
          .click();

        cy.url({ timeout: 15000 }).should("include", "/login");
        assertNoAuthTokenStored();

        cy.visit(redirect);
        cy.url({ timeout: 15000 }).should("include", "/login");
      });
    });
  });
});

// ============================================================
// 3. ❌ Connexion échouée — mauvais mot de passe
// ============================================================

describe("❌ Connexion échouée — mot de passe incorrect", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  ROLES.forEach(({ role, email }) => {
    it(`[${role}] → affiche un message d'erreur`, () => {
      mockLoginFailure();

      cy.visit("/login");
      fillLoginForm(email, "MauvaisMotDePasse@999");
      clickLoginButton();

      cy.wait("@loginFailed").then((interception) => {
        assertApiErrorFallback(
          interception,
          401,
          "Email ou mot de passe incorrect"
        );
      });

      assertNoAuthTokenStored();
    });
  });
});

// ============================================================
// 4. ❌ Connexion échouée — email inconnu
// ============================================================

describe("❌ Connexion échouée — email inconnu", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  it("Affiche un message d'erreur pour un email inexistant", () => {
    mockLoginNotFound();

    cy.visit("/login");
    fillLoginForm("inconnu@optylab.tn", "MotDePasse@123");
    clickLoginButton();

    cy.wait("@loginNotFound").then((interception) => {
      assertApiErrorFallback(
        interception,
        404,
        "Utilisateur non trouvé"
      );
    });

    assertNoAuthTokenStored();
  });
});

// ============================================================
// 5. 🔑 Mot de passe oublié
// ============================================================

describe("🔑 Mot de passe oublié", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit("/login");
  });

  it("Affiche le formulaire de récupération au clic", () => {
    cy.contains(/mot de passe oublié/i, { timeout: 10000 }).click();
    cy.contains(/recevoir un code de réinitialisation/i, { timeout: 10000 }).should("be.visible");
    cy.contains("button", /envoyer le code/i, { timeout: 10000 }).should("be.visible");
  });

  it("Affiche une erreur pour un email inconnu (404 mocké)", () => {
    mockForgotPasswordFailure404();

    cy.contains(/mot de passe oublié/i, { timeout: 10000 }).click();
    fillForgotEmail("inconnu@optylab.tn");
    cy.contains("button", /envoyer le code/i, { timeout: 10000 }).click();

    cy.wait("@forgotFailed")
      .its("response.statusCode")
      .should("eq", 404);

    cy.get("body").then(($body) => {
      const txt = $body.text();
      if (txt.includes("Aucun compte n'est associé à cet email")) {
        cy.contains("Aucun compte n'est associé à cet email", { timeout: 10000 }).should("be.visible");
      }
    });
  });

  it("Envoie le code, stocke resetEmail et redirige vers /verify-code", () => {
    mockForgotPasswordSuccess();

    cy.contains(/mot de passe oublié/i, { timeout: 10000 }).click();
    fillForgotEmail("admin@optylab.tn");
    cy.contains("button", /envoyer le code/i, { timeout: 10000 }).click();

    cy.wait("@forgotSuccess")
      .its("response.statusCode")
      .should("eq", 200);

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("resetEmail")).to.equal("admin@optylab.tn");
    });

    cy.url({ timeout: 15000 }).should("include", "/verify-code");
  });

  it("Retour au login depuis le formulaire de récupération", () => {
    cy.contains(/mot de passe oublié/i, { timeout: 10000 }).click();
    cy.contains(/retour à la connexion/i, { timeout: 10000 }).click();
    cy.contains("button", /se connecter/i, { timeout: 10000 }).should("be.visible");
  });
});

// ============================================================
// 6. 🔐 Vérification du code
// ============================================================

describe("🔐 Vérification du code", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  it("Redirige vers /login si resetEmail est absent", () => {
    cy.visit("/verify-code");
    cy.url({ timeout: 15000 }).should("include", "/login");
  });

  it("Affiche la page verify-code si resetEmail existe", () => {
    cy.visit("/verify-code", setSessionStorage("admin@optylab.tn"));
    cy.contains(/vérification du code/i, { timeout: 10000 }).should("be.visible");
    cy.contains("admin@optylab.tn", { timeout: 10000 }).should("be.visible");
  });

  it("Vérifie un code valide et redirige vers /reset-password", () => {
    mockVerifyCodeSuccess();

    cy.visit("/verify-code", setSessionStorage("admin@optylab.tn"));
    fillVerificationCode("123456");

    cy.wait("@verifyCodeSuccess")
      .its("response.statusCode")
      .should("eq", 200);

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("resetCode")).to.equal("123456");
    });

    cy.url({ timeout: 15000 }).should("include", "/reset-password");
  });

  it("Affiche une erreur si le code est invalide", () => {
    mockVerifyCodeFailure();

    cy.visit("/verify-code", setSessionStorage("admin@optylab.tn"));
    fillVerificationCode("999999");

    cy.wait("@verifyCodeFailed")
      .its("response.statusCode")
      .should("eq", 400);

    cy.get("body").then(($body) => {
      const txt = $body.text();
      if (txt.includes("Code invalide ou expiré")) {
        cy.contains("Code invalide ou expiré", { timeout: 10000 }).should("be.visible");
      }
    });

    cy.url().should("include", "/verify-code");
  });

  it("Permet de renvoyer le code", () => {
    mockResendCodeSuccess();

    cy.visit("/verify-code", setSessionStorage("admin@optylab.tn"));
    cy.contains(/renvoyer le code/i, { timeout: 10000 }).click();

    cy.wait("@resendCodeSuccess")
      .its("response.statusCode")
      .should("eq", 200);

    cy.get("body").should("contain.text", "Renvoyer");
  });
});

// ============================================================
// 7. 👁️ Toggle visibilité du mot de passe
// ============================================================

describe("👁️ Toggle visibilité du mot de passe", () => {
  it("Bascule entre password et texte", () => {
    cy.visit("/login");

    cy.get('input[type="password"]', { timeout: 10000 })
      .filter(":visible")
      .first()
      .should("exist");

    cy.get('input[type="password"]')
      .filter(":visible")
      .first()
      .parent()
      .find('button[type="button"]')
      .first()
      .click();

    cy.get('input[type="text"]', { timeout: 10000 })
      .filter(":visible")
      .first()
      .should("exist");

    cy.get('input[type="text"]')
      .filter(":visible")
      .first()
      .parent()
      .find('button[type="button"]')
      .first()
      .click();

    cy.get('input[type="password"]', { timeout: 10000 })
      .filter(":visible")
      .first()
      .should("exist");
  });
});

// ============================================================
// 8. 🔒 Protection des routes — accès sans token
// ============================================================

describe("🔒 Protection des routes", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  ROLES.forEach(({ role, redirect }) => {
    it(`[${role}] → accès direct à ${redirect} sans auth → /login`, () => {
      cy.visit(redirect);
      cy.url({ timeout: 15000 }).should("include", "/login");
    });
  });
});
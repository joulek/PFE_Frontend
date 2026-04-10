import React from "react";
import FichesPage from "../../src/app/recruiter/fiche-renseignement/page";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

// ─── FIXTURES ────────────────────────────────────────────────────────────────

const makeFiche = (overrides = {}) => ({
  _id: `fiche-${Math.random().toString(36).slice(2)}`,
  title: "Fiche Développeur Fullstack",
  description: "Formulaire pour les postes tech.",
  ...overrides,
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Crée un router mock compatible Next.js App Router.
 * On wrappe FichesPage dans AppRouterContext.Provider pour que
 * useRouter() trouve le contexte sans crash.
 */
const createRouter = (overrides = {}) => ({
  push:      cy.stub().as("routerPush"),
  replace:   cy.stub().as("routerReplace"),
  prefetch:  cy.stub().as("routerPrefetch"),
  back:      cy.stub(),
  forward:   cy.stub(),
  refresh:   cy.stub(),
  pathname:  "/recruiter/fiche-renseignement",
  params:    {},
  ...overrides,
});

/**
 * Monte FichesPage enveloppé dans le provider du router.
 * getFiches() → Axios → res.data = body HTTP (tableau direct).
 */
const mountWithRouter = (router) => {
  cy.mount(
    <AppRouterContext.Provider value={router}>
      <FichesPage />
    </AppRouterContext.Provider>
  );
  cy.wait("@getFiches");
};

const stubLoad = (data) => {
  cy.intercept("GET", "**/fiches", {
    statusCode: 200,
    body: data,
  }).as("getFiches");
};

const stubDelete = () => {
  cy.intercept("DELETE", "**/fiches/**", {
    statusCode: 200,
    body: { success: true },
  }).as("deleteFiche");
};

// ─────────────────────────────────────────────────────────────────────────────

describe("FichesPage — état vide / erreur", () => {
  it("affiche le loader pendant le chargement", () => {
    cy.intercept("GET", "**/fiches", (req) => {
      req.reply((res) => {
        res.setDelay(500);
        res.send({ statusCode: 200, body: [] });
      });
    }).as("getFiches");

    cy.mount(
      <AppRouterContext.Provider value={createRouter()}>
        <FichesPage />
      </AppRouterContext.Provider>
    );
    cy.contains("Chargement...").should("be.visible");
    cy.wait("@getFiches");
  });

  it("n'affiche aucune fiche quand la liste est vide", () => {
    stubLoad([]);
    mountWithRouter(createRouter());
    cy.contains("Nouvelle fiche").should("be.visible");
    cy.contains("Fiche Développeur").should("not.exist");
  });

  it("affiche la carte Nouvelle fiche même si l'API échoue", () => {
    cy.intercept("GET", "**/fiches", {
      statusCode: 500,
      body: { message: "Internal Server Error" },
    }).as("getFiches");
    mountWithRouter(createRouter());
    cy.contains("Nouvelle fiche").should("be.visible");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("FichesPage — rendu des fiches", () => {
  let router;

  beforeEach(() => {
    router = createRouter();
    stubLoad([
      makeFiche(),
      makeFiche({
        _id: "fiche-2",
        title: "Fiche Designer UI",
        description: "Pour les designers.",
      }),
    ]);
    mountWithRouter(router);
  });

  it("affiche le titre principal de la page", () => {
    cy.contains("Fiches de renseignement").should("be.visible");
  });

  it("affiche le titre de chaque fiche", () => {
    cy.contains("Fiche Développeur Fullstack").should("be.visible");
    cy.contains("Fiche Designer UI").should("be.visible");
  });

  it("affiche la description d'une fiche", () => {
    cy.contains("Formulaire pour les postes tech.").should("be.visible");
  });

  it("affiche 'Aucune description' si la description est vide", () => {
    stubLoad([makeFiche({ description: "" })]);
    cy.mount(
      <AppRouterContext.Provider value={createRouter()}>
        <FichesPage />
      </AppRouterContext.Provider>
    );
    cy.wait("@getFiches");
    cy.contains("Aucune description").should("be.visible");
  });

  it("affiche les boutons Modifier et Supprimer pour chaque fiche", () => {
    cy.contains("Fiche Développeur Fullstack")
      .closest("div[class*='rounded-3xl']")
      .within(() => {
        cy.contains("Modifier").should("be.visible");
        cy.contains("Supprimer").should("be.visible");
      });
  });

  it("affiche la carte Nouvelle fiche avec sa description", () => {
    cy.contains("Nouvelle fiche").should("be.visible");
    cy.contains("Créer un nouveau formulaire de renseignement").should("be.visible");
  });

  it("appelle router.push vers la page d'édition au clic sur Modifier", () => {
    cy.contains("Modifier").first().click();
    cy.get("@routerPush").should("have.been.called");
  });

  it("appelle router.push vers la page de création au clic sur Nouvelle fiche", () => {
    cy.contains("Nouvelle fiche").click();
    cy.get("@routerPush").should(
      "have.been.calledWith",
      "/recruiter/fiche-renseignement/create"
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("FichesPage — suppression d'une fiche", () => {
  beforeEach(() => {
    stubLoad([makeFiche({ _id: "fiche-del", title: "Fiche à supprimer" })]);
    stubDelete();
    mountWithRouter(createRouter());
  });

  it("ouvre la modale de confirmation au clic sur Supprimer", () => {
    cy.contains("Supprimer").click();
    cy.contains("Supprimer la fiche").should("be.visible");
    cy.contains("Cette action est irréversible").should("be.visible");
  });

  it("affiche le titre de la fiche dans la modale", () => {
    cy.contains("Supprimer").click();
    cy.contains("Fiche à supprimer").should("be.visible");
  });

  it("ferme la modale sans supprimer au clic sur Annuler", () => {
    cy.contains("Supprimer").click();
    cy.contains("Annuler").click();
    cy.contains("Supprimer la fiche").should("not.exist");
    cy.contains("Fiche à supprimer").should("be.visible");
  });

  it("ferme la modale en cliquant sur l'overlay", () => {
    cy.contains("Supprimer").click();
    cy.get(".fixed.inset-0 > .absolute").click({ force: true });
    cy.contains("Supprimer la fiche").should("not.exist");
  });

  it("appelle l'API delete et recharge la liste après confirmation", () => {
    cy.intercept("GET", "**/fiches", {
      statusCode: 200,
      body: [],
    }).as("getFichesReload");

    cy.contains("Supprimer").click();
    cy.get(".fixed.inset-0").contains("button", "Supprimer").click();
    cy.wait("@deleteFiche");
    cy.wait("@getFichesReload");
    cy.contains("Fiche à supprimer").should("not.exist");
  });
});
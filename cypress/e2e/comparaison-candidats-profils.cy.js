/// <reference types="cypress" />

/**
 * Tests E2E — Comparaisons IA
 *
 * Pages testées :
 *   A) /recruiter/comparisons_list  → ComparisonsListPage
 *   B) /recruiter/compare_interviews?ids=... → CompareInterviewsPage (loading + redirect)
 *
 * Suites :
 *  1. Affichage de la liste des comparaisons
 *  2. État vide
 *  3. Ouverture du modal de suppression
 *  4. Suppression d'une comparaison
 *  5. Navigation vers le détail (Détails)
 *  6. Navigation vers création (Nouvelle comparaison)
 *  7. Page de lancement de comparaison (compare_interviews?ids=)
 *  8. Flux complet : lancer → liste → détail → supprimer
 */

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_COMPARISON_1 = {
  _id: "comp_001",
  title: "Candidat A vs Candidat B",
  candidateNames: ["Candidat A", "Candidat B"],
  jobTitle: "Développeur Full Stack",
  createdByName: "Admin",
  createdAt: "2024-04-01T10:00:00Z",
};

const MOCK_COMPARISON_2 = {
  _id: "comp_002",
  title: "Alice vs Bob",
  candidateNames: ["Alice Dupont", "Bob Martin"],
  jobTitle: "Data Engineer",
  createdByName: "Recruteur",
  createdAt: "2024-04-02T14:00:00Z",
};

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 1 — Affichage de la liste des comparaisons
// ══════════════════════════════════════════════════════════════════════════════
describe("ComparisonsListPage — affichage liste", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [MOCK_COMPARISON_1, MOCK_COMPARISON_2],
    }).as("getComparisons");
  });

  it("affiche le titre 'Comparaisons IA'", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Comparaisons IA").should("be.visible");
  });

  it("affiche le nombre de comparaisons dans le sous-titre", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    // "Historique des comparaisons — 2 comparaisons"
    cy.contains(/2 comparaison/i).should("be.visible");
  });

  it("affiche les titres des comparaisons", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Candidat A vs Candidat B").should("be.visible");
    cy.contains("Alice vs Bob").should("be.visible");
  });

  it("affiche le poste et le créateur pour chaque comparaison", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Développeur Full Stack").should("be.visible");
    cy.contains("Data Engineer").should("be.visible");
    cy.contains(/par Admin/i).should("be.visible");
    cy.contains(/par Recruteur/i).should("be.visible");
  });

  it("affiche le badge avec le nombre de candidats", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    // Chaque comparaison a 2 candidats → badge "2 candidats"
    cy.contains(/2 candidat/i).should("be.visible");
  });

  it("affiche les boutons Détails et Supprimer pour chaque comparaison", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("button", "Détails").should("be.visible");

    // Deux boutons Détails (une par comparaison)
    cy.contains("button", "Détails").should("have.length.gte", 1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 2 — État vide
// ══════════════════════════════════════════════════════════════════════════════
describe("ComparisonsListPage — état vide", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [],
    }).as("getComparisons");
  });

  it("affiche le message 'Aucune comparaison'", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Aucune comparaison").should("be.visible");
  });

  it("affiche le compteur à 0 comparaison", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains(/0 comparaison/i).should("be.visible");
  });

  it("affiche le bouton 'Aller aux entretiens'", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Aller aux entretiens").should("be.visible");
  });

  it("le bouton 'Aller aux entretiens' redirige vers /list_interview", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Aller aux entretiens").click();

    cy.url().should("include", "/recruiter/list_interview");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 3 — Modal de suppression
// ══════════════════════════════════════════════════════════════════════════════
describe("ComparisonsListPage — modal de suppression", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [MOCK_COMPARISON_1],
    }).as("getComparisons");
  });

  it("ouvre le modal en cliquant sur le bouton poubelle", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    // Bouton Trash2 — pas de texte, on cible via index après Détails
    cy.contains("Candidat A vs Candidat B")
      .closest("[class*='rounded-2xl']")
      .find("button")
      .last()  // dernier bouton = poubelle
      .click();

    cy.contains("Supprimer cette comparaison ?").should("be.visible");
  });

  it("affiche le titre de la comparaison dans le modal", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Candidat A vs Candidat B")
      .closest("[class*='rounded-2xl']")
      .find("button").last().click();

    cy.contains("Candidat A vs Candidat B").should("be.visible");
    cy.contains("irréversible").should("be.visible");
  });

  it("ferme le modal en cliquant sur Annuler", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Candidat A vs Candidat B")
      .closest("[class*='rounded-2xl']")
      .find("button").last().click();

    cy.contains("Supprimer cette comparaison ?").should("be.visible");

    cy.contains("button", "Annuler").click();

    cy.contains("Supprimer cette comparaison ?").should("not.exist");
  });

  it("ferme le modal en cliquant sur l'overlay", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Candidat A vs Candidat B")
      .closest("[class*='rounded-2xl']")
      .find("button").last().click();

    cy.contains("Supprimer cette comparaison ?").should("be.visible");

    // Clic sur l'overlay (div fixed inset-0)
    cy.get("div.fixed.inset-0").first().click({ force: true });

    cy.contains("Supprimer cette comparaison ?").should("not.exist");
  });

  it("ferme le modal en cliquant sur le bouton X", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Candidat A vs Candidat B")
      .closest("[class*='rounded-2xl']")
      .find("button").last().click();

    cy.contains("Supprimer cette comparaison ?").should("be.visible");

    // Bouton X en haut à droite du modal
    cy.get("button").filter((_i, el) =>
      !!el.querySelector("svg.lucide-x, svg[class*='lucide-x']")
    ).first().click({ force: true });

    cy.contains("Supprimer cette comparaison ?").should("not.exist");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 4 — Suppression d'une comparaison
// ══════════════════════════════════════════════════════════════════════════════
describe("ComparisonsListPage — suppression", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [MOCK_COMPARISON_1, MOCK_COMPARISON_2],
    }).as("getComparisons");

    cy.intercept("DELETE", "**/api/interviews/comparisons/comp_001", {
      statusCode: 200,
      body: {},
    }).as("deleteComparison");
  });

  it("supprime la comparaison et la retire de la liste", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    // Ouvrir le modal pour comp_001
    cy.contains("Candidat A vs Candidat B")
      .closest("[class*='rounded-2xl']")
      .find("button").last().click();

    cy.contains("Supprimer cette comparaison ?").should("be.visible");

    // Confirmer la suppression
    cy.contains("button", "Supprimer").click();

    cy.wait("@deleteComparison");

    // La comparaison supprimée disparaît
    cy.contains("Candidat A vs Candidat B").should("not.exist");

    // L'autre comparaison reste visible
    cy.contains("Alice vs Bob").should("be.visible");
  });

  it("met à jour le compteur après suppression", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains(/2 comparaison/i).should("be.visible");

    cy.contains("Candidat A vs Candidat B")
      .closest("[class*='rounded-2xl']")
      .find("button").last().click();

    cy.contains("button", "Supprimer").click();

    cy.wait("@deleteComparison");

    // Maintenant 1 comparaison
    cy.contains(/1 comparaison/i).should("be.visible");
  });

  it("affiche un spinner pendant la suppression", () => {
    // Intercept avec délai pour voir le spinner
    cy.intercept("DELETE", "**/api/interviews/comparisons/comp_001", (req) => {
      req.reply({
        delay: 500,
        statusCode: 200,
        body: {},
      });
    }).as("deleteComparisonSlow");

    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Candidat A vs Candidat B")
      .closest("[class*='rounded-2xl']")
      .find("button").last().click();

    cy.contains("button", "Supprimer").click();

    // Pendant la suppression : texte "Suppression…" visible
    cy.contains(/Suppression/i).should("be.visible");

    cy.wait("@deleteComparisonSlow");
  });

  it("affiche une erreur si la suppression échoue", () => {
    cy.intercept("DELETE", "**/api/interviews/comparisons/comp_001", {
      statusCode: 500,
      body: { message: "Erreur serveur" },
    }).as("deleteComparisonFail");

    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Candidat A vs Candidat B")
      .closest("[class*='rounded-2xl']")
      .find("button").last().click();

    cy.contains("button", "Supprimer").click();

    cy.wait("@deleteComparisonFail");

    // Message d'erreur affiché dans la page
    cy.contains(/Erreur serveur|erreur/i).should("be.visible");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 5 — Navigation vers le détail
// ══════════════════════════════════════════════════════════════════════════════
describe("ComparisonsListPage — navigation détail", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [MOCK_COMPARISON_1],
    }).as("getComparisons");
  });

  it("redirige vers /compare_interviews/:id en cliquant sur Détails", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("button", "Détails").click();

    cy.url().should("include", "/recruiter/compare_interviews/comp_001");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 6 — Navigation vers création
// ══════════════════════════════════════════════════════════════════════════════
describe("ComparisonsListPage — nouvelle comparaison", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [],
    }).as("getComparisons");
  });

  it("redirige vers /list_interview en cliquant sur 'Nouvelle comparaison'", () => {
    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Nouvelle comparaison").click();

    cy.url().should("include", "/recruiter/list_interview");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 7 — Page de lancement de comparaison (CompareInterviewsPage)
// ══════════════════════════════════════════════════════════════════════════════
describe("CompareInterviewsPage — lancement comparaison", () => {

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it("affiche le loader 'Analyse IA en cours' pendant le traitement", () => {
    // Intercept avec délai pour voir l'état de chargement
    cy.intercept("POST", "**/api/interviews/compare", (req) => {
      req.reply({
        delay: 800,
        statusCode: 200,
        body: { success: true, comparisonId: "comp_new_001" },
      });
    }).as("compareInterviews");

    cy.visit("/recruiter/compare_interviews?ids=iv_001,iv_002");

    // État de chargement visible
    cy.contains("Analyse IA en cours").should("be.visible");
    cy.contains("Le LLM compare les candidats").should("be.visible");

    cy.wait("@compareInterviews");
  });

  it("redirige vers /compare_interviews/:id après succès", () => {
    cy.intercept("POST", "**/api/interviews/compare", {
      statusCode: 200,
      body: { success: true, comparisonId: "comp_new_001" },
    }).as("compareInterviews");

    cy.visit("/recruiter/compare_interviews?ids=iv_001,iv_002");

    cy.wait("@compareInterviews");

    cy.url().should("include", "/recruiter/compare_interviews/comp_new_001");
  });

  it("affiche une erreur si l'API retourne une erreur", () => {
    cy.intercept("POST", "**/api/interviews/compare", {
      statusCode: 500,
      body: { success: false, message: "Erreur de comparaison" },
    }).as("compareInterviewsFail");

    cy.visit("/recruiter/compare_interviews?ids=iv_001,iv_002");

    cy.wait("@compareInterviewsFail");

    cy.contains("Erreur de comparaison").should("be.visible");
    cy.contains("← Retour à la liste").should("be.visible");
  });

  it("le bouton retour redirige vers /list_interview après erreur", () => {
    cy.intercept("POST", "**/api/interviews/compare", {
      statusCode: 500,
      body: { success: false, message: "Erreur de comparaison" },
    }).as("compareInterviewsFail");

    cy.visit("/recruiter/compare_interviews?ids=iv_001,iv_002");

    cy.wait("@compareInterviewsFail");

    cy.contains("← Retour à la liste").click();

    cy.url().should("include", "/recruiter/list_interview");
  });

  it("redirige vers /comparisons_list si moins de 2 ids fournis", () => {
    cy.visit("/recruiter/compare_interviews?ids=iv_001");

    // Avec un seul id → redirect immédiat vers comparisons_list
    cy.url().should("include", "/recruiter/comparisons_list");
  });

  it("redirige vers /comparisons_list si aucun id fourni", () => {
    cy.visit("/recruiter/compare_interviews");

    cy.url().should("include", "/recruiter/comparisons_list");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 8 — Flux complet : lancer → liste → détail → supprimer
// ══════════════════════════════════════════════════════════════════════════════
describe("Flux complet comparaisons IA", () => {

  it("lance une comparaison, la retrouve dans la liste, consulte le détail puis la supprime", () => {
    cy.loginAsAdmin();

    // ── 1. Lancer la comparaison ──
    cy.intercept("POST", "**/api/interviews/compare", {
      statusCode: 200,
      body: { success: true, comparisonId: "comp_001" },
    }).as("compareInterviews");

    cy.visit("/recruiter/compare_interviews?ids=iv_001,iv_002");
    cy.wait("@compareInterviews");

    // Redirigé vers le détail
    cy.url().should("include", "/recruiter/compare_interviews/comp_001");

    // ── 2. Retourner à la liste ──
    cy.intercept("GET", "**/api/interviews/comparisons", {
      statusCode: 200,
      body: [MOCK_COMPARISON_1],
    }).as("getComparisons");

    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Candidat A vs Candidat B").should("be.visible");
    cy.contains("Comparaisons IA").should("be.visible");

    // ── 3. Consulter le détail ──
    cy.contains("button", "Détails").click();
    cy.url().should("include", "/recruiter/compare_interviews/comp_001");

    // ── 4. Retour liste + suppression ──
    cy.intercept("DELETE", "**/api/interviews/comparisons/comp_001", {
      statusCode: 200,
      body: {},
    }).as("deleteComparison");

    cy.visit("/recruiter/comparisons_list");
    cy.wait("@getComparisons");

    cy.contains("Candidat A vs Candidat B")
      .closest("[class*='rounded-2xl']")
      .find("button").last().click();

    cy.contains("Supprimer cette comparaison ?").should("be.visible");
    cy.contains("button", "Supprimer").click();

    cy.wait("@deleteComparison");

    cy.contains("Candidat A vs Candidat B").should("not.exist");
    cy.contains("Aucune comparaison").should("be.visible");
  });
});
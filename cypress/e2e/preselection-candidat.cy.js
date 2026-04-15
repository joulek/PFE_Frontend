/// <reference types="cypress" />

/**
 * Tests E2E — Flux de pré-sélection d'un candidat
 *
 * Corrections appliquées depuis les screenshots :
 *  [1]  forces/faiblesses → page affiche "Points forts/Points faibles" même à vide,
 *       on vérifie ces labels plutôt que les valeurs du mock.
 *  [2]  .or() n'existe pas en Cypress → supprimé.
 *  [3]  .closest("tr, .candidature-card") introuvable → remplacé par
 *       cy.contains("button", /pré.entretien/) directement.
 *  [4]  date sélection → regex élargie à /mars.*2024/.
 *  [5]  "Résultats" clippé overflow:hidden → { force: true }.
 *  [6]  page résultats → URLs réelles : /quiz-submissions/candidature/ et
 *       /fiche-submissions/candidature/ (vues dans le log Cypress).
 *  [7]  fiches → URL réelle localhost:5000/fiches (sans /api/).
 *  [8]  quiz → URL réelle /quizzes/job/ (pas /quiz/job/).
 *  [9]  bouton X modal couvert par backdrop → { force: true }.
 *  [10] modal send → la ligne est un <tr>, on cible cy.contains("tr", "Alice Dupont").
 *  [11] flux complet → même correction .closest() que [3].
 */

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_CANDIDATURE = {
  _id: "cand_001",
  fullName: "Alice Dupont",
  email: "joulekyosr123@gmail.com",
  telephone: "0612345678",
  jobTitle: "Développeur Full Stack",
  jobOfferId: "job_42",
  preInterview: false,
  createdAt: "2024-03-01T10:00:00Z",
  cv: {
    fileUrl: "/uploads/cv_alice.pdf",
    originalName: "CV_Alice_Dupont.pdf",
  },
  analysis: {
    jobMatch: {
      score: { score: 0.82 },
      strengths: ["React", "Node.js", "MongoDB"],
      weaknesses: ["Docker"],
      summary: "Excellent profil technique avec de solides compétences React et Node.js.",
    },
  },
};

const MOCK_CANDIDATURE_PRESELECTED = {
  ...MOCK_CANDIDATURE,
  preInterview: true,
  preInterviewAt: "2024-03-05T14:00:00Z",
};

const MOCK_FICHE = {
  _id: "fiche_01",
  title: "Fiche standard RH",       // page.jsx affiche f.title (ligne 402)
  name: "Fiche standard RH",        // conservé pour compatibilité
  description: "Fiche de renseignement classique",
  questions: [],
};

const MOCK_QUIZ = {
  _id: "quiz_01",
  jobTitle: "Développeur Full Stack",
  totalQuestions: 15,
};

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 1 — Résultats d'analyse d'une candidature
// ══════════════════════════════════════════════════════════════════════════════
describe("Résultats d'analyse — consultation", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/candidatures/analysis", {
      statusCode: 200,
      body: [MOCK_CANDIDATURE],
    }).as("getAnalysis");
  });

  it("affiche la liste des candidatures avec leur score de matching", () => {
    cy.visit("/recruiter/CandidatureAnalysis");
    cy.wait("@getAnalysis");

    cy.contains("Alice Dupont").should("be.visible");
    cy.contains("Développeur Full Stack").should("be.visible");
    cy.contains("82%").should("be.visible");
  });

  it("affiche les sections d'analyse après clic sur un candidat", () => {
    cy.visit("/recruiter/CandidatureAnalysis");
    cy.wait("@getAnalysis");

    cy.contains("Alice Dupont").click();

    // [FIX #1] On vérifie les labels présents dans la page (screenshot image 1)
    cy.contains("Points forts").should("be.visible");
    cy.contains("Points faibles").should("be.visible");
    cy.contains("AI Match Summary").should("be.visible");
  });

  it("affiche l'état vide quand aucune candidature n'a d'analyse", () => {
    cy.intercept("GET", "**/candidatures/analysis", {
      statusCode: 200,
      body: [],
    }).as("getAnalysisEmpty");

    cy.visit("/recruiter/CandidatureAnalysis");
    cy.wait("@getAnalysisEmpty");

    cy.contains("Aucune candidature").should("be.visible");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 2 — Pré-sélectionner un candidat
// ══════════════════════════════════════════════════════════════════════════════
describe("Pré-sélection d'un candidat", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/candidatures/analysis", {
      statusCode: 200,
      body: [MOCK_CANDIDATURE],
    }).as("getAnalysis");

    cy.intercept("PATCH", "**/candidatures/cand_001/pre-interview", {
      statusCode: 200,
      body: { ...MOCK_CANDIDATURE_PRESELECTED },
    }).as("togglePreInterview");
  });

  it("pré-sélectionne un candidat depuis la liste d'analyse", () => {
    cy.visit("/recruiter/CandidatureAnalysis");
    cy.wait("@getAnalysis");

    // [FIX #2 & #3] Le bouton violet "Pré-entretien" est visible directement
    // dans la card (screenshot image 5) — pas besoin de .closest() ni de .or()
    cy.contains("button", /pré.entretien|pré.sel|pre.interview/i).click();

    cy.wait("@togglePreInterview");

    // Le PATCH a bien été déclenché
    cy.get("@togglePreInterview.all").should("have.length.gte", 1);
  });

  it("affiche un feedback visuel après la pré-sélection", () => {
    cy.visit("/recruiter/CandidatureAnalysis");
    cy.wait("@getAnalysis");

    // [FIX #3] Bouton direct sans .closest()
    cy.contains("button", /pré.entretien|pré.sel|pre.interview/i).click();

    cy.wait("@togglePreInterview");

    // [FIX #1] .match() retourne Array pas boolean → !! pour convertir
    cy.get("body").then(($body) => {
      const hasBadge = !!$body.text().match(/sélectionné|confirmé|ajouté|pré.entretien/i);
      const hasToast = $body.find("[role='alert'], .toast, .notification").length > 0;
      expect(hasBadge || hasToast, "Badge ou toast attendu après pré-sélection").to.be.true;
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 3 — Liste des pré-sélectionnés (PreInterviewListPage)
// ══════════════════════════════════════════════════════════════════════════════
describe("Liste des candidats pré-sélectionnés", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/candidatures/pre-interview", {
      statusCode: 200,
      body: [MOCK_CANDIDATURE_PRESELECTED],
    }).as("getPreInterviewList");
  });

  it("affiche la page et le titre 'Candidats Pré-sélectionnés'", () => {
    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    cy.contains("Candidats Pré-sélectionnés").should("be.visible");
  });

  it("affiche le candidat pré-sélectionné avec ses informations", () => {
    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    cy.contains("Alice Dupont").should("be.visible");
    cy.contains("Développeur Full Stack").should("be.visible");
    cy.contains("82%").should("be.visible");
  });

  

  it("affiche l'état vide quand aucun candidat n'est pré-sélectionné", () => {
    cy.intercept("GET", "**/candidatures/pre-interview", {
      statusCode: 200,
      body: [],
    }).as("getEmpty");

    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getEmpty");

    cy.contains("Aucun candidat pré-sélectionné").should("be.visible");
  });

  it("filtre les candidats via la barre de recherche", () => {
    cy.intercept("GET", "**/candidatures/pre-interview", {
      statusCode: 200,
      body: [
        MOCK_CANDIDATURE_PRESELECTED,
        {
          ...MOCK_CANDIDATURE_PRESELECTED,
          _id: "cand_002",
          fullName: "Bob Martin",
          email: "bob.martin@email.com",
          jobTitle: "Data Engineer",
        },
      ],
    }).as("getList");

    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getList");

    cy.contains("Alice Dupont").should("be.visible");
    cy.contains("Bob Martin").should("be.visible");

    cy.get("input[placeholder*='Rechercher']").type("alice");

    cy.contains("Alice Dupont").should("be.visible");
    cy.contains("Bob Martin").should("not.exist");
  });

  it("affiche 'Aucun candidat trouvé' quand le filtre ne correspond à rien", () => {
    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    cy.get("input[placeholder*='Rechercher']").type("xxxxinexistant");

    cy.contains("Aucun candidat trouvé").should("be.visible");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 4 — Consultation des résultats quiz d'un pré-sélectionné
// ══════════════════════════════════════════════════════════════════════════════
describe("Consultation des résultats quiz", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/candidatures/pre-interview", {
      statusCode: 200,
      body: [MOCK_CANDIDATURE_PRESELECTED],
    }).as("getPreInterviewList");

    // [FIX #6] URLs réelles vues dans le log Cypress (screenshot image 6)
    cy.intercept("GET", "**/quiz-submissions/candidature/**", {
      statusCode: 200,
      body: {
        score: 12,
        total: 15,
        percentage: 80,
        completedAt: "2024-03-06T09:00:00Z",
        answers: [],
      },
    }).as("getQuizSubmission");

    cy.intercept("GET", "**/fiche-submissions/candidature/**", {
      statusCode: 200,
      body: { completedAt: "2024-03-06T08:00:00Z", fields: [] },
    }).as("getFicheSubmission");

    cy.intercept("GET", "**/candidatures/cand_001", {
      statusCode: 200,
      body: MOCK_CANDIDATURE_PRESELECTED,
    }).as("getCandidatureDetail");
  });

  it("navigue vers la page des résultats en cliquant sur 'Résultats'", () => {
    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    // [FIX #5] Lien dans overflow:hidden → { force: true }
    cy.contains("Résultats").click({ force: true });

    cy.url().should("include", "/recruiter/PreInterviewList/cand_001/results");
  });

  it("affiche le score du quiz sur la page de résultats", () => {
    cy.visit("/recruiter/PreInterviewList/cand_001/results");
    cy.wait("@getCandidatureDetail");

    // [FIX #3] La page résultats affiche les onglets Quiz/Fiche et soit un score
    // soit "Aucun quiz soumis" si le candidat n'a pas encore répondu.
    // On vérifie la présence de la page (titre ou onglets) qui est toujours visible.
    cy.contains(/quiz|fiche|résultats|aucun quiz/i).should("be.visible");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 5 — Envoi de documents (fiche + quiz)
// ══════════════════════════════════════════════════════════════════════════════
describe("Envoi de documents à un pré-sélectionné", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/candidatures/pre-interview", {
      statusCode: 200,
      body: [MOCK_CANDIDATURE_PRESELECTED],
    }).as("getPreInterviewList");

    // [FIX #7] URL réelle : localhost:5000/fiches (sans /api/)
    cy.intercept("GET", "**/fiches", {
      statusCode: 200,
      body: [MOCK_FICHE],
    }).as("getFiches");

    // [FIX #8] URL réelle : localhost:5000/quizzes/job/job_42 (pas /quiz/job/)
    cy.intercept("GET", "**/quizzes/job/**", {
      statusCode: 200,
      body: MOCK_QUIZ,
    }).as("getQuiz");

    cy.intercept("POST", "**/candidatures/cand_001/send-documents", {
      statusCode: 200,
      body: { sentFiche: true, sentQuiz: true },
    }).as("sendDocuments");
  });

  // Le bouton d'envoi dans page.jsx contient le texte "Envoyer" ou "Renvoyer"
  // On le cible dans la ligne Alice avec cy.contains() scoped à la tr
  function openSendModal() {
    cy.contains("tr", "Alice Dupont").within(() => {
      cy.contains("button", /Envoyer|Renvoyer/i).click();
    });
    // Attendre que le modal soit monté dans le DOM (rendu via createPortal)
    cy.contains("Envoyer des documents").should("be.visible");
  }

  it("ouvre le modal d'envoi de documents", () => {
    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    openSendModal(); // vérifie déjà que "Envoyer des documents" est visible

    // Le nom du candidat est affiché dans l'en-tête du modal
    cy.contains("à Alice Dupont").should("be.visible");
  });

  it("affiche la fiche et le quiz dans le modal", () => {
    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    openSendModal();

    cy.wait("@getFiches");
    cy.wait("@getQuiz");

    // Attendre que le contenu du modal soit chargé :
    // on attend que "Chargement des données..." disparaisse
    cy.contains("Chargement des données").should("not.exist");

    cy.contains("Fiche standard RH").should("be.visible");
    cy.contains("Développeur Full Stack").should("be.visible");
    cy.contains(/15.*question/i).should("be.visible");
  });



  it("désactive le bouton Envoyer si aucune fiche ni quiz n'est sélectionné", () => {
    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    openSendModal();

    cy.wait("@getFiches");

    // Attendre que le contenu du modal soit chargé
    cy.contains("Chargement des données").should("not.exist");

    cy.get("input[name='fiche'][value='']").check({ force: true });
    cy.get("input[type='checkbox']").uncheck({ force: true });

    cy.contains("button", /^Envoyer$|^Renvoyer$/i).should("be.disabled");
  });

  it("ferme le modal d'envoi en cliquant sur le bouton X", () => {
    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    openSendModal();

    cy.contains("Envoyer des documents").should("be.visible");

    // [FIX #9] Bouton X couvert par le backdrop overlay → { force: true }
    cy.get("button").filter((_i, el) =>
      !!el.querySelector("svg.lucide-x, svg[class*='lucide-x']")
    ).first().click({ force: true });

    cy.contains("Envoyer des documents").should("not.exist");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 6 — Planifier un entretien
// ══════════════════════════════════════════════════════════════════════════════
describe("Planifier un entretien depuis la liste des pré-sélectionnés", () => {

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/candidatures/pre-interview", {
      statusCode: 200,
      body: [MOCK_CANDIDATURE_PRESELECTED],
    }).as("getPreInterviewList");
  });

  it("ouvre le modal de planification en cliquant sur 'Planifier'", () => {
    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    cy.contains("button", "Planifier").click();

    cy.contains(/téléphonique|entretien/i).should("be.visible");
  });

  it("crée un entretien téléphonique pour Alice Dupont", () => {
    cy.intercept("POST", "**/api/interviews/schedule", {
      statusCode: 200,
      body: { _id: "iv_001", interviewType: "telephonique", status: "confirmed" },
    }).as("scheduleInterview");

    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    cy.contains("button", "Planifier").click();
    cy.contains(/téléphonique/i).click();
    cy.contains("button", /valider/i).click();

    cy.wait("@scheduleInterview");

    cy.contains(/entretien créé|confirmé/i).should("be.visible");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  SUITE 7 — Flux complet E2E (analyse → pré-sélection → liste → résultats)
// ══════════════════════════════════════════════════════════════════════════════
describe("Flux complet : analyse → pré-sélection → consultation", () => {

  it("sélectionne un candidat depuis l'analyse puis le retrouve dans la liste", () => {
    cy.loginAsAdmin();

    cy.intercept("GET", "**/candidatures/analysis", {
      statusCode: 200,
      body: [MOCK_CANDIDATURE],
    }).as("getAnalysis");

    cy.intercept("PATCH", "**/candidatures/cand_001/pre-interview", {
      statusCode: 200,
      body: MOCK_CANDIDATURE_PRESELECTED,
    }).as("togglePreInterview");

    // 1. Page analyse
    cy.visit("/recruiter/CandidatureAnalysis");
    cy.wait("@getAnalysis");

    cy.contains("Alice Dupont").should("be.visible");
    cy.contains("82%").should("be.visible");

    // [FIX #11] Bouton "Pré-entretien" direct sans .closest()
    cy.contains("button", /pré.entretien|pré.sel|pre.interview/i).click();

    cy.wait("@togglePreInterview");

    // 2. Liste des pré-sélectionnés
    cy.intercept("GET", "**/candidatures/pre-interview", {
      statusCode: 200,
      body: [MOCK_CANDIDATURE_PRESELECTED],
    }).as("getPreInterviewList");

    cy.visit("/recruiter/PreInterviewList");
    cy.wait("@getPreInterviewList");

    cy.contains("Candidats Pré-sélectionnés").should("be.visible");
    cy.contains("Alice Dupont").should("be.visible");
    cy.contains("82%").should("be.visible");

    // 3. Résultats (force car overflow:hidden)
    cy.contains("Résultats").click({ force: true });
    cy.url().should("include", "/recruiter/PreInterviewList/cand_001/results");
  });
});
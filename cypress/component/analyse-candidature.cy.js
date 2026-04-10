import React from "react";
import CandidatureAnalysisPage from "../../src/app/recruiter/CandidatureAnalysis/page";

// ─── FIXTURES ────────────────────────────────────────────────────────────────

const makeCandidature = (overrides = {}) => ({
  _id: `cand-${Math.random().toString(36).slice(2)}`,
  fullName: "Jean Dupont",
  email: "jean@example.com",
  jobTitle: "Développeur Fullstack",
  preInterview: { status: "PENDING" },
  cv: { fileUrl: "https://cdn.example.com/cv.pdf", originalName: "cv-jean.pdf" },
  analysis: {
    aiDetection: { status: "DONE", isAIGenerated: false, confidence: 0.95 },
    jobMatch: {
      score: 0.82,
      recommendation: "hire",
      seniorityFit: "senior",
      confidenceLevel: "high",
      detailedScores: {
        skillsFitScore: 0.9,
        experienceFitScore: 0.8,
        projectFitScore: 0.75,
        educationScore: 0.7,
        communicationScore: 0.85,
      },
      skillsAnalysis: {
        matchedSkills: ["React", "Node.js"],
        missingMustHaveSkills: [],
        missingNiceToHaveSkills: ["GraphQL"],
        transferableSkills: ["TypeScript"],
      },
      experienceAnalysis: {
        totalYears: 6,
        relevantYears: 5,
        seniorityLevel: "senior",
        yearsOfRelevantExperience: 5,
        breakdown: [{ role: "Lead Dev", company: "Acme", duration: "3 ans" }],
      },
      strengths: ["React expertise"],
      weaknesses: ["No GraphQL"],
      summary: "Strong fullstack candidate.",
    },
  },
  ...overrides,
});

const makeAICandidature = () =>
  makeCandidature({
    _id: "cand-ai",
    fullName: "Bot Candidat",
    email: "bot@example.com",
    jobTitle: "Designer UI",
    analysis: {
      aiDetection: { status: "DONE", isAIGenerated: true, confidence: 0.99 },
      jobMatch: { score: 0.4, recommendation: "reject" },
    },
  });

const makeLowScoreCandidature = () =>
  makeCandidature({
    _id: "cand-low",
    fullName: "Alice Martin",
    email: "alice@example.com",
    jobTitle: "QA Engineer",
    analysis: {
      aiDetection: { status: "DONE", isAIGenerated: false, confidence: 0.6 },
      jobMatch: { score: 0.35, recommendation: "consider" },
    },
  });

const makeMany = (n) =>
  Array.from({ length: n }, (_, i) =>
    makeCandidature({
      _id: `cand-${i}`,
      fullName: `Candidat ${i + 1}`,
      email: `c${i}@test.com`,
      jobTitle: "Développeur Fullstack",
      analysis: {
        aiDetection: { status: "DONE", isAIGenerated: false, confidence: 0.8 },
        jobMatch: { score: (100 - i) / 100, recommendation: "hire" },
      },
    })
  );

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * L'API utilise une instance Axios (`api`).
 * Axios wrappe la réponse : res.data = le body HTTP.
 * Le composant fait : const data = res?.data  → attend le tableau directement.
 * Donc cy.intercept doit retourner le tableau en body, pas { data: [...] }.
 */
const stubLoad = (data) => {
  cy.intercept("GET", "**/candidatures/analysis", {
    statusCode: 200,
    body: data,          // ← tableau directement, Axios expose ça dans res.data
  }).as("getCandidaturesAnalysis");
};

const stubToggle = (nextStatus = "SELECTED") => {
  cy.intercept("PATCH", "**/candidatures/**/pre-interview", {
    statusCode: 200,
    body: { preInterviewStatus: nextStatus },
  }).as("togglePreInterview");
};

const mount = () => {
  cy.mount(<CandidatureAnalysisPage />);
  cy.wait("@getCandidaturesAnalysis");
};

// ─────────────────────────────────────────────────────────────────────────────

describe("CandidatureAnalysisPage — états vide / erreur", () => {
  it("affiche le message vide quand l'API retourne une liste vide", () => {
    stubLoad([]);
    mount();
    cy.contains("Aucune candidature trouvée.").should("be.visible");
    cy.get("[data-cy=candidature-card]").should("not.exist");
  });

  it("affiche le message vide quand l'API échoue (500)", () => {
    cy.intercept("GET", "**/candidatures/analysis", {
      statusCode: 500,
      body: { message: "Internal Server Error" },
    }).as("getCandidaturesAnalysis");
    mount();
    cy.contains("Aucune candidature trouvée.").should("be.visible");
  });

 
});

// ─────────────────────────────────────────────────────────────────────────────

describe("CandidatureAnalysisPage — rendu des cartes", () => {
  beforeEach(() => {
    stubLoad([makeCandidature(), makeAICandidature()]);
    mount();
  });

  it("affiche le bon nombre de cartes", () => {
    cy.get("[data-cy=candidature-card]").should("have.length", 2);
  });

  it("affiche le match score en pourcentage", () => {
    // Jean (0.82) est trié en premier
    cy.get("[data-cy=match-score]").first().should("contain", "82%");
  });

  it("affiche Human / AI selon la détection", () => {
    cy.get("[data-cy=ai-detection-result]").first().should("contain", "Human");
    cy.get("[data-cy=ai-detection-result]").last().should("contain", "AI");
  });

  it("affiche le lien vers le CV", () => {
    cy.get("[data-cy=candidature-card]")
      .first()
      .find("a[href='https://cdn.example.com/cv.pdf']")
      .should("exist");
  });

  it("affiche CV Missing quand le CV est absent", () => {
    stubLoad([makeCandidature({ cv: null })]);
    // nouveau intercept donc nouveau wait
    cy.mount(<CandidatureAnalysisPage />);
    cy.wait("@getCandidaturesAnalysis");
    cy.get("[data-cy=candidature-card]").should("contain", "CV Missing");
  });

  it("affiche le badge 🥇 pour le meilleur candidat", () => {
    cy.get("[data-cy=candidature-card]").first().contains("🥇");
  });

  it("utilise l'email comme nom de fallback si fullName est vide", () => {
    stubLoad([makeCandidature({ fullName: "", nom: "", prenom: "" })]);
    cy.mount(<CandidatureAnalysisPage />);
    cy.wait("@getCandidaturesAnalysis");
    cy.get("[data-cy=candidature-card]").should("contain", "jean@example.com");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("CandidatureAnalysisPage — filtres & recherche", () => {
  beforeEach(() => {
    stubLoad([makeCandidature(), makeAICandidature(), makeLowScoreCandidature()]);
    mount();
  });

  it("filtre par nom via la recherche", () => {
    cy.get("[data-cy=search-candidate]").type("alice");
    cy.get("[data-cy=candidature-card]").should("have.length", 1);
    cy.get("[data-cy=candidature-card]").contains("Alice Martin");
  });

  it("filtre par email via la recherche", () => {
    cy.get("[data-cy=search-candidate]").type("bot@example");
    cy.get("[data-cy=candidature-card]").should("have.length", 1);
  });

  it("affiche le message vide si la recherche ne donne aucun résultat", () => {
    cy.get("[data-cy=search-candidate]").type("zzznoresult");
    cy.contains("Aucune candidature trouvée.").should("be.visible");
  });

  it("filtre les CVs IA avec le filtre AI", () => {
    cy.get("[data-cy=ai-filter]").select("AI");
    cy.get("[data-cy=candidature-card]").should("have.length", 1);
    cy.get("[data-cy=ai-detection-result]").should("contain", "AI");
  });

  it("filtre les CVs humains avec le filtre HUMAN", () => {
    cy.get("[data-cy=ai-filter]").select("HUMAN");
    cy.get("[data-cy=candidature-card]").should("have.length", 2);
  });


});


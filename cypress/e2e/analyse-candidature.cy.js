describe("Analyse candidatures - RECRUTEUR (UI uniquement)", () => {

    beforeEach(() => {
        cy.loginAsAdmin();

        cy.intercept("GET", "**/candidatures/analysis*", {
            statusCode: 200,
            body: [
                {
                    _id: "1",
                    fullName: "Ahmed Ben Ali",
                    jobTitle: "Fullstack Developer",
                    cv: { fileUrl: "/uploads/cv1.pdf", originalName: "cv1.pdf" },
                    analysis: {
                        aiDetection: {
                            status: "DONE",
                            isAIGenerated: false,
                            confidence: 0.92
                        },
                        jobMatch: {
                            score: 0.85,
                            recommendation: "strong_hire",
                            summary: "Excellent candidat",
                            strengths: ["React"],
                            weaknesses: ["DevOps"]
                        }
                    }
                }
            ]
        }).as("getAnalysis");

        cy.visit("/recruiter/CandidatureAnalysis");
        cy.wait("@getAnalysis");
    });

    it("Affiche la carte candidat", () => {
        cy.get("[data-cy=candidature-card]").should("have.length", 1);
    });

    it("Affiche nom + poste", () => {
        cy.contains("Ahmed Ben Ali").should("exist");
        cy.contains("Fullstack Developer").should("exist");
    });

    it("Affiche score match", () => {
        cy.get("[data-cy=match-score]").should("contain", "85%");
    });

    it("Affiche résultat AI", () => {
        cy.get("[data-cy=ai-detection-result]").should("contain", "Human");
    });

    it("Affiche bouton Pré-entretien (sans cliquer)", () => {
        cy.contains("Pré-entretien").should("exist");
    });

});


describe("Analyse candidatures - RH NORD (UI uniquement)", () => {

    beforeEach(() => {
        cy.loginAsRHNord();

        cy.intercept("GET", "**/candidatures/**", {
            statusCode: 200,
            body: [
                {
                    _id: "1",
                    fullName: "Sana Trabelsi",
                    jobTitle: "Backend Developer",
                    cv: { fileUrl: "/uploads/cv2.pdf" },
                    analysis: {
                        aiDetection: {
                            status: "DONE",
                            isAIGenerated: true,
                            confidence: 0.8
                        },
                        jobMatch: {
                            score: 0.6,
                            recommendation: "consider"
                        }
                    }
                }
            ]
        }).as("getAnalysisNord");

        cy.visit("/Responsable_RH_Nord/candidatures_Analysis");

        cy.wait("@getAnalysisNord");
    });

    it("Affiche carte candidat", () => {
        cy.get("[data-cy=candidature-card]").should("exist");
    });

    it("Affiche nom", () => {
        cy.contains("Sana Trabelsi").should("exist");
    });

    it("Affiche score", () => {
        cy.get("[data-cy=match-score]").should("contain", "60%");
    });

    it("Affiche AI = AI", () => {
        cy.get("[data-cy=ai-detection-result]").should("contain", "AI");
    });

});


describe("Analyse candidatures - RESPONSABLE METIER (UI uniquement)", () => {

    beforeEach(() => {
        cy.loginAsResponsable();

        cy.intercept("GET", "**/candidatures/my-analysis*", {
            statusCode: 200,
            body: [
                {
                    _id: "1",
                    fullName: "Karim Ali",
                    jobTitle: "Frontend Developer",
                    cv: { fileUrl: "/uploads/cv3.pdf" },
                    analysis: {
                        aiDetection: {
                            status: "DONE",
                            isAIGenerated: false,
                            confidence: 0.95
                        },
                        jobMatch: {
                            score: 0.9,
                            recommendation: "hire"
                        }
                    }
                }
            ]
        }).as("getMyAnalysis");

        cy.visit("/ResponsableMetier/candidatures_Analysis");
        cy.wait("@getMyAnalysis");
    });

    it("Affiche candidat", () => {
        cy.contains("Karim Ali").should("exist");
    });

    it("Affiche score", () => {
        cy.get("[data-cy=match-score]").should("contain", "90%");
    });

    it("Affiche AI Human", () => {
        cy.get("[data-cy=ai-detection-result]").should("contain", "Human");
    });

});
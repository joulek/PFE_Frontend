// cypress/e2e/rh-nord/rh_nord_jobs.cy.js

/**
 * ============================================================
 *  TESTS FONCTIONNELS — Gestion des offres (Responsable RH Nord)
 * ============================================================
 */

const LIST_URL = "/Responsable_RH_Nord/job";
const DETAIL_URL = "/Responsable_RH_Nord/job";

let f = {};

// ─── Helpers ───────────────────────────────────────────────────────────────

function getFutureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function openCreateModal() {
    cy.contains("button", "Nouvelle offre").click();
    cy.get(".fixed.inset-0").should("be.visible");
}

/**
 * Placeholders EXACTS du code source JobOfferModal
 */
function fillRequiredFields({ titre, isStage = false, description, lieu, dateCloture }) {
    const titrePH = isStage
        ? "Ex: Stage PFE Développeur React"
        : "Ex: Fullstack Developer (React/Node)";

    // FIX : attendre que le placeholder soit présent dans le DOM (React async state)
    cy.get(`input[placeholder="${titrePH}"]`, { timeout: 8000 }).should("exist").clear().type(titre);
    cy.get("textarea").clear().type(description);
    cy.get('input[placeholder="Ex: Tunis, Sfax, Télétravail, Hybride..."]').clear().type(lieu);
    cy.get('input[type="date"]').first().type(dateCloture);
}

/**
 * FIX : {selectall} avant de taper évite l'accumulation sur input[type=number]
 */
function setScore(label, value) {
    cy.contains(label)
        .closest("div")
        .find('input[type="number"]')
        .focus()
        .type("{selectall}")
        .type(String(value))
        .blur();
}

/**
 * 40 + 20 + 20 + 10 + 10 = 100
 * Vérifie "Total : 100%" avant de continuer
 */
function fillValidScores() {
    setScore("Skills Fit", 40);
    setScore("Professional Experience Fit", 20);
    setScore("Projects Fit", 20);
    setScore("Education", 10);
    setScore("Communication", 10);
    cy.contains(/Total : 100%/).should("be.visible");
}

// ─── SUITE ─────────────────────────────────────────────────────────────────

describe("RH Nord — Fonctionnalités de gestion des offres", () => {

    before(() => {
        cy.fixture("jobs").then((data) => { f = data; });
    });

    beforeEach(() => {
        cy.loginAsRHNord();
    });

    // ==================================================================
    //  1. CRÉATION D'UNE OFFRE D'EMPLOI
    // ==================================================================
    describe("1. Création d'une offre d'emploi", () => {

        beforeEach(() => {
            cy.intercept("GET", "**/jobs/my-offers**", f.emptyOffers).as("getOffers");
            cy.intercept("POST", "**/jobs", { statusCode: 201, body: f.createJob }).as("createJob");
            cy.visit(LIST_URL);
            cy.wait("@getOffers");
            openCreateModal();
            // FIX : scoper dans la modale + attendre le re-render React
            cy.get(".fixed.inset-0").within(() => {
                cy.contains("button", "Offre d'emploi").click();
            });
            cy.get('input[placeholder="Ex: Fullstack Developer (React/Node)"]', { timeout: 8000 }).should("exist");
        });

        it("soumet correctement une offre d'emploi complète", () => {
            fillRequiredFields({
                titre: "Développeur Fullstack React/Node",
                description: "Rejoignez notre équipe pour concevoir des applications modernes.",
                lieu: "Tunis",
                dateCloture: getFutureDate(30),
            });
            cy.get('input[placeholder="Ex: 2000 TND / 2000-2500"]').type("2500 TND");
            cy.get('input[placeholder="Ex: 2, 5, 10..."]').type("3");
            cy.get('input[placeholder="Ex: Licence, Master, Ingénieur..."]').first().type("Ingénieur");
            cy.get("select").eq(0).select("CDI");
            cy.get("select").eq(1).select("NOUVEAU");
            cy.get("select").eq(2).select("HF");
            cy.get('input[placeholder="React, Node.js, SQL, Docker..."]').type("React, Node.js, MongoDB");
            cy.get('input[placeholder="Communication, Leadership, Esprit..."]').type("Communication, Leadership");
            fillValidScores();

            cy.contains("button", /Créer \+ Quiz|Enregistrer/).click();

            cy.wait("@createJob").then(({ request }) => {
                expect(request.body.typeOffre).to.eq("JOB");
                expect(request.body.titre).to.eq("Développeur Fullstack React/Node");
                expect(request.body.lieu).to.eq("Tunis");
                expect(request.body.typeContrat).to.eq("CDI");
                expect(request.body.motif).to.eq("NOUVEAU");
                expect(request.body.salaire).to.eq("2500 TND");
                expect(request.body.scores.skillsFit).to.eq(40);
                expect(request.body.hardSkills).to.include("React");
                expect(request.body.softSkills).to.include("Communication");
            });

            cy.get(".fixed.inset-0").should("not.exist");
        });

        it("envoie generateQuiz=true et numQuestions quand le quiz est activé", () => {
            fillRequiredFields({
                titre: "Dev Java",
                description: "Mission Java backend.",
                lieu: "Sfax",
                dateCloture: getFutureDate(20),
            });
            fillValidScores();
            cy.get('input[type="checkbox"]').should("be.checked");
            cy.contains("button", /Créer \+ Quiz|Enregistrer/).click();
            cy.wait("@createJob").then(({ request }) => {
                expect(request.body.generateQuiz).to.eq(true);
                expect(request.body.numQuestions).to.be.greaterThan(0);
            });
        });

        it("envoie generateQuiz=false quand le quiz est désactivé", () => {
            fillRequiredFields({
                titre: "Dev Python",
                description: "Mission Python.",
                lieu: "Tunis",
                dateCloture: getFutureDate(20),
            });
            fillValidScores();
            cy.get('input[type="checkbox"]').uncheck({ force: true });
            cy.contains("button", "Enregistrer").click();
            cy.wait("@createJob").then(({ request }) => {
                expect(request.body.generateQuiz).to.eq(false);
            });
        });

        it("bloque la soumission si les pondérations ne totalisent pas 100%", () => {
            fillRequiredFields({
                titre: "Test",
                description: "Desc",
                lieu: "Tunis",
                dateCloture: getFutureDate(10),
            });
            setScore("Skills Fit", 99);
            cy.contains("button", /Créer|Enregistrer/).should("be.disabled");
            cy.get("@createJob.all").should("have.length", 0);
        });

        it("bloque la soumission si le titre est manquant", () => {
            cy.contains("button", /Créer|Enregistrer/).click();
            // FIX : scrollIntoView car le message d'erreur peut être hors viewport
            cy.contains("titre du poste est obligatoire").scrollIntoView().should("be.visible");
            cy.get("@createJob.all").should("have.length", 0);
        });

        it("bloque la soumission si la description est manquante", () => {
            cy.get('input[placeholder="Ex: Fullstack Developer (React/Node)"]').type("Titre OK");
            cy.contains("button", /Créer|Enregistrer/).click();
            cy.contains("description est obligatoire").scrollIntoView().should("be.visible");
            cy.get("@createJob.all").should("have.length", 0);
        });

        it("bloque la soumission si le lieu est manquant", () => {
            cy.get('input[placeholder="Ex: Fullstack Developer (React/Node)"]').type("Titre OK");
            cy.get("textarea").type("Description OK");
            cy.contains("button", /Créer|Enregistrer/).click();
            cy.contains("lieu").scrollIntoView().should("be.visible");
            cy.get("@createJob.all").should("have.length", 0);
        });

        it("bloque la soumission si la date de clôture est manquante", () => {
            cy.get('input[placeholder="Ex: Fullstack Developer (React/Node)"]').type("Titre OK");
            cy.get("textarea").type("Description OK");
            cy.get('input[placeholder="Ex: Tunis, Sfax, Télétravail, Hybride..."]').type("Tunis");
            cy.contains("button", /Créer|Enregistrer/).click();
            cy.contains("date de clôture est obligatoire").scrollIntoView().should("be.visible");
            cy.get("@createJob.all").should("have.length", 0);
        });

        it("affiche un message d'erreur si l'API retourne 500 et garde la modale ouverte", () => {
            cy.intercept("POST", "**/jobs", { statusCode: 500 }).as("createFail");
            fillRequiredFields({
                titre: "Test erreur",
                description: "Desc",
                lieu: "Tunis",
                dateCloture: getFutureDate(10),
            });
            fillValidScores();
            cy.contains("button", /Créer|Enregistrer/).click();
            cy.wait("@createFail");
            // FIX : scrollIntoView car le message est dans la modale scrollée
            cy.contains("Une erreur est survenue").scrollIntoView().should("be.visible");
            cy.get(".fixed.inset-0").should("be.visible");
        });

        it("annuler ne soumet rien à l'API", () => {
            fillRequiredFields({
                titre: "Brouillon",
                description: "Desc",
                lieu: "Tunis",
                dateCloture: getFutureDate(10),
            });
            cy.contains("button", "Annuler").click();
            cy.get(".fixed.inset-0").should("not.exist");
            cy.get("@createJob.all").should("have.length", 0);
        });
    });

    // ==================================================================
    //  2. CRÉATION D'UNE OFFRE DE STAGE
    // ==================================================================
    describe("2. Création d'une offre de stage", () => {

        beforeEach(() => {
            cy.intercept("GET", "**/jobs/my-offers**", f.emptyOffers).as("getOffers");
            cy.intercept("POST", "**/jobs", { statusCode: 201, body: f.createJob }).as("createStage");
            cy.visit(LIST_URL);
            cy.wait("@getOffers");
            openCreateModal();
            // FIX : scoper le clic DANS la modale pour éviter de cliquer sur le bouton
            // filtre "Stages" de la page liste qui a le même texte
            cy.get(".fixed.inset-0").within(() => {
                cy.contains("button", "Stage").click();
            });
            // Attendre que React re-rende le champ titre avec le bon placeholder
            cy.get('input[placeholder="Ex: Stage PFE Développeur React"]', { timeout: 8000 }).should("exist");
        });

        it("soumet correctement une offre de stage complète", () => {
            fillRequiredFields({
                titre: "Stage PFE Développeur React",
                isStage: true,
                description: "Stage de fin d'études dans l'équipe frontend.",
                lieu: "Sfax",
                dateCloture: getFutureDate(60),
            });
            cy.get('input[placeholder="Ex: 2, 5, 10..."]').type("2");
            cy.get('input[placeholder="Ex: Licence, Master, Ingénieur..."]').type("Master");
            cy.get("select").eq(0).select("STAGE_PFE");
            cy.get("select").eq(1).select("6_MOIS");
            cy.get("select").eq(2).select("HF");
            cy.get('input[placeholder="React, Node.js, SQL, Docker..."]').type("React, TypeScript");
            cy.get('input[placeholder="Communication, Leadership, Esprit..."]').type("Rigueur, Autonomie");

            cy.contains("button", "Enregistrer").click();

            cy.wait("@createStage").then(({ request }) => {
                expect(request.body.typeOffre).to.eq("STAGE");
                expect(request.body.titre).to.eq("Stage PFE Développeur React");
                expect(request.body.typeStage).to.eq("STAGE_PFE");
                expect(request.body.dureeStage).to.eq("6_MOIS");
                expect(request.body.lieu).to.eq("Sfax");
                expect(request.body.generateQuiz).to.be.undefined;
                expect(request.body.scores).to.be.undefined;
            });

            cy.get(".fixed.inset-0").should("not.exist");
        });

        it("bloque la soumission si le titre est manquant", () => {
            cy.contains("button", "Enregistrer").click();
            cy.contains("titre du poste est obligatoire").scrollIntoView().should("be.visible");
            cy.get("@createStage.all").should("have.length", 0);
        });

        it("annuler ne soumet rien à l'API", () => {
            fillRequiredFields({
                titre: "Stage test",
                isStage: true,
                description: "Desc",
                lieu: "Tunis",
                dateCloture: getFutureDate(30),
            });
            cy.contains("button", "Annuler").click();
            cy.get(".fixed.inset-0").should("not.exist");
            cy.get("@createStage.all").should("have.length", 0);
        });
    });

    // ==================================================================
    //  3. MODIFICATION D'UNE OFFRE EN_ATTENTE
    // ==================================================================
    describe("3. Modification d'une offre EN_ATTENTE", () => {
        const jobId = "edit-job-002";

        beforeEach(() => {
            const editableData = { ...f.jobDetail.data, _id: jobId, status: "EN_ATTENTE" };
            cy.intercept("GET", `**/jobs/${jobId}`, { data: editableData }).as("getJob");
            cy.intercept("PUT", `**/jobs/my-offers/${jobId}`, f.updateJob).as("updateJob");
            cy.visit(`${DETAIL_URL}/${jobId}`);
            cy.wait("@getJob");
            cy.contains("button", /Modifier l'offre/i).click();
            cy.contains("h2", "Modifier l'offre").should("be.visible");
        });




        it("bloque la modification si les pondérations ne totalisent pas 100%", () => {
            cy.get('.fixed.inset-0 input[type="number"][max="100"]').first()
                .focus().type("{selectall}").type("99").blur();
            cy.contains("button", "Enregistrer").should("be.disabled");
            cy.get("@updateJob.all").should("have.length", 0);
        });

        it("annuler ne soumet rien à l'API", () => {
            cy.get(".fixed.inset-0 form input[type='text'], .fixed.inset-0 form input:not([type='number']):not([type='date'])")
                .first()
                .clear()
                .type("Titre abandonné");
            cy.get(".fixed.inset-0").contains("button", "Annuler").click();
            cy.contains("h2", "Modifier l'offre").should("not.exist");
            cy.get("@updateJob.all").should("have.length", 0);
        });


    });




    // ==================================================================
    //  4. GESTION DES ERREURS API
    // ==================================================================
    describe("8. Gestion des erreurs API", () => {

        it("affiche une liste vide sans crash si l'API retourne 500", () => {
            cy.intercept("GET", "**/jobs/my-offers**", { statusCode: 500 }).as("error500");
            cy.visit(LIST_URL);
            cy.wait("@error500");
            cy.contains("Aucune offre pour ce filtre").should("be.visible");
        });

        it("affiche 'Offre introuvable' si le détail retourne 404", () => {
            cy.intercept("GET", "**/jobs/inexistant**", { statusCode: 404 }).as("notFound");
            cy.visit(`${DETAIL_URL}/inexistant`);
            cy.wait("@notFound");
            cy.contains("Offre introuvable").should("be.visible");
        });
    });
});
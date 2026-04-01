describe("Responsable Métier - Consultation des offres", () => {

    beforeEach(() => {
        cy.loginAsResponsable();
    });

    it("Afficher la liste des offres (créées + assignées)", () => {

        cy.intercept("GET", "**/jobs/my-offers*", {
            statusCode: 200,
            body: [
                {
                    _id: "1",
                    titre: "Développeur React",
                    description: "Offre test React",
                    lieu: "Sfax",
                    typeOffre: "EMPLOI",
                    status: "CONFIRMEE",
                    createdAt: "2026-01-01",
                    dateCloture: "2026-12-31"
                }
            ]
        }).as("getMyOffers");

        cy.intercept("GET", "**/jobs/my-assigned*", {
            statusCode: 200,
            body: [
                {
                    _id: "2",
                    titre: "Stage PFE Node.js",
                    description: "Stage backend",
                    lieu: "Tunis",
                    typeOffre: "STAGE",
                    status: "EN_ATTENTE",
                    createdAt: "2026-02-01",
                    dateCloture: "2026-06-01"
                }
            ]
        }).as("getAssigned");

        cy.visit("/ResponsableMetier/job");

        cy.wait("@getMyOffers");
        cy.wait("@getAssigned");

        cy.contains("Offres Responsable Métier").should("be.visible");

        cy.contains("Développeur React").should("be.visible");
        cy.contains("Stage PFE Node.js").should("be.visible");

        cy.contains("Publiée").should("exist");
        cy.contains("En attente").should("exist");

        cy.contains("Détails").should("exist");
    });

    it("Filtrer les offres par statut", () => {

        cy.loginAsResponsable();

        cy.intercept("GET", "**/jobs/my-offers*", {
            statusCode: 200,
            body: [
                {
                    _id: "1",
                    titre: "Offre validée",
                    typeOffre: "EMPLOI",
                    status: "VALIDEE",
                    createdAt: "2026-01-01"
                }
            ]
        }).as("getMyOffers");

        cy.intercept("GET", "**/jobs/my-assigned*", {
            statusCode: 200,
            body: []
        }).as("getAssigned");

        cy.visit("/ResponsableMetier/job");

        cy.wait("@getMyOffers");

        cy.contains("Validées").click();

        cy.contains("Offre validée").should("be.visible");
    });

    it("Accéder au détail d'une offre", () => {

        cy.loginAsResponsable();

        cy.intercept("GET", "**/jobs/my-offers*", {
            statusCode: 200,
            body: [
                {
                    _id: "1",
                    titre: "Développeur React",
                    typeOffre: "EMPLOI",
                    status: "CONFIRMEE",
                    createdAt: "2026-01-01",
                    dateCloture: "2026-12-31",
                    lieu: "Sfax"
                }
            ]
        }).as("getMyOffers");

        cy.intercept("GET", "**/jobs/my-assigned*", {
            statusCode: 200,
            body: []
        }).as("getAssigned");

        cy.intercept("GET", "**/jobs/1", {
            statusCode: 200,
            body: {
                _id: "1",
                titre: "Développeur React",
                description: "Offre test React",
                lieu: "Sfax",
                typeOffre: "EMPLOI",
                status: "CONFIRMEE",
                createdAt: "2026-01-01",
                dateCloture: "2026-12-31",
                hardSkills: ["React", "Node"],
                softSkills: ["Communication"]
            }
        }).as("getJobById");

        cy.visit("/ResponsableMetier/job");

        cy.wait("@getMyOffers");

        cy.contains("Détails").click();

        cy.wait("@getJobById");

        cy.contains("Développeur React").should("be.visible");
        cy.contains("Description").should("be.visible");
        cy.contains("Sfax").should("be.visible");

    });

    it("Créer offre EN_ATTENTE", () => {

        const titre = "Offre Test EN_ATTENTE " + Date.now();

        cy.intercept("POST", "**/jobs").as("createJob");

        cy.visit("/ResponsableMetier/job");

        cy.contains("Nouvelle offre").click();

        cy.get('input').eq(0).type(titre);
        cy.get('textarea').type("Description test");
        cy.get('input[placeholder*="Tunis"]').type("Sfax");

        const d = new Date();
        d.setDate(d.getDate() + 1);
        cy.get('input[type="date"]').type(d.toISOString().split("T")[0]);

        cy.get('[data-cy="hardSkills"]').type("React");
        cy.get('[data-cy="softSkills"]').type("Communication");

        cy.contains("Générer un quiz technique").click();

        cy.get('[data-cy="submitJob"]').click();

        cy.wait("@createJob").then((interception) => {
            expect(interception.request.body.titre).to.eq(titre);
        });

    });

    it("Responsable métier - Modifier une offre EN_ATTENTE (sans quiz)", () => {

        const titre = "Offre Test " + Date.now();
        const titreUpdated = "Offre Modifiée " + Date.now();

        let offers = [
            {
                _id: "1",
                titre,
                lieu: "Sfax",
                typeOffre: "EMPLOI",
                status: "EN_ATTENTE",
                dateCloture: "2026-12-31",
                description: "desc",
                hardSkills: ["React"],
                softSkills: ["Communication"]
            }
        ];

        // 🔥 GET liste
        cy.intercept("GET", "**/jobs/my-offers*", {
            statusCode: 200,
            body: offers
        }).as("getMyOffers");

        cy.intercept("GET", "**/jobs/my-assigned*", {
            statusCode: 200,
            body: []
        }).as("getAssigned");

        // 🔥 GET detail (DYNAMIQUE 🔥)
        cy.intercept("GET", "**/jobs/1", (req) => {
            req.reply({
                statusCode: 200,
                body: offers[0]
            });
        }).as("getJobDetails");

        // 🔥 UPDATE (ROUTE CORRECTE 🔥)
        cy.intercept("PUT", "**/jobs/my-offers/1", (req) => {
            offers[0].titre = titreUpdated;
            req.reply({ statusCode: 200 });
        }).as("updateJob");

        cy.visit("/ResponsableMetier/job");

        cy.wait("@getMyOffers");
        cy.wait("@getAssigned");

        // ✅ ouvrir détail (FIX)
        cy.contains("Détails").click();
        cy.wait("@getJobDetails");

        // ✅ ouvrir modal
        cy.contains("Modifier l'offre").click();

        // ✅ modifier titre
        cy.get('input').first().clear().type(titreUpdated);

        // ✅ modifier skills
        cy.get('input[placeholder*="React"]').clear().type("Angular");
        cy.get('input[placeholder*="Communication"]').clear().type("Leadership");

        // 🚫 PAS DE QUIZ

        // ✅ submit
        cy.contains("Enregistrer")
            .scrollIntoView()
            .should("be.visible")
            .click();

        cy.wait("@updateJob");

        // 🔥 attendre reload GET après update
        cy.wait("@getJobDetails");

        // ✅ vérification finale
        cy.contains(titreUpdated).should("exist");

    });




    it("Responsable métier - Supprimer une offre EN_ATTENTE", () => {

        const titre = "Offre à supprimer " + Date.now();

        let offers = [
            {
                _id: "1",
                titre,
                lieu: "Sfax",
                typeOffre: "STAGE",
                status: "EN_ATTENTE",
                dateCloture: "2026-12-31",
                description: "desc",
                hardSkills: ["React"],
                softSkills: ["Communication"]
            }
        ];

        // 🔥 GET liste
        cy.intercept("GET", "**/jobs/my-offers*", {
            statusCode: 200,
            body: offers
        }).as("getMyOffers");

        cy.intercept("GET", "**/jobs/my-assigned*", {
            statusCode: 200,
            body: []
        }).as("getAssigned");

        // 🔥 GET détail
        cy.intercept("GET", "**/jobs/1", {
            statusCode: 200,
            body: offers[0]
        }).as("getJobDetails");

        // 🔥 DELETE
        cy.intercept("DELETE", "**/jobs/my-offers/1", {
            statusCode: 200
        }).as("deleteJob");

        cy.visit("/ResponsableMetier/job");

        cy.wait("@getMyOffers");
        cy.wait("@getAssigned");

        // ✅ ouvrir détail
        cy.contains("Détails").click();
        cy.wait("@getJobDetails");

        // ✅ cliquer supprimer
        cy.contains("Supprimer le stage").click();

        // ✅ modal affiché
        cy.contains("Êtes-vous sûr").should("exist");

        // ✅ confirmer suppression
        cy.contains("Oui, supprimer").click();

        cy.wait("@deleteJob");

        // ✅ redirection vers liste
        cy.url().should("include", "/ResponsableMetier/job");

    });



    it("Responsable métier - Ajouter un stage (statut CONFIRMEE)", () => {

        const titre = "Stage TEST " + Date.now();

        let offers = []; // 🔥 état dynamique

        // ✅ GET dynamique
        cy.intercept("GET", "**/jobs/my-offers*", (req) => {
            req.reply({
                statusCode: 200,
                body: offers
            });
        }).as("getMyOffers");

        cy.intercept("GET", "**/jobs/my-assigned*", {
            statusCode: 200,
            body: []
        }).as("getAssigned");

        // ✅ POST création
        cy.intercept("POST", "**/jobs", (req) => {

            // 🔥 on ajoute dans la liste
            offers.push({
                _id: "99",
                titre,
                lieu: "Sfax",
                typeOffre: "STAGE",
                status: "CONFIRMEE",
                createdAt: new Date().toISOString(),
                dateCloture: "2026-12-31",
                description: "Description test stage"
            });

            req.reply({ statusCode: 201 });

        }).as("createJob");

        cy.visit("/ResponsableMetier/job");

        cy.wait("@getMyOffers");
        cy.wait("@getAssigned");

        cy.contains("Nouvelle offre").click();

        // ✅ CLICK STAGE (robuste)
        cy.contains("Stage")
            .parents("button, div")
            .first()
            .click({ force: true });

        // ✅ champs
        cy.get('input').first().type(titre);

        cy.get("textarea").type("Description test stage");

        cy.get('input[placeholder*="Tunis"]').type("Sfax");

        cy.get('input[type="date"]').type("2026-12-31");

        cy.get('[data-cy="hardSkills"]').type("React");

        cy.get('[data-cy="softSkills"]').type("Communication");

        // ✅ submit
        cy.get('[data-cy="submitJob"]').click();

        cy.wait("@createJob");

        // 🔥 IMPORTANT → attendre re-fetch
        cy.wait("@getMyOffers");

        // ✅ vérif
        cy.contains(titre).should("exist");

        cy.contains(titre)
            .parents(".bg-white")
            .should("contain", "Publiée");

    });


    it("Responsable métier - Modifier un stage CONFIRMEE", () => {

        const titre = "Stage TEST " + Date.now();
        const titreUpdated = "Stage MODIFIE " + Date.now();

        let offers = [
            {
                _id: "1",
                titre,
                lieu: "Sfax",
                typeOffre: "STAGE",
                status: "CONFIRMEE",
                createdAt: "2026-01-01",
                dateCloture: "2026-12-31",
                description: "Description initiale",
                hardSkills: ["React"],
                softSkills: ["Communication"]
            }
        ];

        // ✅ GET liste dynamique
        cy.intercept("GET", "**/jobs/my-offers*", (req) => {
            req.reply({
                statusCode: 200,
                body: offers
            });
        }).as("getMyOffers");

        cy.intercept("GET", "**/jobs/my-assigned*", {
            statusCode: 200,
            body: []
        }).as("getAssigned");

        // ✅ GET détail dynamique
        cy.intercept("GET", "**/jobs/1", (req) => {
            req.reply({
                statusCode: 200,
                body: offers[0]
            });
        }).as("getJobDetails");

        // ✅ PUT update
        cy.intercept("PUT", "**/jobs/my-offers/1", (req) => {

            // 🔥 update local state
            offers[0].titre = titreUpdated;
            offers[0].description = "Description modifiée";
            offers[0].hardSkills = ["Angular"];
            offers[0].softSkills = ["Leadership"];

            req.reply({ statusCode: 200 });

        }).as("updateJob");

        cy.visit("/ResponsableMetier/job");

        cy.wait("@getMyOffers");
        cy.wait("@getAssigned");

        // ✅ ouvrir détail
        cy.contains(titre).parents(".bg-white").within(() => {
            cy.contains("Détails").click();
        });

        cy.wait("@getJobDetails");

        // ✅ ouvrir modal modification
        cy.contains("Modifier le stage").click();

        // ✅ modifier champs
        cy.get('input').first().clear().type(titreUpdated);

        cy.get("textarea").clear().type("Description modifiée");

        cy.get('input[placeholder*="React"]').clear().type("Angular");
        cy.get('input[placeholder*="Communication"]').clear().type("Leadership");

        // ✅ submit
        cy.contains("Enregistrer")
            .scrollIntoView()
            .should("be.visible")
            .click();

        cy.wait("@updateJob");

        // 🔥 attendre refresh
        cy.wait("@getJobDetails");

        // ✅ vérification UI
        cy.contains(titreUpdated).should("exist");
        cy.contains("Description modifiée").should("exist");
        cy.contains("Angular").should("exist");
        cy.contains("Leadership").should("exist");

    });

    it("Responsable métier - Supprimer un stage", () => {

        const titre = "Stage à supprimer " + Date.now();

        let offers = [
            {
                _id: "1",
                titre,
                lieu: "Sfax",
                typeOffre: "STAGE",
                status: "CONFIRMEE",
                createdAt: "2026-01-01",
                dateCloture: "2026-12-31",
                description: "Description test",
                hardSkills: ["React"],
                softSkills: ["Communication"]
            }
        ];

        // ✅ GET liste dynamique
        cy.intercept("GET", "**/jobs/my-offers*", (req) => {
            req.reply({
                statusCode: 200,
                body: offers
            });
        }).as("getMyOffers");

        cy.intercept("GET", "**/jobs/my-assigned*", {
            statusCode: 200,
            body: []
        }).as("getAssigned");

        // ✅ GET détail
        cy.intercept("GET", "**/jobs/1", (req) => {
            req.reply({
                statusCode: 200,
                body: offers[0]
            });
        }).as("getJobDetails");

        // ✅ DELETE
        cy.intercept("DELETE", "**/jobs/my-offers/1", (req) => {

            // 🔥 supprimer de la liste
            offers = [];

            req.reply({ statusCode: 200 });

        }).as("deleteJob");

        cy.visit("/ResponsableMetier/job");

        cy.wait("@getMyOffers");
        cy.wait("@getAssigned");

        // ✅ ouvrir détail
        cy.contains(titre)
            .parents(".bg-white")
            .within(() => {
                cy.contains("Détails").click();
            });

        cy.wait("@getJobDetails");

        // ✅ cliquer supprimer
        cy.contains("Supprimer le stage")
            .scrollIntoView()
            .should("be.visible")
            .click();

        // ✅ vérifier modal
        cy.contains("Êtes-vous sûr").should("be.visible");

        // ✅ confirmer
        cy.contains("Oui, supprimer").click();

        cy.wait("@deleteJob");

        // 🔥 attendre refresh liste
        cy.wait("@getMyOffers");

        // ✅ vérifier suppression UI
        cy.contains(titre).should("not.exist");

        // ✅ vérifier redirection
        cy.url().should("include", "/ResponsableMetier/job");

    });

});
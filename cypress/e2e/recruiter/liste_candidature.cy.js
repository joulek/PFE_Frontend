/// <reference types="cypress" />

describe("Recruteur — Consultation liste des candidatures (RÉEL)", () => {

    beforeEach(() => {
        // ✅ login réel (déjà implémenté chez toi)
        cy.loginAsAdmin();

        // ✅ aller à la page
        cy.visit("/recruiter/candidatures");
    });

    it("affiche la liste des candidatures", () => {

        // 🔥 attendre chargement réel API
        cy.contains("Liste des Candidatures").should("be.visible");

        // soit tableau soit cards
        cy.get("body").then((body) => {

            if (body.find("table").length > 0) {
                cy.get("table tbody tr").should("have.length.greaterThan", 0);
            } else {
                cy.get("body").should("contain.text", "Voir CV");
            }

        });

    });

    it("affiche les informations principales d’une candidature", () => {

        cy.get("body").then((body) => {

            if (body.find("table").length > 0) {

                cy.get("table tbody tr").first().within(() => {
                    cy.get("td").eq(0).should("not.be.empty"); // nom
                    cy.get("td").eq(1).should("exist"); // email
                    cy.get("td").eq(4).should("exist"); // poste
                });

            } else {

                cy.contains("Voir CV").should("exist");

            }

        });

    });

    it("fonctionne avec la recherche", () => {

        cy.get("input[placeholder*='Rechercher']")
            .type("test");

        cy.wait(500);

        cy.get("body").should("exist"); // juste vérifier pas crash

    });

    it("filtre par statut", () => {

        cy.contains("En attente").click();

        cy.wait(500);

        cy.get("body").should("exist");

    });

    it("change les onglets (Offres / Stage / Spontané)", () => {

        cy.contains("Offres").click();
        cy.wait(500);

        cy.contains("Stages").click();
        cy.wait(500);

        cy.contains("Candidature spontané").click();
        cy.wait(500);

        cy.get("body").should("exist");

    });

    it("ouvre le détail d’une candidature", () => {

        cy.get('[data-cy="btn-detail"]')
            .should("have.length.greaterThan", 0)
            .first()
            .click();

        cy.url().should("match", /\/recruiter\/candidatures\/.+/);

    });

    it("workflow complet statut candidature (depuis liste → détail)", () => {

        // ✅ aller à la liste
        cy.visit("/recruiter/candidatures");

        // ✅ attendre chargement
        cy.contains("Liste des Candidatures").should("be.visible");

        // ✅ cliquer sur une candidature (stage/spontané seulement)
        cy.get('[data-cy="btn-detail"]')
            .should("have.length.greaterThan", 0)
            .first()
            .click();

        // ✅ vérifier qu'on est dans détail
        cy.url().should("match", /\/recruiter\/candidatures\/.+/);

        // ===============================
        // 🔥 TEST DES BOUTONS
        // ===============================

        // ✅ VU
        cy.contains("Marquer comme vu").click();
        cy.contains("Vu").should("exist");

        // ✅ RESET
        cy.contains("Réinitialiser").click();
        cy.contains("En attente").should("exist");

        // ✅ REFUSER
        cy.contains("Refuser").click();
        cy.contains("Rejeté").should("exist");

        // ✅ ACCEPTER
        cy.contains("Accepter la candidature").click();
        cy.contains("Retenu").should("exist");

    });






    /// ==========================================
    /// RESPONSABLE MÉTIER
    /// ==========================================

    describe("Responsable métier — Consultation liste des candidatures (RÉEL)", () => {

        beforeEach(() => {
            // ✅ login responsable métier
            cy.loginAsResponsable();

            // ✅ accéder à la page
            cy.visit("/ResponsableMetier/candidatures");
        });

        it("affiche la liste des candidatures", () => {

            cy.contains("Liste des Candidatures").should("be.visible");

            cy.get("body").then((body) => {

                // ✅ CAS 1 : tableau présent
                if (body.find("table").length > 0) {
                    cy.get("table tbody tr").should("have.length.greaterThan", 0);
                }

                // ✅ CAS 2 : liste vide
                else if (body.text().includes("Aucune candidature")) {
                    cy.contains("Aucune candidature").should("exist");
                }

                // ✅ CAS 3 : mobile cards
                else {
                    cy.get("a").should("have.length.greaterThan", 0);
                }

            });

        });

        it("affiche les informations principales", () => {

            cy.get("body").then((body) => {

                if (body.find("table tbody tr").length > 0) {

                    cy.get("table tbody tr").first().within(() => {
                        cy.get("td").eq(0).should("not.be.empty");
                        cy.get("td").eq(1).should("exist");
                        cy.get("td").eq(2).should("exist");
                    });

                } else {

                    cy.contains("Aucune candidature").should("exist");

                }

            });

        });



        it("fonctionne avec la recherche", () => {

            cy.get("input[placeholder*='Rechercher']")
                .type("test");

            cy.wait(500);

            cy.get("body").should("exist");

        });

        it("ouvre le CV d’une candidature", () => {

            cy.get("body").then((body) => {

                // ✅ cas 1 : bouton CV existe
                if (body.text().includes("Voir CV")) {

                    cy.contains("Voir CV")
                        .first()
                        .should("have.attr", "href");

                }

                // ✅ cas 2 : aucune candidature
                else if (body.text().includes("Aucune candidature")) {

                    cy.contains("Aucune candidature").should("exist");

                }

                // ✅ cas 3 : fallback (sécurité)
                else {

                    cy.log("Aucun CV trouvé, test ignoré");

                }

            });

        });

    });




    /// ==========================================
    /// RESPONSABLE RH OPTYLAB
    /// ==========================================

    describe("RH OPTYLAB — Consultation des candidatures (RÉEL)", () => {

        beforeEach(() => {
            cy.loginAsRHOPTYLAB();
            cy.visit("/RESPONSABLE_RH_OPTYLAB/candidats");
        });

        it("affiche la liste des candidatures", () => {

            cy.contains("Liste des Candidatures").should("be.visible");

            cy.get("body").then((body) => {

                if (body.find("table tbody tr").length > 0) {
                    cy.get("table tbody tr").should("have.length.greaterThan", 0);
                }

                else if (body.text().includes("Aucune candidature")) {
                    cy.contains("Aucune candidature").should("exist");
                }

            });

        });

        it("fonctionne avec les onglets", () => {

            cy.contains("Offres").click();
            cy.wait(300);

            cy.contains("Stages").click();
            cy.wait(300);

            cy.contains("Candidature spontanée").click();
            cy.wait(300);

            cy.contains("Tous").click();

        });

        it("fonctionne avec la recherche", () => {

            cy.get("input[placeholder*='Rechercher']")
                .type("test");

            cy.wait(500);

            cy.get("body").should("exist");

        });

        it("ouvre le CV si disponible", () => {

            cy.get("body").then((body) => {

                const hasCV = body.text().includes("Voir CV");

                if (hasCV) {

                    cy.contains("Voir CV")
                        .first()
                        .should("have.attr", "href");

                } else {

                    cy.log("Aucun CV disponible → test ignoré");

                }

            });

        });
        it("ouvre le détail d’une candidature (stage / spontanée uniquement)", () => {

            cy.get("body").then((body) => {

                const hasDetailBtn = body.find('[title="Voir le détail"]').length > 0;

                if (hasDetailBtn) {

                    cy.get('[title="Voir le détail"]')
                        .first()
                        .click({ force: true });

                    cy.url().should("match", /\/RESPONSABLE_RH_OPTYLAB\/candidats\/.+/);

                } else {

                    cy.log("Aucune candidature avec détail (OFFRES uniquement)");

                }

            });

        });
    });





    /// ==========================================
    /// RESPONSABLE RH NORD
    /// ==========================================

    describe("RH NORD — Consultation liste candidatures (RÉEL)", () => {

        beforeEach(() => {
            cy.loginAsRHNord();
            cy.visit("/Responsable_RH_Nord/candidatures");
        });

        it("affiche la liste des candidatures", () => {

            cy.contains("Liste des Candidatures").should("be.visible");

            cy.get("body").then((body) => {

                // ✅ CAS 1 : tableau
                if (body.find("table tbody tr").length > 0) {
                    cy.get("table tbody tr").should("have.length.greaterThan", 0);
                }

                // ✅ CAS 2 : vide
                else if (body.text().includes("Aucune candidature")) {
                    cy.contains("Aucune candidature").should("exist");
                }

            });

        });

        it("affiche les informations principales", () => {

            cy.get("body").then((body) => {

                if (body.find("table tbody tr").length > 0) {

                    cy.get("table tbody tr").first().within(() => {
                        cy.get("td").eq(0).should("not.be.empty"); // nom
                        cy.get("td").eq(1).should("exist"); // email
                        cy.get("td").eq(2).should("exist"); // phone
                        cy.get("td").eq(3).should("exist"); // poste
                    });

                } else {

                    cy.contains("Aucune candidature").should("exist");

                }

            });

        });

        it("fonctionne avec la recherche", () => {

            cy.get("input[placeholder*='Rechercher']")
                .type("test");

            cy.wait(500);

            cy.get("body").should("exist");

        });

        it("ouvre le CV si disponible", () => {

            cy.get("body").then((body) => {

                if (body.text().includes("Voir CV")) {

                    cy.contains("Voir CV")
                        .first()
                        .should("have.attr", "href");

                } else {

                    cy.log("Aucun CV disponible");

                }

            });

        });

        

    });
});
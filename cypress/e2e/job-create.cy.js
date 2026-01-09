describe("Gestion des offres - Création", () => {
    it("Créer une nouvelle offre", () => {
      cy.loginRecruiter();
      cy.visit("http://localhost:3000/recruiter/jobs");
  
      cy.contains("Nouvelle offre").click();
  
      cy.get('input').eq(0).type("Développeur Frontend");
      cy.get('textarea').type("Développement d’interfaces React.");
      cy.get('input').eq(1).type("React, Next.js");
      cy.get('input[type="date"]').type("2026-06-30");
  
      cy.contains("Enregistrer").click();
  
      // Vérifier que l’offre apparaît
      cy.contains("Développeur Frontend").should("be.visible");
    });
  });
  
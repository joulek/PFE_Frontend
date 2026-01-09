describe("Gestion des offres - Affichage", () => {
    it("Affiche la liste des offres", () => {
      cy.loginRecruiter();
  
      cy.visit("http://localhost:3000/recruiter/jobs");
  
      cy.contains("Offres d’emploi").should("be.visible");
  
      // Vérifier qu’au moins une carte offre existe
      cy.get("h3").should("exist");
    });
  });
  
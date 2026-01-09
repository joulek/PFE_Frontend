describe("Gestion des offres - Suppression", () => {
    it("Supprimer une offre", () => {
      cy.loginRecruiter();
      cy.visit("http://localhost:3000/recruiter/jobs");
  
      // Cliquer sur Supprimer de la carte
      cy.contains("Supprimer").first().click();
  
      // Vérifier que le modal est visible
      cy.contains("Supprimer l’offre").should("be.visible");
  
      // ✅ Cliquer sur le bouton Supprimer DU MODAL
      cy.get('[data-cy="confirm-delete"]').click();
  
      // Vérifier que le modal se ferme
      cy.contains("Supprimer l’offre").should("not.exist");
    });
  });
  
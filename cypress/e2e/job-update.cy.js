describe("Gestion des offres - Modification", () => {
    it("Modifier une offre existante", () => {
      cy.loginadmin();
      cy.visit("http://localhost:3000/admin/jobs");
  
      cy.contains("Modifier").first().click();
  
      cy.get('input').first().clear().type("Développeur Frontend Senior");
  
      cy.contains("Enregistrer").click();
  
      cy.contains("Développeur Frontend Senior").should("be.visible");
    });
  });
  
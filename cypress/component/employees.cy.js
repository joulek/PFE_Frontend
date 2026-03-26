import EmployeesPage from "../../src/app/employees/page";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

describe("EmployeesPage - Component", () => {

  beforeEach(() => {
    window.localStorage.setItem("token", "fake-token");
    window.localStorage.setItem(
      "user",
      JSON.stringify({ role: "ADMIN" })
    );
  });

  it("ouvre le modal d'ajout employé", () => {

    const mockRouter = {
      push: cy.stub(),
      replace: cy.stub(),
      refresh: cy.stub(),
      prefetch: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
    };

    cy.mount(
      <AppRouterContext.Provider value={mockRouter}>
        <EmployeesPage />
      </AppRouterContext.Provider>
    );

    cy.contains("Ajouter un employé").should("be.visible");
    cy.contains("Ajouter un employé").click();

    cy.contains("Complétez les informations de l'employé puis enregistrez.").should("be.visible");
  });

});
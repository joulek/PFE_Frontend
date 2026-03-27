// cypress/e2e/employees.cy.js

describe("Gestion des employés", () => {
  function makeEmployeeData() {
    const n = Date.now();

    return {
      cin: String(10000000 + (n % 89999999)).slice(0, 8),
      matricule: `EMP${n}`,
      fullName: `Test Employe Cypress ${n}`,
      agence: "Sfax",
      societe: "optylab",
      poste: "Développeur",
      contratSociete: "optylab",
      typeContrat: "CIVP",
      dateDebutContrat: "2024-01-01",
    };
  }

  function openCreateModal() {
    cy.contains("button", /ajouter un employé/i).should("be.visible").click();
    cy.contains("h3", "Ajouter un employé").should("be.visible");
    cy.get("#employee-form").should("be.visible");
  }

  function openEditModalFor(name) {
    cy.contains("table tbody tr", name).within(() => {
      cy.get('button[title="Modifier"]').click();
    });

    cy.contains("h3", "Modifier l'employé").should("be.visible");
    cy.get("#employee-form").should("be.visible");
  }

  function fillEmployeeForm(data) {
    cy.get("#employee-form").within(() => {
      cy.get('input[placeholder="Saisir n°cin"]')
        .should("be.visible")
        .clear()
        .type(data.cin);

      cy.get('input[placeholder="Saisir matricule"]')
        .should("be.visible")
        .clear()
        .type(data.matricule);

      cy.get('input[placeholder="Saisir nom & prénom"]')
        .should("be.visible")
        .clear()
        .type(data.fullName);

      cy.get("select").eq(0).select(data.agence);
      cy.get("select").eq(1).select(data.societe);

      cy.get('input[placeholder="Saisir poste"]')
        .should("be.visible")
        .clear()
        .type(data.poste);

      cy.get("select").eq(2).select(data.contratSociete);
      cy.get("select").eq(3).select(data.typeContrat);

      cy.get('input[type="date"]')
        .first()
        .should("be.visible")
        .clear()
        .type(data.dateDebutContrat);
    });
  }

  function updateEmployeeNameOnly(newName) {
    cy.get("#employee-form").within(() => {
      cy.get('input[placeholder="Saisir nom & prénom"]')
        .should("be.visible")
        .clear()
        .type(newName);
    });
  }

  function searchEmployee(term) {
    cy.get('input[placeholder*="Rechercher" i]')
      .filter(":visible")
      .first()
      .clear();

    if (term && term.trim()) {
      cy.get('input[placeholder*="Rechercher" i]')
        .filter(":visible")
        .first()
        .type(term)
        .type("{enter}");
    }
  }

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit("/employees");
    cy.contains("Liste des employés").should("be.visible");
  });

  it("Autoriser accès ADMIN", () => {
    cy.visit("/employees");
    cy.contains("Liste des employés").should("be.visible");
    cy.get("table").should("be.visible");
  });

  it("Autoriser accès ASSISTANTE RH", () => {
    cy.loginAsAssistanteRH();
    cy.visit("/employees");
    cy.contains("Liste des employés").should("be.visible");
    cy.get("table").should("be.visible");
  });

  it("Refuser accès si non connecté", () => {
    cy.clearAppSession();
    cy.visit("/employees");
    cy.url().should("include", "/login");
  });

  it("Refuser accès si rôle non autorisé", () => {
    cy.clearAppSession();

    cy.visit("/login");
    cy.window().then((win) => {
      win.localStorage.setItem("token", "fake-token");
      win.localStorage.setItem(
        "user",
        JSON.stringify({ role: "RECRUTEUR", email: "recruteur@test.com" })
      );
    });

    cy.visit("/employees");
    cy.url().should("include", "/login");
  });

  it("Afficher la liste des employés", () => {
    cy.get("table").should("be.visible");
    cy.contains("button", /ajouter un employé/i).should("be.visible");
    cy.get('input[placeholder*="Rechercher" i]').should("be.visible");
  });

  it("Afficher erreurs si formulaire vide", () => {
    openCreateModal();
    cy.contains("button", /^Enregistrer$/).click();
    cy.contains("obligatoire").should("be.visible");
  });

  it("Ajouter un employé", () => {
    const employee = makeEmployeeData();

    openCreateModal();
    fillEmployeeForm(employee);

    cy.contains("button", /^Enregistrer$/).click();

    cy.contains("Employé ajouté avec succès").should("be.visible");
    cy.wait(900);

    searchEmployee(employee.fullName);
    cy.contains("table tbody tr", employee.fullName).should("be.visible");
  });

  it("Modifier un employé", () => {
    const employee = makeEmployeeData();
    const updatedName = `${employee.fullName} Modifié`;

    openCreateModal();
    fillEmployeeForm(employee);
    cy.contains("button", /^Enregistrer$/).click();
    cy.contains("Employé ajouté avec succès").should("be.visible");
    cy.wait(900);

    searchEmployee(employee.fullName);
    openEditModalFor(employee.fullName);

    updateEmployeeNameOnly(updatedName);

    cy.contains("button", /^Enregistrer$/).click();

    cy.contains("Employé modifié avec succès").should("be.visible");
    cy.wait(900);

    searchEmployee(updatedName);
    cy.contains("table tbody tr", updatedName).should("be.visible");
  });

  it("Supprimer un employé", () => {
    const employee = makeEmployeeData();

    openCreateModal();
    fillEmployeeForm(employee);
    cy.contains("button", /^Enregistrer$/).click();
    cy.contains("Employé ajouté avec succès").should("be.visible");
    cy.wait(900);

    searchEmployee(employee.fullName);

    cy.contains("table tbody tr", employee.fullName).within(() => {
      cy.get('button[title="Supprimer"]').click();
    });

    cy.contains("h3", "Confirmer la suppression").should("be.visible");
    cy.contains("button", /^Supprimer$/).click();

    cy.wait(900);

    searchEmployee(employee.fullName);
    cy.contains(employee.fullName).should("not.exist");
  });
});
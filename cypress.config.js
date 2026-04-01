const { defineConfig } = require("cypress");
const jwt = require("jsonwebtoken");

module.exports = defineConfig({

  // ======================================================
  // ✅ CONFIG E2E
  // ======================================================
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.js",

    setupNodeEvents(on, config) {

      // 🔐 Génération token JWT pour login mock
      on("task", {
        generateToken({ role, email }) {
          const secret = config.env.JWT_SECRET;

          if (!secret) {
            throw new Error("JWT_SECRET manquant dans cypress.env.json !");
          }

          const token = jwt.sign(
            {
              id: 1,
              email,
              role,
              poste: "",
            },
            secret,
            { expiresIn: "5h" }
          );

          return token;
        },
      });

      return config;
    },
  },

  // ======================================================
  // ✅ CONFIG COMPONENT TESTING
  // ======================================================
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/component.js",
  },

});
const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/fileMock.cjs",
  },
  globals: {
    "ts-jest": {
      diagnostics: false,
      tsconfig: {
        verbatimModuleSyntax: false,
        moduleResolution: "node",
        jsx: "react-jsx",
        esModuleInterop: true,
        types: ["jest", "@testing-library/jest-dom", "node"],
      },
    },
  },
};
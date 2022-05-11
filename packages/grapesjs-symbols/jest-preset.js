/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = { 
  preset: 'jest',
  "extensionsToTreatAsEsm": [".js"],
  "globals": {
    "ts-jest": {
      "useESM": true
    }   
  },  
};


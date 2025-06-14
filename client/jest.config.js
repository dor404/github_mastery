module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@?react-d3-tree|d3-selection|d3-.*|uuid|react-markdown|devlop|micromark.*|decode-named-character-reference|character-entities|.+\\.mjs$)/)',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
}; 
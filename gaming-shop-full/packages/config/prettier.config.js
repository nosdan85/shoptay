/** @type {import('prettier').Config} */
const prettierConfig = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  quoteProps: 'as-needed',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Print width and tab settings
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,

  // Newlines
  endOfLine: 'lf',
  proseWrap: 'preserve',

  // HTML/JSX
  htmlWhitespaceSensitivity: 'css',
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // Markdown
  embeddedLanguageFormatting: 'auto',

  // File-level overrides
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2,
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};

module.exports = prettierConfig;

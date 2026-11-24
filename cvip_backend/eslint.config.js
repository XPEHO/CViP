import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import jsdoc from 'eslint-plugin-jsdoc'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**']),

  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      // Explicit: the editor opens the whole repository and several folders contain a tsconfig.
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  {
    files: ['**/*.ts'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: { FunctionDeclaration: true, ClassDeclaration: true },
          contexts: ['TSInterfaceDeclaration', 'VariableDeclarator > ArrowFunctionExpression'],
        },
      ],
      'jsdoc/require-description': ['error', { contexts: ['any'] }],
    },
  },

  {
    // Tests are exempt from the documentation rule.
    files: ['**/*.test.ts'],
    rules: { 'jsdoc/require-jsdoc': 'off', 'jsdoc/require-description': 'off' },
  },
])

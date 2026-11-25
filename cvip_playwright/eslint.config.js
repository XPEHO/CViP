import js from '@eslint/js'
import jsdoc from 'eslint-plugin-jsdoc'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['report/**', 'test-results/**']),

  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },

  js.configs.recommended,
  tseslint.configs.recommended,

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
      // Stable tests: wait for an observable state, never for the network or a fixed duration
      // (they fail on a loaded machine).
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='waitForLoadState'][arguments.0.value='networkidle']",
          message: '`networkidle` only waits for the network: wait for an assertion instead.',
        },
        {
          selector: "CallExpression[callee.property.name='waitForTimeout']",
          message:
            'No fixed pause: wait for an assertion or a response (`expect`, `waitForResponse`).',
        },
      ],
    },
  },

  {
    // Specs are exempt from the documentation rule.
    files: ['tests/**/*.spec.ts'],
    rules: { 'jsdoc/require-jsdoc': 'off', 'jsdoc/require-description': 'off' },
  },
])

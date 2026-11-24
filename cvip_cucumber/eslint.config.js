import js from '@eslint/js'
import jsdoc from 'eslint-plugin-jsdoc'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['report/**']),

  {
    files: ['**/*.{js,mjs,ts}'],
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
    },
  },
])

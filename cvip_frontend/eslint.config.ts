import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import jsdoc from 'eslint-plugin-jsdoc'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    name: 'app/parser-root',
    // Explicit: the editor opens the whole repository and several folders contain a tsconfig.
    languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
  },

  ...pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  {
    name: 'app/stricter-vue-rules',
    rules: {
      'vue/max-props': ['error', { maxProps: 10 }],
      'vue/max-template-depth': ['error', { maxDepth: 6 }],
      'vue/no-ref-object-reactivity-loss': 'error',
      'vue/no-unused-properties': 'error',
      'vue/no-unused-refs': 'error',
      'vue/require-typed-ref': 'error',
    },
  },

  {
    name: 'app/documentation',
    files: ['**/*.ts', '**/*.vue'],
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
    files: ['**/*.spec.ts'],
    rules: { 'jsdoc/require-jsdoc': 'off', 'jsdoc/require-description': 'off' },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/*.spec.ts'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)

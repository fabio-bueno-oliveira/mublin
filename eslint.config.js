import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import mantine from 'eslint-config-mantine'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      ...mantine, // inclui regras de react, hooks e jsx-a11y
      reactHooks.configs.flat.recommended, // exhaustive-deps e rules-of-hooks
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Reporta variáveis e imports não utilizados, incluindo os que começam
      // com maiúscula (componentes, constantes). Apenas o padrão _var é ignorado
      // para parâmetros intencionalmente não usados (ex: (_, index) => ...).
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Garante que useEffect, useCallback e useMemo declarem todas as dependências.
      // Era o causador dos cascading renders que corrigimos manualmente.
      'react-hooks/exhaustive-deps': 'warn',

      // Permite componentes sem prop-types (padrão razoável sem TypeScript)
      'react/prop-types': 'off',

      // Permite spreads em JSX (comum com props do Mantine como {...form.getInputProps()})
      'react/jsx-props-no-spreading': 'off',
    },
  },
])

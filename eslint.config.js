import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // SI-RAJU/ is a local reference checkout and retro-future/ a standalone demo:
  // neither is part of the SI-MAUNG app. supabase/functions is Deno TypeScript.
  // src/components/auth/RetroFutureAuth.* is an earlier, unused auth theme kept
  // as-is (it was uncommitted work in progress); the app uses AuthLayout.
  globalIgnores(['dist', 'SI-RAJU', 'retro-future', 'supabase', 'src/components/auth/RetroFutureAuth.jsx']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['vite.config.js', '**/*.test.js', 'scripts/**/*.{js,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
])

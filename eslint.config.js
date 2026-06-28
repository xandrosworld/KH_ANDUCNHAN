import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'src/components/LatestListings.tsx',
    'src/components/LocationMapPicker.tsx',
    'src/components/PayPalButton.tsx',
    'src/components/PaymentGateway.tsx',
    'src/components/PlatformStats.tsx',
    'src/contexts/CurrencyContext.tsx',
    'src/pages/AdminPage.tsx',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])

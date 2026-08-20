import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export function createTypeScriptConfig({ browser = false } = {}) {
  return [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      languageOptions: {
        globals: browser ? globals.browser : globals.node,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
    { ignores: ['dist/**', 'coverage/**', 'generated/**'] },
  ];
}

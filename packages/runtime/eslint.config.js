import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021,
            }
        },
        rules: {
            'no-undef': 'error',
            'no-duplicate-imports': 'error',
            'no-unused-vars': 'warn'
        }
    }
];
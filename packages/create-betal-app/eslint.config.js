import js from '@eslint/js';
import globals from 'globals';


export default [
    js.configs.recommended,
    {
        // templates/ ships as browser code copied verbatim into generated
        // projects — it's never run as part of this package, and its globals
        // (document, window, ...) differ from this CLI's own Node code.
        ignores: ['templates/**'],
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
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

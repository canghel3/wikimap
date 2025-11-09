import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
    {ignores: ['dist']},

    {
        // Target only the Vite configuration file
        files: ['vite.config.js'],
        languageOptions: {
            // Enable all Node.js global variables and scoping
            globals: globals.node,
            // Optional: Set ecmaVersion based on your Node version (e.g., 2022 for Node 18)
            ecmaVersion: 2022,
        },
        // Optional: You can explicitly set the 'node: true' environment as well
        env: {
          node: true,
        },
        // Alternative explicit fix if globals.node isn't sufficient:
        globals: {
          process: 'readonly'
        }
    },
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: {jsx: true},
                sourceType: 'module',
            },
        },
        settings: {react: {version: '18.3'}},
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            'react/jsx-no-target-blank': 'off',
            'react-refresh/only-export-components': [
                'warn',
                {allowConstantExport: true},
            ],
        },
    },
]

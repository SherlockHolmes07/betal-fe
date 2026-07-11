import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        reporters: 'verbose',
        // Plain Node environment (default) — this package does file-system
        // scaffolding and CLI logic, no DOM involved.
        testTimeout: 30000, // template smoke tests run real npm install/build
    },
})

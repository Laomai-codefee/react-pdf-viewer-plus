import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
    plugins: [
        dts({
            include: ['src/**/*'],
            exclude: ['**/*.stories.tsx', 'src/demo/**', 'public/**'],
            insertTypesEntry: true,
            rollupTypes: true
        })
    ],

    esbuild: {
        jsx: "automatic"
    },

    resolve: {
        alias: { '@': resolve(__dirname, 'src') }
    },

    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'PdfJsExtensionReact',
            formats: ['es', 'cjs'],
            fileName: (format) =>
                `index.${format === 'es' ? 'es' : 'cjs'}.js`
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM'
                }
            }
        },
        sourcemap: false,
        emptyOutDir: true,
        copyPublicDir: false
    }
})


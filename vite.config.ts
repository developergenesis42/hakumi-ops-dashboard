import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to disable preload directives in development
const disablePreloadPlugin = () => {
  return {
    name: 'disable-preload',
    transformIndexHtml(html: string) {
      // Remove preload directives that cause warnings in development
      return html.replace(/<link[^>]*rel="preload"[^>]*>/g, '')
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    }), 
    disablePreloadPlugin()
  ],
  esbuild: {
    define: {
      global: 'globalThis',
    },
    // Ignore TypeScript errors during build
    logLevel: 'error',
  },
  build: {
    minify: 'esbuild',
    // esbuild automatically removes console.log in production builds
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('@sentry')) {
              return 'monitoring-vendor';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            if (id.includes('tailwindcss')) {
              return 'css-vendor';
            }
            // Group other vendor libraries
            return 'vendor';
          }
          
          // Feature-based chunks for better caching
          if (id.includes('/src/components/auth/')) {
            return 'auth';
          }
          if (id.includes('/src/components/admin/')) {
            return 'admin';
          }
          if (id.includes('/src/services/')) {
            return 'services';
          }
          if (id.includes('/src/context/')) {
            return 'context';
          }
          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }
          if (id.includes('/src/utils/')) {
            return 'utils';
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk'
          return `assets/${facadeModuleId}-[hash].js`
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Optimize chunk size - reduced warning limit
    chunkSizeWarningLimit: 500,
    // Enable source maps in development
    sourcemap: process.env.NODE_ENV === 'development',
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'hoist-non-react-statics'
    ],
    exclude: [
      // Exclude large dependencies that should be lazy loaded
      'jspdf',
      'html2canvas',
      '@sentry/react',
      '@sentry/tracing'
    ],
    force: true
  },
  // Exclude Jest transform files from Vite processing
  resolve: {
    alias: {
      // Path aliases for absolute imports
      '@': '/src',
      '@/components': '/src/components',
      '@/context': '/src/context',
      '@/hooks': '/src/hooks',
      '@/services': '/src/services',
      '@/utils': '/src/utils',
      '@/types': '/src/types',
      '@/features': '/src/features',
      '@/shared': '/src/shared',
      '@/config': '/src/config',
      '@/lib': '/src/lib',
      '@/data': '/src/data',
      '@/constants': '/src/constants',
      // Exclude Jest transform files by pointing them to empty modules
      'jest-transform-import-meta': '/dev/null',
      'jest-transform-import-meta.cjs': '/dev/null',
    },
    dedupe: ['react', 'react-dom']
  },
  // Define global variables for CommonJS compatibility
  define: {
    global: 'globalThis',
    'process.env': 'import.meta.env',
  },
  // Add CommonJS support
  // Development server configuration
  server: {
    port: 3002,
    open: true,
    cors: true
  },
  // Preview server configuration
  preview: {
    port: 4173,
    open: true
  }
})
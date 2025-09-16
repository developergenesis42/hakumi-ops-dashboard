#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to process
const filesToProcess = [
  'src/context/AppContextRefactored.tsx',
  'src/features/roster/RosterHistory.tsx',
  'src/services/walkoutService.ts',
  'src/services/sessionService.ts',
  'src/services/dailyResetService.ts',
  'src/hooks/useDataLoading.ts',
  'src/lib/supabaseWithCSRF.ts'
];

// Console.log replacement patterns
const replacements = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.debug('
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn('
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error('
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info('
  }
];

function processFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Check if logger import exists
    const hasLoggerImport = content.includes("import { logger }");
    
    if (!hasLoggerImport && (content.includes('console.log') || content.includes('console.warn') || content.includes('console.error'))) {
      // Add logger import at the top
      const importMatch = content.match(/import.*from.*['"][^'"]+['"];?\s*\n/);
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;
        content = content.slice(0, insertIndex) + 
                 "import { logger } from '../utils/logger';\n" + 
                 content.slice(insertIndex);
        modified = true;
      }
    }

    // Replace console statements
    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Processed: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Process all files
console.log('🧹 Starting console.log cleanup...\n');

filesToProcess.forEach(processFile);

console.log('\n✨ Console.log cleanup completed!');

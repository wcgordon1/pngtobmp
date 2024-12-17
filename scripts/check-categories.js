import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

async function checkCategories() {
  const contentDir = 'src/content/converters';
  
  try {
    const files = await readdir(contentDir);
    
    console.log('\nChecking categories in all content files...\n');
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const filePath = join(contentDir, file);
      const content = await readFile(filePath, 'utf-8');
      const { data } = matter(content);
      
      if (!data.category) {
        console.log(`❌ Missing category in: ${file}`);
        continue;
      }
      
      console.log(`✅ ${file}\n   Category: ${data.category}`);
    }
    
    console.log('\nCategory check complete!\n');
  } catch (error) {
    console.error('Error checking categories:', error);
  }
}

checkCategories(); 
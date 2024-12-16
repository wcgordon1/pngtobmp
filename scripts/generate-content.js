import OpenAI from 'openai';
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const categories = [
  'embedded-systems',
  'printing',
  'retro-gaming',
  'medical-imaging'
];

const converterTypes = [
  {
    type: 'png-to-bmp',
    title: 'PNG to BMP Converter for',
    tag: 'png-to-bmp'
  },
  {
    type: 'bmp-to-png',
    title: 'BMP to PNG Converter for',
    tag: 'bmp-to-png'
  }
];

async function getExistingFiles() {
  try {
    const files = await fs.readdir('src/content/converters');
    return files;
  } catch {
    return [];
  }
}

async function validateAndFixFrontmatter(content, category, converterType) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return `---
title: '${converterType.title} ${category}'
description: 'Professional ${converterType.title} ${category}. Optimized for ${category} specific needs.'
category: '${category}'
pubDate: ${new Date().toISOString().split('T')[0]}
tags: ['${converterType.tag}', '${category}', 'conversion']
---

${content}`;
  }

  const updatedFrontmatter = {
    title: `${converterType.title} ${category}`,
    description: `Professional ${converterType.title} ${category}. Optimized for ${category} specific needs.`,
    category: category,
    pubDate: new Date().toISOString().split('T')[0],
    tags: [converterType.tag, category, 'conversion']
  };

  return `---
title: '${updatedFrontmatter.title}'
description: '${updatedFrontmatter.description}'
category: '${updatedFrontmatter.category}'
pubDate: ${updatedFrontmatter.pubDate}
tags: ${JSON.stringify(updatedFrontmatter.tags)}
---

${content.replace(frontmatterRegex, '')}`;
}

async function generateContent(category, converterType) {
  const prompt = `
    Create markdown content for a ${converterType.title} ${category} page.
    The content should include:
    1. A descriptive title specific to ${category}
    2. A detailed description for meta tags
    3. Relevant features for this specific use case
    4. Common use cases in the ${category} field
    5. Benefits specific to ${category} users
    6. Best practices for ${category} conversion

    The content should be professional and focused on the specific needs of ${category} users.
    Do not include frontmatter - it will be added automatically.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a technical writer creating content for image conversion software."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
  });

  const content = completion.choices[0].message.content;
  return validateAndFixFrontmatter(content, category, converterType);
}

async function getNextFileNumber(converterType) {
  const existingFiles = await getExistingFiles();
  const pattern = new RegExp(`^${converterType.type}-.*-(\\d+)\\.md$`);
  
  const numbers = existingFiles
    .map(file => {
      const match = file.match(pattern);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(num => !isNaN(num));

  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
}

async function main() {
  // Ensure the converters directory exists
  await fs.mkdir('src/content/converters', { recursive: true });

  for (const category of categories) {
    for (const converterType of converterTypes) {
      for (let i = 1; i <= 3; i++) {
        const nextNumber = await getNextFileNumber(converterType);
        const filename = `${converterType.type}-${category}-${nextNumber}.md`;
        const filePath = path.join('src/content/converters', filename);

        try {
          await fs.access(filePath);
          console.log(`Skipping existing file: ${filePath}`);
          continue;
        } catch {
          const content = await generateContent(category, converterType);
          await fs.writeFile(filePath, content, 'utf-8');
          console.log(`Generated: ${filePath}`);
        }
      }
    }
  }
}

main().catch(console.error); 
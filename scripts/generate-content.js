import OpenAI from 'openai';
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define specific use cases for each category
const categoryUseCases = {
  'gis-mapping': [
    { name: 'topographic-maps', title: 'Topographic Maps', displayCategory: 'GIS and Mapping' },
    { name: 'terrain-data', title: 'Terrain Data', displayCategory: 'GIS and Mapping' },
    { name: 'geological-surveys', title: 'Geological Surveys', displayCategory: 'GIS and Mapping' }
  ],
  'advertising-marketing': [
    { name: 'billboards', title: 'Billboards', displayCategory: 'Advertising and Marketing' },
    { name: 'brochures', title: 'Brochures', displayCategory: 'Advertising and Marketing' },
    { name: 'digital-ads', title: 'Digital Ads', displayCategory: 'Advertising and Marketing' }
  ],
  'education-training': [
    { name: 'classroom-materials', title: 'Classroom Materials', displayCategory: 'Education and Training' },
    { name: 'training-modules', title: 'Training Modules', displayCategory: 'Education and Training' },
    { name: 'interactive-lessons', title: 'Interactive Lessons', displayCategory: 'Education and Training' }
  ],
  'manufacturing-engineering': [
    { name: 'product-blueprints', title: 'Product Blueprints', displayCategory: 'Manufacturing and Engineering' },
    { name: 'technical-diagrams', title: 'Technical Diagrams', displayCategory: 'Manufacturing and Engineering' },
    { name: 'assembly-guides', title: 'Assembly Guides', displayCategory: 'Manufacturing and Engineering' }
  ]
};

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

async function validateAndFixFrontmatter(content, category, useCase, converterType) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  const title = `${converterType.title} ${useCase.displayCategory}`;
  const description = `Professional ${converterType.title} ${useCase.displayCategory}. Optimized for ${useCase.displayCategory.toLowerCase()} workflows.`;
  
  const frontmatter = `---
title: '${title}'
description: '${description}'
category: '${category}'
pubDate: ${new Date().toISOString().split('T')[0]}
tags: ['${converterType.tag}', '${category}', 'conversion']
---

${match ? content.replace(frontmatterRegex, '') : content}`;

  return frontmatter;
}

async function generateContent(category, useCase, converterType) {
  const prompt = `
    Create markdown content for a ${converterType.title} ${useCase.displayCategory} ${useCase.title} page.
    This is specifically for ${useCase.title} in ${useCase.displayCategory} field.

    Begin with a short introduction to the ${useCase.title} in ${useCase.displayCategory}. Do not include markdown for h1, only include h2 -  h3 tags. 
    
    The content should include:
    1. Specific features for ${useCase.title} in ${useCase.displayCategory}
    2. Common use cases in ${useCase.title} workflows
    3. Benefits for ${useCase.displayCategory} ${useCase.title} users
    4. Best practices for ${useCase.title} conversion
    5. Technical considerations specific to ${useCase.title}

    Make the content unique and focused on this specific use case.
    Do not include frontmatter - it will be added automatically.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a technical writer creating content for specialized image conversion software."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
  });

  const content = completion.choices[0].message.content;
  return validateAndFixFrontmatter(content, category, useCase, converterType);
}

async function main() {
  await fs.mkdir('src/content/converters', { recursive: true });

  for (const [category, useCases] of Object.entries(categoryUseCases)) {
    for (const useCase of useCases) {
      for (const converterType of converterTypes) {
        const filename = `${converterType.type}-${category}-${useCase.name}.md`;
        const filePath = path.join('src/content/converters', filename);

        try {
          await fs.access(filePath);
          console.log(`Skipping existing file: ${filePath}`);
          continue;
        } catch {
          const content = await generateContent(category, useCase, converterType);
          await fs.writeFile(filePath, content, 'utf-8');
          console.log(`Generated: ${filePath}`);
        }
      }
    }
  }
}

main().catch(console.error); 
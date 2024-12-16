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
  'medical-imaging': [
    { name: 'diagnostic-imaging', title: 'Diagnostic Imaging' },
    { name: 'pathology-slides', title: 'Pathology Slides' },
    { name: 'radiology-scans', title: 'Radiology Scans' }
  ],
  'retro-gaming': [
    { name: 'sprite-sheets', title: 'Sprite Sheets' },
    { name: 'texture-maps', title: 'Texture Maps' },
    { name: 'game-assets', title: 'Game Assets' }
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
  
  const title = `${converterType.title} ${category} ${useCase.title}`;
  const description = `Professional ${converterType.title} ${category} ${useCase.title}. Optimized for ${category} ${useCase.title.toLowerCase()} workflows.`;
  
  const frontmatter = `---
title: '${title}'
description: '${description}'
category: '${category}'
pubDate: ${new Date().toISOString().split('T')[0]}
tags: ['${converterType.tag}', '${category}', '${useCase.name}', 'conversion']
---

${match ? content.replace(frontmatterRegex, '') : content}`;

  return frontmatter;
}

async function generateContent(category, useCase, converterType) {
  const prompt = `
    Create markdown content for a ${converterType.title} ${category} ${useCase.title} page.
    This is specifically for ${useCase.title} in the ${category} field.

    Begin with a short introduction to the ${useCase.title} in ${category}. Do not include markdown for h1, only include h2 -  h3 tags. 
    
    The content should include:
    1. Specific features for ${useCase.title} in ${category}
    2. Common use cases in ${useCase.title} workflows
    3. Benefits for ${category} ${useCase.title} users
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
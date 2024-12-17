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
  'robotics-automation': [
    { name: 'sensor-outputs', title: 'Sensor Outputs', displayCategory: 'Robotics and Automation' },
    { name: 'robot-navigation-maps', title: 'Robot Navigation Maps', displayCategory: 'Robotics and Automation' },
    { name: 'control-panel-graphics', title: 'Control Panel Graphics', displayCategory: 'Robotics and Automation' }
  ],
  'legal-compliance': [
    { name: 'court-diagrams', title: 'Court Diagrams', displayCategory: 'Legal and Compliance' },
    { name: 'evidence-photos', title: 'Evidence Photos', displayCategory: 'Legal and Compliance' },
    { name: 'document-annotations', title: 'Document Annotations', displayCategory: 'Legal and Compliance' }
  ],
  'environmental-monitoring': [
    { name: 'climate-maps', title: 'Climate Maps', displayCategory: 'Environmental Monitoring' },
    { name: 'pollution-analysis', title: 'Pollution Analysis', displayCategory: 'Environmental Monitoring' },
    { name: 'wildlife-tracking', title: 'Wildlife Tracking', displayCategory: 'Environmental Monitoring' }
  ],
  'telecommunications': [
    { name: 'network-diagrams', title: 'Network Diagrams', displayCategory: 'Telecommunications' },
    { name: 'signal-maps', title: 'Signal Maps', displayCategory: 'Telecommunications' },
    { name: 'legacy-system-graphics', title: 'Legacy System Graphics', displayCategory: 'Telecommunications' }
  ],
  'medical-equipment-interfaces': [
    { name: 'ultrasound-screens', title: 'Ultrasound Screens', displayCategory: 'Medical Equipment Interfaces' },
    { name: 'mri-displays', title: 'MRI Displays', displayCategory: 'Medical Equipment Interfaces' },
    { name: 'patient-monitor-graphics', title: 'Patient Monitor Graphics', displayCategory: 'Medical Equipment Interfaces' }
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
  
  const title = `${converterType.title} ${useCase.displayCategory} ${useCase.title}`;
  const description = `Professional ${converterType.title} ${useCase.displayCategory} ${useCase.title}. Optimized for ${useCase.displayCategory} ${useCase.title.toLowerCase()} workflows.`;
  
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
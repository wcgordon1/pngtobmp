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
  'animation-graphics': [
    { name: 'animated-sprites', title: 'Animated Sprites', displayCategory: 'Animation and Motion Graphics' },
    { name: 'storyboards', title: 'Storyboards', displayCategory: 'Animation and Motion Graphics' },
    { name: 'frame-by-frame', title: 'Frame-by-Frame Graphics', displayCategory: 'Animation and Motion Graphics' }
  ],
  'vr-design': [
    { name: 'vr-textures', title: 'VR Textures', displayCategory: 'Virtual Reality Design' },
    { name: 'object-overlays', title: 'Object Overlays', displayCategory: 'Virtual Reality Design' },
    { name: 'interactive-ui', title: 'Interactive UI', displayCategory: 'Virtual Reality Design' }
  ],
  'drone-imaging': [
    { name: 'aerial-photos', title: 'Aerial Photos', displayCategory: 'Drone Imaging' },
    { name: 'mapping-overlays', title: 'Mapping Overlays', displayCategory: 'Drone Imaging' },
    { name: 'surveying-images', title: 'Surveying Images', displayCategory: 'Drone Imaging' }
  ],
  'fashion-textile': [
    { name: 'fabric-patterns', title: 'Fabric Patterns', displayCategory: 'Fashion and Textile Design' },
    { name: 'embroidery-designs', title: 'Embroidery Designs', displayCategory: 'Fashion and Textile Design' },
    { name: 'clothing-templates', title: 'Clothing Templates', displayCategory: 'Fashion and Textile Design' }
  ],
  'security-surveillance': [
    { name: 'camera-feeds', title: 'Camera Feeds', displayCategory: 'Security and Surveillance' },
    { name: 'facial-recognition', title: 'Facial Recognition', displayCategory: 'Security and Surveillance' },
    { name: 'motion-detection-images', title: 'Motion Detection Images', displayCategory: 'Security and Surveillance' }
  ],
  'scientific-research': [
    { name: 'microscopy-images', title: 'Microscopy Images', displayCategory: 'Scientific Research' },
    { name: 'data-visualizations', title: 'Data Visualizations', displayCategory: 'Scientific Research' },
    { name: 'satellite-images', title: 'Satellite Images', displayCategory: 'Scientific Research' }
  ],
  'automotive-design': [
    { name: 'car-blueprints', title: 'Car Blueprints', displayCategory: 'Automotive Design' },
    { name: 'vehicle-manuals', title: 'Vehicle Manuals', displayCategory: 'Automotive Design' },
    { name: 'engine-diagrams', title: 'Engine Diagrams', displayCategory: 'Automotive Design' }
  ],
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
tags: ['${converterType.tag}', '${category}', '${useCase.name}', 'conversion']
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
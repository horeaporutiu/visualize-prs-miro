#!/usr/bin/env node

// Analyzes the repo's src/ files, parses import relationships,
// and creates an architecture diagram on a Miro board via REST API.

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';

const MIRO_TOKEN = process.env.MIRO_API_TOKEN;
const BOARD_NAME = process.env.BOARD_NAME || 'Architecture Diagram';
const GITHUB_URL = process.env.GITHUB_URL || '';
const API = 'https://api.miro.com/v2';

if (!MIRO_TOKEN) {
  console.error('Error: MIRO_API_TOKEN environment variable is required');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${MIRO_TOKEN}`,
  'Content-Type': 'application/json',
};

async function miroPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Miro API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// Scan src/ directory and parse import relationships
async function analyzeCode() {
  const srcDir = join(process.cwd(), 'src');
  const files = (await readdir(srcDir)).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

  const modules = [];
  for (const file of files) {
    const content = await readFile(join(srcDir, file), 'utf-8');
    const name = basename(file, file.endsWith('.ts') ? '.ts' : '.js');

    // Extract local imports (from './...')
    const importRegex = /from\s+['"]\.\/(\w+)['"]/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Extract exported functions/classes
    const exportRegex = /export\s+(?:function|class|const|default)\s+(\w+)/g;
    const exports = [];
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    modules.push({ file, name, imports, exports, lineCount: content.split('\n').length });
  }

  return modules;
}

// Color palette for different module types
function getColor(name) {
  const colors = {
    server: '#a6ccf5',   // blue - entry point
    auth: '#f16c7f',     // red - security
    routes: '#93d275',   // green - routing
  };
  return colors[name] || '#fff9b1'; // yellow default
}

async function main() {
  console.log('Analyzing codebase...');
  const modules = await analyzeCode();
  console.log(`Found ${modules.length} modules:`, modules.map(m => m.name).join(', '));

  // Create the board
  console.log(`Creating Miro board: "${BOARD_NAME}"...`);
  const board = await miroPost('/boards', {
    name: BOARD_NAME,
    description: `Auto-generated architecture diagram${GITHUB_URL ? ` for ${GITHUB_URL}` : ''}`,
  });
  const boardId = board.id;
  const boardUrl = board.viewLink;
  console.log(`Board created: ${boardUrl}`);

  // Create a title shape
  await miroPost(`/boards/${boardId}/shapes`, {
    data: { content: `<strong>${BOARD_NAME}</strong>`, shape: 'round_rectangle' },
    style: {
      fillColor: '#1a1a1a',
      color: '#ffffff',
      fontSize: '24',
      textAlign: 'center',
      textAlignVertical: 'middle',
      borderOpacity: '0',
    },
    position: { x: 0, y: -250 },
    geometry: { width: 500, height: 70 },
  });

  // Add GitHub link if provided
  if (GITHUB_URL) {
    await miroPost(`/boards/${boardId}/shapes`, {
      data: { content: `<a href="${GITHUB_URL}">View Pull Request on GitHub</a>`, shape: 'round_rectangle' },
      style: {
        fillColor: '#f5f6f8',
        fontSize: '14',
        textAlign: 'center',
        textAlignVertical: 'middle',
        borderOpacity: '0',
      },
      position: { x: 0, y: -180 },
      geometry: { width: 500, height: 40 },
    });
  }

  // Layout: spread modules horizontally
  const spacing = 300;
  const startX = -((modules.length - 1) * spacing) / 2;

  const shapeIds = {};

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const x = startX + i * spacing;
    const y = 0;

    // Module box
    const shape = await miroPost(`/boards/${boardId}/shapes`, {
      data: {
        content: `<strong>${mod.file}</strong>`,
        shape: 'round_rectangle',
      },
      style: {
        fillColor: getColor(mod.name),
        fontSize: '18',
        textAlign: 'center',
        textAlignVertical: 'middle',
        borderColor: '#1a1a1a',
        borderWidth: '2',
        borderOpacity: '1',
      },
      position: { x, y },
      geometry: { width: 220, height: 60 },
    });
    shapeIds[mod.name] = shape.id;

    // Exports detail box below
    if (mod.exports.length > 0) {
      await miroPost(`/boards/${boardId}/shapes`, {
        data: {
          content: `<strong>Exports:</strong>\n${mod.exports.map(e => `• ${e}`).join('\n')}`,
          shape: 'round_rectangle',
        },
        style: {
          fillColor: '#f5f6f8',
          fontSize: '12',
          textAlign: 'left',
          textAlignVertical: 'top',
          borderColor: getColor(mod.name),
          borderWidth: '1',
          borderOpacity: '1',
        },
        position: { x, y: y + 90 },
        geometry: { width: 220, height: 30 + mod.exports.length * 22 },
      });
    }
  }

  // Create connectors for imports
  for (const mod of modules) {
    for (const imp of mod.imports) {
      if (shapeIds[mod.name] && shapeIds[imp]) {
        await miroPost(`/boards/${boardId}/connectors`, {
          startItem: { id: shapeIds[mod.name], snapTo: 'auto' },
          endItem: { id: shapeIds[imp], snapTo: 'auto' },
          shape: 'curved',
          captions: [{ content: `imports` }],
          style: {
            strokeColor: '#1a1a1a',
            strokeWidth: '2',
            endStrokeCap: 'stealth',
            startStrokeCap: 'none',
            fontSize: '12',
          },
        });
      }
    }
  }

  console.log('Architecture diagram created successfully!');
  console.log(`board_url=${boardUrl}`);

  // Output for GitHub Actions
  const ghOutput = process.env.GITHUB_OUTPUT;
  if (ghOutput) {
    const { appendFile } = await import('fs/promises');
    await appendFile(ghOutput, `board_url=${boardUrl}\n`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

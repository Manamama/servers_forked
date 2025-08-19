import { KnowledgeGraphManager } from './index.js';
import { promises as fs } from 'fs';
import path from 'path';

const testMemoryFile = path.join(process.cwd(), 'test_memory.json');
process.env.MEMORY_FILE_PATH = testMemoryFile;

async function runWriteTest() {
  console.log(`Starting write-only test. Creating file: ${testMemoryFile}`);
  const manager = new KnowledgeGraphManager(testMemoryFile);
  try {
    await fs.unlink(testMemoryFile).catch(err => { if (err.code !== 'ENOENT') throw err; });
    console.log("Testing createEntities (write operation)...");
    const entitiesToCreate = [
      { entityType: 'Software Project', name: 'Project Gemini', observations: ['A project to create a powerful command-line AI assistant.'] },
      { entityType: 'Software Component', name: 'CLI Agent', observations: ['The user-facing component of Project Gemini.'] }
    ];
    await manager.createEntities(entitiesToCreate as any);
    console.log("Write operation finished successfully.");
    const fileContent = await fs.readFile(testMemoryFile, 'utf-8');
    console.log("--- test_memory.json content ---");
    console.log(fileContent);
    console.log("---------------------------------");
  } catch (error) {
    console.error("Write test encountered an error:", error);
  }
}

runWriteTest();
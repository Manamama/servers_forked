import { test } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';

import { promises as fs } from 'fs'; // This is now the only instance
// Set environment variable BEFORE importing KnowledgeGraphManager
process.env.MEMORY_FILE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'test_memory.json');

import { KnowledgeGraphManager } from './dist/index.js'; // This is now the only instance

// Helper to clean up the test memory file
async function cleanup() {
    try {
        await fs.unlink(process.env.MEMORY_FILE_PATH);
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore file not found error
            throw error;
        }
    }
}

test('KnowledgeGraphManager handles concurrent operations without data loss', async (t) => {
    await cleanup(); // Start with a clean slate

    const manager = new KnowledgeGraphManager();

    const numOperations = 10;
    const promises = [];

    for (let i = 0; i < numOperations; i++) {
        promises.push(manager.createEntities([{ name: `entity_${i}`, entityType: 'test' }]));
    }

    // Wait for all operations to complete
    await Promise.all(promises);

    // Verify the final state of the graph
    const finalGraph = await manager.readGraph();

    deepStrictEqual(finalGraph.entities.length, numOperations, `Expected ${numOperations} entities, but got ${finalGraph.entities.length}`);

    // Verify that all entities are unique and correctly named
    const entityNames = new Set(finalGraph.entities.map(e => e.name));
    deepStrictEqual(entityNames.size, numOperations, `Expected ${numOperations} unique entity names, but got ${entityNames.size}`);

    for (let i = 0; i < numOperations; i++) {
        deepStrictEqual(entityNames.has(`entity_${i}`), true, `Expected entity_ ${i} to be present`);
    }

    // Test concurrent relations (optional, but good for thoroughness)
    const numRelations = 5;
    const relationPromises = [];
    for (let i = 0; i < numRelations; i++) {
        relationPromises.push(manager.createRelations([{ from: `entity_${i}`, to: `entity_${i + 1}`, relationType: `rel_${i}` }]));
    }
    await Promise.all(relationPromises);

    const graphWithRelations = await manager.readGraph();
    deepStrictEqual(graphWithRelations.relations.length, numRelations, `Expected ${numRelations} relations, but got ${graphWithRelations.relations.length}`);


    await cleanup(); // Clean up after test
});

test('KnowledgeGraphManager handles empty memory file gracefully', async (t) => {
    await cleanup(); // Ensure file does not exist

    const manager = new KnowledgeGraphManager();
    process.env.MEMORY_FILE_PATH = process.env.MEMORY_FILE_PATH; // Replaced TEST_MEMORY_FILE

    const graph = await manager.readGraph();
    deepStrictEqual(graph.entities.length, 0, 'Expected 0 entities for empty file');
    deepStrictEqual(graph.relations.length, 0, 'Expected 0 relations for empty file');

    await cleanup();
});

test('KnowledgeGraphManager handles corrupted JSON gracefully (simulated)', async (t) => {
    await cleanup();
    process.env.MEMORY_FILE_PATH = process.env.MEMORY_FILE_PATH; // Replaced TEST_MEMORY_FILE

    // Write corrupted JSON
    await fs.writeFile(process.env.MEMORY_FILE_PATH, '{"entities": [', 'utf-8'); // Replaced TEST_MEMORY_FILE

    const manager = new KnowledgeGraphManager();
    let errorThrown = false;
    try {
        await manager.readGraph();
    } catch (e) {
        errorThrown = true;
        // Expect a JSON parsing error
        deepStrictEqual(e instanceof Error, true, 'Expected an error to be thrown');
    }
    deepStrictEqual(errorThrown, true, 'Expected an error to be thrown for corrupted JSON');

    await cleanup();
});
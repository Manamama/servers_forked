#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import net from 'net';

// Define memory file path using environment variable with fallback
const defaultMemoryPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'memory.jsonl');

// If MEMORY_FILE_PATH is just a filename, put it in the same directory as the script
const MEMORY_FILE_PATH = process.env.MEMORY_FILE_PATH
  ? path.isAbsolute(process.env.MEMORY_FILE_PATH)
    ? process.env.MEMORY_FILE_PATH
    : path.join(path.dirname(fileURLToPath(import.meta.url)), process.env.MEMORY_FILE_PATH)
  : defaultMemoryPath;

// We are storing our memory using entities, relations, and observations in a graph structure
interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

interface Relation {
  from: string;
  to: string;
  relationType: string;
}

interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

// The KnowledgeGraphManager class contains all operations to interact with the knowledge graph
export class KnowledgeGraphManager { constructor(private memoryFilePath: string) { } 
  private fileOperationPromise = Promise.resolve();

  private async _executeWithLock<T>(operation: () => Promise<T>): Promise<T> {
    const previousPromise = this.fileOperationPromise;
    let release: () => void;
    this.fileOperationPromise = new Promise(r => { release = r; });

    await previousPromise;
    try {
      return await operation();
    } finally {
      release!();
    }
  }

  private async loadGraph(): Promise<KnowledgeGraph> {
    try {
        const data = await fs.readFile(MEMORY_FILE_PATH, "utf-8");
        // Handle empty file gracefully
        if (data.trim() === '') {
            return { entities: [], relations: [] };
        }
        const lines = data.split('\n').filter(line => line.trim() !== "");
        return lines.reduce((graph: KnowledgeGraph, line, index) => {
            try {
                const item = JSON.parse(line);
                if (item.type === "entity") graph.entities.push(item as Entity);
                if (item.type === "relation") graph.relations.push(item as Relation);
                return graph;
            } catch (e) {
                throw e; // Re-throw the error after logging
            }
        }, { entities: [], relations: [] });
    } catch (error) {
        if (error instanceof Error && 'code' in error && (error as any).code === "ENOENT") {
            return { entities: [], relations: [] };
        }
        throw error;
    }
  }

  private async saveGraph(graph: KnowledgeGraph): Promise<void> {
    const lines = [
      ...graph.entities.map(e => JSON.stringify({ 
        type: "entity", 
        name: e.name, 
        entityType: e.entityType, 
        observations: e.observations 
      })),
      ...graph.relations.map(r => JSON.stringify({ 
        type: "relation", 
        from: r.from, 
        to: r.to, 
        relationType: r.relationType 
      })),
    ];
    const fileContent = lines.join('\n') + '\n';
    await fs.writeFile(MEMORY_FILE_PATH, fileContent);
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    return this._executeWithLock(async () => {
      const graph = await this.loadGraph();
      const newEntities = entities.filter(e => !graph.entities.some(existingEntity => existingEntity.name === e.name));
      graph.entities.push(...newEntities);
      await this.saveGraph(graph);
      return newEntities;
    });
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    return this._executeWithLock(async () => {
      const graph = await this.loadGraph();
      const newRelations = relations.filter(r => !graph.relations.some(existingRelation => 
        existingRelation.from === r.from && 
        existingRelation.to === r.to && 
        existingRelation.relationType === r.relationType
      ));
      graph.relations.push(...newRelations);
      await this.saveGraph(graph);
      return newRelations;
    });
  }

  async addObservations(observations: { entityName: string; contents: string[] }[]): Promise<{ entityName: string; addedObservations: string[] }[]> {
    return this._executeWithLock(async () => {
      const graph = await this.loadGraph();
      const results = observations.map(o => {
        const entity = graph.entities.find(e => e.name === o.entityName);
        if (!entity) {
          throw new Error(`Entity with name ${o.entityName} not found`);
        }
        const newObservations = o.contents.filter(content => !entity.observations.includes(content));
        entity.observations.push(...newObservations);
        return { entityName: o.entityName, addedObservations: newObservations };
      });
      await this.saveGraph(graph);
      return results;
    });
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    return this._executeWithLock(async () => {
      const graph = await this.loadGraph();
      graph.entities = graph.entities.filter(e => !entityNames.includes(e.name));
      graph.relations = graph.relations.filter(r => !entityNames.includes(r.from) && !entityNames.includes(r.to));
      await this.saveGraph(graph);
    });
  }

  async deleteObservations(deletions: { entityName: string; observations: string[] }[]): Promise<void> {
    return this._executeWithLock(async () => {
      const graph = await this.loadGraph();
      deletions.forEach(d => {
        const entity = graph.entities.find(e => e.name === d.entityName);
        if (entity) {
          entity.observations = entity.observations.filter(o => !d.observations.includes(o));
        }
      });
      await this.saveGraph(graph);
    });
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    return this._executeWithLock(async () => {
      const graph = await this.loadGraph();
      graph.relations = graph.relations.filter(r => !relations.some(delRelation => 
        r.from === delRelation.from && 
        r.to === delRelation.to && 
        r.relationType === delRelation.relationType
      ));
      await this.saveGraph(graph);
    });
  }

  async readGraph(): Promise<KnowledgeGraph> {
    return this._executeWithLock(async () => {
      return this.loadGraph();
    });
  }

  // Very basic search function
  async searchNodes(query: string): Promise<KnowledgeGraph> {
    return this._executeWithLock(async () => {
      const graph = await this.loadGraph();
      
      // Filter entities
      const filteredEntities = graph.entities.filter(e => 
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.entityType.toLowerCase().includes(query.toLowerCase()) ||
        e.observations.some(o => o.toLowerCase().includes(query.toLowerCase()))
      );
    
      // Create a Set of filtered entity names for quick lookup
      const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
    
      // Filter relations to only include those between filtered entities
      const filteredRelations = graph.relations.filter(r => 
        filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
      );
    
      const filteredGraph: KnowledgeGraph = {
        entities: filteredEntities,
        relations: filteredRelations,
      };
    
      return filteredGraph;
    });
  }

  async openNodes(names: string[]): Promise<KnowledgeGraph> {
    return this._executeWithLock(async () => {
      const graph = await this.loadGraph();
      
      // Filter entities
      const filteredEntities = graph.entities.filter(e => names.includes(e.name));
    
      // Create a Set of filtered entity names for quick lookup
      const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
    
      // Filter relations to only include those between filtered entities
      const filteredRelations = graph.relations.filter(r => 
        filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
      );
    
      const filteredGraph: KnowledgeGraph = {
        entities: filteredEntities,
        relations: filteredRelations,
      };
    
      return filteredGraph;
    });
  }

  async visualizeGraph(): Promise<string> {
    return this._executeWithLock(async () => {
        const graph = await this.loadGraph();
        let mermaid = "graph TD\n";

        // Add entities
        graph.entities.forEach(entity => {
            const sanitizedName = entity.name.replace(/[^a-zA-Z0-9_]/g, "");
            mermaid += `    ${sanitizedName}["${entity.name}"]\n`;
        });

        // Add relations
        graph.relations.forEach(relation => {
            const sanitizedFrom = relation.from.replace(/[^a-zA-Z0-9_]/g, "");
            const sanitizedTo = relation.to.replace(/[^a-zA-Z0-9_]/g, "");
            const relationType = relation.relationType || "relates";
            mermaid += `    ${sanitizedFrom} -- ${relationType} --> ${sanitizedTo}\n`;
        });

        return mermaid;
    });
  }
}


const knowledgeGraphManager = new KnowledgeGraphManager(MEMORY_FILE_PATH);


// The server instance and tools exposed to Claude
const server = new Server({
  name: "memory-server",
  version: "0.6.4",
},    {
    capabilities: {
      tools: {},
    },
  });

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_entities",
        description: "Create multiple new entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            entities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "The name of the entity" },
                  entityType: { type: "string", description: "The type of the entity" },
                  observations: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "An array of observation contents associated with the entity"
                  },
                },
                required: ["name", "entityType", "observations"],
                additionalProperties: false,
              },
            },
          },
          required: ["entities"],
          additionalProperties: false,
        },
      },
      {
        name: "create_relations",
        description: "Create multiple new relations between entities in the knowledge graph. Relations should be in active voice",
        inputSchema: {
          type: "object",
          properties: {
            relations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string", description: "The name of the entity where the relation starts" },
                  to: { type: "string", description: "The name of the entity where the relation ends" },
                  relationType: { type: "string", description: "The type of the relation" },
                },
                required: ["from", "to", "relationType"],
                additionalProperties: false,
              },
            },
          },
          required: ["relations"],
          additionalProperties: false,
        },
      },
      {
        name: "add_observations",
        description: "Add new observations to existing entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            observations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entityName: { type: "string", description: "The name of the entity to add the observations to" },
                  contents: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "An array of observation contents to add"
                  },
                },
                required: ["entityName", "contents"],
                additionalProperties: false,
              },
            },
          },
          required: ["observations"],
          additionalProperties: false,
        },
      },
      {
        name: "delete_entities",
        description: "Delete multiple entities and their associated relations from the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            entityNames: { 
              type: "array", 
              items: { type: "string" },
              description: "An array of entity names to delete" 
            },
          },
          required: ["entityNames"],
          additionalProperties: false,
        },
      },
      {
        name: "delete_observations",
        description: "Delete specific observations from entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            deletions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entityName: { type: "string", description: "The name of the entity containing the observations" },
                  observations: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "An array of observations to delete"
                  },
                },
                required: ["entityName", "observations"],
                additionalProperties: false,
              },
            },
          },
          required: ["deletions"],
          additionalProperties: false,
        },
      },
      {
        name: "delete_relations",
        description: "Delete multiple relations from the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            relations: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  from: { type: "string", description: "The name of the entity where the relation starts" },
                  to: { type: "string", description: "The name of the entity where the relation ends" },
                  relationType: { type: "string", description: "The type of the relation" },
                },
                required: ["from", "to", "relationType"],
                additionalProperties: false,
              },
              description: "An array of relations to delete" 
            },
          },
          required: ["relations"],
          additionalProperties: false,
        },
      },
      {
        name: "read_graph",
        description: "Read the entire knowledge graph",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "search_nodes",
        description: "Search for nodes in the knowledge graph based on a query",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query to match against entity names, types, and observation content" },
          },
          required: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "open_nodes",
        description: "Open specific nodes in the knowledge graph by their names",
        inputSchema: {
          type: "object",
          properties: {
            names: {
              type: "array",
              items: { type: "string" },
              description: "An array of entity names to retrieve",
            },
          },
          required: ["names"],
          additionalProperties: false,
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "read_graph") {
    return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.readGraph(), null, 2) }] };
  }

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  switch (name) {
    case "create_entities":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.createEntities(args.entities as Entity[]), null, 2) }] };
    case "create_relations":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.createRelations(args.relations as Relation[]), null, 2) }] };
    case "add_observations":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.addObservations(args.observations as { entityName: string; contents: string[] }[]), null, 2) }] };
    case "delete_entities":
      await knowledgeGraphManager.deleteEntities(args.entityNames as string[]);
      return { content: [{ type: "text", text: "Entities deleted successfully" }] };
    case "delete_observations":
      await knowledgeGraphManager.deleteObservations(args.deletions as { entityName: string; observations: string[] }[]);
      return { content: [{ type: "text", text: "Observations deleted successfully" }] };
    case "delete_relations":
      await knowledgeGraphManager.deleteRelations(args.relations as Relation[]);
      return { content: [{ type: "text", text: "Relations deleted successfully" }] };
    case "search_nodes":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.searchNodes(args.query as string), null, 2) }] };
    case "open_nodes":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.openNodes(args.names as string[]), null, 2) }] };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

function startVisualizationServer(port: number) {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/') {
      try {
        const mermaidDiagram = await knowledgeGraphManager.visualizeGraph();
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Knowledge Graph</title>
              <meta http-equiv="refresh" content="5">
            </head>
            <body>
              <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
              <script>mermaid.initialize({startOnLoad:true});</script>
              <div class="mermaid">
                ${mermaidDiagram}
              </div>
            </body>
          </html>
        `;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error generating graph');
        console.error('Error in visualization server:', error);
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    console.error(`Visualization server running at http://localhost:${port}/");
  });
}

async function findFreePort(startPort: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', () => {
            resolve(findFreePort(startPort + 1));
        });
        server.listen(startPort, () => {
            const port = (server.address() as net.AddressInfo).port;
            server.close(() => {
                resolve(port);
            });
        });
    });
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Knowledge Graph MCP Server running on stdio");
  const port = await findFreePort(4000);
  startVisualizationServer(port);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
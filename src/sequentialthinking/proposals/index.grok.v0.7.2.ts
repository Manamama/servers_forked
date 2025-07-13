#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
}

class SequentialThinkingServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private disableThoughtLogging: boolean;

  constructor() {
    this.disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
  }

  private validateThoughtData(input: unknown): ThoughtData {
    const data = input as Record<string, unknown>;

    if (!data.thought || typeof data.thought !== 'string') {
      throw new Error('Invalid thought: must be a string');
    }
    if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number' || data.thoughtNumber < 1) {
      throw new Error('Invalid thoughtNumber: must be a positive number');
    }
    if (!data.totalThoughts || typeof data.totalThoughts !== 'number' || data.totalThoughts < 1) {
      throw new Error('Invalid totalThoughts: must be a positive number');
    }
    if (typeof data.nextThoughtNeeded !== 'boolean') {
      throw new Error('Invalid nextThoughtNeeded: must be a boolean');
    }
    if (data.isRevision && (typeof data.revisesThought !== 'number' || data.revisesThought < 1)) {
      throw new Error('Invalid revisesThought: must be a positive number when isRevision is true');
    }
    if (data.branchFromThought && !data.branchId) {
      throw new Error('Missing branchId: must provide branchId when branchFromThought is set');
    }

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      isRevision: data.isRevision as boolean | undefined,
      revisesThought: data.revisesThought as number | undefined,
      branchFromThought: data.branchFromThought as number | undefined,
      branchId: data.branchId as string | undefined,
      needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
    };
  }

  private formatThought(thoughtData: ThoughtData): string {
    const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } = thoughtData;

    let prefix = '';
    let context = '';

    if (isRevision) {
      prefix = chalk.yellow('🔄 Revision');
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      prefix = chalk.green('🌿 Branch');
      context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
    } else {
      prefix = chalk.blue('💭 Thought');
      context = '';
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const border = '─'.repeat(Math.max(header.length, thought.length) + 4);

    return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thought.padEnd(border.length - 2)} │
└${border}┘`;
  }

  public processThought(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const validatedInput = this.validateThoughtData(input);

      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }

      // Auto-generate branchId if branching is implied but not provided
      if (validatedInput.branchFromThought && !validatedInput.branchId) {
        validatedInput.branchId = `Branch_${validatedInput.branchFromThought}_${Date.now()}`;
        this.branches[validatedInput.branchId] = [];
      }

      // Suggest revision or branching based on thought content
      let suggestion = '';
      if (validatedInput.thought.includes('fail') || validatedInput.thought.includes('error')) {
        suggestion = `Consider revising thought ${validatedInput.thoughtNumber - 1} with isRevision: true, revisesThought: ${validatedInput.thoughtNumber - 1}`;
      } else if (validatedInput.thought.includes('try') || validatedInput.thought.includes('alternative')) {
        suggestion = `Consider branching from thought ${validatedInput.thoughtNumber} with branchFromThought: ${validatedInput.thoughtNumber}, branchId: "Alternative_${Date.now()}"`;
      }

      this.thoughtHistory.push(validatedInput);

      if (validatedInput.branchFromThought && validatedInput.branchId) {
        if (!this.branches[validatedInput.branchId]) {
          this.branches[validatedInput.branchId] = [];
        }
        this.branches[validatedInput.branchId].push(validatedInput);
      }

      if (!this.disableThoughtLogging) {
        const formattedThought = this.formatThought(validatedInput);
        console.error(formattedThought);
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtNumber: validatedInput.thoughtNumber,
            totalThoughts: validatedInput.totalThoughts,
            nextThoughtNeeded: validatedInput.nextThoughtNeeded,
            branches: Object.keys(this.branches),
            thoughtHistoryLength: this.thoughtHistory.length,
            suggestion: suggestion || undefined
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed',
            suggestion: 'Check input parameters: ensure thought is a string, thoughtNumber and totalThoughts are positive numbers, and branchId is provided if branchFromThought is set'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

const SEQUENTIAL_THINKING_TOOL: Tool = {
  name: "sequentialthinking",
  description: `A detailed tool for dynamic and reflective problem-solving through thoughts.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

When to use this tool:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

Key features:
- Adjust total_thoughts dynamically as you progress
- Question or revise previous thoughts using isRevision and revisesThought
- Branch into alternative approaches with branchFromThought and branchId
- Express uncertainty and explore alternative strategies
- Generate and verify solution hypotheses
- Maintain context through thoughtHistory
- Filter irrelevant information

Parameters explained:
- thought: Current thinking step (e.g., analytical step, revision, hypothesis)
- nextThoughtNeeded: True if more thinking is needed
- thoughtNumber: Current number in sequence (must be >= 1)
- totalThoughts: Estimated total thoughts needed (adjustable, must be >= 1)
- isRevision: Boolean indicating if this thought revises a previous one
- revisesThought: Thought number being reconsidered (required if isRevision is true)
- branchFromThought: Thought number from which a new branch starts
- branchId: Identifier for the branch (required if branchFromThought is set)
- needsMoreThoughts: Boolean indicating if more thoughts are needed

Usage guidelines:
1. Start with an initial estimate of totalThoughts
2. Use isRevision/revisesThought to refine failed or suboptimal thoughts
3. Use branchFromThought/branchId to explore alternative strategies
4. Adjust totalThoughts if the task scope changes
5. Express uncertainty and test multiple hypotheses when appropriate
6. Set nextThoughtNeeded to false only when a satisfactory solution is reached

Example API Calls:
- Linear thought:
  {
    "thought": "Start geolocation with Wolfram Alpha",
    "thoughtNumber": 1,
    "totalThoughts": 5,
    "nextThoughtNeeded": true
  }
- Revision:
  {
    "thought": "Revising failed Wolfram Alpha query",
    "thoughtNumber": 3,
    "totalThoughts": 10,
    "nextThoughtNeeded": true,
    "isRevision": true,
    "revisesThought": 1
  }
- Branching:
  {
    "thought": "Try Google Web Search for coordinates",
    "thoughtNumber": 4,
    "totalThoughts": 10,
    "nextThoughtNeeded": true,
    "branchFromThought": 3,
    "branchId": "GoogleSearchBranch"
  }
Expected Output:
  {
    "content": [{
      "type": "text",
      "text": "{\"thoughtNumber\":4,\"totalThoughts\":10,\"nextThoughtNeeded\":true,\"branches\":[\"GoogleSearchBranch\"],\"thoughtHistoryLength\":4,\"suggestion\":null}"
    }]
  }

Note: This tool is in beta (v0.2.0). Advanced features like revision and branching may require careful configuration.
Common Errors:
- "Invalid thoughtNumber: must be a positive number" - Ensure thoughtNumber is >= 1
- "Missing branchId: must provide branchId when branchFromThought is set" - Include branchId for branching
- "Invalid revisesThought: must be a positive number when isRevision is true" - Provide revisesThought when isRevision is true`,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step"
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed"
      },
      thoughtNumber: {
        type: "integer",
        description: "Current thought number",
        minimum: 1
      },
      totalThoughts: {
        type: "integer",
        description: "Estimated total thoughts needed",
        minimum: 1
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking"
      },
      revisesThought: {
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1
      },
      branchFromThought: {
        type: "integer",
        description: "Branching point thought number",
        minimum: 1
      },
      branchId: {
        type: "string",
        description: "Branch identifier"
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed"
      }
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
  }
};

const server = new Server(
  {
    name: "sequential-thinking-server",
    version: "0.7.2.grok-dev",
      source: "Grok AI",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const thinkingServer = new SequentialThinkingServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [SEQUENTIAL_THINKING_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "sequentialthinking") {
    return thinkingServer.processThought(request.params.arguments);
  }

  return {
    content: [{
      type: "text",
      text: `Unknown tool: ${request.params.name}`
    }],
    isError: true
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sequential Thinking MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});

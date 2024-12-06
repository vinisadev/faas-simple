import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

interface FunctionMetadata {
    name: string;
    language: string;
    filePath: string;
    entryPoint: string;
    timeout?: number;
}

interface FunctionRegistry {
    [key: string]: FunctionMetadata;
}

class FaaSServer {
    private registry: FunctionRegistry = {};
    private functionDir: string;
    private app: express.Application;
    private port: number;

    constructor(functionDir: string = './functions', port: number = 3000) {
        this.functionDir = functionDir;
        this.port = port;
        this.app = express();
        this.app.use(express.json());
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Register a new function
        this.app.post('/register', async (req, res) => {
            try {
                const { name, language, code, entryPoint } = req.body;
                const functionId = await this.registerFunction(name, language, code, entryPoint);
                res.json({ functionId, message: 'Function registered successfully' });
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                res.status(500).json({ error: errorMessage });
            }
        });

        // Execute a function
        this.app.post('/execute/:functionId', async (req, res) => {
            try {
                const result = await this.executeFunction(req.params.functionId, req.body);
                res.json({ result });
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                res.status(500).json({ error: errorMessage });
            }
        });

        // List all registered functions
        this.app.get('/functions', (req, res) => {
            res.json(this.registry);
        });
    }

    private async registerFunction(
        name: string,
        language: string,
        code: string,
        entryPoint: string
    ): Promise<string> {
        const functionId = uuidv4();
        const extension = this.getFileExtension(language);
        const fileName = `${functionId}${extension}`;
        const filePath = path.join(this.functionDir, fileName);

        // Create functions directory if it doesn't exist
        await fs.mkdir(this.functionDir, { recursive: true });

        // Write function code to file
        await fs.writeFile(filePath, code);

        // Store function metadata
        this.registry[functionId] = {
            name,
            language,
            filePath,
            entryPoint,
            timeout: 30000, // Default timeout: 30 seconds
        };

        return functionId;
    }

    private async executeFunction(functionId: string, input: any): Promise<any> {
        const metadata = this.registry[functionId];
        if (!metadata) {
            throw new Error('Function not found');
        }

        const command = this.buildExecutionCommand(metadata, input);
        
        try {
            const { stdout, stderr } = await execAsync(command, {
                timeout: metadata.timeout,
            });

            if (stderr) {
                throw new Error(stderr);
            }

            return JSON.parse(stdout);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Execution failed: ${errorMessage}`);
        }
    }

    private buildExecutionCommand(metadata: FunctionMetadata, input: any): string {
        const inputStr = JSON.stringify(input);
        
        switch (metadata.language.toLowerCase()) {
            case 'python':
                return `python ${metadata.filePath} '${inputStr}'`;
            case 'node':
            case 'javascript':
                return `node ${metadata.filePath} '${inputStr}'`;
            case 'ruby':
                return `ruby ${metadata.filePath} '${inputStr}'`;
            default:
                throw new Error(`Unsupported language: ${metadata.language}`);
        }
    }

    private getFileExtension(language: string): string {
        switch (language.toLowerCase()) {
            case 'python':
                return '.py';
            case 'node':
            case 'javascript':
                return '.js';
            case 'ruby':
                return '.rb';
            default:
                throw new Error(`Unsupported language: ${language}`);
        }
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`FaaS server running on port ${this.port}`);
        });
    }
}

export default FaaSServer;
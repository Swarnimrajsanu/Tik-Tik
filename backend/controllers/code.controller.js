import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Temporary directory for code execution
const TEMP_DIR = path.join(__dirname, '../temp');

// Ensure temp directory exists
async function ensureTempDir() {
    try {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating temp directory:', error);
    }
}

// Clean up temporary files
async function cleanup(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        // Ignore cleanup errors
    }
}

export const executeCode = async(req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Code and language are required'
            });
        }

        await ensureTempDir();

        let command;
        let fileName;
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);

        switch (language) {
            case 'python':
                fileName = `code_${timestamp}_${randomId}.py`;
                const pythonFile = path.join(TEMP_DIR, fileName);
                await fs.writeFile(pythonFile, code);
                command = `python3 "${pythonFile}"`;
                break;

            case 'java':
                fileName = `Main_${timestamp}_${randomId}.java`;
                const javaFile = path.join(TEMP_DIR, fileName);
                await fs.writeFile(javaFile, code);
                const className = 'Main';
                command = `cd "${TEMP_DIR}" && javac "${fileName}" && java ${className}`;
                break;

            case 'cpp':
                fileName = `code_${timestamp}_${randomId}.cpp`;
                const cppFile = path.join(TEMP_DIR, fileName);
                const cppExe = `code_${timestamp}_${randomId}`;
                await fs.writeFile(cppFile, code);
                command = `cd "${TEMP_DIR}" && g++ "${fileName}" -o "${cppExe}" && ./"${cppExe}"`;
                break;

            case 'c':
                fileName = `code_${timestamp}_${randomId}.c`;
                const cFile = path.join(TEMP_DIR, fileName);
                const cExe = `code_${timestamp}_${randomId}`;
                await fs.writeFile(cFile, code);
                command = `cd "${TEMP_DIR}" && gcc "${fileName}" -o "${cExe}" && ./"${cExe}"`;
                break;

            case 'go':
                fileName = `code_${timestamp}_${randomId}.go`;
                const goFile = path.join(TEMP_DIR, fileName);
                await fs.writeFile(goFile, code);
                command = `go run "${goFile}"`;
                break;

            case 'rust':
                fileName = `code_${timestamp}_${randomId}.rs`;
                const rustFile = path.join(TEMP_DIR, fileName);
                await fs.writeFile(rustFile, code);
                const rustExe = `code_${timestamp}_${randomId}`;
                command = `cd "${TEMP_DIR}" && rustc "${fileName}" -o "${rustExe}" && ./"${rustExe}"`;
                break;

            case 'php':
                fileName = `code_${timestamp}_${randomId}.php`;
                const phpFile = path.join(TEMP_DIR, fileName);
                await fs.writeFile(phpFile, code);
                command = `php "${phpFile}"`;
                break;

            case 'ruby':
                fileName = `code_${timestamp}_${randomId}.rb`;
                const rubyFile = path.join(TEMP_DIR, fileName);
                await fs.writeFile(rubyFile, code);
                command = `ruby "${rubyFile}"`;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: `Language ${language} is not supported for server-side execution`
                });
        }

        // Execute code with timeout (5 seconds)
        const timeout = 5000;
        const startTime = Date.now();

        try {
            const { stdout, stderr } = await Promise.race([
                execAsync(command, {
                    timeout,
                    maxBuffer: 1024 * 1024 // 1MB buffer
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Execution timeout')), timeout)
                )
            ]);

            // Cleanup
            const filePath = path.join(TEMP_DIR, fileName);
            await cleanup(filePath);

            // Cleanup executable files
            if (language === 'cpp' || language === 'c' || language === 'rust' || language === 'java') {
                const exePath = path.join(TEMP_DIR, fileName.replace(/\.(cpp|c|rs|java)$/, ''));
                try {
                    if (language === 'java') {
                        await cleanup(path.join(TEMP_DIR, fileName.replace('.java', '.class')));
                    } else {
                        await cleanup(exePath);
                    }
                } catch (e) {
                    // Ignore
                }
            }

            const executionTime = Date.now() - startTime;

            res.json({
                success: true,
                output: stdout || '',
                error: stderr || '',
                executionTime
            });
        } catch (error) {
            // Cleanup on error
            const filePath = path.join(TEMP_DIR, fileName);
            await cleanup(filePath);

            res.status(500).json({
                success: false,
                error: error.message || 'Execution failed',
                output: '',
                stderr: error.stderr || ''
            });
        }
    } catch (error) {
        console.error('Code execution error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};
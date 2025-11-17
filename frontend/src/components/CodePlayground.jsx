import React, { useEffect, useRef, useState } from 'react';
import axios from '../config/axios';

const CodePlayground = () => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState('');
    const codeEditorRef = useRef(null);

    const languages = [
        { value: 'javascript', label: 'JavaScript', icon: '📜' },
        { value: 'python', label: 'Python', icon: '🐍' },
        { value: 'java', label: 'Java', icon: '☕' },
        { value: 'cpp', label: 'C++', icon: '⚙️' },
        { value: 'c', label: 'C', icon: '🔧' },
        { value: 'typescript', label: 'TypeScript', icon: '📘' },
        { value: 'go', label: 'Go', icon: '🐹' },
        { value: 'rust', label: 'Rust', icon: '🦀' },
        { value: 'php', label: 'PHP', icon: '🐘' },
        { value: 'ruby', label: 'Ruby', icon: '💎' },
    ];

    const defaultCode = {
        javascript: `// JavaScript Example
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));
console.log("Sum:", 5 + 3);`,
        python: `# Python Example
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
print("Sum:", 5 + 3)`,
        java: `// Java Example
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Sum: " + (5 + 3));
    }
}`,
        cpp: `// C++ Example
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "Sum: " << (5 + 3) << endl;
    return 0;
}`,
        c: `// C Example
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    printf("Sum: %d\\n", 5 + 3);
    return 0;
}`,
        typescript: `// TypeScript Example
function greet(name: string): string {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));
console.log("Sum:", 5 + 3);`,
        go: `// Go Example
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    fmt.Println("Sum:", 5+3)
}`,
        rust: `// Rust Example
fn main() {
    println!("Hello, World!");
    println!("Sum: {}", 5 + 3);
}`,
        php: `<?php
// PHP Example
function greet($name) {
    return "Hello, $name!";
}

echo greet("World") . PHP_EOL;
echo "Sum: " . (5 + 3) . PHP_EOL;
?>`,
        ruby: `# Ruby Example
def greet(name)
    "Hello, #{name}!"
end

puts greet("World")
puts "Sum: #{5 + 3}"`,
    };

    useEffect(() => {
        if (code === '' && defaultCode[language]) {
            setCode(defaultCode[language]);
        }
    }, [language]);

    const highlightCode = (codeText, lang) => {
        try {
            if (window.hljs) {
                return window.hljs.highlight(codeText, { language: lang }).value;
            }
            return codeText;
        } catch (e) {
            return codeText;
        }
    };

    const executeCode = async () => {
        setIsRunning(true);
        setOutput('');
        setError('');

        try {
            // For JavaScript, execute directly in browser
            if (language === 'javascript' || language === 'typescript') {
                try {
                    const logs = [];
                    const originalLog = console.log;
                    const originalError = console.error;
                    
                    console.log = (...args) => {
                        logs.push(args.map(arg => 
                            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        ).join(' '));
                        originalLog(...args);
                    };
                    
                    console.error = (...args) => {
                        logs.push('ERROR: ' + args.map(arg => 
                            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        ).join(' '));
                        originalError(...args);
                    };

                    // Execute JavaScript code
                    if (language === 'typescript') {
                        // TypeScript would need compilation, but for demo we'll treat as JS
                        eval(code);
                    } else {
                        eval(code);
                    }

                    // Restore console
                    console.log = originalLog;
                    console.error = originalError;

                    setOutput(logs.join('\n') || 'Code executed successfully (no output)');
                } catch (err) {
                    setError(err.toString());
                }
            } else {
                // For other languages, use backend API
                try {
                    const response = await axios.post('/code/execute', {
                        code: code,
                        language: language
                    });

                    if (response.data.success) {
                        if (response.data.error) {
                            setError(response.data.error);
                        }
                        setOutput(response.data.output || 'Code executed successfully (no output)');
                        if (response.data.executionTime) {
                            setOutput(prev => prev + `\n\n⏱️ Execution time: ${response.data.executionTime}ms`);
                        }
                    } else {
                        setError(response.data.error || 'Execution failed');
                    }
                } catch (err) {
                    const errorMessage = err.response?.data?.error || err.message || 'Failed to execute code';
                    setError(errorMessage);
                    
                    // Show helpful message if backend is not available
                    if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
                        setError(errorMessage + '\n\n⚠️ Backend code execution service may not be available.\n' +
                            'Make sure the backend server is running and the /code/execute endpoint is configured.');
                    }
                }
            }
        } catch (err) {
            setError('Execution error: ' + err.toString());
        } finally {
            setIsRunning(false);
        }
    };

    const handleCodeChange = (e) => {
        const newCode = e.target.innerText;
        setCode(newCode);
    };

    const clearCode = () => {
        setCode('');
        setOutput('');
        setError('');
    };

    const loadTemplate = () => {
        if (defaultCode[language]) {
            setCode(defaultCode[language]);
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-gradient-to-br from-gray-50 to-white overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-3 shadow-lg flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <i className="ri-code-s-slash-line text-2xl"></i>
                        <h2 className="text-xl font-bold">Code Playground</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
                        >
                            {languages.map((lang) => (
                                <option key={lang.value} value={lang.value} className="text-gray-900">
                                    {lang.icon} {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Code Editor */}
                <div className="flex-1 flex flex-col border-b border-gray-200">
                    <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <i className="ri-file-code-line text-gray-600"></i>
                            <span className="text-sm font-medium text-gray-700">Code Editor</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={loadTemplate}
                                className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
                            >
                                <i className="ri-file-list-3-line mr-1"></i>
                                Template
                            </button>
                            <button
                                onClick={clearCode}
                                className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
                            >
                                <i className="ri-delete-bin-line mr-1"></i>
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-gray-900">
                        <pre className="h-full">
                            <code
                                ref={codeEditorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={handleCodeChange}
                                className="block h-full p-4 text-sm font-mono text-gray-100 outline-none whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{
                                    __html: highlightCode(code || defaultCode[language] || '', language)
                                }}
                                style={{
                                    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
                                }}
                            />
                        </pre>
                    </div>
                </div>

                {/* Output Area */}
                <div className="flex-1 flex flex-col border-t border-gray-200">
                    <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <i className="ri-terminal-line text-gray-600"></i>
                            <span className="text-sm font-medium text-gray-700">Output</span>
                        </div>
                        <button
                            onClick={executeCode}
                            disabled={isRunning}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                        >
                            {isRunning ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Running...
                                </>
                            ) : (
                                <>
                                    <i className="ri-play-fill"></i>
                                    Run Code
                                </>
                            )}
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto bg-gray-900 p-4">
                        {error && (
                            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-300 font-mono text-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <i className="ri-error-warning-line"></i>
                                    <span className="font-bold">Error:</span>
                                </div>
                                <pre className="whitespace-pre-wrap">{error}</pre>
                            </div>
                        )}
                        {output && (
                            <div className="text-green-400 font-mono text-sm">
                                <pre className="whitespace-pre-wrap">{output}</pre>
                            </div>
                        )}
                        {!output && !error && (
                            <div className="text-gray-500 text-sm italic">
                                Click "Run Code" to execute your {language} code...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodePlayground;


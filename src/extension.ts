import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('copyPasteFolderStructure');
    const defaultFormat = config.get<string>('defaultFormat') || 'Indented';

    let disposableCopy = vscode.commands.registerCommand('extension.copyFolderStructure', async (uri: vscode.Uri) => {
        const folderPath = uri.fsPath;
        const format = await vscode.window.showQuickPick(['Tree', 'Indented'], {
            placeHolder: 'Select the format to copy',
            canPickMany: false,
            ignoreFocusOut: true
        }) || defaultFormat;

        const structure = getFolderStructure(folderPath, '', format === 'Tree');
        await vscode.env.clipboard.writeText(structure);
        vscode.window.showInformationMessage('Folder structure copied to clipboard!');
    });

    let disposablePaste = vscode.commands.registerCommand('extension.pasteFolderStructure', async (uri: vscode.Uri) => {
        const targetFolderPath = uri.fsPath;
        const structure = await vscode.env.clipboard.readText();

        const format = determineFormat(structure);
        if (!format) {
            vscode.window.showErrorMessage('Clipboard does not contain a valid folder structure.');
            return;
        }

        if (isFolderStructure(structure, format === 'Tree')) {
            const existingFiles = fs.readdirSync(targetFolderPath);
            if (existingFiles.length > 0) {
                const response = await vscode.window.showWarningMessage(
                    'The target folder is not empty. Do you want to overwrite existing files?',
                    'Yes',
                    'No'
                );
                if (response !== 'Yes') {
                    return;
                }
            }
            createFolderStructure(targetFolderPath, structure, format === 'Tree');
            vscode.window.showInformationMessage('Folder structure created from clipboard!');
        } else {
            vscode.window.showErrorMessage('Clipboard does not contain a valid folder structure.');
        }
    });

    context.subscriptions.push(disposableCopy);
    context.subscriptions.push(disposablePaste);
}

function getFolderStructure(dir: string, indent: string, isTreeFormat: boolean): string {
    let structure = '';
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.lstatSync(fullPath);

        if (stat.isDirectory()) {
            structure += isTreeFormat ? `${indent}├── ${item}\n` : `${indent}${item}/\n`;
            structure += getFolderStructure(fullPath, indent + (isTreeFormat ? '│   ' : '  '), isTreeFormat);
        } else {
            structure += isTreeFormat ? `${indent}├── ${item}\n` : `${indent}${item}\n`;
        }
    });

    return structure;
}

function createFolderStructure(targetDir: string, structure: string, isTreeFormat: boolean) {
    const lines = structure.split('\n');
    const stack: string[] = [targetDir];

    lines.forEach(line => {
        const indentLevel = line.search(/[^│ ──]/);
        const name = line.replace(/^[├└─] /, '').trim();

        if (!name) return; // Skip empty lines

        while (stack.length > indentLevel + 1) {
            stack.pop();
        }

        const currentDir = stack[stack.length - 1];
        const newPath = path.join(currentDir, name);

        if (isTreeFormat && name.includes('── ')) {
            if (name.endsWith('/')) {
                fs.mkdirSync(newPath, { recursive: true });
                stack.push(newPath);
            } else {
                fs.closeSync(fs.openSync(newPath, 'w'));
            }
        } else {
            if (name.endsWith('/')) {
                fs.mkdirSync(newPath, { recursive: true });
                stack.push(newPath);
            } else {
                fs.closeSync(fs.openSync(newPath, 'w'));
            }
        }
    });
}

function determineFormat(structure: string): 'Tree' | 'Indented' | null {
    if (structure.includes('├── ') || structure.includes('└── ')) {
        return 'Tree';
    } else if (structure.includes('/')) {
        return 'Indented';
    }
    return null;
}

function isFolderStructure(structure: string, isTreeFormat: boolean): boolean {
    const lines = structure.split('\n');
    if (lines.length === 0) return false;

    return lines.every(line => {
        const trimmed = line.trim();
        if (isTreeFormat) {
            return trimmed === '' || trimmed.match(/^[├└─] /) || !trimmed.includes(' ');
        } else {
            return trimmed === '' || trimmed.endsWith('/') || !trimmed.includes(' ');
        }
    });
}

export function deactivate() {}

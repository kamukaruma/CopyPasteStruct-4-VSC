"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    let disposableCopy = vscode.commands.registerCommand('extension.copyFolderStructure', async (uri) => {
        const folderPath = uri.fsPath;
        const structure = getFolderStructure(folderPath, '');
        await vscode.env.clipboard.writeText(structure);
        vscode.window.showInformationMessage('Folder structure copied to clipboard!');
    });
    let disposablePaste = vscode.commands.registerCommand('extension.pasteFolderStructure', async (uri) => {
        const targetFolderPath = uri.fsPath;
        const structure = await vscode.env.clipboard.readText();
        if (isFolderStructure(structure)) {
            createFolderStructure(targetFolderPath, structure);
            vscode.window.showInformationMessage('Folder structure created from clipboard!');
        }
        else {
            vscode.window.showErrorMessage('Clipboard does not contain a valid folder structure.');
        }
    });
    context.subscriptions.push(disposableCopy);
    context.subscriptions.push(disposablePaste);
}
function getFolderStructure(dir, indent) {
    let structure = '';
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.lstatSync(fullPath);
        if (stat.isDirectory()) {
            structure += `${indent}${item}/\n`;
            structure += getFolderStructure(fullPath, indent + '  ');
        }
        else {
            structure += `${indent}${item}\n`;
        }
    });
    return structure;
}
function createFolderStructure(targetDir, structure) {
    const lines = structure.split('\n');
    const stack = [targetDir];
    lines.forEach(line => {
        const indentLevel = line.search(/\S/);
        const name = line.trim();
        while (stack.length > indentLevel + 1) {
            stack.pop();
        }
        const currentDir = stack[stack.length - 1];
        const newPath = path.join(currentDir, name);
        if (name.endsWith('/')) {
            fs.mkdirSync(newPath, { recursive: true });
            stack.push(newPath);
        }
        else if (name) {
            fs.closeSync(fs.openSync(newPath, 'w'));
        }
    });
}
function isFolderStructure(structure) {
    return structure.split('\n').every(line => line.trim() === '' || line.trim().endsWith('/') || !line.includes(' '));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map
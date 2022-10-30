import * as vscode from 'vscode';

import { getIndicesOf } from "./utils";

const STORAGE_PREFIX = "@storage_var\nfunc ";

export class StorageVariablesCairo implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;

    // will hold all TreeItems
    private data: TreeItem[];

    private lineNumberToItemMap: { [linenumber: number]: TreeItem; };


    // array with all the storage variable names
    private varNames: string[];

    constructor() {
        this.data = [];
        this.varNames = [];
        this.lineNumberToItemMap = {};
        this.reloadTreeViewData();
    }

    /**
     * Finds and returns the TreeItem corresponding to the first
     * variable name present on the currently selected line.
     * @returns the TreeItem
     */
    selectIfCursor(): TreeItem | undefined {
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }

        let selection = editor.selection;
        let lineNum = selection.start.line;

        return this.lineNumberToItemMap[lineNum];
    }

    /**
     * Reloads the treeView finding the storage variables
     * and their reads and writes.
     */
    reloadTreeViewData(): void {
        if (!vscode.window.activeTextEditor) {
            return;
        }

        let fileName = vscode.window.activeTextEditor.document.fileName;
        let isCairo = fileName.endsWith('.cairo');
        if (!isCairo) {
            return;
        }

        let doc = vscode.window.activeTextEditor.document;

        let docText = doc.getText();

        let storageVars = docText.split(STORAGE_PREFIX);
        storageVars.shift();

        this.data = [];
        this.lineNumberToItemMap = {};
        if (storageVars.length > 0) {
            for (const storageVar of storageVars) {
                let varName = storageVar.substring(0, storageVar.indexOf('('));
                let label = varName;

                let idx = docText.indexOf(STORAGE_PREFIX + varName);
                let position = doc.positionAt(idx);
                // create parent so that we can construct the children with parent
                let parent = new TreeItem(label, undefined, position.line + 1);
                parent.iconPath = new vscode.ThemeIcon('variable');

                let reads = this.getReads(doc, docText, varName, parent);
                let writes = this.getWrites(doc, docText, varName, parent);

                // assign the children
                parent.children = reads.concat(writes);
                this.data.push(parent);

                this.lineNumberToItemMap[position.line + 1] = parent;

                this.varNames.push(varName);
            }
        }
        this.refresh();
    }

    getWrites(doc: vscode.TextDocument, docText: string, varName: string, parent: TreeItem): TreeItem[] {
        let writes = [];
        let indices = getIndicesOf(varName + ".write(", docText);
        for (const idx of indices) {
            let position = doc.positionAt(idx);
            let item = new TreeItem("  🖋 " + doc.lineAt(position.line).text.trim(), undefined, position.line, parent);
            writes.push(item);
            this.lineNumberToItemMap[position.line] = item;
        }
        return writes;
    }

    getReads(doc: vscode.TextDocument, docText: string, varName: string, parent: TreeItem): TreeItem[] {
        let reads = [];
        let indices = getIndicesOf(varName + ".read(", docText);
        for (const idx of indices) {
            let position = doc.positionAt(idx);
            let item = new TreeItem("  📘 " + doc.lineAt(position.line).text.trim(), undefined, position.line, parent);
            reads.push(item);
            this.lineNumberToItemMap[position.line] = item;
        }
        return reads;
    }

    refresh(): void {
        this._onDidChangeTreeDataEmitter.fire();
    };

    getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    };

    getChildren(element?: TreeItem | undefined): vscode.ProviderResult<TreeItem[]> {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }

    getParent(element: TreeItem): vscode.ProviderResult<TreeItem> {
        return element.parent;
    }
}


export class TreeItem extends vscode.TreeItem {
    children: TreeItem[] | undefined;
    parent: TreeItem | undefined;

    constructor(label: string, children?: TreeItem[], lineNum?: number, parent?: TreeItem) {
        super(
            label,
            parent === undefined ? vscode.TreeItemCollapsibleState.Expanded :
                vscode.TreeItemCollapsibleState.None);

        this.children = children;

        if (lineNum === undefined) {
            return;
        }

        let command = {
            "title": "Select line",
            "command": "starknetExplorer.openFile",
            "arguments": [lineNum]
        };

        this.command = command;
        this.parent = parent;
    }
}
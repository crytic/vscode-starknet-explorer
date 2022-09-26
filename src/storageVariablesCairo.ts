import * as vscode from 'vscode';

const STORAGE_PREFIX = "@storage_var\nfunc ";

export class StorageVariablesCairo implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;

    // will hold all TreeItems
    private data: TreeItem[];

    // maps the variable name to its index on the this.data array
    private idxVarnameMap: { [varName: string]: number; };

    // array with all the storage variable names
    private varNames: string[];

    constructor() {
        this.data = [];
        this.varNames = [];
        this.idxVarnameMap = {};
        this.reloadTreeViewData();
    }

    /**
     * Checks if the line includes any of the variable names
     * @param line string corresponding to a line of code
     * @returns if it exists, returns the variable name included on the line,
     *          otherwise returns undefined
     */
    hasLineVarname(line: string): string | undefined {
        for (const varName of this.varNames) {
            if (line.includes(varName)) {
                return varName;
            }
        }
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
        let line = editor.document.lineAt(lineNum)!;
        let varName = this.hasLineVarname(line.text);

        if (varName !== undefined) {
            // get treeItem at the correct position
            return this.data[this.idxVarnameMap[varName]];
        }
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
        this.idxVarnameMap = {};
        if (storageVars.length > 0) {
            for (const storageVar of storageVars) {
                let varName = storageVar.substring(0, storageVar.indexOf('('));
                let label = "⚪ " + varName;

                let idx = docText.indexOf(STORAGE_PREFIX + varName);
                let position = doc.positionAt(idx);
                // create parent so that we can construct the children with parent
                let parent = new TreeItem(label, undefined, position.line + 1);

                let reads = this.getReads(doc, docText, varName, parent);
                let writes = this.getWrites(doc, docText, varName, parent);

                // assign the children
                parent.children = reads.concat(writes);
                this.data.push(parent);

                this.idxVarnameMap[varName] = this.data.length - 1;
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
            writes.push(new TreeItem("\t🖋 " + doc.lineAt(position.line).text, undefined, position.line, parent));
        }
        return writes;
    }

    getReads(doc: vscode.TextDocument, docText: string, varName: string, parent: TreeItem): TreeItem[] {
        let reads = [];
        let indices = getIndicesOf(varName + ".read(", docText);
        for (const idx of indices) {
            let position = doc.positionAt(idx);
            reads.push(new TreeItem("\t📘 " + doc.lineAt(position.line).text, undefined, position.line, parent));
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

function getIndicesOf(searchStr: string, str: string): number[] {
    var searchStrLen = searchStr.length;
    if (searchStrLen === 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
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
            "command": "cairostorageviewer.openFile",
            "arguments": [lineNum]
        };

        this.command = command;
        this.parent = parent;
    }
}
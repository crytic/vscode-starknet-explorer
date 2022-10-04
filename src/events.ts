import * as vscode from 'vscode';
import { getIndicesOf } from "./utils";

const EVENT_PREFIX = "@event\nfunc ";

export class EventCairo implements vscode.TreeDataProvider<TreeItem> {
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

        let eventNames = docText.split(EVENT_PREFIX);
        eventNames.shift();

        this.data = [];
        this.lineNumberToItemMap = {};
        if (eventNames.length > 0) {
            for (const eventName of eventNames) {
                let varName = eventName.substring(0, eventName.indexOf('('));
                let label = "💡 " + varName;

                let idx = docText.indexOf(EVENT_PREFIX + varName);
                let position = doc.positionAt(idx);
                // create parent so that we can construct the children with parent
                let parent = new TreeItem(label, undefined, position.line + 1);

                let emits = this.getEmits(doc, docText, varName, parent);

                // assign the children
                parent.children = emits;
                this.data.push(parent);

                this.lineNumberToItemMap[position.line + 1] = parent;
                this.varNames.push(varName);
            }
        }
        this.refresh();
    }


    getEmits(doc: vscode.TextDocument, docText: string, varName: string, parent: TreeItem): TreeItem[] {
        let emits = [];
        let indices = getIndicesOf(varName + ".emit(", docText);
        for (const idx of indices) {
            let position = doc.positionAt(idx);
            let item = new TreeItem("  🚨 " + doc.lineAt(position.line).text.trim(), undefined, position.line, parent);
            emits.push(item);
            this.lineNumberToItemMap[position.line] = item;
        }
        return emits;
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
            "command": "cairoexplorer.openFile",
            "arguments": [lineNum]
        };

        this.command = command;
        this.parent = parent;
    }
}
import * as vscode from 'vscode';
import { MinNoNegative } from "./utils";

const EXTERNAL_PREFIX = "@external\nfunc ";
const VIEW_PREFIX = "@view\nfunc ";

export class ExternalFunctions implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;

    // will hold all TreeItems
    private data: TreeItem[];

    private lineNumberToItemMap: { [linenumber: number]: TreeItem; };

    // array with all the storage variable names
    private externalFunctionNames: string[];

    constructor() {
        this.data = [];
        this.externalFunctionNames = [];
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
        let line = editor.document.lineAt(lineNum)!;

        let item = this.lineNumberToItemMap[line.lineNumber];
        return item;
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

        let externalFunctions = docText.split(EXTERNAL_PREFIX);
        externalFunctions.shift();

        this.data = [];
        this.lineNumberToItemMap = {};

        if (externalFunctions.length > 0) {
            for (const extFunc of externalFunctions) {
                let separatorIdx = Math.min(extFunc.indexOf('{'), extFunc.indexOf('('));
                let varName = extFunc.substring(0, separatorIdx);
                let label = "🅧 " + varName;

                let idx = docText.indexOf(EXTERNAL_PREFIX + varName);
                let position = doc.positionAt(idx);

                let parent = new TreeItem(label, position.line + 1);
                this.data.push(parent);

                this.lineNumberToItemMap[position.line + 1] = parent;

                this.externalFunctionNames.push(varName);
            }
        }

        let viewFunctions = docText.split(VIEW_PREFIX);
        viewFunctions.shift();

        if (viewFunctions.length > 0) {
            for (const viewFunc of viewFunctions) {
                let separatorIdx = MinNoNegative(viewFunc.indexOf('{'), viewFunc.indexOf('('));
                let varName = viewFunc.substring(0, separatorIdx);
                let label = "👁 " + varName;

                let idx = docText.indexOf(VIEW_PREFIX + varName);
                let position = doc.positionAt(idx);

                let parent = new TreeItem(label, position.line + 1);
                this.data.push(parent);

                this.lineNumberToItemMap[position.line + 1] = parent;

                this.externalFunctionNames.push(varName);
            }
        }
        this.refresh();
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
        // return undefined because we only have a flat list of items
        return undefined;
    }

}

export class TreeItem extends vscode.TreeItem {
    children: TreeItem[] | undefined;
    parent: TreeItem | undefined;

    constructor(label: string, lineNum: number, children?: TreeItem[]) {
        super(label, vscode.TreeItemCollapsibleState.None);

        this.children = children;

        let command = {
            "title": "Select line",
            "command": "cairoexplorer.openFile",
            "arguments": [lineNum]
        };

        this.command = command;
    }
}
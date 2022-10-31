import * as vscode from 'vscode';
import { minNoNegative } from "./utils";

const EXTERNAL_PREFIX = "@external";
const VIEW_PREFIX = "@view";
const L1_HANDLER = "@l1_handler";

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
                let declaration = extFunc.substring(extFunc.indexOf("func ") + 5);
                let separatorIdx = Math.min(declaration.indexOf('{'), declaration.indexOf('('));
                let varName = declaration.substring(0, separatorIdx);
                let label = "🅧 " + varName;

                let idx = docText.indexOf(declaration);
                let position = doc.positionAt(idx);

                let parent = new TreeItem(label, position.line);
                this.data.push(parent);

                this.lineNumberToItemMap[position.line] = parent;

                this.externalFunctionNames.push(varName);
            }
        }

        let viewFunctions = docText.split(VIEW_PREFIX);
        viewFunctions.shift();

        if (viewFunctions.length > 0) {
            for (const viewFunc of viewFunctions) {
                let declaration = viewFunc.substring(viewFunc.indexOf("func ") + 5);

                let separatorIdx = minNoNegative(declaration.indexOf('{'), declaration.indexOf('('));
                let varName = declaration.substring(0, separatorIdx);
                let label = "👁 " + varName;

                let idx = docText.indexOf(declaration);
                let position = doc.positionAt(idx);

                let parent = new TreeItem(label, position.line);
                this.data.push(parent);

                this.lineNumberToItemMap[position.line] = parent;

                this.externalFunctionNames.push(varName);
            }
        }


        let l1Handlers = docText.split(L1_HANDLER);
        l1Handlers.shift();

        if (l1Handlers.length > 0) {
            for (const l1Handler of l1Handlers) {
                let declaration = l1Handler.substring(l1Handler.indexOf("func ") + 5);

                let separatorIdx = minNoNegative(declaration.indexOf('{'), declaration.indexOf('('));
                let varName = declaration.substring(0, separatorIdx);
                let label = "L₁ " + varName;

                let idx = docText.indexOf(declaration);
                let position = doc.positionAt(idx);

                let parent = new TreeItem(label, position.line);
                this.data.push(parent);

                this.lineNumberToItemMap[position.line] = parent;

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
            "command": "starknetExplorer.openFile",
            "arguments": [lineNum]
        };

        this.command = command;
    }
}
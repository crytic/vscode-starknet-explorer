import * as vscode from 'vscode';
import { StorageVariablesCairo } from './storageVariablesCairo';
import { ExternalFunctions } from './externalFunctions';
import { EventCairo } from './events';

let storageVariablesTreeData = new StorageVariablesCairo();
let externalFunctionsTreeData = new ExternalFunctions();
let eventFunctionsTreeData = new EventCairo();

var storageTreeView: vscode.TreeView<vscode.TreeItem>;
var externalTreeView: vscode.TreeView<vscode.TreeItem>;
var eventTreeView: vscode.TreeView<vscode.TreeItem>;

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('cairoexplorer.openFile', (line: number) => {
		let activeEditor = vscode.window.activeTextEditor!;
		let range = activeEditor.document.lineAt(line).range;
		activeEditor.selection = new vscode.Selection(range.start, range.end);
		activeEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
	});

	vscode.window.registerTreeDataProvider('storage-variables', storageVariablesTreeData);
	vscode.window.registerTreeDataProvider('external-functions', externalFunctionsTreeData);
	vscode.window.registerTreeDataProvider('events', eventFunctionsTreeData);

	storageTreeView = vscode.window.createTreeView('storage-variables', { treeDataProvider: storageVariablesTreeData });
	externalTreeView = vscode.window.createTreeView('external-functions', { treeDataProvider: externalFunctionsTreeData });
	eventTreeView = vscode.window.createTreeView('events', { treeDataProvider: eventFunctionsTreeData });

	context.subscriptions.push(disposable);

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(reload));
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(selected));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(reload));

	// to check if the Cairo Storage tab is visible
	// storageTreeView.visible
}

/**
 * Reloads each tree view
 */
function reload() {
	storageVariablesTreeData.reloadTreeViewData();
	externalFunctionsTreeData.reloadTreeViewData();
	eventFunctionsTreeData.reloadTreeViewData();
}

/**
 * On a selection event, reveal the item in the tree view corresponding to where the cursor is.
 * @param e selection event
 */
function selected(e: vscode.TextEditorSelectionChangeEvent): void {
	// ignore if we were the ones triggering the selection with the reload range select
	if (e.kind === vscode.TextEditorSelectionChangeKind.Command) {
		return;
	}

	let treeItem = storageVariablesTreeData.selectIfCursor();
	if (treeItem) {
		storageTreeView.reveal(treeItem, { expand: true });
	}

	let externalFunctionItem = externalFunctionsTreeData.selectIfCursor();
	if (externalFunctionItem) {
		externalTreeView.reveal(externalFunctionItem, { expand: true });
	}

	let eventFunctionItem = eventFunctionsTreeData.selectIfCursor();
	if (eventFunctionItem) {
		eventTreeView.reveal(eventFunctionItem, { expand: true });
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

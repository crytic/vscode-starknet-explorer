// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StorageVariablesCairo } from './storageVariablesCairo';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let treeData = new StorageVariablesCairo();
var treeView: vscode.TreeView<vscode.TreeItem>;

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('cairostorageviewer.openFile', (line: number) => {
		let activeEditor = vscode.window.activeTextEditor!;
		let range = activeEditor.document.lineAt(line).range;
		activeEditor.selection = new vscode.Selection(range.start, range.end);
		activeEditor.revealRange(range);
	});

	vscode.window.registerTreeDataProvider('cairo-storage-view', treeData);
	treeView = vscode.window.createTreeView('cairo-storage-view', { treeDataProvider: treeData });

	context.subscriptions.push(disposable);
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(reload));
	vscode.window.onDidChangeTextEditorSelection(selected);

	// to check if the Cairo Storage tab is visible
	// treeView.visible

}

function reload() {
	treeData.reloadTreeViewData();
}

function selected(e: vscode.TextEditorSelectionChangeEvent) {
	// ignore if we were the ones triggering the selection with the reload range select
	if (e.kind === vscode.TextEditorSelectionChangeKind.Command) {
		return;
	}

	let treeItem = treeData.selectIfCursor();

	if (treeItem) {
		treeView.reveal(treeItem, { expand: true});
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

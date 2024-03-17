import { File } from 'buffer';
import * as vscode from 'vscode';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('antitest.checkantipatterns', async () => {
		
		vscode.window.showInformationMessage('Checking for common antipatterns.');
		let moo = require('moo');
		let moo_lexer = moo.compile({
			WS:      /[ \t]+/,
			comment: /\/\/.*?$/,
			number:  /0|[1-9][0-9]*/,
			string:  /"(?:\\["\\]|[^\n"\\])*"/,
			lparen:  '(',
			rparen:  ')',
			keyword: ['while', 'if', 'else', 'moo', 'cows'],
			NL:      { match: /\n/, lineBreaks: true },
		});

		var opPat = [
			// operators
			'(',')', '[', ']', '{', '}',
			',',':', '.', ';', '@', '->',
			'+=','-=', '*=', '/=', '//=', '%=', '@=',
			'&=','|=', '^=', '>>=', '<<=', '**=',
		  
			// delimiters
			'+','-', '**', '*', '//', '/', '%', // '@',
			'<<','>>', '<=', '>=', '==', '!=',
			'&','|', '^', '~',
			'<','>',
		  
			// another operator
			'=',
		  ];

		let cpp_lexer = moo.compile({
			WS:      /[ \t]+/,
			lbracket: '{',
			rbracket: '}',
			endLine: ';',
			keyword: ['int', 'return'],
			class: /class\s+[A-Za-z_]\w*/,
			func: /[A-Za-z]\w*\([\w\s,]*\)/,
			NL:      { match: /[\n\r]/, lineBreaks: true },
			STRING: /[\w]+/,
			op: opPat,
			myError: moo.error,
		});
			

		// let my_lexer = moo.compile({
		// 	endL: ';',
		// 	ws: /\s/,
		// 	lbracket: '{',
		// 	rbracket: '}',
		// 	other: /w*/,
		// 	keyword: ['class'],
		// 	myError: moo.error,
		// });

		// let my_other_lexer = moo.compile({
		// 	keyword: ['class'],
		// 	WS:      /[ \t]+/,
		// 	comment: /\/\/.*?$/,
		// 	number:  /0|[1-9][0-9]*/,
		// 	string:  /"(?:\\["\\]|[^\n"\\])*"/,
		// 	lparen:  '(',
		// 	rparen:  ')',
		// 	NL:      { match: /\n/, lineBreaks: true },
		// });
		

		
		
		// var pythonLexer = moo.compile({
		// 	Whitespace: /[ ]+/, // TODO tabs
		// 	NAME: /[A-Za-z_][A-Za-z0-9_]*/,
		// 	OP: opPat,
		// 	COMMENT: /#.*/,
		// 	NEWLINE: { match: /\r|\r\n|\n/, lineBreaks: true },
		// 	Continuation: /\\/,
		// 	ERRORTOKEN: {match: /[\$?`]/, error: true},
		// 	// TODO literals: str, long, float, imaginary
		// 	NUMBER: [
		// 	  /(?:[0-9]+(?:\.[0-9]+)?e-?[0-9]+)/, // 123[.123]e[-]123
		// 	  /(?:(?:0|[1-9][0-9]*)?\.[0-9]+)/,   // [123].123
		// 	  /(?:(?:0|[1-9][0-9]*)\.[0-9]*)/,    // 123.[123]
		// 	  /(?:0|[1-9][0-9]*)/,              // 123
		// 	],
		// 	STRING: [
		// 	  {match: /"""[^]*?"""/, lineBreaks: true, value: x => x.slice(3, -3)},
		// 	  {match: /"(?:\\["\\rn]|[^"\\\n])*?"/, value: x => x.slice(1, -1)},
		// 	  {match: /'(?:\\['\\rn]|[^'\\\n])*?'/, value: x => x.slice(1, -1)},
		// 	],
		//   });

		

		//identify a class
		//identify a function's parameters (and which function they belong to)
		//identify a function declaration (and which class it belongs to)
		//identify a function call (and which function it belongs to)
		//identify a line of code (and which function it belongs to)
		//identify and ignore comments, keywords, whitespace, etc.
		//identify conditional statements...

		//complicated conditional statements (we might look for if's, whiles, and fors and then just check their conditions)


		
		// const workspaceFolders = vscode.workspace.workspaceFolders;

        // if (workspaceFolders && workspaceFolders.length > 0) {
        //     const workspaceFolder = workspaceFolders[0].uri.fsPath;
        //     const files = await readFilesInDirectory(workspaceFolder);

        //     // Print file names
        //     files.forEach(file => {
        //         console.log(file); // or use vscode.window.showInformationMessage for UI messages
        //     });

        //     vscode.window.showInformationMessage(`Found ${files.length} files. Check the Debug Console for file names.`);
        // } else {
        //     vscode.window.showInformationMessage('No workspace folder is open.');
        // }

		// const folderUri = await vscode.window.showOpenDialog({
		// 	canSelectFolders: true,
		// 	canSelectFiles: false,
		// 	canSelectMany: false,
		// 	openLabel: 'Select Folder'
		// });

		const workspaceFolders = vscode.workspace.workspaceFolders;
	

		if (!workspaceFolders || workspaceFolders.length == 0){
			console.log('No workspace is selected');
			return;
		}
		
		if (workspaceFolders.length > 1){
			console.log('Too many workspaces selected...');
			return;
		}

		//get a file open

		const workspaceFolder = workspaceFolders[0].uri.fsPath;
		const files = await readFilesInDirectory(workspaceFolder);

		

		// Print file names
		files.forEach(file => {
			vscode.workspace.openTextDocument(file).then((document) => {
				let rawText = document.getText();
				cpp_lexer.reset(rawText);
				console.log(cpp_lexer);
				// lexer.next();
			});
			console.log(file); // or use vscode.window.showInformationMessage for UI messages
		});

		// if(!vscode.window.activeTextEditor){
		// 	console.log('There are no active domuments');
		// 	return;
		// }

		// let active_document = vscode.window.activeTextEditor.document.uri;

		// if(!(active_document.scheme === 'file')){
		// 	console.log('The active document is not a compatible');
		// 	return;
		// }

		// vscode.workspace.openTextDocument(active_document).then((document) => {
		// 	let rawText = document.getText();
		// 	console.log(document.lineCount);
		// 	console.log(rawText);
		// });
	});

	context.subscriptions.push(disposable);
}

async function readFilesInDirectory(dir: string): Promise<string[]> {
    let filesInDirectory = await readdir(dir, { withFileTypes: true });
    let files: string[] = [];

    for (const file of filesInDirectory) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            files = files.concat(await readFilesInDirectory(filePath));
        } else {
            // Optionally filter file types here (e.g., if you want only TypeScript files, check the file extension)
			// if(file.name.endsWith('.cpp') || file.name.endsWith('.c')){
			if(file.name.endsWith('.cpp')){
            	files.push(filePath);
			}
        }
    }

    return files;
}

// This method is called when your extension is deactivated
export function deactivate() {}

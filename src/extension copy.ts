import { File } from 'buffer';
import * as vscode from 'vscode';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';
// import {CppFunction} from "./CppFunction";
import {CppClass, CppFunction} from "./CppClass";

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
	

		if (!workspaceFolders || workspaceFolders.length === 0){
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

				var token = cpp_lexer.next();
				let fileTokens: Array<String>;

				//array of classes
				// var classes: Array<CppClass>;
				//array of func
				// var functions: Array<CppFunction>;

				//current class
				// var current_class: Array<String>;
				//current func
				// var current_func: Array<String>;

				var current_class = null;
				var current_func = null;
				let classes: CppClass[] = [];
				let funcs: CppFunction[] = [];
				let bracketSkips: number = 0;

				while(token){

					// console.log(token);
					//WS, NL, keyword, STRING, op -> ignore

					//if class -> switch current class
					//if } and current func != NULL -> close func
					//if } and current class != NULL -> close class
					//if func Is this a declaration or a call?
					//if next token is { then delcaration -> switch current func
					//if next token is ; then call -> add call to current func
					//if ; -> add line to current class and func

					/*
					class CppClass {
						name:string
						lines:int
						functions:CppFunction[]
					}

					class CppFunction{
						name:string
						lines:int
						class:CppClass
						calls:CppFunction[]
					}

					classes:CppClass[]
					funcs:CppFunction[]
					*/


					if (token.type === "class"){
						// console.log("Found class -> need to set current class to this one");
						// current_class = ;
						var name = token.value.split(" ").slice(-1); 
						current_class = new CppClass(name); //TODO this likely is wrong
						console.log("Created class: " + name);
						token = skipWhiteSpace(cpp_lexer);
						if (token.type !== "lbracket") {
							console.log("BAD NEWS BEARS NO LBRACKET AFTER CLASS")
						}
						
					}
					else if (token.type === "rbracket") {
						// console.log("found } -> need to end function or class");
						if (bracketSkips > 0) {
							bracketSkips = bracketSkips - 1;
						}
						else if (current_func !== null) {
							funcs = [...funcs, current_func];
							if (current_class !== null) {
								current_class.addFunc(current_func);
							}
							current_func = null;
						}
						else if (current_class !== null) {
							classes = [...classes, current_class];
							current_class = null;
						}
						else {
							console.log(token);
							console.log("Invalid Cpp me thinks");
						}
					}
					else if (token.type === "lbracket") {
						// console.log("found { -> nothing required this should only follow class");
						bracketSkips = bracketSkips + 1;
					}
					else if (token.type === "func") {
						// console.log("found func -> is this a call or a declaration");
						let temp = token;
						token = cpp_lexer.next();
						if (token.type === "lbracket"){
							// console.log("This is a function declaration -> switch active function");
							//TODO we need to get the correct name here
							current_func = new CppFunction(temp.value, current_class);
							console.log("Created function: " + temp.value);
						}
						else if (token.type === "endLine"){
							// console.log("; function call -> increment lines, and add call dependency");
							if (current_class === null){
								console.log("invalid cpp");
							}
							else{
								current_func!.addLines(1);
								current_func!.addFuncName(temp.value); //TODO this needs some work
								if (current_class !== null) {
									current_class.addLines(1);
								}
							}
						}
						else {
							console.log(token);
							console.log("should never be printed");
						}
					}
					else if (token.type === "endLine"){
						// console.log("; -> increment line on current class and func");
						if (current_class !== null) {
							current_class.addLines(1);
						}

						if (current_func !== null) {
							current_func.addLines(1);
						}
						
					}
					else{
						// console.log(token.type + " not parsed");
					}
					
					token = cpp_lexer.next();
				};
				god_class(classes, funcs);
				feature_envy(classes, funcs);
				duplicate_code(classes, funcs);
				refused_bequest(classes, funcs);
				divergent_change(classes, funcs);
				shotgun_surgery(classes, funcs);
				parallel_inheritance(classes, funcs);
				functional_decomposition(classes, funcs);
				spaghetti_code(classes, funcs);
				swiss_army_knife(classes, funcs);
				type_checking(classes, funcs);

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

 function skipWhiteSpace(cpp_lexer: any){
	var token = cpp_lexer.next();
	while (token.type === "WS") {
		token = cpp_lexer.next();
	}
	return token;
 }

 function god_class(classes: CppClass[], funcs:CppFunction[]){
	console.log()
 }

 function feature_envy(classes: CppClass[], funcs:CppFunction[]){
	
 }

 function duplicate_code(classes: CppClass[], funcs:CppFunction[]){
	
 }

 function refused_bequest(classes: CppClass[], funcs:CppFunction[]){
	
 }

 function divergent_change(classes: CppClass[], funcs:CppFunction[]){
	
 }

 function shotgun_surgery(classes: CppClass[], funcs:CppFunction[]){
	
 }

 function parallel_inheritance(classes: CppClass[], funcs:CppFunction[]){
	
 }

 function functional_decomposition(classes: CppClass[], funcs:CppFunction[]){
	
 }

 function spaghetti_code(classes: CppClass[], funcs:CppFunction[]){
	
 }

 function swiss_army_knife(classes: CppClass[], funcs:CppFunction[]){
	
 }

 function type_checking(classes: CppClass[], funcs:CppFunction[]){
	
 }

// This method is called when your extension is deactivated
export function deactivate() {}

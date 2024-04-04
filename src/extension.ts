import { File } from 'buffer';
import * as vscode from 'vscode';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';
// import {CppFunction} from "./CppFunction";
import {CppClass, CppFunction} from "./CppClass";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let disposable1 = vscode.commands.registerCommand('antitest.checkantipatterns', async () => {
		
		vscode.window.showInformationMessage('Checking for common antipatterns.');
		let moo = require('moo');
	
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

					if (token.type === "class"){
						// console.log("Found class -> need to set current class to this one");
						// current_class = ;
						var name = token.value.split(" ").slice(-1); 
						current_class = new CppClass(name); //TODO this likely is wrong
						console.log("Created class: " + name);
						token = skipWhiteSpace(cpp_lexer);
						if (token.type !== "lbracket") {
							console.log("BAD NEWS BEARS NO LBRACKET AFTER CLASS");
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

	});

	let disposable2 = vscode.commands.registerCommand('antitest.checkantipatterns2', async () => {
		
		vscode.window.showInformationMessage('Checking for common antipatterns.');
		let moo = require('moo');
	
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
			WS:      {match: /\s+/, lineBreaks: true},
			STRING: /"[^"]*"/,
			lbracket: '{',
			rbracket: '}',
			endLine: ';',
			includeStatement: /#include\s+<[A-Za-z]+>/,
			// scopeResolution: /[\w]+::[\w]+[\s]*\([\w]*\)/,  	// CLASS::METHOD()
			// scopeResolution2: /[\w]+::[\w]+/,  	// std::endl
			scopeResolution: /[\w]+::[\w]+(?:[\s]*\([\w]*\))?/,  	// CLASS::METHOD() and std::endl
			member: '.',
			keyword: ['int', 'return'],
			class: /class\s+[A-Za-z_]\w*/,
			func: /[A-Za-z]\w*\([\w\s,]*\)/,
			NL:      { match: /[\n\r]/, lineBreaks: true },
			variable: /[\w]+/,
			op: opPat,
			myError: moo.error,
		});
			

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

				var current_class = null;
				var current_func = null;
				let classes: CppClass[] = [];
				let funcs: CppFunction[] = [];
				let bracketSkips: number = 0;

				while(token){
					// console.log(token);

					if (token.type === "class"){
						// console.log("Found class -> need to set current class to this one");
						// current_class = ;
						var name = token.value.split(" ").slice(-1); 
						current_class = new CppClass(name); //TODO this likely is wrong
						console.log("Created class: " + name);
						token = skipWhiteSpace(cpp_lexer);
						if (token.type !== "lbracket") {
							console.log("BAD NEWS BEARS NO LBRACKET AFTER CLASS");
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
							console.log("Func closed: " + current_func.name);
							current_func = null;
						}
						else if (current_class !== null) {
							classes = [...classes, current_class];
							console.log("Class closed: " + current_class.name);
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
						token = skipWhiteSpace(cpp_lexer); // changed to remove whitespace
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
						// else {
						// 	console.log(token);
						// 	console.log("should never be printed"); // can be hit such as on pow(2, i) << ... line 41 spaghetti.cpp
						// }
					}
					else if (token.type === "endLine"){
						// console.log("; -> increment line on current class and func");
						if (current_func !== null) {
							current_func.addLines(1);
						}

						if (current_class !== null) {
							current_class.addLines(1);
						}
					}
					else{
						// console.log(token.type + " not parsed");
					}
					
					token = skipWhiteSpace(cpp_lexer);
				};
				
				// god_class(classes, funcs);
				// feature_envy(classes, funcs);
				// duplicate_code(classes, funcs);
				// refused_bequest(classes, funcs);
				// divergent_change(classes, funcs);
				// shotgun_surgery(classes, funcs);
				// parallel_inheritance(classes, funcs);
				// functional_decomposition(classes, funcs);
				spaghetti_code(classes, funcs);
				// swiss_army_knife(classes, funcs);
				// type_checking(classes, funcs);

			});
			console.log(file); // or use vscode.window.showInformationMessage for UI messages
		});

	});

	context.subscriptions.push(disposable1);
	context.subscriptions.push(disposable2);
}

async function readFilesInDirectory(dir: string): Promise<string[]> {
    let filesInDirectory = await readdir(dir, { withFileTypes: true });
    let files: string[] = [];

    for (const file of filesInDirectory) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            files = files.concat(await readFilesInDirectory(filePath));
        } else {
			if(file.name.endsWith('spaghetti.cpp')){
				console.log(file.name);
            	files.push(filePath);
			}
        }
    }

    return files;
}

 function skipWhiteSpace(cpp_lexer: any){
	
	var token = cpp_lexer.next();
	if (token === undefined) {return null;}
	while (token.type === "WS") {
		token = cpp_lexer.next();
		if(token === undefined){return null;}
	}
	return token;
 }

 function god_class(classes: CppClass[], funcs:CppFunction[]){
	console.log("god class not implemented");
	//EASY - Routledge
 }

 function feature_envy(classes: CppClass[], funcs:CppFunction[]){
	console.log("feature envy class not implemented");
	//EASY - Routledge
 }

 function duplicate_code(classes: CppClass[], funcs:CppFunction[]){
	console.log("duplicate code class not implemented");
	//Doesn't use parser...
 }

 function refused_bequest(classes: CppClass[], funcs:CppFunction[]){
	console.log("refused bequest class not implemented");
	//Inheritance.. oof
 }

 function divergent_change(classes: CppClass[], funcs:CppFunction[]){
	console.log("diveregent change class not implemented");
	//Difficult update parser
 }

 function shotgun_surgery(classes: CppClass[], funcs:CppFunction[]){
	console.log("shotgun surgery class not implemented");
	//Difficult update parser
 }

 function parallel_inheritance(classes: CppClass[], funcs:CppFunction[]){
	console.log("parallel inher not implemented");
	//inheritance
 }

 function functional_decomposition(classes: CppClass[], funcs:CppFunction[]){
	console.log("functional decomp not implemented");

 }

 function spaghetti_code(classes: CppClass[], funcs:CppFunction[]){
	// console.log("spaghetti code not implemented");
	const SPAGHETTI_LINES = 10;
	const SPAGHETTI_FUNCS = 1;

	/*
	Spaghetti code is revealed by classes with
	no structure,
	declaring long methods with no parameters,
	utilizing global variables (this may need updates to the parser),
	names of functions may suggest procedural programming (this would require too much work),

	*/


	//foreach class
	classes.forEach(c => {
		let n = 0;
		c.functions.forEach(f => {
			if (f.lines > SPAGHETTI_LINES) {
				console.log(f.name + " has enough lines");
				if (f.name.includes("()")){
					console.log(f.name + " has no parameters");
					n = n + 1;
				}
			}
		});
		if (n > SPAGHETTI_FUNCS) {
			console.log(c.name + " exhibits spaghetti code antipattern");
		}
		else {
			console.log(c.name + " does not exhibit spaghetti code");
		}
	});

	//does it have long methods without parameters


	//Easy - Peterson
 }

 function swiss_army_knife(classes: CppClass[], funcs:CppFunction[]){
	console.log("swiss army knife not implemented");
	//Easy - Peterson
 }

 function type_checking(classes: CppClass[], funcs:CppFunction[]){
	console.log("type checking not implemented");
	//Doesn't use parser
 }

// This method is called when your extension is deactivated
export function deactivate() {}

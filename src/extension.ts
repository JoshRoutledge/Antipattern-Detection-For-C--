import { File } from 'buffer';
import * as vscode from 'vscode';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';
// import {CppFunction} from "./CppFunction";
import {CppClass, CppFunction, Variable} from "./CppClass";

let DEBUG = true;
let all_classes: CppClass[] = [];
let classless_functions: CppFunction[] = [];
/*
	Primatives :
	"int",
	"double",
	"byte",
	"short",
	"char",
	"long",
	"float",
	"boolean",
	"void"

	Collections:
	Array<type>

*/




// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let disposable2 = vscode.commands.registerCommand('antitest.checkantipatterns', async () => {

		// let primatives = [	"int",
		// 					"double",
		// 					"byte",
		// 					"short",
		// 					"char",
		// 					"long",
		// 					"float",
		// 					"boolean",
		// 					"void"];

		// let collections = [ "array" ];

		

		function paramTypes(s:string){
			var split_str = s.replace(/[^\w\,\s]/g, "").split(",");
			var parameters:Variable[] = [];

			split_str.forEach(str => {
				var arr = str.split(" ");
				if( arr.length > 2 ){
					arr = arr.slice(1);
				}
				parameters.push(new Variable(arr[0], arr[1]));
			});

			return parameters;
		}

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
			comment: [{match: /\/\/.*?$/},
					  {match: /\/\*[^\*\/"]*?\*\//}],
			string:  /"(?:\\["\\rn]|[^"\\\n])*?"/,
			lbracket: '{',
			rbracket: '}',
			endLine: ';',
			includeStatement: /#include\s+<[A-Za-z]+>/,
			keyword: ['return'],
			class: {match: /class\s+[A-Za-z_]\w*/, value: (s: string) => s.replace(/class/, "").replace(/\s/g, "")},
			func: [{match: /[A-Za-z]\w*\s[A-Za-z]\w*\([\w\s,]*\)\s?\{/, value: (s:string) => s.slice(s.split(" ")[0].length + 1).split(")")[0]},
				   {match: /[A-Za-z]\w*\([\w\s,]*\)\s?\{/, value: (s:string) => s.split(")")[0]}],
			// func: {match: /[A-Za-z]\w*\([\w\s,]*\)/},
			externalDefinition: {match: /\w+::\w+\s*\(\w*\)/},  	// scopeResolution for CLASS::METHOD() //TODO ADD
			member_func: [{match: /\w+\.\w+\s*\(\w*\)/, value: (s: string) => s.replace(/\./, " ")}, // doesnt handle OBJ.FUNC1().FUNC2()
					 {match: /\w+\-\>\w+\s*\(\w*\)/, value: (s: string) => s.replace(/\-\>/, " ")}],
			member_var: [{match: /\w+\.\w+/, value: (s: string) => s.replace(/\./, " ")}, 
					{match: /\w+\-\>\w+/, value: (s: string) => s.replace(/\-\>/, " ")}], 
			NL:      { match: /[\n\r]/, lineBreaks: true },
			variableDeclaration: [{match: /\w+\s\w+/},
								{match: /\w+(?:::\w+)+\<\w+(?:::\w+)+\>\s\w+/}
								// {match: /[\w(\:\:)]+\<[\w(\:\:)]+\>\s\w+/}
			],
			variable: [{match: /\w+::\w+/},
					   {match: /::\w*/, value: (s: string) => s.slice(2)},
					   { match: /\w+/}],
			// scopeResolution: ,  	// scopeResolution for CLASS::METHOD such as std::endl but could also be a variable //TODO ADD
			op: opPat,
			ERROR: moo.error,
			// Namespace
			// Inheritence
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
				DEBUG && console.log(cpp_lexer);
				var token = cpp_lexer.next();

				// Set token to the next non-whitespace token
				function next(){
					token = cpp_lexer.next();
					if (token === undefined) {token = null; return;}
					while (token.type === "WS") {
						token = cpp_lexer.next();
						if(token === undefined){token = null; return;}
					}
					return;
				}	

				var current_class = null;
				var current_func = null;
				let classes: CppClass[] = [];
				let funcs: CppFunction[] = [];
				let bracketSkips: number = 0;

				while(token){
					DEBUG && console.log(token);
					switch(token.type){
					case 'class':
						current_class = new CppClass(token.value);
						DEBUG && console.log("Created class: " + token.value);
						next();
						if (token.type !== "lbracket") {
							console.log("BAD NEWS BEARS NO LBRACKET AFTER CLASS");
						}
						break;

					case 'rbracket':
						if (bracketSkips > 0) {
							bracketSkips = bracketSkips - 1;
						}
						else if (current_func !== null) {
							funcs = [...funcs, current_func];
							if (current_class !== null) {
								current_class.addFunc(current_func);
							} else {
								classless_functions = [...classless_functions, current_func];
							}
							current_func = null;
						}
						else if (current_class !== null) {
							classes = [...classes, current_class];
							all_classes = [...all_classes, current_class];
							current_class = null;
						}
						else {
							console.log(token);
							console.log("Invalid Cpp me thinks");
						}
						break;

					case 'lbracket':
						bracketSkips = bracketSkips + 1;
						break;

					case 'func':
						var split_str = token.value.split("(");
						var name = split_str[0];
						if(split_str[1].length > 1){
							var parameters = paramTypes(split_str[1].replace(")",""));
						}
						else{
							var parameters:Variable[] = [];
						}
						current_func = new CppFunction(name, current_class, parameters);
						break;

					case 'endLine':
						if (current_func !== null) { current_func.addLines(1); }
						if (current_class !== null) { current_class.addLines(1); }
						break;

						case 'member_func':
							var split_str = token.value.split(" ", 2);
							
							if (current_func !== null) {
								current_func.varToFunc(split_str[0], split_str[1]);
							}
							else if (current_class !== null) {
								current_class.varToFunc(split_str[0], split_str[1]);
							}
							break;
	
						case 'member_var':
							var split_str = token.value.split(" ", 2);
							var classType = "UNKNOWN";
							var c:any;
							for(c in all_classes){
								if(c.name === split_str[1]){
									classType = c.type;
								}
							}
							var attribute:Variable = new Variable(classType, split_str[1]);
							
							if (current_func !== null) {
								current_func.addAttributes(attribute);
							}
							else if (current_class !== null) {
								current_class.addAttributes(attribute);
							}
							break;
		
						case 'variableDeclaration':
						var split_str = token.value.split(" ", 2);
						var attribute = new Variable(split_str[0], split_str[1]);

						if (current_func !== null) {
							current_func.addAttributes(attribute);
						}
						else if (current_class !== null) {
							current_class.addAttributes(attribute);
						}
						break;

					case 'variable':
						
						break;

					case 'ERROR':
						DEBUG && console.log("An error occured while parsing: " + token.value);
						break;

					default:

					}

					next();
				}
				
			});
			DEBUG && console.log(file);
		});
		
	});

	let disposable1 = vscode.commands.registerCommand('antitest.checkclasses', async () => {

		// god_class(all_classes, classless_functions);
		feature_envy(all_classes, classless_functions);
		// duplicate_code(all_classes, classless_functions);
		// refused_bequest(all_classes, classless_functions;
		// divergent_change(all_classes, classless_functions);
		// shotgun_surgery(all_classes, classless_functions);
		// parallel_inheritance(all_classes, classless_functions);
		// functional_decomposition(all_classes, classless_functions);
		// spaghetti_code(all_classes, classless_functions);
		// swiss_army_knife(all_classes, classless_functions);
		// type_checking(all_classes, classless_functions);
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
			if(file.name.endsWith('.cpp')){
				DEBUG && console.log(file.name);
            	files.push(filePath);
			}
        }
    }

    return files;
}

 function god_class(classes: CppClass[], funcs:CppFunction[]){
	/*
		Description of antipattern

	*/

	const MAX_LENGTH = 500; // Need to decide on a value


	console.log("god class not implemented");
	//EASY - Routledge
 }

 function feature_envy(classes: CppClass[], funcs:CppFunction[]){
	/*
		Description of antipattern

		Papers:
			https://ieeexplore.ieee.org/document/7051460
			https://ieeexplore.ieee.org/document/4752842
	*/
	let W = 0.5;
	let X = 0.5;

	function CallSet(obj:string, func:CppFunction){
		var v:any;
		for (v in func){	
			
		}
	}

	function FeatureEnvyFactor(){

	}


	const MAX_FEATURES = 5;
	
	classes.forEach(c => {
		c.functions.forEach(f => {
			
		});
	});
	
	// console.log("feature envy class not implemented");
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

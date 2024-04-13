import { File } from 'buffer';
import * as vscode from 'vscode';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';
// import {CppFunction} from "./CppFunction";
import {CppClass, CppFunction, Variable} from "./CppClass";
import { availableParallelism } from 'os';
import { assert } from 'console';

let DEBUG = true;
let ONLYT = true;
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
			'&=','|=', '^=', '>>=', '<<=', '**=', '!',
		  
			// delimiters
			'+','-', '**', '*', '//', '/', '%', // '@',
			'<<','>>', '<=', '>=', '==', '!=',
			'&','|', '^', '~',
			'<','>', '&&', '||',
		  
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
			keyword: ['return', 'while', 'if', 'for', 'else'],
			class: {match: /class\s+[A-Za-z_]\w*/, value: (s: string) => s.replace(/class/, "").replace(/\s/g, "")},
			func: [{match: /[A-Za-z]\w*\s[A-Za-z]\w*\([\w\s,]*\)\s?\{/, value: (s:string) => s.slice(s.split(" ")[0].length + 1).split(")")[0]},
				   {match: /[A-Za-z]\w*\([\w\s,]*\)\s?\{/, value: (s:string) => s.split(")")[0]}],
			// func: {match: /[A-Za-z]\w*\([\w\s,]*\)/},
			externalDefinition: {match: /\w+::\w+\s*\(\w*\)/},  	// scopeResolution for CLASS::METHOD() //TODO ADD
			member_func: [{match: /\w+\.\w+\s*\(\w*\)/, value: (s: string) => s.replace(/\./, " ")}, // doesnt handle OBJ.FUNC1().FUNC2()
					 {match: /\w+\-\>\w+\s*\(\w*\)/, value: (s: string) => s.replace(/\-\>/, " ")}],
			func_call: {match: /[A-Za-z]\w*\(/},
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

					case 'func_call':
						current_func?.addFunctionName(token.value.slice(0, -1));
					
					case 'keyword':
						//here we want can go through the work of parsing in the conditional if the keyword is if or while?
						//maybe count the number of operators as a heuristic for the type-checking thingy
						if (token.value == "if") {
							DEBUG && console.log("found an if");
							next();
							assert(token.value == "(", "if should be followed by (")
							next();
							let s = 0;
							let paren_count = 1;
							while (paren_count > 0) {
								if (token.type == "op") {
									s = s  + 1;
									if (token.value == "(") {
										paren_count = paren_count + 1;
									}
									if (token.value == ")") {
										paren_count = paren_count - 1;
										if (paren_count == 0) {
											break;
										}
									}
								}
								next();
							}
							current_class?.addConditional(s);
							assert(token.value == ")", "after parsing conditional should be )");
						}

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

		//placeholder may have a better location someday
		all_classes.forEach(c => {
			c.functions.forEach(f => {
				f.unknown_func_names.forEach(ufn => {
					//find correct function and add to f's functions

					all_classes.forEach(c_fs => {
						c_fs.functions.forEach(f_fs => {
							if (ufn == f_fs.name) {
								f.addFuncCall(f_fs);
							}
						});
					});
				});
			});
		});


		god_class(all_classes, classless_functions);
		feature_envy(all_classes, classless_functions);
		duplicate_code(all_classes, classless_functions);
		refused_bequest(all_classes, classless_functions);
		divergent_change(all_classes, classless_functions);
		shotgun_surgery(all_classes, classless_functions);
		parallel_inheritance(all_classes, classless_functions);
		functional_decomposition(all_classes, classless_functions);
		spaghetti_code(all_classes, classless_functions);
		swiss_army_knife(all_classes, classless_functions);
		type_checking(all_classes, classless_functions);
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
		Checks for feature envy between classes.
		Feature envy occurs when a method in one class relies too heavily on methods 
		from another class.

		Formula based on this research paper: https://ieeexplore.ieee.org/document/7051460
	*/
	//Predefined threshhold weight: W and base: X
	let W = 0.5;
	let X = 0.5;
	let THRESHOLD = 0.65;
	
	classes.forEach(c => {
		c.functions.forEach(func => {
			var attribute_methods:number[] = [];
			var total = func.func_calls.length || 0;
			var max = 0;

			func.attributes.forEach( attr =>{
				var count = attr.func_calls.length;
				attribute_methods.push(count);
				total += count;
			});

			if(total !== 0){
				attribute_methods.forEach( M => {
					var envy_factor = W * (M / total) + (1 - W) * (1 - (Math.pow(X, M)));
					if(envy_factor > max){
						max = envy_factor;
						// DEBUG && console.log(`${func.name} envy factor increased to ${max}`);
					}
				});
			}
			DEBUG && console.log(`${func.name} has an envy factor of ${max}`);
			if(max > THRESHOLD){
				console.log(`Feature envy found in ${c.name}'s function ${func.name}`);
			}
		});
	});
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
				if (f.parameters.length == 0){
					console.log(f.name + " has no parameters");
					n = n + 1;
				}
			}
		});
		if (n >= SPAGHETTI_FUNCS) {
			console.log(c.name + " exhibits spaghetti code antipattern");
		}
		else {
			DEBUG && console.log(c.name + " does not exhibit spaghetti code");
		}
	});
 }

 function swiss_army_knife(classes: CppClass[], funcs:CppFunction[]){
	const SAK_NUM_SETS = 2;
	//Easy - Peterson

	//All classes start in their own "group"
	//Define operator join, example if A-1 B-1 C-2 D-3 join C and A results in A,B,C-2 D-3
	//Simple algorithm join C, A get A's group and set all values with that group to C's group

	classes.forEach(c => {

		let uj: number[] = [];
		for (let i = 0; i < classes.length; i++) {
			uj.push(-1);
		}

		c.functions.forEach(f => {
			let classesThatCallF: number[] = [];

			//find all the classes that call this function join them
			for (let j = 0; j < classes.length; j++) {
				const element = classes[j];
				for (let k = 0; k < element.functions.length; k++) {
					const t = element.functions[k];
					t.func_calls.forEach(e => {
						//e is a function call from class j to function e
						if (e.name == f.name) {
							//we have found that class j calls function f track it
							classesThatCallF.push(j);
						}
					});
				}
				
			}

			//we now have all classes that call F they must be in the same group, join them
			for (let l = 0; l < classesThatCallF.length; l++) {
				const element = classesThatCallF[l];
				let a = classesThatCallF[0]; //index into uj
				let b = classesThatCallF[l]; //index into uj

				//join a and b
				let a_value = uj[a];
				let b_value = uj[b];

				if (a_value == -1) {
					a_value = a;
					uj[a] == a_value;
				}
				if (b_value == -1) {
					b_value = b;
					uj[b] = b_value;
				}

				for (let m = 0; m < uj.length; m++) {
					if (uj[m] == b_value) {
						uj[m] = a_value;
					}
				}
				
			}
			console.log("for breakpoint");
		});
		
		//here we determine if c is a sak
		const s = (new Set(uj)).size - 1; //used to count how many "groups" not counting the no call group
		if (s >= SAK_NUM_SETS) {
			console.log(c.name + " may be a Swiss Army Knife")
		}
	})

	//Now we should have the number of groups

 }

 function type_checking(classes: CppClass[], funcs:CppFunction[]){
	const TC_COMPLEX_THRESHOLD = 5;
	const TC_NUMBER_CC_REQUIRED = 6;

	let count = 0;
	classes.forEach(c => {
		c.conditionals.forEach(pcc => {
			if (pcc >= TC_COMPLEX_THRESHOLD) {
				count = count + 1;
			}
		});
		if (count >= TC_NUMBER_CC_REQUIRED) {
			console.log(c.name + " is an example of a type checking antipattern")
		}
	});
 }

// This method is called when your extension is deactivated
export function deactivate() {}

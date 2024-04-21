import { File } from 'buffer';
import * as vscode from 'vscode';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';
import {CppClass, CppFunction, Variable} from "./CppClass";
import { availableParallelism } from 'os';
import { assert } from 'console';
import { maxHeaderSize } from 'http';


//user settings
let DEBUG = false;
const SAK_NUM_SETS = 2; //How many mutually exclusive sets of functions within a class are required to idetify a class as exhibiting the Swiss Army Knife antipattern
const FE_THRESHOLD = 0.65;
const TC_COMPLEX_THRESHOLD = 5; //How many operators are required to lable a conditional as "complex"
const TC_NUMBER_CC_REQUIRED = 6; //How many complex conditionals are required to identify a class as exhibiting the TypeChecking antipattern
const SPAGHETTI_LINES = 10; //How many lines are required for a function to be considered a "long" function
const SPAGHETTI_FUNCS = 1; //How many long functions are required within a class to identify the class as exhibiting the Spaghetti Code antipattern

//variables used to track certain aspects of the analyzed code
let all_classes: CppClass[] = [];
let classless_functions: CppFunction[] = [];
let SAK_scores: number[] = [];
let feature_envy_score: number[] = [];


/**
 * Runs on activation of the extension adding our commands to users command palette
 */
export function activate(context: vscode.ExtensionContext) {

	/**
	 * A VS Code command that parses all c++ files in the active workspace into classes, functions, and variables
	 * and the relationships between them.
	 * 
	 * This command is run upon calling `Parse Files` from the command palette.
	 */
	let disposable2 = vscode.commands.registerCommand('antitest.checkantipatterns', async () => {

		all_classes = [];
		classless_functions = [];
		SAK_scores = [];
		feature_envy_score = [];

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
	
		// Define operators and delimiters
		var opPat = [
			// operators
			'(',')', '[', ']', '{', '}',
			',',':', '.', ';', '@', '->',
			'+=','-=', '*=', '/=', '//=', '%=', '@=',
			'&=','|=', '^=', '>>=', '<<=', '**=', '!',
		  
			// delimiters
			'+','-', '**', '*', '//', '/', '%',
			'<<','>>', '<=', '>=', '==', '!=',
			'&','|', '^', '~',
			'<','>', '&&', '||',
		  
			'=',
		  ];

		// Our lexer definition with the rules for tokenizing the input
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
			externalDefinition: {match: /\w+::\w+\s*\(\w*\)/},  
			member_func: [{match: /\w+\.\w+\s*\(\w*\)/, value: (s: string) => s.replace(/\./, " ")}, // doesnt handle OBJ.FUNC1().FUNC2()
					 {match: /\w+\-\>\w+\s*\(\w*\)/, value: (s: string) => s.replace(/\-\>/, " ")}],
			func_call: {match: /[A-Za-z]\w*\(/},
			member_var: [{match: /\w+\.\w+/, value: (s: string) => s.replace(/\./, " ")}, 
						{match: /\w+\-\>\w+/, value: (s: string) => s.replace(/\-\>/, " ")}], 
			NL:      { match: /[\n\r]/, lineBreaks: true },
			variableDeclaration: [{match: /\w+\s\w+/},
								{match: /\w+(?:::\w+)+\<\w+(?:::\w+)+\>\s\w+/}],
			variable: [{match: /\w+::\w+/},
					   {match: /::\w*/, value: (s: string) => s.slice(2)},
					   { match: /\w+/}],
			op: opPat,
			ERROR: moo.error,
		});
		
		// Get the workspace folders and verify there is a only one selected workspace
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

		let files_complete = 0;

		// Print file names
		files.forEach(file => {
			let file_count = files.length;
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
							console.log("Invalid Cpp");
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
							console.log("Invalid Cpp");
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
						break;
					
					case 'keyword':
						if (token.value === "if") {
							next();
							assert(token.value === "(", "if should be followed by (");
							next();
							let s = 0;
							let paren_count = 1;
							while (paren_count > 0) {
								if (token.type === "op") {
									s = s  + 1;
									if (token.value === "(") {
										paren_count = paren_count + 1;
									}
									if (token.value === ")") {
										paren_count = paren_count - 1;
										if (paren_count === 0) {
											break;
										}
									}
								}
								next();
							}
							current_class?.addConditional(s);
							assert(token.value === ")", "after parsing conditional should be )");
						}
						break;

					case 'ERROR':
						DEBUG && console.log("An error occured while parsing: " + token.value);
						break;

					default:

					}

					next();
				}
				files_complete += 1;
				if(files_complete === file_count){
					console.log('Parsing Complete');
				}
			});
			DEBUG && console.log(file);
		});
		
	});

	/**
	 * A VS Code command that checks for common antipatterns in the parsed c++ files.
	 * 
	 * This command is run upon calling `Check for Antipatterns` from the command palette.
	 */
	let disposable1 = vscode.commands.registerCommand('antitest.checkclasses', async () => {

		SAK_scores = [];
		feature_envy_score = [];

		all_classes.forEach(c => {
			c.functions.forEach(f => {
				f.unknown_func_names.forEach(ufn => {
					
					//find correct function and add to f's functions
					all_classes.forEach(c_fs => {
						c_fs.functions.forEach(f_fs => {
							if (ufn === f_fs.name) {
								f.addFuncCall(f_fs);
							}
						});
					});
				});
			});
		});

		feature_envy(all_classes, classless_functions);
		duplicate_code(all_classes, classless_functions);
		refused_bequest(all_classes, classless_functions);
		divergent_change(all_classes, classless_functions);
		shotgun_surgery(all_classes, classless_functions);
		parallel_inheritance(all_classes, classless_functions);
		spaghetti_code(all_classes, classless_functions);
		swiss_army_knife(all_classes, classless_functions);
		type_checking(all_classes, classless_functions);
		god_class(all_classes, classless_functions);
	});

	context.subscriptions.push(disposable1);
	context.subscriptions.push(disposable2);
}

/**
 * Finds and returns all C++ file paths within a directory and its subdirectories 
 * 
 * @param dir root directory for search
 * @returns Array of C++ file paths found
 */
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

/**
 * Checks for the presence of a god class in the provided classes and functions and prints to the console if found
 * 
 * A god class may be present if a class meets the thresholds for both Feature Envy and Swiss Army Knife.
 * 
 * @param classes Array of classes
 * @param funcs Array of functions
 */
 function god_class(classes: CppClass[], funcs:CppFunction[]){
	let god_class_found = false;
	for(let i = 0; i < all_classes.length; i++){
		if (SAK_scores[i] > SAK_NUM_SETS) {
			if(feature_envy_score[i] > FE_THRESHOLD){
				god_class_found = true;
				console.log(`${all_classes[i].name} may be a god class.`);
			}
		}
	}

	if(!god_class_found){
		console.log('This project does not contain a god class.');
	}
 }

/**
 * Checks for the presence of feature envy in the provided classes and functions and prints to the console if found
 * 
 * Feature envy occurs when a method in one class relies too heavily on methods 
 * from another class. 
 * 
 * Formula based on this research paper: https://ieeexplore.ieee.org/document/7051460
 * 
 * @param classes Array of classes
 * @param funcs Array of functions
 */
 function feature_envy(classes: CppClass[], funcs:CppFunction[]){
	//Predefined threshhold weight: W and base: X
	let W = 0.5;
	let X = 0.5;
	
	classes.forEach(c => {
		var class_max = 0;
		c.functions.forEach(func => {
			var attribute_methods:number[] = [];
			var total = func.func_calls.length || 0;
			var func_max = 0;

			func.attributes.forEach( attr =>{
				var count = attr.func_calls.length;
				attribute_methods.push(count);
				total += count;
			});

			if(total !== 0){
				attribute_methods.forEach( M => {
					var envy_factor = W * (M / total) + (1 - W) * (1 - (Math.pow(X, M)));
					if(envy_factor > func_max){
						func_max = envy_factor;
					}
				});
			}
			DEBUG && console.log(`${func.name} has an envy factor of ${func_max}`);
			if(func_max > FE_THRESHOLD){
				console.log(`Feature envy found in ${c.name}'s function ${func.name}`);
			}
			if(func_max > class_max){
				class_max = func_max;
			}
		});
		feature_envy_score.push(class_max);
	});
 }

/**
 * Checks for the presence of duplicate code in the provided classes and functions and prints to the console if found
 * @param classes Array of classes
 * @param funcs Array of functions
 */
 function duplicate_code(classes: CppClass[], funcs:CppFunction[]){
	DEBUG && console.log("duplicate code class not implemented");
 }

/**
 * Checks for the presence of refused bequest in the provided classes and functions and prints to the console if found
 * @param classes Array of classes
 * @param funcs Array of functions
 */
 function refused_bequest(classes: CppClass[], funcs:CppFunction[]){
	DEBUG && console.log("refused bequest class not implemented");
 }

/**
 * Checks for the presence of divergent change in the provided classes and functions and prints to the console if found
 * @param classes Array of classes
 * @param funcs Array of functions
 */
 function divergent_change(classes: CppClass[], funcs:CppFunction[]){
	DEBUG && console.log("diveregent change class not implemented");
 }

/**
 * Checks for the presence of shotgun surgery in the provided classes and functions and prints to the console if found
 * @param classes Array of classes
 * @param funcs Array of functions
 */
 function shotgun_surgery(classes: CppClass[], funcs:CppFunction[]){
	DEBUG && console.log("shotgun surgery class not implemented");
 }

/**
 * Checks for the presence of parallel inheritance in the provided classes and functions and prints to the console if found
 * @param classes Array of classes
 * @param funcs Array of functions
 */
 function parallel_inheritance(classes: CppClass[], funcs:CppFunction[]){
	DEBUG && console.log("parallel inher not implemented");
 }

/**
 * Checks for the presence of spaghetti code in the provided classes and functions and prints to the console if found
 * @param classes Array of classes
 * @param funcs Array of functions
 */
 function spaghetti_code(classes: CppClass[], funcs:CppFunction[]){

	classes.forEach(c => {
		let long_functions_count = 0;
		c.functions.forEach(f => {
			if (f.lines > SPAGHETTI_LINES) {
				DEBUG && console.log(f.name + " has enough lines");
				if (f.parameters.length === 0){
					DEBUG && console.log(f.name + " has no parameters");
					long_functions_count = long_functions_count + 1;
				}
			}
		});
		if (long_functions_count >= SPAGHETTI_FUNCS) {
			console.log(c.name + " exhibits spaghetti code antipattern");
		}
		else {
			DEBUG && console.log(c.name + " does not exhibit spaghetti code");
		}
	});
 }

/**
 * Checks for the presence of the swiss army knife antipattern in the provided classes and functions and prints to the console if found
 * @param classes Array of classes
 * @param funcs Array of functions
 */
 function swiss_army_knife(classes: CppClass[], funcs:CppFunction[]){

	classes.forEach(c => {

		let groups: number[] = []; //Used to track which "set" each class belogs to
		for (let i = 0; i < classes.length; i++) {
			groups.push(-1); //initialize each class to be in the set that doesn't call any functions within c
		}

		c.functions.forEach(f => {
			let classesThatCallF: number[] = [];

			//find all the classes that call f
			for (let j = 0; j < classes.length; j++) {
				const classJ = classes[j];
				for (let k = 0; k < classJ.functions.length; k++) {
					const functionK = classJ.functions[k];
					functionK.func_calls.forEach(jCall => {
						//jCall is a function call from class j's function k to jCall
						if (jCall.name === f.name) { //is this function call calling f which is in c
							//we have found that class j calls function f track it
							classesThatCallF.push(j);
						}
					});
				}
				
			}

			//join the classes that call f into the same group
			for (let l = 0; l < classesThatCallF.length; l++) {
				const element = classesThatCallF[l];
				let a = classesThatCallF[0]; //index into group arbitrarilly select a's group as the group to join into
				let b = classesThatCallF[l]; //index into group arbitrarilly select b's group as the group to join from

				let a_value = groups[a];
				let b_value = groups[b];

				if (a_value === -1) { // is a's group the group that doesn't call c
					a_value = a;
					groups[a] === a_value; //if so give a a "new" group as it calls f
				}
				if (b_value === -1) { // is b's current group the group that doesn't call c
					b_value = b;
					groups[b] = b_value; // if so give b a "new" group, as it calls f
				}

				//set all values in b's group to a's group
				for (let m = 0; m < groups.length; m++) {
					if (groups[m] === b_value) {
						groups[m] = a_value;
					}
				}
				
			}
		});
		
		//here we determine if c is a sak
		const s = (new Set(groups)).size - 1; //used to count how many "groups" not counting the no call group
		if (s >= SAK_NUM_SETS) {
			console.log(c.name + " may be a Swiss Army Knife");
		}
		SAK_scores.push(s); //track score for the Godclass identifier
	});

 }

/**
 * Checks for the presence of type checking in the provided classes and functions and prints to the console if found
 * @param classes Array of classes
 * @param funcs Array of functions
 */
 function type_checking(classes: CppClass[], funcs:CppFunction[]){

	let cc_count = 0;
	classes.forEach(c => {
		c.conditionals.forEach(potential_complex_conditional => {
			if (potential_complex_conditional >= TC_COMPLEX_THRESHOLD) {
				cc_count = cc_count + 1;
			}
		});


		if (cc_count >= TC_NUMBER_CC_REQUIRED) {
			console.log(c.name + " is an example of a type checking antipattern");
		}
	});
 }

// This method is called when your extension is deactivated
export function deactivate() {}

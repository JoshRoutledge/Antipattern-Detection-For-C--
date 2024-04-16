
/**
 * A parsed representation of a c++ class
 * 
 *  name: Name of the class.
 * 	lines:	Length of the class based of number of endlines.
 * 	attributes:	Attributes of this class.
 * 	func_calls: An array of function calls by attributes within the class but outside of a function.
 * 	unknown_func_calls: An array of function calls that the parser has not seen the parent class for.
 * 	functions:	Functions of this class.
 */
export class CppClass {
    name: string;
    lines: number;
	attributes: Variable[];
    func_calls: CppFunction[];
    unknown_func_calls: Variable[];
    functions: CppFunction[];
	conditionals: number[];

    constructor(name: string){
        this.name = name;
        this.lines = 0;
		this.attributes = [];
        this.functions = [];
        this.func_calls = [];
        this.unknown_func_calls = [];
		this.conditionals = [];
    }

    addLines(n: number){
        this.lines = this.lines + n;
    }

    addFunc(f: CppFunction){
        this.functions = [...this.functions, f];
    }

	addAttributes(v: Variable){
		this.attributes.push(v);
	}

	addFuncCall(f: CppFunction){
        this.func_calls.push(f);
    }

	addConditional(n: number){
		this.conditionals.push(n);
	}

	varToFunc(name:string, method:string){
		this.attributes.forEach(v => {
			if(v.name === name){
				v.addFunctionCall(method);
			}
		});
	}
}

/**
 * A parsed representation of a c++ function
 * 
 *  name: Name of the function.
 * 	lines:	Length of the function based of number of endlines.
 * 	attributes:	Attributes declared within this function.
 * 	func_calls: An array of function calls by attributes within the function.
 * 	unknown_func_calls: An array of function calls that the parser has not seen the parent class for.
 * 	functions:	Functions of this class.
 */
export class CppFunction{
    name: string;
    lines: number;
	attributes: Variable[];
	parameters: Variable[];
    functions: CppFunction[];
    func_calls: CppFunction[];
    unknown_func_calls: Variable[];
	unknown_func_names: string[];
    parent_class: CppClass | null;

    constructor(name: string, c: CppClass | null, param: Variable[]){
        this.name = name;
        this.parent_class = c;
        this.lines = 0;
		this.parameters = param;
		this.attributes = param.slice();
        this.functions = [];
        this.func_calls = [];
        this.unknown_func_calls = [];
		this.unknown_func_names = [];
    }

    addLines(n: number){
        this.lines = this.lines + n;
    }
    
    addFunction(f: CppFunction){
        this.functions.push(f);
    }

	addFuncCall(f: CppFunction){
        this.func_calls.push(f);
    }

	varToFunc(name:string, method:string){
		var found = false;
		this.attributes.forEach(v => {
			if(v.name === name){
				v.addFunctionCall(method);
				found = true;
			}
		});

		if(!found && this.parent_class){
			this.parent_class.attributes.forEach(v => {
				if(v.name === name){
					var v_clone = new Variable(v.type, v.name);
					v_clone.addFunctionCall(method);
					this.addAttributes(v_clone);
				}
			});
		}
	}

	addAttributes(v: Variable){
		this.attributes.push(v);
	}

	addFunctionName(n: string){
		this.unknown_func_names.push(n);
	}
}

export class Variable{
	type:string;
	name:string;
	func_calls: string[];
	constructor(type:string, name:string){
		this.type = type;
		this.name = name;
		this.func_calls = [];
	}

	addFunctionCall(func:string) {
		this.func_calls.push(func);
	}
	
}
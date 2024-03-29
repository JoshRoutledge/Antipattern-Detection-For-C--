// import { CppFunction } from "./CppFunction";

export class CppClass {
    name: string;
    lines: number;
    functions: Array<CppFunction>;

    constructor(name: string){
        this.name = name;
        this.lines = 0;
        this.functions = [];
    }

    addLines(n: number){
        this.lines = this.lines + n;
    }

    addFunc(f: CppFunction){
        this.functions = [...this.functions, f];
    }
}


export class CppFunction{
    name: string;
    lines: number;
    function_calls: Array<CppFunction>;
    temp_names: Array<string>;
    parent_class: CppClass | null;

    constructor(name: string, c: CppClass | null){
        this.name = name;
        this.parent_class = c;
        this.lines = 0;
        this.function_calls = [];
        this.temp_names = [];
    }

    addLines(n: number){
        this.lines = this.lines + n;
    }
    
    addFunc(f: CppFunction){
        this.function_calls = [...this.function_calls, f];
    }

    addFuncName(s: string){
        this.temp_names = [...this.temp_names, s];
    }
}
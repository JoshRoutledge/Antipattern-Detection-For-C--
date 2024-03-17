class TestClass {
    int foo(int a, int b){
        return a + b;
    }

    int bar(int a){
        a = 15 - a;
        return a + foo(3, 4);
    }

    int buz(int a){
        int b = 0;
        if (a > 5){
            return 0;
        }
        else{
            while (a > 5){
                a = a - 1;
                b = b + 1;
            }
            return b;
        }
    }
};
/*
keyword: class
string
lbracket 1
func : foo(int a, int b)
lbracket 2
expr
endl
rbracket 2
func
lbracket 2
expr
endl
func
endl
rbracket 2
... buz declaration
rbracket 2
rbracket 1
*/

/*
TestClass -> Class
foo -> func
bar -> func
buz -> func
foo belongs to TestClass
bar belongs to TestClass
buz belongs to TestClass
foo has 1 line
bar has 2 lines
buz has 5 lines?
bar calls foo
*/

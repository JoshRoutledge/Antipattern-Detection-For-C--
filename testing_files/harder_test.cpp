#include <iostream>

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

// Description of Anouter Class
class AnoutherClass {
    public:
        void undefinedMethod();

};

void AnoutherClass::undefinedMethod() {
    std::cout << "Now Im Defined";
    std::string findMe = "I should be \" one \" string" + "I should be a seperate string" ;
}

int main() {
    AnoutherClass ac;
    ac.undefinedMethod();
    return 0;
}
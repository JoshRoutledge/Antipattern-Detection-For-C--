class SAKClass {
    int sak_foo(int a, int b){
        return a + b;
    }

    int sak_bar(int a){
        a = 15 - a;
        return a + foo(3, 4);
    }

    int sak_buz(int a){
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

class SAKUser0 {
    int sak_user_0_foo(int a, int b){
        sak_foo(a, b);
        sak_bar(a);
        return a + b;
    }

};

class SAKUser1 {
    int sak_user_1_foo(int a, int b){
        sak_bar(a);
        return a + b;
    }
};

class SAKUser2 {
    int sak_user_2_foo(int a, int b){
        sak_buz(a);
        return a + b;
    }
};
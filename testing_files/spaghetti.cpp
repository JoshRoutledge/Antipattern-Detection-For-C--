#include <iostream>
#include <string>
#include <vector>
#include <cmath>

class SpaghettiClass {
public:
    void long_function() {
        std::cout << "Starting functionOne" << std::endl;
        int squareSum = 0;
        for(int i = 1; i <= 10; i++) {
            std::cout << "Square of " << i << " is " << i*i << std::endl;
            squareSum += i*i;
        }
        std::cout << "Sum of squares from 1 to 10 is: " << squareSum << std::endl;
        double rootOfSum = sqrt(squareSum);
        std::cout << "Square root of sum is: " << rootOfSum << std::endl;
        int subtraction = 100 - squareSum;
        std::cout << "100 - Sum of squares: " << subtraction << std::endl;
        int addition = subtraction + 100;
        std::cout << "Adding 100: " << addition << std::endl;
        std::cout << "Completing functionOne" << std::endl;
    }

    void long_function(int with_parameters) {
        std::cout << "Starting functionTwo" << std::endl;
        std::vector<std::string> words = {"Adding", "more", "lines", "to", "functionTwo", "for", "testing"};
        int wordCount = 0;
        for(const std::string& word : words) {
            std::cout << word << " ";
            ++wordCount;
        }
        std::cout << "\nTotal words: " << wordCount << std::endl;
        std::cout << "Printing in reverse:" << std::endl;
        for(auto it = words.rbegin(); it != words.rend(); ++it) {
            std::cout << *it << " ";
        }
        std::cout << std::endl;
        std::cout << "Random calculations:" << std::endl;
        for(int i = 0; i < 5; i++) {
            std::cout << "2^" << i << " = " << pow(2, i) << std::endl;
        }
        std::cout << "Finished functionTwo" << std::endl;
    }
};
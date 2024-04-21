# Antitest
Antitest is a vscode extension for detecting the presence of antipatterns in C++ code.

---

#### Installation Instructions
1. Open a terminal.
2. Navigate to the Antitest root folder.
3. run npm install.
---

#### How to run
1. Within Visual Studio Code (VS Code), press F5 or run the debugger. A new VS Code window will open with the extention active.
2. Within the new window, open the command pallet (Ctrl+Shift+P by default) and run the 'Parse Files' Command. This will parse all C++ files in the active workspace. i.e The C++ files within the new window
3. Open the command pallet a second time and run the 'Check for Antipatterns' Command. This will check all parsed files for the antipatterns currently detected and will print the results to the debug console of the first VS Code window.

> The DEBUG global variable at the top of the 'extention.ts' file can be switched to true for a more verbose print out to the console. (This option also prints each parsed token to the console significantly slowing the extentions speed)

---
#### Implemented AntiPattern Detection
Antitest currently detects the following antipatterns:
* Feature Envy: A method making too many calls to methods of another class to obtain data and/or functionality.
* Spaghetti Code: A class without structure that declare long methods without parameters.
* Swiss Army Knife: A class that exhibits high complexity and offer number of different services.
* Type Checking: A class that shows complicated conditional statements.
* God Class: A class having huge size and implementing different responsibilities.

#### Planned Antipattern Detection
* Duplicate Code: Classes that show the same code structure in multiple places.
* Refused Bequest: A class inheriting functionalities that it never uses.
* Divergent Change: A class commonly changed in different ways for different reasons.
* Shotgun Surgery: A class where a change implies cascading changes in several related classes.
* Parallel Inheritance: Pair of classes where the addition of a subclass in a hierarchy implies the addition of a subclass in another hierarchy.

---
#### Requirements
* Visual Studio Code: Version 1.87.0 or newer
* Node.js: Version: 18.x or newer
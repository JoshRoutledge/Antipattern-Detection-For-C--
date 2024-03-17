# antitest README

This is the README for your extension "antitest". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**

## Anti Patterns
* Blob (God Class): A class having huge size and implementing different responsibilities.
* Feature Envy: A method making too many calls to methods of another class to obtain data and/or functionality.
* Duplicate Code: Classes that show the same code structure in multiple places.
* Refused Bequest: A class inheriting functionalities that it never uses.
* Divergent Change: A class commonly changed in different ways for different reasons.
* Shotgun Surgery: A class where a change implies cascading changes in several related classes.
* Parallel Inheritance: Pair of classes where the addition of a subclass in a hierarchy implies the addition of a subclass in another hierarchy.
* Functional Decomposition: A class implemented following a procedural style.
* Spaghetti Code: A class without structure that declare long methods without parameters
* Swiss Army Knife: A class that exhibits high complexity and offer number of different services.
* Type Checking: A class that shows complicated conditional statements.

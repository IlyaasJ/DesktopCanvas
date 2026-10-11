# <img width="50" height="50" alt="DesktopCanvasIcon" src="https://github.com/user-attachments/assets/6154871f-ab14-4b8a-bd3a-d7f23f333648" /> DesktopCanvas

An on-screen drawing and annotation application

## Description

This project was built using electron.
The app can be used as a place to brainstorm, solve technical leetcode problems, 
annotate online text books, all right on your desktop screen.
A invisble canvas that can be painted anywhere on your desktop, in anyway you like.

## Getting Started

### Dependencies

* Nodejs Required
* Works on MacOS and Windows (Linux support is not gurrenteed)

### Installing

* Clone the repository or Download the ZIP file

### Executing program

* Open your preferred terminal got into the
  DesktopCanvas directory and run the following command
```
npm install
```
* after the application is installed, run this command to execute
```
npm start
```
#Note: A final deloyed build does not exist
so to reopen the app, you need to re-run the command
above

## Help

* The app won't run
    1. check if electron is installed
    ```
    npm ls electron
    ```
    2. if electron is not listed, run this command inside the DesktopCanvas directory
    ```
    npm install
    ```
    3. attempt to run the program again

* The app does not install 
    1. confirm NodeJs is installed on your machine
    ```
    node -v
    ```
    2. if NodeJs is not found or the command doesn't exist,
      install NodeJs and retry (https://nodejs.org/en/download)
      
* Errors still persist
    * Reinstall a different version of DesktopCanvas

## Version History

* No current version history (heavy prototype)

## License

This project is licensed under the MIT License - see the LICENSE.md file for details

## Acknowledgments

Inspiration.
  thinking through a leetcode problem and not having anywhere
  to write down my thoughts was such a pain which motivated
  me to create this tool.

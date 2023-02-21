# Contributing

There are many ways in which you can participate in this project, for example:

- [Submit bugs and feature requests](https://github.com/noahweasley/SMD-Desktop/issues), and help us verify as they are checked in

- Review [source code changes](https://github.com/noahweasley/SMD-desktop/pulls)

- Review the project and make pull requests for anything from typos to additional and new content

## Getting Started

### Initializations

- Clone the repository using `git clone https://github.com/noahweasley/SMD-Desktop.git`

- Enter the project directory using `cd SMD-Desktop` on Windows, in case you are not in the project directory

- Run `$ npm install` to install all the project dependencies

- Run `$ npm run start` to run the application

### Configurations

- To check your code for errors and enforce code formatting, run `$ npm run lint`

- To automatically format your code according to the Prettier configuration, run `$ npm run format`

This will ensure that your code is consistent and error-free, according to the rules and settings specified in the project's ESLint and Prettier configurations.

### Building the application

- Run `npm run pack:win32` to build for Windows x32

- Run `npm run pack:win64` to build for Windows x64

- Run `npm run build` to build for all supported platforms

### Installing the tools

There are a few VS Code extensions used in the development of S.M.D namely:

#### Recommended

- Prettier formatter (esbenp.prettier-vscode)

- Code Spell Checker (streetsidesoftware.code-spell-checker)

- ES Lint (dbaeumer.vscode-eslint)

#### Optional

- Community Material Theme Darker High Contrast (Equinusocio.vsc-community-material-theme)

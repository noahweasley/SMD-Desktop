# Contributing Guidelines

Thank you for considering contributing to S.M.D! Here are some guidelines to help you get started:

## Code Style

We use [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) to ensure consistent code style across the project. Before submitting a pull request, make sure your code follows the style guidelines. To run Prettier and ESLint on your code, run the following commands:

- `npm run lint` - To check your code for errors and enforce code formatting
- `npm run format` - To automatically format your code according to the Prettier configuration

## Development Environment Setup

To set up a development environment for this project, follow these steps:

- Install [Node.js](https://nodejs.org/en/) and [Git](https://git-scm.com/) on your system if you haven't already.
- Clone the repository to your local machine using `git clone https://github.com/noahweasley/SMD-Desktop.git`.
- Navigate to the project directory and install dependencies using `npm install`.
- Run the application using `npm start`.

### Additional Configurations

Add a `.env` file (optional) at the root of the project with these keys:

```dotenv
BINARY_LOCATION="folder/to/ytdlp/binary"
DB_FILEPATH="folder/to/sqlite/database"
```

This will enable you to test the test and view the contents of files created by the application properly. Set `DB_FILEPATH` to a custom folder of your choice and also edit the path to the database folder in `clear:debug-database` script if you want it to run successfully.

**Please Note**: Any changes made to the `clear:debug-database` or `clear:preference` scripts should be changed to the default before opening a pull request.

### Building the application

- Run `npm run package:win32` to build for Windows x32
- Run `npm run package:win64` to build for Windows x64
- Run `npm run package` to build for all supported platforms
- Run `npm run build` to build for all supported platforms and generate installers
- Run `npm run rebuild` to re-generate icons, build for all supported platforms and also generate installers

  **Please note**: re-generating icons are only recommended when there are changes made to the app's icons and shouldn't be used, prefer `npm run build` instead.

Once you've completed these steps, you should be able to start making changes to the project and testing them locally.

## Pull Requests

- Fork the repository and create a new branch for your feature or bug fix
- Make your changes and commit them with clear commit messages
- Push your changes to your forked repository
- Open a pull request to the main repository, explaining the changes you've made and why they are necessary

## Documentation Guidelines

We strive to maintain clear and up-to-date documentation for this project. To contribute to the documentation, please follow these guidelines:

- Use [JSDoc](https://jsdoc.app/) syntax to clearly describe and document your code
- Keep the documentation up-to-date with the latest changes to the project. If you notice that documentation is out of date, please update it or create an issue to let someone know that it needs to be updated
- Follow the project's style guide for documentation. This includes using clear and concise language, formatting code examples properly, and providing context for any code snippets
- Use appropriate headings, bullet points, and other formatting techniques to make the documentation easy to read and navigate.
- If you're not sure how to document something or you need help with documentation, don't hesitate to ask for guidance from the project maintainers

## Installing VS Code tools

Here are a list of the VS Code extensions used in the development of S.M.D:

### Recommended

- Prettier formatter (esbenp.prettier-vscode)
- Code Spell Checker (streetsidesoftware.code-spell-checker)
- ES Lint (dbaeumer.vscode-eslint)

### Optional

- NPM Script Advanced (daez.npm-scripts-advanced)
- Community Material Theme Darker High Contrast (Equinusocio.vsc-community-material-theme)

## Issue Reporting

If you encounter any bugs or issues while using the project, please [create an issue](https://github.com/noahweasley/SMD-Desktop/issues/new) in the repository. Please include a clear and detailed description of the issue, steps to reproduce it, and any relevant information about your environment.

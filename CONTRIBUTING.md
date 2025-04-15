# Contributing to AI Chat365

Thank you for your interest in contributing to AI Chat365! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:
- Be respectful and inclusive
- Be collaborative
- Gracefully accept constructive criticism
- Focus on what is best for the community

## How to Contribute

### Reporting Bugs

If you find a bug, please report it by creating an issue. Ensure your report includes:
- A clear title and description
- Steps to reproduce the bug
- Expected behavior vs actual behavior
- Screenshots if applicable
- Any relevant code snippets

### Suggesting Enhancements

If you have ideas for enhancements, please:
- Check if the enhancement has already been suggested
- Create a new issue with a clear title and detailed description
- Explain why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch from `main` for your changes
3. Make your changes
4. Write or update tests as needed
5. Update documentation if necessary
6. Submit a pull request

#### Pull Request Guidelines

- Follow the coding style of the project
- Include tests for new features or bug fixes
- Keep changes focused and related
- Reference any relevant issues in your PR description

### Development Setup

See the README.md file for detailed setup instructions for each component of the project.

## Project Structure

This project is divided into four main components:

1. **end-user-api**: Backend API for end-users
2. **end-user-ui**: Frontend application for end-users
3. **mgmt-api**: Backend API for management/administration
4. **mgmt-ui**: Frontend application for management/administration

## Coding Guidelines

### JavaScript/TypeScript
- Use ES6+ features when appropriate
- Use semicolons
- Use meaningful variable and function names
- Comment your code when necessary

### Vue.js
- Follow Vue style guide (https://vuejs.org/style-guide/)
- Use Vue components to modularize UI code
- Use Vuex for state management

### Node.js/Express
- Organize routes, controllers, and models in separate files
- Use async/await for asynchronous operations
- Implement proper error handling

### MongoDB
- Use Mongoose schemas for data validation
- Create indexes for frequently queried fields

## License

By contributing to AI Chat365, you agree that your contributions will be licensed under the project's MIT license.

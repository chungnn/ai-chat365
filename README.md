# Open source AI Helpdesk Support System

An open source AI-based helpdesk support system with a focus on chat functionality, designed to provide intelligent customer support with human agent integration.

# Give me a ⭐ star on [GitHub repo](https://github.com/chungnn/ai-chat365) to keep improving this project! 💖

## Features
- AI-powered chat support for customer inquiries
- Live agent handoff when AI can't resolve issues
- Ticket management and tracking system
- Knowledge base integration for accurate responses (coming soon: Elasticsearch-based knowledge management)
- Analytics and reporting on support metrics

## Project Structure
This project consists of four main components:
- **/end-user-api**: Backend API for end-users
- **/end-user-ui**: Frontend application for end-users
- **/mgmt-api**: Backend API for management/administration
- **/mgmt-ui**: Frontend application for management/administration

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Elasticsearch (for knowledge base functionality)
- Redis (optional, for enhanced real-time functionality)
- GEMINI API KEY (obtain from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:
    ```powershell
    git clone https://github.com/chungnn/ai-chat365.git
    cd ai-chat365
    ```

2. Set up the end-user API:
    ```powershell
    cd end-user-api
    npm install
    # Configure your .env file based on the example
    npm run dev
    ```

3. Set up the end-user UI (in a new terminal):
    ```powershell
    cd end-user-ui
    npm install
    npm run serve
    ```

4. Set up the management API (in a new terminal):
    ```powershell
    cd mgmt-api
    npm install
    # Configure your .env file based on the example
    npm run dev
    ```

5. Set up the management UI (in a new terminal):
    ```powershell
    cd mgmt-ui
    npm install
    npm run serve
    ```

## Configuration
Each component has its own configuration needs. Refer to the README files in each directory for specific configuration details.

## Contributing
This is an open source project and contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

## Screenshots
Below are some screenshots of the AI Helpdesk Support System in action:

![Chat Interface](screenshots/sc1.JPG)

![MGMT Chat Interface](screenshots/sc2.JPG)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
# TwinAI Backend API

## Overview
The TwinAI backend API is designed to provide an AI-powered digital twin for productivity automation. This API incorporates features such as scheduling meetings, retrieving unread emails, generating personalized email responses, and creating to-do lists.

## Features
- **AI-Powered Digital Twin**: Interacts with the Gemini AI model to learn from user behavior and enhance productivity.
- **Email Management**: Retrieve unread emails and generate personalized responses.
- **Meeting Scheduling**: Schedule meetings and set reminders efficiently.
- **To-Do List Management**: Create and manage to-do lists to keep track of tasks.

## Project Structure
```
twinAI-backend
├── src
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── utils
│   └── app.js
├── index.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Setup Instructions
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd twinAI-backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   - Create a `.env` file in the root directory based on the `.env.example` file.
   - Add your configuration settings, including API keys and other sensitive information.

4. **Run the Application**:
   ```bash
   npm start
   ```

## Usage
- **API Endpoints**: The API provides various endpoints for interacting with the digital twin functionalities, email management, meeting scheduling, and to-do list management. Refer to the individual route files for detailed endpoint information.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.
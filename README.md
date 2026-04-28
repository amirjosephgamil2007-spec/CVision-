# CVision - CV Screening Application

Welcome to CVision! This application allows you to bulk-upload CVs/Resumes and automatically score and evaluate them against specific Job Profiles using a localized keyword analysis system.

## Getting Started

To run this application on your own domain or local environment, follow these steps:

### Prerequisites

1.  **Node.js**: Ensure you have Node.js installed (v18 or higher recommended).

### Installation

1.  Clone or extract the project files to your desired directory.
2.  Open your terminal, navigate to the project directory, and install the dependencies:
    ```bash
    npm install
    ```

### Running in Development

To start the development server:
```bash
npm run dev
```
The application will launch and be available on your local network (typically `http://localhost:3000`).

### Production Build & Deployment

To build the application for production deployment:
```bash
npm run build
```
Once built, you can start the production server with:
```bash
npm run start
```
For external domains like Vercel, you can simply import the repository and deploy it as normal. Since the system does not use any external API keys, it will work immediately out of the box!

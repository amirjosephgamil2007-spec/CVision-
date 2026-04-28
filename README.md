# CVision - AI-Powered CV Screening Application

Welcome to CVision! This application allows you to bulk-upload CVs/Resumes and automatically score and evaluate them against specific Job Profiles using Google's Gemini AI.

## Getting Started

To run this application on your own domain or local environment, follow these steps:

### Prerequisites

1.  **Node.js**: Ensure you have Node.js installed (v18 or higher recommended).
2.  **API Key**: You need a valid Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  Clone or extract the project files to your desired directory.
2.  Open your terminal, navigate to the project directory, and install the dependencies:
    ```bash
    npm install
    ```

### Environment Configuration

This application securely uses environment variables instead of hard-coded API keys. 

1. Create a `.env` file in the root of your project directory.
2. Open `.env.example` as a reference.
3. Add your Gemini API key to the `.env` file like this:
    ```env
    GEMINI_API_KEY="your_actual_api_key_here"
    ```
*(Note: Never commit your `.env` file to public version control or share it with others.)*

### How to Obtain a Free Gemini API Key

To use the AI evaluation features, you will need a free API key from Google.

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. On the left sidebar, click on **Get API key**.
4. Click the **Create API key** button.
5. Copy the generated key. **Keep this key secure and never share it publicly.**

### Deploying to Vercel (or similar external domains)

If you are deploying this application to a hosting provider like Vercel, you need to securely pass your API key as an environment variable.

1. Push your code to a GitHub repository.
2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** -> **Project**.
3. Import your GitHub repository.
4. In the **Configure Project** section, open the **Environment Variables** dropdown.
5. Add a new variable:
   * **Name**: `GEMINI_API_KEY`
   * **Value**: *(Paste the API key you generated from Google AI Studio)*
6. Click **Deploy**. Vercel will automatically build the app and securely make the API key available to the server.

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
*Note: Make sure your hosting environment has the `GEMINI_API_KEY` configured in its environment variables settings.*

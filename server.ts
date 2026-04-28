import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import * as url from "url";
import mammoth from "mammoth";

// For __dirname in ESM
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // We need to increase the payload size limit since CVs can be slightly large
  app.use(express.json({ limit: "50mb" }));

  // API route
  app.post("/api/analyze-cv", async (req, res) => {
    try {
      const { fileName, fileData, mimeType, profile } = req.body;

      if (!fileData || !profile) {
        return res.status(400).json({ error: "Missing file data or profile." });
      }

      const base64Data = fileData.split(",")[1] || fileData;
      let finalMimeType = mimeType;
      let finalData = base64Data;
      
      const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.toLowerCase().endsWith(".docx");

      if (isDocx) {
        try {
          const buffer = Buffer.from(base64Data, "base64");
          const result = await mammoth.extractRawText({ buffer });
          finalData = Buffer.from(result.value).toString("base64");
          finalMimeType = "text/plain";
        } catch (e) {
          console.error("Mammoth DOCX extraction failed, passing directly.", e);
        }
      } else if (fileName.toLowerCase().endsWith(".pdf") || mimeType === "application/pdf") {
        finalMimeType = "application/pdf";
      } else if (!["application/pdf", "text/plain", "text/csv"].includes(finalMimeType)) {
        finalMimeType = "text/plain";
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are a highly skilled technical recruiter and HR specialist.
Please analyze the provided resume against the following job profile requirements:

Job Title: ${profile.title}
Experience Required: ${profile.experienceLevel || "Not specified"}
Certifications Required: ${profile.certifications || "Not specified"}

Job Description:
${profile.description}

Key Responsibilities/Tasks:
${profile.tasks}

Analyze the candidate's resume completely and accurately. Give a fair, objective assessment based on the actual content of the CV. Do not hallucinate skills they do not have, but do not penalize them unfairly if they use different terminology for the same skills.
Return ONLY a valid JSON object matching the following structure exactly (without formatting markdown like \`\`\`json):

{
  "candidateName": "string (Extract their actual name from the CV text. If not found, use a best guess or 'Unknown')",
  "score": number (1 to 10 integer. Assess how well they match the requirements. 10 is an excellent match, 5 is a partial match, 1 is a very poor match),
  "skillsMatch": number (percentage 0 to 100),
  "strengths": ["string", "string"], (at least 2 to 4 very specific strengths related to the requirements found in the resume)
  "weaknesses": ["string", "string"], (at least 2 to 4 specific gaps, missing certs, or lacks of experience based on requirements)
  "experience": "string", (short summary of their years of experience explicitly found, e.g. '5 years relevant experience')
  "summary": "string" (a detailed 3-4 sentence paragraph summarizing the match accurately, clearly referencing their specific strengths, weaknesses, and qualifications.)
}

If the file appears completely unreadable or devoid of resume content, set score to 1 and explicitly note that the file could not be read in the summary.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          prompt,
          {
            inlineData: {
              data: finalData,
              mimeType: finalMimeType
            }
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const jsonOutput = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(jsonOutput);

      res.json(parsed);

    } catch (error: any) {
      console.error("Analysis Error:", error);
      
      const errorMessage = error?.message || "";
      
      if (errorMessage.includes("API key not valid") || errorMessage.includes("GEMINI_API_KEY is not set")) {
        return res.status(401).json({ 
          error: "Invalid or missing API Key. If you are in AI Studio, click the gear icon in the top right, go to 'Secrets', and provide a valid GEMINI_API_KEY. If deployed, ensure the GEMINI_API_KEY environment variable is set." 
        });
      }
      
      res.status(500).json({ error: "Failed to extract or analyze text. Please check server logs." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

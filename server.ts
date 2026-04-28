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
        const buffer = Buffer.from(base64Data, "base64");
        const result = await mammoth.extractRawText({ buffer });
        finalData = Buffer.from(result.value).toString("base64");
        finalMimeType = "text/plain";
      } else if (!["application/pdf", "text/plain", "text/csv"].includes(mimeType)) {
        finalMimeType = "text/plain";
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are an expert technical recruiter and HR specialist.
Please analyze the provided resume against the following job profile requirements:

Job Title: ${profile.title}
Experience Required: ${profile.experienceLevel || "Not specified"}
Certifications Required: ${profile.certifications || "Not specified"}

Job Description:
${profile.description}

Key Responsibilities/Tasks:
${profile.tasks}

Analyze the candidate's resume carefully. Give a totally objective assessment.
Return ONLY a valid JSON object matching the following structure exactly (without formatting markdown like \`\`\`json):

{
  "candidateName": "string (Extract their actual name from the CV text. If not found, use a best guess or 'Unknown')",
  "score": number (1 to 10 integer. Be very strict. 10 is a perfect match, 5 is average, 1 is terrible),
  "skillsMatch": number (percentage 0 to 100),
  "strengths": ["string", "string"], (at least 2 to 4 very specific strengths related to the requirements)
  "weaknesses": ["string", "string"], (at least 2 to 4 very specific shortcomings, missing certs, or lacks of experience based on requirements)
  "experience": "string", (short summary of their years of experience explicitly found, e.g. '5 years relevant experience')
  "summary": "string" (a detailed 3-4 sentence paragraph summarizing the match, clearly referencing their specific strengths, weaknesses, and qualifications. Mention if they have the required certifications.)
}

If the file seems unreadable or devoid of resume content, set score to 1 and note that in the summary.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
          error: "Invalid or missing Gemini API Key. Please click the gear icon in the top right, go to 'Secrets', and provide a valid GEMINI_API_KEY." 
        });
      }
      
      res.status(500).json({ error: "Failed to extract or analyze text." });
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

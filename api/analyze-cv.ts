import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";

// Config specifically for Vercel serverless functions to allow larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ 
        error: "Missing API Key. Ensure GEMINI_API_KEY is set in Vercel Environment Variables." 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
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

    res.status(200).json(parsed);

  } catch (error: any) {
    console.error("Vercel Analysis Error:", error);
    
    const errorMessage = error?.message || "";
    
    if (errorMessage.includes("API key not valid") || errorMessage.includes("GEMINI_API_KEY is not set")) {
      return res.status(401).json({ 
        error: "Invalid or missing API Key. Please provide a valid GEMINI_API_KEY in Vercel Environment Variables." 
      });
    }
    
    res.status(500).json({ error: "Failed to extract or analyze text. Please check server logs." });
  }
}

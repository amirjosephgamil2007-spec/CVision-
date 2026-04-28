import mammoth from "mammoth";
import pdfParse from "pdf-parse";

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
    
    let extractedText = "No text could be extracted.";
    const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.toLowerCase().endsWith(".docx");
    const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

    const buffer = Buffer.from(base64Data, "base64");

    if (isDocx) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (e) {
        console.error("Mammoth DOCX extraction failed:", e);
      }
    } else if (isPdf) {
      try {
        const result = await pdfParse(buffer);
        extractedText = result.text;
      } catch (e) {
        console.error("PDF-Parse extraction failed:", e);
      }
    } else {
       extractedText = buffer.toString("utf8");
    }

    // Basic keyword extraction & matching logic (Mock AI Evaluation)
    const textToAnalyze = extractedText.toLowerCase();
    const jobDescTokens = (profile.description + " " + profile.tasks + " " + (profile.certifications || "")).toLowerCase().match(/\b\w+\b/g) || [];
    
    // Filter out common stop words
    const stopWords = ['and', 'the', 'is', 'in', 'at', 'of', 'for', 'to', 'with', 'a', 'on', 'this'];
    const keywords = [...new Set(jobDescTokens.filter((w: string) => !stopWords.includes(w) && w.length > 3))];
    
    let matchedKeywords = 0;
    let strengths: string[] = [];
    let weaknesses: string[] = [];

    for (const kw of keywords) {
      if (textToAnalyze.includes(kw)) {
        matchedKeywords++;
        if (strengths.length < 4 && Math.random() > 0.5) {
          strengths.push(`Experience with ${kw}`);
        }
      } else {
        if (weaknesses.length < 4 && Math.random() > 0.7) {
          weaknesses.push(`Lacks explicit mention of ${kw}`);
        }
      }
    }

    if (strengths.length === 0) strengths.push("Basic communication skills");
    if (weaknesses.length === 0) weaknesses.push("May need more specific domain experience");

    const matchRatio = keywords.length > 0 ? (matchedKeywords / keywords.length) : Math.random(); 
    let score = Math.floor(matchRatio * 10) + 2; 
    if (score > 10) score = 10;
    if (score < 1) score = 1;

    const skillsMatch = Math.floor((score / 10) * 100);
    let candidateName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

    const resultJSON = {
      candidateName,
      score,
      skillsMatch,
      strengths,
      weaknesses,
      experience: "Found relevant experience based on keywords.",
      summary: `The candidate demonstrates a ${skillsMatch}% match based on localized keyword crossover. They possess strengths like ${strengths.slice(0, 2).join(', ')}, but might need to demonstrate more in ${weaknesses.slice(0, 2).join(', ')}. Overall, they score a ${score}/10 against the provided job profile.`
    };

    res.status(200).json(resultJSON);

  } catch (error: any) {
    console.error("Vercel Analysis Error:", error);
    res.status(500).json({ error: "Failed to extract or analyze text. Please check server logs." });
  }
}

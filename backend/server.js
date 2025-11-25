import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// Using the native global fetch API available in Node.js v18+

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Using a modern, available Gemini model and the standard :generateContent endpoint.
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

app.post("/chat", async (req, res) => {
  const { messages, mood } = req.body;
  
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Define the System Instruction string
  const systemInstructionString = 
    `You are MoodBuddy, a warm emotional support companion. ` +
    `You are NOT a therapist. Keep replies gentle, short, and kind. ` +
    `The user's detected mood is: ${mood}.`;
    
  // 2. Convert user/bot messages into the 'contents' array structure
  const contents = messages.map((m) => ({
    role: m.sender === "user" ? "user" : "model", // 'model' is used for previous AI turns
    parts: [{ text: m.text }],
  }));

  // --- FIX: STRUCTURE systemInstruction as a Content Object ---
  const structuredSystemInstruction = {
    parts: [{ text: systemInstructionString }],
  };

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        // Use the newly structured object for the systemInstruction field
        systemInstruction: structuredSystemInstruction, 
      }),
    });

    const data = await response.json();

    console.log("RAW GEMINI RESPONSE:", JSON.stringify(data, null, 2));

    // Check for explicit API error response structure
    if (data.error) {
        console.error("Gemini API Error:", data.error.message);
        return res.status(data.error.code || 500).json({ 
            reply: `API Error: ${data.error.message}. Check your API Key and Model availability.`
        });
    }

    // Check for standard successful response (candidates array)
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      // Handle cases where response is empty or unexpected but not a formal error object
      return res.json({ reply: "Hmm… I didn’t catch that. Try again?" });
    }

    const aiReply = data.candidates[0].content.parts[0].text;
    res.json({ reply: aiReply });

  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ reply: "Server error contacting Gemini." });
  }
});

app.listen(5000, () =>
  console.log("Bison backend running at http://localhost:5000")
);
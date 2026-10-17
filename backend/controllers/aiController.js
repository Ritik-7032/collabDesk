const genAI = require("../config/gemini");

const generateSubtasks = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    let subtasks = [];
    let isFallback = false;

    // Attempt generation via verified active Google Gemini 3.8 Flash model
    if (
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== "mock_key" &&
      process.env.GEMINI_API_KEY !== "dummy_gemini_test_key"
    ) {
      try {
        const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `Break down this task into 4-6 short, actionable subtasks. Task: "${description}". Return ONLY a JSON array of strings, no other text. Example format: ["Subtask 1", "Subtask 2"]`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          subtasks = JSON.parse(jsonMatch[0]);
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to resilient template decomposition:", geminiError.message);
      }
    }

    // Explicitly tracked graceful fallback for test environments or API rate-limit spikes
    if (!subtasks || subtasks.length === 0) {
      isFallback = true;
      subtasks = [
        `Analyze and scope deliverables for: ${description.slice(0, 40)}`,
        "Implement core component logic and interface contracts",
        "Add comprehensive validation and unit tests",
        "Review edge cases and deploy to staging",
      ];
    }

    res.json({ subtasks, isFallback });
  } catch (error) {
    console.error("AI generation error:", error.message);
    res.status(500).json({ message: error.message || "Failed to generate subtasks" });
  }
};

module.exports = {
  generateSubtasks,
};

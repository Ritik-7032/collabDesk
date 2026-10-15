const genAI = require("../config/gemini");

const generateSubtasks = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const prompt = `Break down this task into 4-6 short, actionable subtasks. Task: "${description}". Return ONLY a JSON array of strings, no other text. Example format: ["Subtask 1", "Subtask 2"]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse subtasks from AI response");
    }
    const subtasks = JSON.parse(jsonMatch[0]);

    res.json({ subtasks });
  } catch (error) {
    console.error("AI generation error:", error.message);
    res.status(500).json({ message: error.message || "Failed to generate subtasks" });
  }
};

module.exports = {
  generateSubtasks,
};

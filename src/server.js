require("dotenv").config();
const express = require("express");
const { generateFlashcard } = require("./generate-flashcard");
const fs = require("fs");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Add this line to serve static files from the public directory
app.use(express.static("public"));

const outputDir = path.join(__dirname, "..", "flashcards_output");
const allFlashcards = [];

try {
  const existingData = fs.readFileSync(
    path.join(outputDir, "all_flashcards.json")
  );
  allFlashcards.push(...JSON.parse(existingData));
} catch (error) {
  // File doesn't exist yet, that's okay
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

app.post("/generate-flashcard", async (req, res) => {
  try {
    const { word } = req.body;

    // Validate request body
    if (!word) {
      return res.status(400).json({
        error: "Missing required fields: word is required",
      });
    }

    // Generate flashcard using existing function
    const flashcard = await generateFlashcard(word);

    // Save to array and file
    allFlashcards.push(flashcard);
    fs.writeFileSync(
      path.join(outputDir, "all_flashcards.json"),
      JSON.stringify(allFlashcards, null, 2)
    );

    res.json(flashcard);
  } catch (error) {
    console.error("Error generating flashcard:", error);
    res.status(500).json({
      error: "Failed to generate flashcard",
      message: error.message,
    });
  }
});

app.get("/flashcards", (req, res) => {
  res.json(allFlashcards);
});

app.post("/generate-flashcards-common-words", async (req, res) => {
  try {
    const portugueseWords = JSON.parse(
      fs.readFileSync("portuguese-words.json", "utf8")
    );

    const outputDir = "./flashcards_output";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const allFlashcards = [];

    // Get all words from portugueseWords
    for (let i = 0; i < portugueseWords.length; i++) {
      const { word, type } = portugueseWords[i];
      console.log(`Generating flashcard for: ${word}`);

      try {
        const flashcard = await generateFlashcard(word, type);
        allFlashcards.push(flashcard);

        // Write to file after each successful generation
        const combinedFilename = `${outputDir}/all_flashcards.json`;
        fs.writeFileSync(
          combinedFilename,
          JSON.stringify(allFlashcards, null, 2)
        );
        console.log(`Updated combined flashcards in ${combinedFilename}`);

        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `Failed to generate flashcard for ${word}:`,
          error.message
        );
      }
    }

    res.json({
      message: "Flashcard generation completed",
      totalCards: allFlashcards.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate flashcards",
      message: error.message,
    });
  }
});

app.get("/view", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

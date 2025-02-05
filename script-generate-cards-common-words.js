require("dotenv").config();

const fs = require("fs");
const { generateFlashcard } = require("./src/generate-flashcard");

// Read Portuguese words from JSON file
const portugueseWords = JSON.parse(
  fs.readFileSync("portuguese-words.json", "utf8")
);

async function main() {
  // Create output directory if it doesn't exist
  const outputDir = "./flashcards_output";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Array to store all flashcards
  const allFlashcards = [];

  // Process first 5 words as a test (change the limit as needed)
  for (let i = 0; i < portugueseWords.length; i++) {
    const { word, type } = portugueseWords[i];
    console.log(`Generating flashcard for: ${word}`);

    try {
      const flashcard = await generateFlashcard(word, type);
      allFlashcards.push(flashcard);
      const combinedFilename = `${outputDir}/all_flashcards.json`;
      fs.writeFileSync(
        combinedFilename,
        JSON.stringify(allFlashcards, null, 2)
      );
      console.log(`Updated combined flashcards in ${combinedFilename}`);

      // Add a small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to generate flashcard for ${word}:`, error.message);
    }
  }
}

main().catch(console.error);

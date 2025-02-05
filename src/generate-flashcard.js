require("dotenv").config();

const fs = require("fs");
const { z } = require("zod");
const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const { writeFileSync } = require("fs");
const path = require("path");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const Flashcard = z.object({
  word: z.string(),
  pronunciation: z.string(),
  definition: z.string(),
  example_sentence: z.string(),
  sentence_translation: z.string(),
  notes: z.string(),
  audio_european: z.string(),
  audio_brazilian: z.string(),
});

async function generateFlashcard(word, type = "") {
  const client = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  try {
    const response = await client.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "user",
          content: `Create a detailed Portuguese language flashcard for the word "${word}" (${type}). 

          Return a JSON object with the following fields:
          {
            "word": "The Portuguese word itself",
            "pronunciation": "A simple phonetic guide using English sounds (e.g., 'gato' -> 'gah-too')",
            "definition": "A clear and concise definition in Portuguese",
            "example_sentence": "A natural, intermediate-level sentence using the word in context",
            "sentence_translation": "English translation of the example sentence",
            "notes": "In English. Include: common usage patterns, formality level, and any Brazilian vs European Portuguese differences. Keep it short and concise. ",
            "audio_european": "Base64 encoded audio of European Portuguese pronunciation (leave empty for now)",
            "audio_brazilian": "Base64 encoded audio of Brazilian Portuguese pronunciation (leave empty for now)"
          }
          
          Ensure the example sentence is natural and provides good context for the word's usage.`,
        },
      ],
      response_format: zodResponseFormat(Flashcard, "create_flashcard"),
    });

    const flashcard = response.choices[0].message.parsed;
    if (!flashcard) {
      throw new Error("No flashcard data received");
    }

    // Generate European Portuguese audio
    const europeanAudio = await client.chat.completions.create({
      model: "gpt-4o-audio-preview",
      modalities: ["text", "audio"],
      audio: { voice: "alloy", format: "wav" },
      messages: [
        {
          role: "user",
          content: `Pronounce this Portuguese word with a European Portuguese accent: ${word}`,
        },
      ],
      store: true,
    });

    // Generate Brazilian Portuguese audio
    const brazilianAudio = await client.chat.completions.create({
      model: "gpt-4o-audio-preview",
      modalities: ["text", "audio"],
      audio: { voice: "alloy", format: "wav" },
      messages: [
        {
          role: "user",
          content: `Pronounce this Portuguese word with a Brazilian Portuguese accent: ${word}`,
        },
      ],
      store: true,
    });

    // Create audio directory if it doesn't exist
    const audioDir = path.join("public", "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Save audio files with meaningful names
    const sanitizedWord = word.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const europeanAudioPath = `${sanitizedWord}_european.wav`;
    const brazilianAudioPath = `${sanitizedWord}_brazilian.wav`;

    // Save audio files to public directory
    fs.writeFileSync(
      path.join(audioDir, europeanAudioPath),
      Buffer.from(europeanAudio.choices[0].message.audio.data, "base64")
    );
    fs.writeFileSync(
      path.join(audioDir, brazilianAudioPath),
      Buffer.from(brazilianAudio.choices[0].message.audio.data, "base64")
    );

    // Store URLs instead of base64 data
    flashcard.audio_european = `/audio/${europeanAudioPath}`;
    flashcard.audio_brazilian = `/audio/${brazilianAudioPath}`;

    return flashcard;
  } catch (error) {
    console.error("Error generating flashcard:", error.message);
    throw error;
  }
}

module.exports = { generateFlashcard };

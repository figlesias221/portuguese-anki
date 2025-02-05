const axios = require("axios");
const cheerio = require("cheerio");

// URL of the page to scrape
const url =
  "https://travelwithlanguages.com/blog/most-common-portuguese-words.html";

// Function to scrape the words
async function scrapeWords() {
  try {
    // Fetch the HTML of the page
    const { data } = await axios.get(url);

    // Load the HTML into cheerio
    const $ = cheerio.load(data);

    // Array to store the words
    const words = [];

    // Select all li elements and extract vocab and pos
    $("#main-list li").each((index, element) => {
      const word = $(element).find("span.vocab").text().trim();
      const type = $(element).find("span.pos").text().trim();

      if (word && type) {
        words.push({
          word: word,
          type: type,
        });
      }
    });

    // Save to JSON file
    const fs = require("fs");
    fs.writeFileSync("portuguese-words.json", JSON.stringify(words, null, 2));

    console.log("Scraped Words:", words);
    console.log("Words saved to portuguese-words.json");
    return words;
  } catch (error) {
    console.error("Error scraping words:", error);
  }
}

// Execute the scraper
scrapeWords();

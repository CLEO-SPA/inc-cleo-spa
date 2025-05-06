import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import Papa from 'papaparse';
import axios from 'axios';
import { performance } from 'perf_hooks';
import pool from '../config/database.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIRECTORY_PATH = path.join(__dirname, '../csv_files');
const SCHEMA_FILE_PATH = path.join(__dirname, '../prisma/schema.prisma');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL_NAME = 'deepseek/deepseek-chat:free';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_AI_CALLS = 50; // Increased limit for potentially longer SQL
const CONTINUE_MARKER = '-- SQL_CONTINUE_MARKER';

// --- Helper Functions ---
async function readAllCsvsInDirectory(dirPath) {
  console.log(`Reading all CSV files from directory: ${dirPath}`);
  const allCsvData = [];
  try {
    const files = await fs.readdir(dirPath);
    const csvFiles = files.filter((file) => path.extname(file).toLowerCase() === '.csv');

    if (csvFiles.length === 0) {
      console.warn(`No CSV files found in directory: ${dirPath}`);
      return [];
    }
    console.log(`Found CSV files: ${csvFiles.join(', ')}`);

    for (const fileName of csvFiles) {
      const filePath = path.join(dirPath, fileName);
      console.log(`Reading CSV file: ${filePath}`);
      try {
        const csvContent = await fs.readFile(filePath, 'utf8');
        const parseResult = Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0) {
          console.error(`Errors parsing CSV ${fileName}:`, parseResult.errors);
          continue;
        }

        if (parseResult.data.length > 0) {
          const headers = Object.keys(parseResult.data[0]).join(', ');
          allCsvData.push({
            fileName: fileName,
            data: parseResult.data,
            headers: headers,
          });
          console.log(`Successfully parsed ${parseResult.data.length} rows from ${fileName}.`);
        } else {
          console.log(`CSV file ${fileName} is empty or has only headers.`);
        }
      } catch (fileError) {
        console.error(`Error reading or parsing CSV file ${fileName}:`, fileError);
      }
    }
  } catch (dirError) {
    console.error(`Error reading directory ${dirPath}:`, dirError);
    throw dirError;
  }
  console.log(`Finished reading ${allCsvData.length} valid CSV files.`);
  return allCsvData;
}

async function readSchemaFile(filePath) {
  console.log(`Reading Prisma schema file from: ${filePath}`);
  try {
    const schemaContent = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read Prisma schema file.');
    return schemaContent;
  } catch (error) {
    console.error(`Error reading schema file ${filePath}:`, error);
    throw error;
  }
}

async function callOpenRouterAI(allCsvData, schemaContent) {
  console.log('Preparing data from multiple CSVs and calling OpenRouter AI using Axios...');

  if (!allCsvData || allCsvData.length === 0) throw new Error('No valid CSV data provided.');
  if (!schemaContent) throw new Error('Schema content is empty or invalid.');
  if (OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY') {
    console.warn('Warning: OpenRouter API Key is not set. Using placeholder.');
  }

  let csvDataPromptSection = '';
  for (const csvInfo of allCsvData) {
    if (!csvInfo.data || csvInfo.data.length === 0) continue;
    const sampleRows = csvInfo.data.map((row) => Object.values(row).join(', ')).join('\n');
    csvDataPromptSection += `
            **CSV File: ${csvInfo.fileName}**
            Headers: ${csvInfo.headers}
            \`\`\`csv
            ${sampleRows}
            \`\`\`
        `;
  }

  if (!csvDataPromptSection) {
    throw new Error('No data found in any of the provided CSV files to generate a prompt.');
  }

  let completeSql = '';
  let currentPrompt = '';
  let callCount = 0;
  let continueProcessing = true;
  let previousContentForContext = '';

  const initialPrompt = `
        You are an expert SQL generator familiar with Prisma schemas.
        Your task is to generate SQL statements to import all data from multiple CSV files into a database defined by the provided Prisma schema.

        **Prisma Schema:**
        \`\`\`prisma
        ${schemaContent}
        \`\`\`

        **CSV Data Snippets:**
        ${csvDataPromptSection}

        **Instructions:**
        1. Analyze the headers and sample data for **each** CSV file provided above.
        2. Compare the structure of each CSV with the models defined in the Prisma schema. (Note: The CSV headers may not match the Prisma model field names exactly.)
        3. Determine the appropriate target table (Prisma model) for the data from each CSV file.
        4. **Crucially, analyze the relationships (@relation) defined in the Prisma schema to understand foreign key constraints.**
        5. Generate the necessary SQL statements to insert the data from **all** CSV files into their corresponding tables.
            * **Generate INSERT statements in the correct order to satisfy foreign key constraints.** Data for tables referenced by foreign keys must be inserted *before* the data for the tables that reference them.
            * if a data is missing in the CSV, come up with a creative solution to fill the gaps, such as using a default value or generating a random value or text.
            * Assume the AI needs to map CSV columns to table columns based on the headers and schema field names.
        6. **Output ONLY the raw SQL code.** Do not include any explanations, introductions, summaries, or markdown formatting. Just the complete, ordered SQL script.
        7. **Handling Limits:** If the complete SQL script (including all CREATEs and INSERTs in the correct order) is too long for a single response, generate as much as possible and end your response *exactly* with the marker: ${CONTINUE_MARKER}
           Do NOT add the marker if the SQL is complete in this response.

        **Output Format:**
        Raw SQL code only (potentially spanning multiple responses). If incomplete, end with ${CONTINUE_MARKER}
    `;
  currentPrompt = initialPrompt;

  // --- Looping API Calls ---
  while (continueProcessing && callCount < MAX_AI_CALLS) {
    callCount++;
    console.log(`\n--- Making AI Call #${callCount} ---`);

    const requestBody = {
      model: AI_MODEL_NAME,
      messages: [{ role: 'user', content: currentPrompt }],
      //   max_tokens: 2000,
    };

    const requestHeaders = {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      // OpenRouter specific headers (optional)
      // 'HTTP-Referer': $YOUR_SITE_URL,
      // 'X-Title': $YOUR_SITE_NAME,
    };

    try {
      const response = await axios.post(OPENROUTER_API_URL, requestBody, { headers: requestHeaders });

      const responseData = response.data;
      const aiMessage = responseData.choices?.[0]?.message?.content;

      if (!aiMessage) {
        console.error('Could not extract AI message from response:', responseData);
        throw new Error('Invalid response structure from AI API.');
      }

      let currentSqlChunk = aiMessage.trim();
      console.log(`Received response chunk from AI (length: ${currentSqlChunk.length}).`);

      if (currentSqlChunk.endsWith(CONTINUE_MARKER)) {
        console.log('Continuation marker found. Preparing for next call.');
        currentSqlChunk = currentSqlChunk.slice(0, -CONTINUE_MARKER.length).trimEnd();
        completeSql += currentSqlChunk + '\n\n';
        continueProcessing = true;
        previousContentForContext = currentSqlChunk;

        currentPrompt = `
                    ${CONTINUE_MARKER}
                    You previously generated the following SQL chunk (do not repeat it, just continue from where you stopped):
                    \`\`\`sql
                    ... ${previousContentForContext.slice(-300)}
                    \`\`\`
                    Please continue generating the *rest* of the required SQL statements based on the original request (schema and multiple CSV data provided initially), ensuring correct insertion order for foreign keys.
                    Remember to ONLY output raw SQL.
                    If the remaining SQL is still too long, end this response *exactly* with the marker: ${CONTINUE_MARKER}
                    Do not add the marker if the SQL generation is now complete.
                `;
      } else {
        console.log('Continuation marker NOT found. Assuming generation is complete.');
        completeSql += currentSqlChunk;
        continueProcessing = false;
      }
    } catch (error) {
      console.error(`Error during AI call #${callCount}:`);

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error Status:', error.response.status);
        console.error('Error Headers:', error.response.headers);
        console.error('Error Data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error Request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error Message:', error.message);
      }
      throw error; // Re-throw the error to stop the process
    }
  }

  if (callCount >= MAX_AI_CALLS && continueProcessing) {
    console.warn(
      `Reached maximum AI calls (${MAX_AI_CALLS}) but continuation marker was still present. The generated SQL might be incomplete.`
    );
  }

  console.log('Finished processing AI calls.');
  globalCallCount = callCount;
  return completeSql.trim();
}

// --- Main Execution Logic ---
let globalCallCount = 0; // Variable to store call count for logging

async function main() {
  const startTime = performance.now(); // Record start time
  let endTime;
  let duration;

  try {
    const schemaContent = await readSchemaFile(path.resolve(SCHEMA_FILE_PATH));

    const allCsvData = await readAllCsvsInDirectory(path.resolve(CSV_DIRECTORY_PATH));

    if (!allCsvData || allCsvData.length === 0) {
      console.log('No valid CSV data found in the directory. Exiting.');
      return;
    }

    const suggestedSql = await callOpenRouterAI(allCsvData, schemaContent);

    // 4. -- Review ---
    console.log(
      `\n---\n🤖 AI Suggested SQL (Combined from ${globalCallCount} call(s) for ${allCsvData.length} CSVs):\n---\n`
    );
    console.log(suggestedSql);
    console.log(
      '\n---\nReminder: This script does NOT execute the SQL. Review relationships, insertion order, and correctness manually before execution.\n---'
    );

    // 5. (Placeholder) Execute SQL
    // ...

    endTime = performance.now();
    duration = (endTime - startTime) / 1000;
    console.log(`\n--- Script finished successfully in ${duration.toFixed(2)} seconds. ---`);
  } catch (error) {
    endTime = performance.now();
    duration = (endTime - startTime) / 1000;
    console.error('\n--- An error occurred during the process: ---');
    if (!error.response && !error.request) {
      console.error(error.message);
    }
    console.error(error.stack);
    console.error(`\n--- Script failed after ${duration.toFixed(2)} seconds. ---`);
  }
}

main();

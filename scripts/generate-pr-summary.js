const { Octokit } = require("@octokit/rest");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_TITLE = process.env.PR_TITLE;
const PR_BODY = process.env.PR_BODY;
const PR_NUMBER = process.env.PR_NUMBER;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

if (!OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY environment variable is not set.");
  process.exit(1);
}

if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN environment variable is not set.");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

const BOT_SUMMARY_START_MARKER = "<!-- BOT_SUMMARY_START -->";
const BOT_SUMMARY_END_MARKER = "<!-- BOT_SUMMARY_END -->";

async function callOpenRouter(prompt) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    return `Error generating summary: ${error.message}`;
  }
}

async function getPullRequestCommits(owner, repo, pull_number) {
  try {
    const { data: commits } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number,
    });
    // Return both message and the first 7 characters of the SHA
    return commits.map((commit) => ({
      message: commit.commit.message,
      sha: commit.sha.substring(0, 7), // Get short SHA
    }));
  } catch (error) {
    console.error("Error fetching PR commits:", error);
    return [];
  }
}

async function generatePrSummary() {
  const commitsData = await getPullRequestCommits(REPO_OWNER, REPO_NAME, PR_NUMBER);
  const formattedCommitMessages =
    commitsData.length > 0
      ? commitsData.map((commit, index) => `Commit ${index + 1} (SHA: ${commit.sha}):\n${commit.message}`).join("\n\n")
      : "No commit messages found for this PR.";

  const comprehensivePrompt = `You are a helpful assistant that generates comprehensive GitHub Pull Request descriptions in Markdown format.

Based on the following Pull Request details:
PR Title: "${PR_TITLE}"
PR Body (if any):
${PR_BODY ? PR_BODY : "No additional body provided."}
Commit Messages:
${formattedCommitMessages}

Please generate a PR description that strictly follows this Markdown template.
Fill in the sections for "Summary" and "Changes Made" based on the PR details and commit messages.
For all other sections, reproduce the provided text and structure exactly.

Here is the template:

## Summary
[Generate a concise summary of the PR's purpose here. Focus on what is being added, changed, or fixed, and the overall goal and impact of the PR. This summary should be based on the PR title, body, and commit messages.]

## Related Issue
- Link to the related Jira ticket
- Link to UCD of this feature

## Changes Made
[Based on the PR title, body, and commit messages, list the major changes made in bullet points with SHA in bracket. Consider new endpoints, components, significant refactors, or bug fixes.]
For example:
- Added new user authentication endpoint (\`/api/auth/register\`) (SHA: f123abc)
- Refactored the main data processing logic for improved efficiency (SHA: d456efg)
- Fixed a bug in the user profile display (SHA: h789ijk)

## Screenshots / UI Changes (if any)
Include screenshots, or screen recordings to show UI/UX changes.

## Database Changes (if applicable)
- Before: Pre Database condition
- After: Post Database condition

## How to Test
- Steps for manual testing

## Checklist
- [ ] Code runs and builds without errors
- [ ] Functionality works according to the related UCD main/alt paths
- [ ] UCD pre database condition and post database condition are clearly stated in the PR (if applicable)
- [ ] Naming conventions followed:
    - [ ] React component and file names are in PascalCase
    - [ ] API route URLs use kebab-case (e.g., \`/get-user-profile\`)
    - [ ] JSON keys use camelCase
- [ ] Git commit messages are clear and follow present-tense format (e.g., "Add login validation")
- [ ] Manual testing done and steps documented under **How to Test**
- [ ] Screenshots or recordings added if UI is affected

Ensure the entire output is valid Markdown and precisely matches the structure and static content of the template provided above.
The content for "Summary" and "Changes Made" should be dynamically generated.
`;

  // Call the LLM once with the comprehensive prompt
  const prSummaryContent = await callOpenRouter(comprehensivePrompt);

  // Wrap the generated content with markers
  const prSummaryMarkdownWithMarkers = `${BOT_SUMMARY_START_MARKER}\n${prSummaryContent}\n${BOT_SUMMARY_END_MARKER}`;

  // Output the generated Markdown (with markers) to stdout
  console.log(prSummaryMarkdownWithMarkers);
}

generatePrSummary();

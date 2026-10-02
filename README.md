# @shashwatgtmalpha/craft-content-mcp v2.2.17
**CRAFT Content Framework MCP Server**: a complete redesign with user-centric inputs, actual content analysis, and a structured draft with placeholders for each output.

## Use it hosted (no install)

Add `https://craft-content.gtmhelix.com/mcp` to Claude or ChatGPT as a custom connector. It needs no sign-in and always runs the newest version (2.2.17). The same tools run as a free web app with a form per tool at https://craft-content.gtmhelix.com/, and the setup steps are at https://craft-content.gtmhelix.com/connect/.

The npm package below is an older version (2.0.1 on npm on 27 September 2026) until the next npm release. Use it only if you need a local stdio server.


## Design Philosophy

Every tool was redesigned using **chain of thought from the user's perspective**:

1. **What does the user actually want?** (Not what looks impressive in a demo)
2. **What do they already know?** (Keep inputs simple: don't ask for things they need to figure out)
3. **Does the output save them work?** (A structured draft with placeholders, not a blank template)

## What's New in v2.0.0

| Tool | Before | After |
|------|--------|-------|
| **thought_leadership_series** | 200-300 word posts with `[Expand]` placeholders | **Byline article drafts of about 600 to 800 words**, with placeholders to complete before publishing |
| **craft_content_improver** | Blank scorecard output | **Actually analyzes** content, scores dimensions, generates improved version |
| **case_study_generator** | Requires full story | **Discovery mode**: generates interview questions if you don't have the story |
| **sales_enablement_content** | Generic pitches | **Objection-mapped handlers** with your proof points |
| newsletter_builder | Good | Enhanced with A/B subject lines, 4 hooks, segment targeting |
| webinar_script | Good | Type-specific structures (demo vs educational vs panel) |
| content_repurposer | Excellent | Kept: transforms to 10 formats |
| testimonial_capture | Excellent | Kept: request emails, interview guides |

## Installation

```bash
npm install -g @shashwatgtmalpha/craft-content-mcp
```

Or add to Claude Desktop config:

```json
{
  "mcpServers": {
    "craft-content": {
      "command": "npx",
      "args": ["-y", "@shashwatgtmalpha/craft-content-mcp"]
    }
  }
}
```

## Tools and inputs

Generated on 27 September 2026 from the server's own tool list and checked again on 2 October 2026 against `tools/list` of craft-content-mcp 2.2.17 (the same code as the hosted MCP address), so every tool name, title, description and input below is exactly what the server accepts. Every tool is read-only.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `case_study_generator` | Case Study Generator | Build a customer case study from the challenge, solution and results you give (mode full), or an interview kit to collect them (mode discovery). Every result you list is kept, sector notes and questions are added when the sector can be read from your text, and a bracket marks anything you did not give. |
| 2 | `newsletter_builder` | Newsletter Builder | Build a newsletter draft: subject lines that use your full topic, hooks, key points, your own call to action as the button, and sector notes. Without key points it suggests five from the topic and sector. Statistics and stories are bracket prompts, never invented. |
| 3 | `webinar_script` | Webinar Script | Write a webinar run of show and script for your topic, audience, type and duration: speakers as you list them, polls with answer options, content blocks with sector points, anticipated questions and follow-up emails. Without key takeaways it suggests them from the topic and type. |
| 4 | `content_repurposer` | Content Repurposer | Turn a source text into formats such as a LinkedIn post, an X thread, an email, a blog summary and quote cards (five by default). Key points are whole sentences chosen from your source by a stated rule and kept in its order; quote cards are never cut mid-sentence; the brand voice sets the closing line. |
| 5 | `thought_leadership_series` | Thought Leadership Series | Write outlines of thought leadership articles (600 to 800 words each once expanded) from your topic, your take (quoted as you wrote it), the reader and your proof points. Each article follows its own angle and leads with a different proof point. Without proof points it suggests evidence to gather. Brackets mark what only you can supply. |
| 6 | `testimonial_capture` | Testimonial Capture | Prepare a testimonial request: the request email, interview questions for the customer's role and sector, quote drafts for the customer to edit, and a sign-off checklist. Uses your product name when you give it, and says so when you do not. |
| 7 | `sales_enablement_content` | Sales Enablement Content | Build a sales kit: pitch order, a script for each objection (each answered with the sector's pattern and the proof point that fits it), competitor responses, discovery questions and follow-up templates. Without objections it suggests the ones your sector raises. |
| 8 | `craft_content_improver` | CRAFT Content Improver | Check pasted copy against listed rules (buzzwords, claims that need proof, fragments, unfilled merge fields, claims about the reader, a missing figure or ask), score each area with every deduction quoted from your text, and return the edits it made. If it finds no edit to make, it says so and prints no improved version. |

### Inputs of each tool

#### 1. Case Study Generator (`case_study_generator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customer_name` | Yes | string | Customer/company name |
| `your_product` | Yes | string | Your product/service name |
| `customer_industry` | No | string | Customer's industry for context |
| `mode` | No | one of: `full`, `discovery` | full = generate case study (requires challenge/solution/results), discovery = generate interview questions to gather story |
| `interview_notes` | No | string | Optional: Raw interview notes or transcript. Used for a missing challenge, solution or results when mode is 'full'; named as not used when you gave all three |
| `challenge` | No | string | The customer's challenge/problem (required for full mode) |
| `solution` | No | string | How your product solved it (required for full mode) |
| `results` | No | string | Quantifiable outcomes, one per line or per semicolon (required for full mode) |
| `customer_quote` | No | string | Optional: Direct quote from customer |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |

#### 2. Newsletter Builder (`newsletter_builder`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | Main topic/theme of the newsletter |
| `cta_goal` | Yes | string | What action should readers take? (e.g., 'register for the webinar', 'book a 20-minute call', 'read the guide') |
| `key_points` | No | string | Optional: key points to cover, one per line, per semicolon or comma-separated. If not provided, the tool suggests 5 points based on the topic and newsletter type |
| `audience_segment` | No | one of: `executives`, `practitioners`, `technical`, `general`, `prospects`, `customers` | Audience segment affects tone and depth |
| `newsletter_type` | No | one of: `educational`, `product_update`, `industry_news`, `thought_leadership`, `curated_links` | Type of newsletter |
| `tone` | No | one of: `professional`, `conversational`, `authoritative`, `friendly`, `urgent` | Writing tone |
| `previous_topics` | No | string | Optional: Recent newsletter topics to avoid repetition and suggest connections |
| `your_product` | No | string | Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder. |

#### 3. Webinar Script (`webinar_script`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | Webinar topic/title |
| `target_audience` | Yes | string | Who will attend (e.g., 'Support leaders at consumer apps') |
| `webinar_type` | Yes | one of: `educational`, `product_demo`, `panel_discussion`, `customer_story`, `workshop`, `ama` | Type of webinar determines structure |
| `duration` | No | one of: `30_min`, `45_min`, `60_min`, `90_min` | Webinar length |
| `key_takeaways` | No | string | Optional: 3-5 things attendees should learn, one per line, per semicolon or comma-separated. If not provided, they are suggested from the topic |
| `speakers` | No | string | Optional: speakers as you want them listed. Separate speakers with semicolons or line breaks ('Name, Title; Name, Title'), or with commas if each is one phrase |
| `include_polls` | No | boolean | Include interactive poll suggestions |
| `product_mention_level` | No | one of: `none`, `subtle`, `moderate`, `heavy` | Whether to add product tie-in placeholders to the script ('none' leaves them out) |
| `your_product` | No | string | Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder. |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |

#### 4. Content Repurposer (`content_repurposer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `source_content` | Yes | string | Original content to repurpose (blog post, article, transcript, etc.) |
| `source_type` | Yes | one of: `blog_post`, `webinar_transcript`, `podcast_transcript`, `whitepaper`, `case_study`, `research_report`, `presentation` | What type of content is the source |
| `target_formats` | No | string | Optional: formats to generate, comma-separated. Defaults to: linkedin_post, twitter_thread, email, blog_summary, quote_cards. Other options: infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section. A name outside this list is reported, not written |
| `brand_voice` | No | one of: `professional`, `casual`, `authoritative`, `friendly`, `bold` | Brand voice to maintain |
| `key_message` | No | string | Optional: Core message to emphasize across all formats |

#### 5. Thought Leadership Series (`thought_leadership_series`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | The topic you want to establish authority on |
| `your_take` | Yes | string | Your unique perspective or opinion on this topic. What do you believe that others don't? What's your contrarian view? |
| `target_reader` | Yes | string | Who should read this? Be specific (e.g., 'Heads of IT at companies with many branches' not just 'managers') |
| `proof_points` | No | string | Optional: evidence supporting your take: personal stories, client examples, data or stats, one per line, per semicolon or comma-separated. If not provided, proof points to gather are suggested |
| `author_background` | No | string | Optional: Your role and why you're credible (e.g., '15 years in enterprise sales') |
| `num_articles` | No | number (1 or more) | Number of articles to generate (1-5) |
| `article_type` | No | one of: `contrarian`, `how_to`, `lessons_learned`, `prediction`, `framework` | Style of articles |

#### 6. Testimonial Capture (`testimonial_capture`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customer_name` | Yes | string | Customer name |
| `customer_company` | Yes | string | Customer's company |
| `success_story` | Yes | string | Brief description of their success with your product |
| `testimonial_type` | Yes | one of: `written_quote`, `video_interview`, `case_study_interview`, `g2_review`, `reference_call` | Type of testimonial needed |
| `customer_role` | No | string | Customer's job title |
| `relationship_context` | No | string | How long they've been a customer, key interactions |
| `use_case` | No | string | Where will this testimonial be used? (website, sales deck, etc.) |
| `incentive` | No | string | Optional: What you're offering in return |
| `your_product` | No | string | Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder. |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |

#### 7. Sales Enablement Content (`sales_enablement_content`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product` | Yes | string | Product name and what it does |
| `target_persona` | Yes | string | Who sales is pitching to (role, company type) |
| `proof_points` | Yes | string | Evidence for claims: case studies, metrics, quotes, one per line, per semicolon or comma-separated |
| `common_objections` | No | string | Optional: sales objections you hear, one per line, per semicolon or comma-separated. If not provided, likely objections for your sector are suggested |
| `value_props` | No | string | Optional: key value propositions, one per line, per semicolon or comma-separated. Taken from the proof points if not provided |
| `competitor_objections` | No | string | Optional: 'Why not [competitor]' objections |
| `price_context` | No | string | Optional: Your pricing vs market (e.g., 'Premium, 20% above market', 'Budget option', 'Mid-market') |
| `sales_stage` | No | one of: `prospecting`, `discovery`, `demo`, `negotiation`, `closing` | What stage of sales funnel |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |

#### 8. CRAFT Content Improver (`craft_content_improver`)

| Input | Required | Type | Description |
|---|---|---|---|
| `content` | Yes | string | Content to analyze |
| `content_type` | Yes | one of: `blog_post`, `email`, `landing_page`, `social_post`, `sales_email`, `product_description`, `press_release`, `case_study` | Type of content affects evaluation criteria |
| `goal` | No | string | Optional: what should this content achieve? (e.g., 'book a first meeting', 'educate readers'). If not given, a goal is chosen from the content type (for example 'Get meetings booked' for a sales email) |
| `audience` | No | string | Optional: who is this content for? The check reports when the text never mentions them. |
| `tone_preference` | No | one of: `more_formal`, `more_casual`, `more_urgent`, `more_friendly`, `more_authoritative`, `keep_same` | Desired tone. Only more_formal and more_casual are checked in the text; any other value is named in the answer as not used |

## Input Design Principles

1. **Only ask for what users actually know**: don't require "value propositions" if they're calling because they haven't articulated them yet
2. **Make required inputs minimal**: 3 to 4 required, the rest optional with smart defaults
3. **Use natural language**: "your_take" not "contrarian_perspective_thesis"
4. **Derive what you can**: if the user gives a topic, auto-generate related elements

## Output Design Principles

1. **A structured draft with placeholders**: each tool returns a structured draft to edit, with placeholders where your inputs gave no fact
2. **Right length for the format**: bylines 600 to 800 words, social posts 200 to 300 words
3. **Include metadata**: word counts, posting times, headlines
4. **Add promotional content**: social snippets to promote longer content

## Author

**Shashwat Ghosh**, Co-Founder and Fractional CMO, [Helix GTM Consulting](https://tools.gtmhelix.com), with 24+ years in B2B and 10+ years of fractional experience

## License

MIT


## Hosted connector (Streamable HTTP)

The same tools are also available as a hosted MCP server, so they work in Claude on the web, desktop and mobile without installing anything.

- Server URL: `https://craft-content.gtmhelix.com/mcp`
- Transport: Streamable HTTP (stateless, JSON responses). Authentication: none.
- Setup guide: https://craft-content.gtmhelix.com/connect/
- In Claude: Customize, then Connectors, then Add custom connector, and paste the server URL.
- In Claude Code: `claude mcp add --transport http craft-content https://craft-content.gtmhelix.com/mcp`

The npm package (stdio) and the hosted server run the same `createServer()` code in `src/server.ts`.

## Privacy Policy

Full policy: https://craft-content.gtmhelix.com/privacy/ (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Nothing is stored: no database, no files, no cache, no logging of inputs or outputs by our code.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). Fonts are served from this site, so loading a page contacts no one else.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com

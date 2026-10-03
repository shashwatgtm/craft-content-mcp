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
| 1 | `case_study_generator` | Case Study Generator | Builds a customer case study from the customer name, your product and the challenge, solution and results you give (mode full), or an interview kit for collecting them (mode discovery). Optional customer industry, quote, interview notes and business model fit the wording to the customer. Returns a headline, the story with each result you list, a customer quote, social and email copy and sector notes when the sector can be read from your text. A bracket marks anything you did not give. |
| 2 | `newsletter_builder` | Newsletter Builder | Writes a first draft of a newsletter issue from your topic and the action you want readers to take. Optional key points, audience segment, newsletter type, tone, earlier topics and your product fit it to the reader. Returns a subject line and preview, an opening, a short section for each key point, your own call to action as the button, A/B subject lines, alternative opening hooks and sector notes. Without key points it suggests some from the topic and sector. The draft uses only what you gave: it adds no statistic or customer story, and says what it did not get. |
| 3 | `webinar_script` | Webinar Script | Writes a webinar run of show and a full spoken script from your topic, target audience and webinar type. Optional duration, key takeaways, speakers, polls, product mention level, your product and business model shape it. Returns the run of show, the script with the speaker lines and on-screen cues for each segment built from your takeaways and speakers, polls with answer options, anticipated questions with answers, a follow-up email sequence and sector notes. Without key takeaways it suggests them from the topic and type. The script uses only what you gave and says what it did not get. |
| 4 | `content_repurposer` | Content Repurposer | Turns a source text into finished versions for other channels: a LinkedIn post, an X thread, an email, a blog summary and quote cards. Needs the source text and its type. Optional target formats, brand voice and a key message steer the result. Each version is written from whole sentences of your source, with key points chosen by a stated rule and kept in the source order; claims it cannot support are listed to source, and any requested format it does not know is named. Returns the versions, notes on the key points and proof used, and sector notes. |
| 5 | `thought_leadership_series` | Thought Leadership Series | Writes a first draft of each article in a thought leadership series from your topic, your take and the reader you write for. Optional proof points, author background, number of articles and article style shape them. Returns, for each article, a headline, a short draft with the objection it answers, your proof and a way to test the idea, a promotional post for each article, a publishing order and sector notes. Your take and proof points are quoted as you wrote them and no result, customer or figure is invented. Without proof points it names the evidence to gather. |
| 6 | `testimonial_capture` | Testimonial Capture | Prepares a testimonial request from the customer's name, company, success story and the type of testimonial you want. Optional role, relationship, intended use, incentive, your product and business model fit it to the customer. Returns a request email, interview questions for the customer's role and sector, quote drafts for the customer to edit and a sign-off checklist. It uses your product name when you give it and says so when you do not. |
| 7 | `sales_enablement_content` | Sales Enablement Content | Builds a sales kit from your product, the persona you sell to and your proof points. Optional objections, value propositions, competitor objections, price context, sales stage and business model shape it. Returns a pitch order, a script for each objection answered with the sector's pattern and the proof point that fits it, competitor responses, discovery questions and follow-up templates. Without objections it suggests the ones your sector raises. |
| 8 | `craft_content_improver` | CRAFT Content Improver | Reviews pasted copy and its content type against listed rules: buzzwords, claims that need proof, fragments, unfilled merge fields, claims about the reader and a missing figure or ask. Optional goal, audience and tone preference refine the review. Returns a score for each area with each deduction quoted from your text, and the edits it made. If it finds no edit to make, it says so and prints no improved version. |

### Inputs of each tool

#### 1. Case Study Generator (`case_study_generator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customer_name` | Yes | string | Customer or company name |
| `your_product` | Yes | string | Your product or service name |
| `customer_industry` | No | string | The customer's industry, used for context |
| `mode` | No | one of: `full`, `discovery` | full builds the case study and needs the challenge, solution and results; discovery returns interview questions for collecting them |
| `interview_notes` | No | string | Optional: raw interview notes or a transcript. In full mode they fill a missing challenge, solution or results; the answer says they were not used when you gave all three |
| `challenge` | No | string | The customer's challenge or problem (needed in full mode) |
| `solution` | No | string | How your product solved it (needed in full mode) |
| `results` | No | string | Measurable outcomes, one per line or per semicolon (needed in full mode) |
| `customer_quote` | No | string | Optional: a direct quote from the customer |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |

#### 2. Newsletter Builder (`newsletter_builder`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | The main topic or theme of the newsletter |
| `cta_goal` | Yes | string | The action readers should take, in your own words (for example 'register for the webinar', 'book a call', 'read the guide'); it becomes the button |
| `key_points` | No | string | Optional: key points to cover, one per line, per semicolon or comma-separated. If not provided, points are suggested from the topic and newsletter type |
| `audience_segment` | No | one of: `executives`, `practitioners`, `technical`, `general`, `prospects`, `customers` | Who the newsletter is for; sets tone and depth |
| `newsletter_type` | No | one of: `educational`, `product_update`, `industry_news`, `thought_leadership`, `curated_links` | The kind of newsletter |
| `tone` | No | one of: `professional`, `conversational`, `authoritative`, `friendly`, `urgent` | The writing tone |
| `previous_topics` | No | string | Optional: recent newsletter topics, to avoid repetition and suggest connections |
| `your_product` | No | string | Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder. |

#### 3. Webinar Script (`webinar_script`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | The webinar topic or title |
| `target_audience` | Yes | string | Who will attend (for example 'Support leaders at consumer apps') |
| `webinar_type` | Yes | one of: `educational`, `product_demo`, `panel_discussion`, `customer_story`, `workshop`, `ama` | The kind of webinar; sets the structure |
| `duration` | No | one of: `30_min`, `45_min`, `60_min`, `90_min` | The webinar length |
| `key_takeaways` | No | string | Optional: what attendees should learn, one per line, per semicolon or comma-separated. If not provided, takeaways are suggested from the topic |
| `speakers` | No | string | Optional: speakers as you want them listed. Separate speakers with semicolons or line breaks ('Name, Title; Name, Title'), or with commas if each is one phrase |
| `include_polls` | No | boolean | Include poll suggestions with answer options |
| `product_mention_level` | No | one of: `none`, `subtle`, `moderate`, `heavy` | Whether to add product tie-in placeholders to the script ('none' leaves them out) |
| `your_product` | No | string | Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder. |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |

#### 4. Content Repurposer (`content_repurposer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `source_content` | Yes | string | The original content to repurpose (a blog post, article or transcript, for example) |
| `source_type` | Yes | one of: `blog_post`, `webinar_transcript`, `podcast_transcript`, `whitepaper`, `case_study`, `research_report`, `presentation` | The kind of content the source is |
| `target_formats` | No | string | Optional: formats to generate, comma-separated. Defaults to: linkedin_post, twitter_thread, email, blog_summary, quote_cards. Other options: infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section. A name outside this list is reported, not written |
| `brand_voice` | No | one of: `professional`, `casual`, `authoritative`, `friendly`, `bold` | The brand voice to keep |
| `key_message` | No | string | Optional: the core message to emphasize in every format |

#### 5. Thought Leadership Series (`thought_leadership_series`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | The topic you want to build authority on |
| `your_take` | Yes | string | Your own view on this topic: what you believe that others do not, or your contrarian view |
| `target_reader` | Yes | string | Who should read this, named specifically (for example 'Heads of IT at companies with many branches' rather than 'managers') |
| `proof_points` | No | string | Optional: evidence supporting your take: personal stories, client examples, data or stats, one per line, per semicolon or comma-separated. If not provided, proof points to gather are suggested |
| `author_background` | No | string | Optional: your role and why you are credible (for example 'a long career in enterprise sales') |
| `num_articles` | No | integer (1 to 5) | How many articles to outline, a whole number from 1 to 5. If left out, the series has three articles |
| `article_type` | No | one of: `contrarian`, `how_to`, `lessons_learned`, `prediction`, `framework` | The style of the articles |

#### 6. Testimonial Capture (`testimonial_capture`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customer_name` | Yes | string | The customer's name |
| `customer_company` | Yes | string | The customer's company |
| `success_story` | Yes | string | A short description of their success with your product |
| `testimonial_type` | Yes | one of: `written_quote`, `video_interview`, `case_study_interview`, `g2_review`, `reference_call` | The kind of testimonial you need |
| `customer_role` | No | string | The customer's job title |
| `relationship_context` | No | string | How long they have been a customer and the key interactions |
| `use_case` | No | string | Where the testimonial will be used (the website or a sales deck, for example) |
| `incentive` | No | string | Optional: what you are offering in return |
| `your_product` | No | string | Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder. |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |

#### 7. Sales Enablement Content (`sales_enablement_content`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product` | Yes | string | The product name and what it does |
| `target_persona` | Yes | string | Who sales is pitching to (role and company type) |
| `proof_points` | Yes | string | Evidence for your claims: case studies, metrics and quotes, one per line, per semicolon or comma-separated |
| `common_objections` | No | string | Optional: sales objections you hear, one per line, per semicolon or comma-separated. If not provided, likely objections for your sector are suggested |
| `value_props` | No | string | Optional: key value propositions, one per line, per semicolon or comma-separated. Taken from the proof points if not provided |
| `competitor_objections` | No | string | Optional: 'why not [competitor]' objections |
| `price_context` | No | string | Optional: your pricing against the market (for example 'Premium, above market', 'Budget option' or 'Mid-market') |
| `sales_stage` | No | one of: `prospecting`, `discovery`, `demo`, `negotiation`, `closing` | The stage of the sales funnel |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |

#### 8. CRAFT Content Improver (`craft_content_improver`)

| Input | Required | Type | Description |
|---|---|---|---|
| `content` | Yes | string | The content to review |
| `content_type` | Yes | one of: `blog_post`, `email`, `landing_page`, `social_post`, `sales_email`, `product_description`, `press_release`, `case_study` | The kind of content; it changes which checks apply |
| `goal` | No | string | Optional: what the content should achieve (for example 'book a first meeting' or 'educate readers'). If not given, a goal is chosen from the content type |
| `audience` | No | string | Optional: who the content is for. The review reports when the text never mentions them |
| `tone_preference` | No | one of: `more_formal`, `more_casual`, `more_urgent`, `more_friendly`, `more_authoritative`, `keep_same` | The tone you want. Only more_formal and more_casual are checked in the text; any other value is named in the answer as not used |

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

# @shashwatgtmalpha/craft-content-mcp v2.2.24
**CRAFT Content Framework MCP Server**: a complete redesign with user-centric inputs, actual content analysis, and a structured draft with placeholders for each output.

## Use it hosted (no install)

Add `https://craft-content.gtmhelix.com/mcp` as a Streamable HTTP connector. It needs no sign in. The hosted endpoint always runs the newest version (2.2.24) available on this site. It listed 9 tools on 15 November 2026. [Connection instructions](https://craft-content.gtmhelix.com/connect/). You can also open the [web app](https://craft-content.gtmhelix.com/).

For a local stdio connection, run `npx -y @shashwatgtmalpha/craft-content-mcp`. On 15 November 2026 the latest published npm version was 2.2.22. Check the available version with `npm view @shashwatgtmalpha/craft-content-mcp version`.


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

The 9 tools below come from `tools/list` in the 2.2.24 source build, checked on 15 November 2026. Each table shows the accepted fields. A dot marks a field inside an object and `[]` marks an array item. A nested field marked required is required when its parent is supplied.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `case_study_generator` | Case Study Generator | Helps you turn a customer result into a case study, built from the customer name, your product and the challenge, solution and results you give (mode full), or an interview kit to collect them (mode discovery). Optional customer industry, quote, interview notes and business model fit the wording to the customer. Returns a headline, the story with each result you list, a customer quote, social and email copy, and sector notes when the sector can be read from your text. A bracket marks anything you did not give. Ask whether written customer approval covers the exact material and intended use. |
| 2 | `newsletter_builder` | Newsletter Builder | Helps you decide what goes in a newsletter issue and which subject line to test, from your topic and the action you want readers to take. Optional key points, audience segment, newsletter type, tone, earlier topics and your product fit it to the reader. Returns a first draft with subject line and preview, an opening, a short section for each key point, your call to action as the button, A/B subject lines, other opening hooks and sector notes. It adds no statistic or customer story and says what it did not get. Ask whether written customer approval covers the exact material and intended use. |
| 3 | `webinar_script` | Webinar Script | Helps you plan a webinar that leads to meetings, from your topic, target audience and webinar type. Optional duration, key takeaways, speakers, polls, product mention level, your product and business model shape it. Returns a run of show, a full spoken script with speaker lines and on screen cues, polls with answer options, likely questions with answers, a follow up email sequence and sector notes. It uses only what you gave and says what it did not get. Ask whether written customer approval covers the exact material and intended use. |
| 4 | `content_repurposer` | Content Repurposer | Helps you get more from a single piece of content: it needs the source text and its type. Optional target formats, brand voice and a key message steer the result. Returns versions for other channels (a LinkedIn post, an X thread, an email, a blog summary and quote cards), each written from whole sentences of your source with key points kept in source order. Claims it cannot support are listed to source, and any format it does not know is named. Ask whether written customer approval covers the exact material and intended use. |
| 5 | `thought_leadership_series` | Thought Leadership Series | Helps you decide what to publish to make your point of view known, from your topic, your take and the reader you write for. Optional proof points, author background, number of articles and article style shape it. Returns, for each article, a headline and a short first draft with the objection it answers, your proof and a way to test the idea, a promotional post for each, a publishing order and sector notes. Your words are quoted as written and no result, customer or figure is invented. Ask whether written customer approval covers the exact material and intended use. |
| 6 | `testimonial_capture` | Testimonial Capture | Helps you ask a happy customer for a testimonial, from the customer's name, company, success story and the type of testimonial you want. Optional role, relationship, intended use, incentive, your product and business model fit it to the customer. Returns a request email, interview questions for the customer's role and sector, quote drafts for the customer to edit and a sign off checklist. It uses your product name when you give it and says so when you do not. Ask whether written customer approval covers the exact material and intended use. |
| 7 | `sales_enablement_content` | Sales Enablement Content | Helps you decide what sellers should say at each stage of a deal, from your product, the persona you sell to and your proof points. Optional objections, value propositions, competitor objections, price context, sales stage and business model shape it. Returns a pitch order, an answer to each objection with the proof point that fits it, competitor responses, discovery questions and follow up templates. Without objections it suggests the ones your sector raises. |
| 8 | `craft_content_improver` | CRAFT Content Improver | Helps you decide whether a draft is ready to publish and what to fix first, from the pasted copy and its content type. Optional goal, audience and tone preference refine the review. Returns a score for each area (buzzwords, claims that need proof, fragments, unfilled merge fields, claims about the reader, a missing figure or ask) with each deduction quoted from your text, and the edits it made. If it finds nothing to edit, it says so and prints no improved version. |
| 9 | `customer_result_to_content` | Turn this customer result into content | Turn this customer win into a case study, a post and a newsletter without changing the number. Needs the exact result sentence with its qualifier and source label, source and date, your role, approval, your own view and a reader action. Returns a proof card, first drafts and a sentence check. Optional proof details expose gaps. Written approval is required for your own customer; without it, returns the card and questions only. Chat collects the facts; the results view shows them. No form. |

### Inputs of each tool

#### 1. Case Study Generator (`case_study_generator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customer_name` | Yes | string | Customer or company name |
| `customer_industry` | No | string | The customer's industry, used for context |
| `mode` | No | one of `full`, `discovery` | full builds the case study and needs the challenge, solution and results; discovery returns interview questions for collecting them |
| `interview_notes` | No | string | Optional: raw interview notes or a transcript. In full mode they fill a missing challenge, solution or results; the answer says they were not used when you gave all three |
| `challenge` | No | string | The customer's challenge or problem (needed in full mode) |
| `solution` | No | string | How your product solved it (needed in full mode) |
| `results` | No | string | Measurable outcomes, one per line or per semicolon (needed in full mode) |
| `customer_quote` | No | string | Optional: a direct quote from the customer |
| `your_product` | Yes | string | Your product or service name |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |
| `publication_approval` | No | one of `approved`, `not_approved`, `unknown` | Optional confirmed written approval for this exact customer name, figures, quote and intended use. Ask before publication. A draft cannot grant customer permission. |

#### 2. Newsletter Builder (`newsletter_builder`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | The main topic or theme of the newsletter |
| `key_points` | No | string | Optional: key points to cover, one per line, per semicolon or comma-separated. If not provided, points are suggested from the topic and newsletter type |
| `cta_goal` | Yes | string | The action readers should take, in your own words (for example 'register for the webinar', 'book a call', 'read the guide'); it becomes the button |
| `audience_segment` | No | one of `executives`, `practitioners`, `technical`, `general`, `prospects`, `customers` | Who the newsletter is for; sets tone and depth |
| `newsletter_type` | No | one of `educational`, `product_update`, `industry_news`, `thought_leadership`, `curated_links` | The kind of newsletter |
| `tone` | No | one of `professional`, `conversational`, `authoritative`, `friendly`, `urgent` | The writing tone |
| `previous_topics` | No | string | Optional: recent newsletter topics, to avoid repetition and suggest connections |
| `your_product` | No | string | Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder. |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |
| `publication_approval` | No | one of `approved`, `not_approved`, `unknown` | Optional confirmed written approval for this exact customer name, figures, quote and intended use. Ask before publication. A draft cannot grant customer permission. |

#### 3. Webinar Script (`webinar_script`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | The webinar topic or title |
| `target_audience` | Yes | string | Who will attend (for example 'Support leaders at consumer apps') |
| `webinar_type` | Yes | one of `educational`, `product_demo`, `panel_discussion`, `customer_story`, `workshop`, `ama` | The kind of webinar; sets the structure |
| `duration` | No | one of `30_min`, `45_min`, `60_min`, `90_min` | The webinar length |
| `key_takeaways` | No | string | Optional: what attendees should learn, one per line, per semicolon or comma-separated. If not provided, takeaways are suggested from the topic |
| `speakers` | No | string | Optional: speakers as you want them listed. Separate speakers with semicolons or line breaks ('Name, Title; Name, Title'), or with commas if each is one phrase |
| `include_polls` | No | boolean | Include poll suggestions with answer options |
| `product_mention_level` | No | one of `none`, `subtle`, `moderate`, `heavy` | Whether to add product tie-in placeholders to the script ('none' leaves them out) |
| `your_product` | No | string | Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder. |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |
| `publication_approval` | No | one of `approved`, `not_approved`, `unknown` | Optional confirmed written approval for this exact customer name, figures, quote and intended use. Ask before publication. A draft cannot grant customer permission. |

#### 4. Content Repurposer (`content_repurposer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `source_content` | Yes | string | The original content to repurpose (a blog post, article or transcript, for example) |
| `source_type` | Yes | one of `blog_post`, `webinar_transcript`, `podcast_transcript`, `whitepaper`, `case_study`, `research_report`, `presentation` | The kind of content the source is |
| `target_formats` | No | string | Optional: formats to generate, comma-separated. Defaults to: linkedin_post, twitter_thread, email, blog_summary, quote_cards. Other options: infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section. A name outside this list is reported, not written |
| `brand_voice` | No | one of `professional`, `casual`, `authoritative`, `friendly`, `bold` | The brand voice to keep |
| `key_message` | No | string | Optional: the core message to emphasize in every format |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |
| `publication_approval` | No | one of `approved`, `not_approved`, `unknown` | Optional confirmed written approval for this exact customer name, figures, quote and intended use. Ask before publication. A draft cannot grant customer permission. |

#### 5. Thought Leadership Series (`thought_leadership_series`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | The topic you want to build authority on |
| `your_take` | Yes | string | Your own view on this topic: what you believe that others do not, or your contrarian view |
| `target_reader` | Yes | string | Who should read this, named specifically (for example 'Heads of IT at companies with many branches' rather than 'managers') |
| `proof_points` | No | string | Optional: evidence supporting your take: personal stories, client examples, data or stats, one per line, per semicolon or comma-separated. If not provided, proof points to gather are suggested |
| `author_background` | No | string | Optional: your role and why you are credible (for example 'a long career in enterprise sales') |
| `num_articles` | No | integer (1 to 5) | How many articles to outline, a whole number from 1 to 5. If left out, the series has three articles |
| `article_type` | No | one of `contrarian`, `how_to`, `lessons_learned`, `prediction`, `framework` | The style of the articles |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |
| `publication_approval` | No | one of `approved`, `not_approved`, `unknown` | Optional confirmed written approval for this exact customer name, figures, quote and intended use. Ask before publication. A draft cannot grant customer permission. |

#### 6. Testimonial Capture (`testimonial_capture`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customer_status` | No | one of `active`, `cancelled`, `unknown` | Ask whether the customer is active or cancelled before a testimonial request. A confirmed typed fact takes precedence over cancellation wording. |
| `customer_name` | Yes | string | The customer's name |
| `customer_company` | Yes | string | The customer's company |
| `customer_role` | No | string | The customer's job title |
| `relationship_context` | No | string | How long they have been a customer and the key interactions |
| `success_story` | Yes | string | A short description of their success with your product |
| `testimonial_type` | Yes | one of `written_quote`, `video_interview`, `case_study_interview`, `g2_review`, `reference_call` | The kind of testimonial you need |
| `use_case` | No | string | Where the testimonial will be used (the website or a sales deck, for example) |
| `incentive` | No | string | Optional: what you are offering in return |
| `your_product` | No | string | Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder. |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |
| `publication_approval` | No | one of `approved`, `not_approved`, `unknown` | Optional confirmed written approval for this exact customer name, figures, quote and intended use. Ask before publication. A draft cannot grant customer permission. |

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
| `sales_stage` | No | one of `prospecting`, `discovery`, `demo`, `negotiation`, `closing` | The stage of the sales funnel |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |

#### 8. CRAFT Content Improver (`craft_content_improver`)

| Input | Required | Type | Description |
|---|---|---|---|
| `content` | Yes | string | The content to review |
| `content_type` | Yes | one of `blog_post`, `email`, `landing_page`, `social_post`, `sales_email`, `product_description`, `press_release`, `case_study` | The kind of content; it changes which checks apply |
| `goal` | No | string | Optional: what the content should achieve (for example 'book a first meeting' or 'educate readers'). If not given, a goal is chosen from the content type |
| `audience` | No | string | Optional: who the content is for. The review reports when the text never mentions them |
| `tone_preference` | No | one of `more_formal`, `more_casual`, `more_urgent`, `more_friendly`, `more_authoritative`, `keep_same` | The tone you want. Only more_formal and more_casual are checked in the text; any other value is named in the answer as not used |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |

#### 9. Turn this customer result into content (`customer_result_to_content`)

Only the listed top level fields are accepted.

| Input | Required | Type | Description |
|---|---|---|---|
| `exact_sentence` | Yes | string (minimum characters 1, maximum characters 4000) | Copy the result exactly, keeping its qualifier and source label inside this sentence. |
| `source_url` | Yes | string (minimum characters 1, maximum characters 4000) | Public source or approved evidence link, using https. |
| `source_date` | Yes | string (minimum characters 1, maximum characters 4000) | Publication or evidence date as year, month and day, or not stated. Keep it separate from the measurement period. |
| `source_checked_date` | No | string (minimum characters 1, maximum characters 4000) | The date you reopened the source, as year, month and day. This is not the publication date. |
| `source_kind` | Yes | one of `company_reported`, `second_hand`, `customer_record` | Who stands behind the result. A company report is not independent evidence. |
| `source_label` | Yes | string (minimum characters 1, maximum characters 4000) | The source label already inside the exact sentence, for example company-reported. |
| `measured_result` | Yes | boolean | False for a story with no measured outcome. Never infer an improvement from exposure or scale counts. |
| `buyer_role` | Yes | one of `vendor`, `outside_writer` |  |
| `relationship` | Yes | one of `own_customer`, `public_example` |  |
| `approval` | Yes | object (listed fields only) |  |
| `approval.status` | Yes | one of `written`, `public_page`, `none` |  |
| `approval.approver` | No | string (minimum characters 1, maximum characters 4000) | Who approved the uses, in writing. |
| `approval.date` | No | string (minimum characters 1, maximum characters 4000) | Approval date as year, month and day. |
| `approval.uses` | No | array of string (minimum items 1, maximum items 4, each item is one of `case study`, `post`, `newsletter section`, `newsletter issue`) | Every use explicitly covered by the written approval. |
| `proof_details` | No | object (listed fields only) |  |
| `proof_details.qualifier` | No | string (minimum characters 1, maximum characters 4000) | The qualifier inside the locked sentence, or none stated. |
| `proof_details.counted` | No | string (minimum characters 1, maximum characters 4000) | What was counted. |
| `proof_details.definition` | No | string (minimum characters 1, maximum characters 4000) | What counts as the outcome. |
| `proof_details.denominator` | No | string (minimum characters 1, maximum characters 4000) | Out of how many eligible cases. |
| `proof_details.period` | No | string (minimum characters 1, maximum characters 4000) | The measurement period. |
| `proof_details.before` | No | string (minimum characters 1, maximum characters 4000) | The before figure. |
| `proof_details.fell_out` | No | string (minimum characters 1, maximum characters 4000) | How excluded or abandoned cases were counted. |
| `proof_details.reporter` | No | string (minimum characters 1, maximum characters 4000) | Who reported the result. |
| `proof_details.review_by` | No | string (minimum characters 1, maximum characters 4000) | Review date as year, month and day. |
| `as_of_date` | Yes | string (minimum characters 1, maximum characters 4000) | The date of this run as year, month and day. Supplied by chat so repeats stay identical. |
| `story_published` | Yes | boolean |  |
| `published_story` | No | string (minimum characters 1, maximum characters 16000) | The already published story as plain text. Used as source without rebuilding it. |
| `customer_name` | Yes | string (minimum characters 1, maximum characters 4000) | Customer label, including an approved anonymous description. |
| `product` | Yes | string (minimum characters 1, maximum characters 4000) | Your product or vendor name. |
| `challenge` | No | string (minimum characters 1, maximum characters 4000) | The customer problem from the approved story. |
| `solution` | No | string (minimum characters 1, maximum characters 4000) | What was done, from the approved story. |
| `buyer_view` | No | string (minimum characters 0, maximum characters 4000) | Your own view in whole sentences. The tool will not invent it. |
| `call_to_action` | Yes | string (minimum characters 1, maximum characters 4000) | One action you want the reader to take. |
| `headline` | No | string (minimum characters 1, maximum characters 4000) | Your own headline, if available. |

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

The repository defines the stdio and hosted entry points using `createServer()` in `src/server.ts`.

## Privacy Policy

Full policy: <https://craft-content.gtmhelix.com/privacy/> (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Inputs and answers are not stored: no database, no files, no cache, no logging of inputs or outputs by our code. Each call adds one anonymous usage record (date and time, site and tool name, app kind, web form or assistant); see the privacy page.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). Fonts are served from this site, so loading a page contacts no one else.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com

### Turn this customer result into content

The new `customer_result_to_content` tool lives in chat. The assistant collects an exact result sentence with its qualifier and source label, a source and date, the writer's role, approval for each use, the writer's own view and a reader action. The server builds a proof card, chains the existing case study, repurposer and newsletter functions, and checks each final first draft. It makes no network requests and stores no brief.

For the vendor or their own customer, written approval must name the approver, date and each use, with a future review date. A public page does not grant new uses. Missing approval or the writer's view returns the card and questions without drafts. An already published story is used as source and is not rebuilt. Unknown proof fields stay marked as not stated. A sentence check does not establish meaning or independent verification.

The derived results view is at `ui://helix/results/chains/v1.html`. It reuses the shared results view's host bridge and copy control, adds display parts for the proof card, checks, handoffs and first drafts, and sends next actions back to chat. The original byte-pinned results resource is unchanged. Text-only hosts receive the full same answer. The tool page is `/tools/customer-result-to-content/` and has no form.

If a public source has no visible publication date, set `source_date` to `not stated` and keep the retrieval date in `source_checked_date`. The card keeps that gap visible. A retrieval date must not stand in for a publication or measurement date. To regenerate the additive offline results view, run `python scripts/build-chain-view.py`, then build. Font licences are included beside the bundled fonts.

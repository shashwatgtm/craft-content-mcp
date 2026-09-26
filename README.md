# @shashwatgtmalpha/craft-content-mcp v2.2.2
🎯 **CRAFT Content Framework MCP Server** - Complete redesign with user-centric inputs, actual content analysis, and publish-ready outputs.

## Design Philosophy

Every tool was redesigned using **chain of thought from the user's perspective**:

1. **What does the user actually want?** (Not what looks impressive in a demo)
2. **What do they already know?** (Keep inputs simple - don't ask for things they need to figure out)
3. **Does the output save them work?** (Publish-ready, not templates to fill)

## What's New in v2.0.0

| Tool | Before | After |
|------|--------|-------|
| **thought_leadership_series** | 🔴 200-300 word posts with `[Expand]` placeholders | ✅ **600-800 word byline articles** ready for publication |
| **craft_content_improver** | 🔴 Blank scorecard output | ✅ **Actually analyzes** content, scores dimensions, generates improved version |
| **case_study_generator** | 🟡 Requires full story | ✅ **Discovery mode** - generates interview questions if you don't have the story |
| **sales_enablement_content** | 🟡 Generic pitches | ✅ **Objection-mapped handlers** with specific proof points |
| newsletter_builder | 🟢 Good | ✅ Enhanced with A/B subject lines, 4 hooks, segment targeting |
| webinar_script | 🟢 Good | ✅ Type-specific structures (demo vs educational vs panel) |
| content_repurposer | 🟢 Excellent | ✅ Kept - transforms to 10+ formats |
| testimonial_capture | 🟢 Excellent | ✅ Kept - request emails, interview guides |

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

Generated on 27 September 2026 from the server's own tool list (`tools/list` of craft-content-mcp 2.2.2, the same code as the hosted MCP address), so every tool name, title, description and input below is exactly what the server accepts. Every tool is read-only.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `case_study_generator` | Case Study Generator | Generate case studies with DISCOVERY MODE. If you have the full story, get a complete case study. If not, get interview questions to gather the story first. |
| 2 | `newsletter_builder` | Newsletter Builder | Build newsletter content. Just have a topic? We'll suggest key points. Have key points? We'll craft the content. |
| 3 | `webinar_script` | Webinar Script | Generate webinar scripts. Know your takeaways? Get a complete script. Still planning? We'll suggest takeaways based on topic and type. |
| 4 | `content_repurposer` | Content Repurposer | Transform source content into multiple formats. Just paste content - we'll generate the 5 most useful formats by default, or specify exactly what you need. |
| 5 | `thought_leadership_series` | Thought Leadership Series | Generate thought leadership article drafts (about 600 to 800 words each) from your topic, your take and your proof points. Without proof points, the drafts include suggested proof points to gather. Drafts contain placeholders to complete before publishing. |
| 6 | `testimonial_capture` | Testimonial Capture | Generate testimonial request emails, interview questions, and formatted outputs. Discovery-focused by design. |
| 7 | `sales_enablement_content` | Sales Enablement Content | Generate sales content. Know your objections? Get complete handlers. New product with no sales data yet? We'll suggest likely objections based on your product type. |
| 8 | `craft_content_improver` | CRAFT Content Improver | Analyze content for clarity, structure and engagement, score each area, and return suggestions, including a version with common jargon replaced and long sentences split. |

### Inputs of each tool

#### 1. Case Study Generator (`case_study_generator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customer_name` | Yes | string | Customer/company name |
| `your_product` | Yes | string | Your product/service name |
| `customer_industry` | No | string | Customer's industry for context |
| `mode` | No | one of: `full`, `discovery` | full = generate case study (requires challenge/solution/results), discovery = generate interview questions to gather story |
| `interview_notes` | No | string | Optional: Raw interview notes or transcript. Parsed into a case study when mode is 'full' |
| `challenge` | No | string | The customer's challenge/problem (required for full mode) |
| `solution` | No | string | How your product solved it (required for full mode) |
| `results` | No | string | Quantifiable outcomes (required for full mode) |
| `customer_quote` | No | string | Optional: Direct quote from customer |

#### 2. Newsletter Builder (`newsletter_builder`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | Main topic/theme of the newsletter |
| `cta_goal` | Yes | string | What action should readers take? (e.g., 'sign up for webinar', 'try feature', 'read blog') |
| `key_points` | No | string | OPTIONAL: Key points to cover (comma-separated). If not provided, the tool suggests 5 points based on the topic and newsletter type |
| `audience_segment` | No | one of: `executives`, `practitioners`, `technical`, `general`, `prospects`, `customers` | Audience segment affects tone and depth |
| `newsletter_type` | No | one of: `educational`, `product_update`, `industry_news`, `thought_leadership`, `curated_links` | Type of newsletter |
| `tone` | No | one of: `professional`, `conversational`, `authoritative`, `friendly`, `urgent` | Writing tone |
| `previous_topics` | No | string | Optional: Recent newsletter topics to avoid repetition and suggest connections |

#### 3. Webinar Script (`webinar_script`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | Webinar topic/title |
| `target_audience` | Yes | string | Who will attend (e.g., 'Marketing managers at B2B SaaS companies') |
| `webinar_type` | Yes | one of: `educational`, `product_demo`, `panel_discussion`, `customer_story`, `workshop`, `ama` | Type of webinar determines structure |
| `duration` | No | one of: `30_min`, `45_min`, `60_min`, `90_min` | Webinar length |
| `key_takeaways` | No | string | OPTIONAL: 3-5 things attendees should learn (comma-separated). If not provided, we'll suggest based on topic |
| `speakers` | No | string | Optional: Speaker names and titles (comma-separated) |
| `include_polls` | No | boolean | Include interactive poll suggestions |
| `product_mention_level` | No | one of: `none`, `subtle`, `moderate`, `heavy` | Whether to add product tie-in placeholders to the script ('none' leaves them out) |

#### 4. Content Repurposer (`content_repurposer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `source_content` | Yes | string | Original content to repurpose (blog post, article, transcript, etc.) |
| `source_type` | Yes | one of: `blog_post`, `webinar_transcript`, `podcast_transcript`, `whitepaper`, `case_study`, `research_report`, `presentation` | What type of content is the source |
| `target_formats` | No | string | OPTIONAL: Formats to generate (comma-separated). Defaults to: linkedin_post, twitter_thread, email, blog_summary, quote_cards. Other options: infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section |
| `brand_voice` | No | one of: `professional`, `casual`, `authoritative`, `friendly`, `bold` | Brand voice to maintain |
| `key_message` | No | string | Optional: Core message to emphasize across all formats |

#### 5. Thought Leadership Series (`thought_leadership_series`)

| Input | Required | Type | Description |
|---|---|---|---|
| `topic` | Yes | string | The topic you want to establish authority on |
| `your_take` | Yes | string | Your unique perspective or opinion on this topic. What do you believe that others don't? What's your contrarian view? |
| `target_reader` | Yes | string | Who should read this? Be specific (e.g., 'B2B SaaS founders struggling with churn' not just 'marketers') |
| `proof_points` | No | string | OPTIONAL: Evidence supporting your take - personal stories, client examples, data/stats (comma-separated). If not provided, we'll suggest proof points to gather |
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

#### 7. Sales Enablement Content (`sales_enablement_content`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product` | Yes | string | Product name and what it does |
| `target_persona` | Yes | string | Who sales is pitching to (role, company type) |
| `proof_points` | Yes | string | Evidence for claims - case studies, metrics, quotes (comma-separated) |
| `common_objections` | No | string | OPTIONAL: Sales objections you hear (comma-separated). If not provided, we'll suggest likely objections for your product type |
| `value_props` | No | string | OPTIONAL: Key value propositions (comma-separated). Will be DERIVED from proof points if not provided |
| `competitor_objections` | No | string | Optional: 'Why not [competitor]' objections |
| `price_context` | No | string | Optional: Your pricing vs market (e.g., 'Premium - 20% above market', 'Budget option', 'Mid-market') |
| `sales_stage` | No | one of: `prospecting`, `discovery`, `demo`, `negotiation`, `closing` | What stage of sales funnel |

#### 8. CRAFT Content Improver (`craft_content_improver`)

| Input | Required | Type | Description |
|---|---|---|---|
| `content` | Yes | string | Content to analyze |
| `content_type` | Yes | one of: `blog_post`, `email`, `landing_page`, `social_post`, `sales_email`, `product_description`, `press_release`, `case_study` | Type of content affects evaluation criteria |
| `goal` | No | string | OPTIONAL: What should this content achieve? (e.g., 'drive signups', 'educate readers'). If not given, a goal is chosen from the content type (for example 'Get meetings booked' for a sales email) |
| `audience` | No | string | OPTIONAL: Who is this content for? Helps tailor improvements. |
| `tone_preference` | No | one of: `more_formal`, `more_casual`, `more_urgent`, `more_friendly`, `more_authoritative`, `keep_same` | Desired tone (accepted for compatibility; it does not change the analysis) |

## Input Design Principles

1. **Only ask for what users actually know** - Don't require "value propositions" if they're calling because they haven't articulated them yet
2. **Make required inputs minimal** - 3-4 required, rest optional with smart defaults
3. **Use natural language** - "your_take" not "contrarian_perspective_thesis"
4. **Derive what you can** - If user gives topic, auto-generate related elements

## Output Design Principles

1. **Publish-ready** - No `[Fill in]` or `[Expand]` placeholders
2. **Right length for the format** - Bylines = 600-800 words, Social posts = 200-300 words
3. **Include metadata** - Word counts, posting times, headlines
4. **Add promotional content** - Social snippets to promote longer content

## Author

**Shashwat Ghosh**, Co-Founder and Fractional CMO, [Helix GTM Consulting](https://tools.gtmhelix.com), with 24+ years in B2B and 10+ years of fractional experience

## License

MIT


## Hosted connector (Streamable HTTP)

The same tools are also available as a hosted MCP server, so they work in Claude on the web, desktop and mobile without installing anything.

- Server URL: `https://craft-content.gtmhelix.com/mcp`
- Transport: Streamable HTTP (stateless, JSON responses). Authentication: none.
- Setup guide: https://craft-content.gtmhelix.com/
- In Claude: Customize, then Connectors, then Add custom connector, and paste the server URL.
- In Claude Code: `claude mcp add --transport http craft-content https://craft-content.gtmhelix.com/mcp`

The npm package (stdio) and the hosted server run the same `createServer()` code in `src/server.ts`.

## Privacy Policy

Full policy: https://craft-content.gtmhelix.com/privacy.html (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Nothing is stored: no database, no files, no cache, no logging of inputs or outputs by our code.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). The web pages load fonts from Google Fonts.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com

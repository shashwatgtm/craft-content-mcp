# @shashwatgtmalpha/craft-content-mcp v2.0.0

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

## Tools

### 1. 💡 `thought_leadership_series` - **REDESIGNED!**
**600-800 word byline articles, not social posts!**

**Simplified inputs (just 4 required):**
- `topic` - What you're an expert on
- `your_take` - Your unique/contrarian perspective
- `proof_points` - Stories, data, experiences that support your take
- `target_reader` - Who should read this (be specific!)

**Output:** 3 complete articles (600-800 words each) with:
- Compelling headlines
- Hook → Problem → Evidence → Framework → Conclusion structure
- Ready for LinkedIn Articles, Medium, industry publications
- PLUS promotional social posts (200-300 words) to drive traffic

**Article types:** contrarian, how_to, lessons_learned, prediction, framework

### 2. 📝 `craft_content_improver` - **FIXED!**
**Actually analyzes your content now!**

Paste any content and get:
- Clarity score (sentence length, passive voice, jargon)
- Structure score (headers, paragraph length, transitions)
- Engagement score (hooks, power words, questions)
- Goal alignment score
- **Auto-improved version** with before/after
- Content-type specific tips

### 3. 📊 `case_study_generator` - Discovery Mode
**Don't have the full story? No problem!**

- **Discovery mode:** Interview questions, email templates, note templates
- **Full mode:** Complete case study with challenge/solution/results
- **Parse mode:** Feed raw interview notes → structured case study

### 4. 🎯 `sales_enablement_content` - Objection Mapping
**Uses YOUR objections and proof points!**

For each objection you provide, get:
- Acknowledge statement
- Reframe question
- Specific proof point reference
- Bridge to value
- Full response script

Plus: Stage-specific pitch scripts, discovery questions, follow-up templates.

### 5. 📧 `newsletter_builder`
- 4 subject line options (A/B test ready)
- 4 hook styles (question, statistic, story, bold)
- Segment-specific content (executives vs practitioners vs technical)
- Send time recommendations

### 6. 🎬 `webinar_script`
Type-specific structures:
- Educational webinar (teach something)
- Product demo (show features)
- Panel discussion (multiple speakers)
- Customer story (case study format)
- Workshop (hands-on)
- AMA (Q&A focused)

Includes: Run of show, full scripts, Q&A prep, follow-up email sequence.

### 7. 🔄 `content_repurposer`
Transform source content into 10+ formats:
- LinkedIn post
- Twitter thread
- Email version
- Blog summary
- Infographic outline
- Video script
- Podcast talking points
- Slide deck outline
- Quote cards
- Newsletter section

### 8. 🌟 `testimonial_capture`
- Request email templates by type (written, video, case study, G2, reference)
- Interview questions
- Multiple quote formats (short/medium/long)
- Process checklists

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

**Shashwat Ghosh** - [Helix GTM Consulting](https://helixgtm.com)

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

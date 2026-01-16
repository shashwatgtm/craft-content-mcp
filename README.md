# CRAFT Content MCP Server

**8 Content Creation Execution Tools** powered by the CRAFT Framework.

Created by [Shashwat Ghosh](https://gtmexpert.com) | Top 30 PLG Creator Worldwide

---

## ✍️ What is CRAFT Content?

CRAFT Content provides ready-to-execute content tools for **content marketers, SDRs, and growth teams** who need to create:

- Case Studies & Social Proof
- Newsletters & Email Content
- Webinar Scripts
- Repurposed Content (10+ formats)
- Thought Leadership Series
- Testimonial Collection
- Sales Enablement Content

**Typical use:** Daily/weekly content creation (15-45 minutes per asset)

---

## 🛠️ Tools Included

| Tool | Purpose | Output |
|------|---------|--------|
| `case_study_generator` | Create customer stories | Full case study, one-pager, social snippets |
| `newsletter_builder` | Write newsletters | Complete issue, 10 subject lines, sections |
| `webinar_script` | Script webinars | Slide-by-slide script, Q&A prep, engagement prompts |
| `content_repurposer` | Multiply content | 1 piece → 10+ formats (LinkedIn, Twitter, email, etc.) |
| `thought_leadership_series` | Build authority | 5-post LinkedIn series with hooks |
| `testimonial_capture` | Collect social proof | Request emails, interview guide, formatted outputs |
| `sales_enablement_content` | Arm sales team | Pitches (30s/2min/5min), objection handlers |
| `craft_content_improver` | Improve any content | CRAFT score, improved version, A/B tests |

---

## 📦 Installation

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "craft-content": {
      "command": "npx",
      "args": ["-y", "@shashwatah/craft-content-mcp"]
    }
  }
}
```

### Manual Installation

```bash
npm install -g @shashwatah/craft-content-mcp
craft-content-mcp
```

---

## 💡 Example Usage

### Case Study
```
"Create a case study for [Customer].
Challenge: Manual reporting taking 20 hours/week.
Solution: Our analytics platform automated reports.
Results: 80% time saved, $50K cost reduction."
```

### Content Repurposing
```
"Repurpose this blog post into LinkedIn posts, Twitter thread, email section, and video script:
[paste blog content]"
```

### Thought Leadership
```
"Create a 5-post LinkedIn series on 'Why traditional marketing metrics are broken.'
My perspective: Attribution is a vanity exercise.
Audience: B2B marketing leaders."
```

### Sales Enablement
```
"Create sales content for [Product].
Value props: 50% faster implementation, 3x ROI, enterprise security.
Target: VP Engineering at mid-market SaaS.
Common objections: Price, integration complexity, change management."
```

---

## 🔗 Related

- **[CRAFT GTM MCP](https://github.com/anthropics/craft-gtm-mcp)** - 8 strategic GTM tools (PMF, launches, retention)
- **[IMPACT MCP](https://github.com/shashwatgtm/impact-mcp)** - Positioning framework
- **[EPIC MCP](https://github.com/shashwatgtm/epic-mcp)** - GTM strategy framework

---

## 📚 The CRAFT Framework

**C**haracter - Who executes this?
**R**esult - What's the desired outcome?
**A**rtifact - What gets produced?
**F**rame - What's the context?
**T**imeline - What are the steps?

---

## 📄 License

MIT License - Created by Shashwat Ghosh

---

*Part of the GTM Alpha Toolkit | [gtmexpert.com](https://gtmexpert.com)*

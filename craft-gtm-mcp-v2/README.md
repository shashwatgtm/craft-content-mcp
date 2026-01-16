# @shashwatgtm/craft-gtm-mcp v2.0.0

🚀 **CRAFT GTM Framework MCP Server** - A complete redesign with intelligent analysis, metric parsing, and context-aware outputs.

## What's New in v2.0.0

This is a **major redesign** addressing all critical issues from v1.x:

| Issue | v1.x | v2.0.0 |
|-------|------|--------|
| PMF Scorecard | Blank `___` outputs | **Actually parses and scores your metrics** |
| Launch Commander | Same 12-week template for all | **Adapts to launch type, team size, budget** |
| Retention Playbook | Generic health scores | **Parses churn reasons, creates specific interventions** |
| Competitive Intel | `[Research]` placeholders | **Uses your competitor data, generates battle cards** |
| CRAFT Analyzer | Blank scorecard output | **Actually analyzes documents, finds gaps** |

## Installation

```bash
npm install -g @shashwatgtm/craft-gtm-mcp
```

Or add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "craft-gtm": {
      "command": "npx",
      "args": ["-y", "@shashwatgtm/craft-gtm-mcp"]
    }
  }
}
```

## Tools Overview

### 1. 📊 `pmf_scorecard` - Product-Market Fit Analysis
**Now with real metric parsing and scoring!**

Input your metrics in natural language:
```
MRR: $50K, Churn: 3%, NPS: 45, CAC: $500, LTV: $3000, Retention: 92%
```

Output: Auto-scored dimensions against industry benchmarks (Enterprise SaaS, SMB, Consumer, Fintech, etc.)

### 2. 🚀 `launch_commander` - Context-Aware Launch Plans
**Different plans for different launches!**

| Launch Type | Plan Duration | Complexity |
|-------------|---------------|------------|
| Major Release | 12 weeks | Full channel activation |
| Feature Launch | 6 weeks | Focused channels |
| Beta Launch | 4 weeks | Limited audience |
| Product Update | 2 weeks | Existing customers |
| Market Expansion | 10 weeks | Localization focus |

### 3. 🎙️ `customer_interview_kit` - Adaptive Interview Guides
**Industry-specific questions with synthesis templates**

### 4. 🔄 `retention_playbook` - Churn-Specific Interventions
**Parses your churn reasons and creates specific playbooks!**

### 5. 🤝 `partner_architect` - Model-Specific Partner Programs
**Different structures for different partner types!**

### 6. 🚨 `crisis_planner` - Crisis-Specific Playbooks
**Different protocols for different crises!**

### 7. ⚔️ `competitive_intel` - Actual Battle Cards
**No more `[Research]` placeholders!**

### 8. 📋 `craft_gtm_analyzer` - Real Document Analysis
**Actually analyzes your documents!**

## Design Principles (v2.0)

1. **No blank outputs** - Every `___` or `[Define]` replaced with generated content
2. **Context-aware** - Outputs adapt based on inputs provided
3. **Discovery mode** - If info missing, tools ask smart questions
4. **Actionable outputs** - Ready-to-use, not templates to fill
5. **Progressive enhancement** - More input = richer output

## Author

**Shashwat Ghosh** - [Helix GTM Consulting](https://helixgtm.com)

## License

MIT

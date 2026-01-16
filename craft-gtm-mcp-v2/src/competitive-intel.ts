import { parseListItems } from './utils.js';

export function generateCompetitiveIntel(args: {
  your_product: string;
  competitors: string;
  your_strengths?: string;
  your_weaknesses?: string;
  competitor_details?: string;
  common_objections?: string;
  recent_wins?: string;
  recent_losses?: string;
}): string {
  const competitors = parseListItems(args.competitors);
  const wins = args.recent_wins ? parseListItems(args.recent_wins) : [];
  const losses = args.recent_losses ? parseListItems(args.recent_losses) : [];
  const objections = args.common_objections ? parseListItems(args.common_objections) : [];
  
  // DERIVE strengths from wins if not provided
  let strengths: string[];
  if (args.your_strengths) {
    strengths = parseListItems(args.your_strengths);
  } else if (wins.length > 0) {
    strengths = wins.map(w => extractStrengthFromWin(w));
  } else {
    strengths = ['[DISCOVERY NEEDED: Run win analysis to identify]'];
  }
  
  // DERIVE weaknesses from losses if not provided
  let weaknesses: string[];
  if (args.your_weaknesses) {
    weaknesses = parseListItems(args.your_weaknesses);
  } else if (losses.length > 0) {
    weaknesses = losses.map(l => extractWeaknessFromLoss(l));
  } else {
    weaknesses = ['[DISCOVERY NEEDED: Run loss analysis to identify]'];
  }
  
  // If no strengths, weaknesses, AND no objections - return discovery mode
  if (!args.your_strengths && !args.your_weaknesses && wins.length === 0 && losses.length === 0 && objections.length === 0) {
    return generateCompetitiveDiscoveryKit(args.your_product, competitors);
  }
  
  // Parse competitor details if provided
  const competitorInfo: Record<string, string[]> = {};
  if (args.competitor_details) {
    const details = args.competitor_details.split(/[,\n]/);
    for (const detail of details) {
      for (const comp of competitors) {
        if (detail.toLowerCase().includes(comp.toLowerCase())) {
          if (!competitorInfo[comp]) competitorInfo[comp] = [];
          competitorInfo[comp].push(detail.trim());
        }
      }
    }
  }

  // Generate objection handlers
  const generateObjectionHandler = (objection: string): { acknowledge: string; counter: string; redirect: string } => {
    const objLower = objection.toLowerCase();
    
    if (objLower.includes('price') || objLower.includes('expensive') || objLower.includes('cost') || objLower.includes('budget')) {
      return {
        acknowledge: "I understand budget is a consideration.",
        counter: `Let me share what customers find: ${strengths[0] || 'our solution'} typically delivers ROI within [X months]. One customer saved [specific amount] by [specific outcome].`,
        redirect: "What would the cost of NOT solving this problem be for your team?"
      };
    }
    
    if (objLower.includes('competitor') || objLower.includes('other') || objLower.includes('alternative') || competitors.some(c => objLower.includes(c.toLowerCase()))) {
      return {
        acknowledge: "It makes sense to evaluate options thoroughly.",
        counter: `What sets us apart is ${strengths[0] || 'our unique approach'}. Customers who've compared us often find that [specific advantage].`,
        redirect: "What's most important to you in making this decision?"
      };
    }
    
    if (objLower.includes('time') || objLower.includes('now') || objLower.includes('later') || objLower.includes('ready')) {
      return {
        acknowledge: "Timing is definitely important to get right.",
        counter: "Here's what I've seen: teams that wait often find the problem grows. One customer told us they wished they'd started [X] months earlier.",
        redirect: "What would need to change for the timing to feel right?"
      };
    }
    
    if (objLower.includes('feature') || objLower.includes('can\'t') || objLower.includes('doesn\'t') || objLower.includes('missing') || objLower.includes('lack')) {
      return {
        acknowledge: "That's a fair point.",
        counter: `While [feature] works differently in our product, customers find that [workaround or alternative benefit]. Plus, ${strengths[0] || 'our core strength'} more than makes up for it.`,
        redirect: "How critical is that specific capability vs. the overall outcome you're trying to achieve?"
      };
    }
    
    if (objLower.includes('risk') || objLower.includes('trust') || objLower.includes('new') || objLower.includes('proven')) {
      return {
        acknowledge: "De-risking a decision like this is smart.",
        counter: `We work with [similar customers/industries] who had the same concern. Here's how we reduce risk: [pilot program, guarantee, case studies]. Would a reference call help?`,
        redirect: "What would help you feel confident in moving forward?"
      };
    }
    
    return {
      acknowledge: `I appreciate you raising that concern about "${objection}".`,
      counter: `Here's how we address that: ${strengths[0] || 'our approach'} specifically helps with this. Let me share an example...`,
      redirect: "Can you tell me more about why that's a concern for your situation?"
    };
  };

  let output = `# ⚔️ Competitive Battle Cards
## ${args.your_product}

---

## 🎯 Your Competitive Position

### When We Win 💪

${strengths.map((s, i) => `${i + 1}. **${s}**`).join('\n')}

${wins.length > 0 ? `\n**Recent Win Patterns:**\n${wins.map(w => `- ${w}`).join('\n')}` : ''}

### When We Lose ⚠️

${weaknesses.map((w, i) => `${i + 1}. **${w}**`).join('\n')}

${losses.length > 0 ? `\n**Recent Loss Patterns:**\n${losses.map(l => `- ${l}`).join('\n')}` : ''}

---

## 🃏 Competitor Battle Cards

`;

  // Generate battle card for each competitor
  for (let i = 0; i < competitors.length; i++) {
    const comp = competitors[i];
    const info = competitorInfo[comp] || [];
    
    output += `### ${i + 1}. ${comp}

${info.length > 0 ? `**Known Intel:**\n${info.map(i => `- ${i}`).join('\n')}\n` : ''}

**Head-to-Head Comparison:**

| Dimension | ${args.your_product} | ${comp} |
|-----------|------------|---------|
| ${strengths[0]?.split(' ')[0] || 'Strength 1'} | ✅ Strong | ⚠️ Limited |
| ${strengths[1]?.split(' ')[0] || 'Strength 2'} | ✅ Strong | ⚠️ Limited |
| ${weaknesses[0]?.split(' ')[0] || 'Gap 1'} | ⚠️ Developing | ✅ Strong |

**Our Advantages Over ${comp}:**
${strengths.slice(0, 3).map(s => `- ${s}`).join('\n')}

**Their Advantages Over Us:**
${weaknesses.slice(0, 2).map(w => `- They're stronger at: ${w}`).join('\n')}

**${comp} Trap Questions:**
*Questions to ask that expose their weaknesses*

1. "How does ${comp} handle ${strengths[0]?.toLowerCase() || 'your top strength'}?"
2. "What's their approach to ${strengths[1]?.toLowerCase() || 'your second strength'}?"
3. "Have you looked at how they compare on [key metric]?"

**"Why Not ${comp}?" Response:**

\`\`\`
If prospect asks: "Why should we choose you over ${comp}?"

"That's a great question, and ${comp} is solid at [acknowledge their strength].

Here's why customers choose us:

1. ${strengths[0] || 'Key differentiator'} - [Brief explanation]
2. ${strengths[1] || 'Second differentiator'} - [Brief explanation]

Would it help to talk to a customer who evaluated both?"
\`\`\`

---

`;
  }

  output += `## 💬 Objection Handlers

`;

  // Generate specific handler for each objection
  for (let i = 0; i < objections.length; i++) {
    const obj = objections[i];
    const handler = generateObjectionHandler(obj);
    
    output += `### ${i + 1}. "${obj}"

**Acknowledge:** "${handler.acknowledge}"

**Counter:** "${handler.counter}"

**Redirect:** "${handler.redirect}"

**Full Response:**
\`\`\`
"${handler.acknowledge}

${handler.counter}

${handler.redirect}"
\`\`\`

---

`;
  }

  output += `## 📊 Win/Loss Analysis

### We Win When:
${wins.length > 0 
  ? wins.map(w => `- ✅ ${w}`).join('\n')
  : `- ✅ ${strengths[0] || 'Our key strength'} is the priority
- ✅ Buyer values ${strengths[1] || 'our second strength'}
- ✅ Technical evaluation included`}

### We Lose When:
${losses.length > 0 
  ? losses.map(l => `- ❌ ${l}`).join('\n')
  : `- ❌ ${weaknesses[0] || 'Our gap area'} is critical requirement
- ❌ ${weaknesses[1] || 'Price sensitivity'} dominates decision
- ❌ Incumbent relationship too strong`}

### Win Rate by Competitor (Track This):

| Competitor | Win Rate | Sample Size | Trend |
|------------|----------|-------------|-------|
${competitors.map(c => `| ${c} | __% | __ deals | __ |`).join('\n')}

---

## 📝 Quick Reference Card

\`\`\`
${args.your_product.toUpperCase()} vs COMPETITION - QUICK GUIDE

OUR SUPERPOWERS:
${strengths.slice(0, 3).map(s => `• ${s}`).join('\n')}

WATCH OUT FOR:
${weaknesses.slice(0, 2).map(w => `• ${w}`).join('\n')}

TOP OBJECTION HANDLERS:
${objections.slice(0, 3).map((o, i) => `${i + 1}. "${o}" → Focus on [${strengths[i] || 'key value'}]`).join('\n')}
\`\`\`

---

*Competitive intelligence generated using CRAFT GTM Framework v2.0*`;

  return output;
}

// Extract strength from a win reason
function extractStrengthFromWin(win: string): string {
  const winLower = win.toLowerCase();
  
  if (winLower.includes('easy') || winLower.includes('simple') || winLower.includes('intuitive')) {
    return 'Ease of use / intuitive interface';
  }
  if (winLower.includes('support') || winLower.includes('service') || winLower.includes('team')) {
    return 'Superior customer support';
  }
  if (winLower.includes('fast') || winLower.includes('quick') || winLower.includes('speed')) {
    return 'Faster implementation / time to value';
  }
  if (winLower.includes('integrat') || winLower.includes('connect')) {
    return 'Strong integrations / ecosystem';
  }
  if (winLower.includes('feature') || winLower.includes('capabilit')) {
    return 'More comprehensive features';
  }
  if (winLower.includes('price') || winLower.includes('cost') || winLower.includes('value')) {
    return 'Better value / pricing';
  }
  if (winLower.includes('trust') || winLower.includes('security') || winLower.includes('reliable')) {
    return 'Trust / security / reliability';
  }
  
  // Return cleaned up version of the win
  return win.charAt(0).toUpperCase() + win.slice(1);
}

// Extract weakness from a loss reason
function extractWeaknessFromLoss(loss: string): string {
  const lossLower = loss.toLowerCase();
  
  if (lossLower.includes('price') || lossLower.includes('expensive') || lossLower.includes('cost')) {
    return 'Pricing perception (seen as expensive)';
  }
  if (lossLower.includes('feature') || lossLower.includes('missing') || lossLower.includes('lack')) {
    return 'Feature gaps vs competitors';
  }
  if (lossLower.includes('brand') || lossLower.includes('known') || lossLower.includes('trust')) {
    return 'Brand awareness / trust gap';
  }
  if (lossLower.includes('incumbent') || lossLower.includes('existing') || lossLower.includes('already')) {
    return 'Incumbent advantage / switching costs';
  }
  if (lossLower.includes('enterprise') || lossLower.includes('scale')) {
    return 'Enterprise readiness perception';
  }
  if (lossLower.includes('integrat')) {
    return 'Integration gaps';
  }
  
  // Return cleaned up version of the loss
  return loss.charAt(0).toUpperCase() + loss.slice(1);
}

// Discovery mode when user has minimal competitive knowledge
function generateCompetitiveDiscoveryKit(product: string, competitors: string[]): string {
  return `# 🔍 Competitive Discovery Kit: ${product}

## Current Situation

You've identified these competitors: **${competitors.join(', ')}**

But you haven't provided:
- Your strengths (why you win)
- Your weaknesses (why you lose)
- Common objections you hear
- Recent win/loss stories

**To build effective battle cards, we need to understand your competitive position.**

---

## 📋 Step 1: Win/Loss Analysis Template

### For Your Last 10 Wins, Answer:

| Deal | Competitor | Why Did We Win? | Key Differentiator |
|------|------------|-----------------|-------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### For Your Last 10 Losses, Answer:

| Deal | Competitor | Why Did We Lose? | What Would Have Changed the Outcome? |
|------|------------|------------------|--------------------------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## 📞 Step 2: Sales Team Interview Questions

Ask your sales reps:

### Win Patterns
1. "Think about your best wins against ${competitors[0] || 'competitors'}. What did we do right?"
2. "When prospects choose us, what do they say is the deciding factor?"
3. "Which features do you demo that get the best reaction?"

### Loss Patterns  
4. "What objections come up most often that you struggle to handle?"
5. "When we lose, what reason does the prospect give?"
6. "Which competitor do you hate going up against? Why?"

### Competitive Positioning
7. "How do you position us vs ${competitors[0] || 'the main competitor'}?"
8. "What do you wish you could say about us that you can't today?"

---

## 🔎 Step 3: Competitive Research Checklist

For each competitor (${competitors.join(', ')}):

- [ ] Review their website messaging - what do they claim?
- [ ] Check G2/Capterra reviews - what do customers praise/complain about?
- [ ] Look at their case studies - which industries/sizes do they focus on?
- [ ] Find their pricing (if public) - how does it compare?
- [ ] Check LinkedIn - how big is their team? Which roles are they hiring?
- [ ] Search news - any recent funding, acquisitions, or product launches?

---

## 🎯 Quick Competitor Profiles to Fill In

${competitors.map(c => `
### ${c}

**What they claim:** [Check their homepage]
**Target customer:** [Who do they focus on?]
**Pricing model:** [How do they charge?]
**Key strengths:** [What are they known for?]
**Key weaknesses:** [What do people complain about?]
**When they win against us:** [Pattern?]
**When we win against them:** [Pattern?]
`).join('\n')}

---

## 🔄 Next Steps

1. **Fill in the win/loss analysis** (even 5 deals helps)
2. **Do 2-3 sales team interviews** (15 min each)
3. **Complete competitor profiles** above
4. **Come back to this tool** with your findings

**Once you have this data, run competitive_intel again with:**
\`\`\`
your_strengths: "strength 1, strength 2"
your_weaknesses: "weakness 1, weakness 2"
common_objections: "objection 1, objection 2"
recent_wins: "why we won deal 1, why we won deal 2"
recent_losses: "why we lost deal 1, why we lost deal 2"
\`\`\`

You'll get complete battle cards with specific handlers for each competitor and objection.

---

*Competitive Discovery Kit generated using CRAFT GTM Framework v2.0*`;
}

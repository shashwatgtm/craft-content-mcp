import { parseListItems } from './utils.js';

export function generateRetentionPlaybook(args: {
  customer_segment: string;
  business_model: string;
  current_churn_rate: string;
  churn_reasons?: string;
  available_data_signals?: string;
  cs_team_size?: string;
  current_interventions?: string;
}): string {
  const businessModel = args.business_model;
  const csTeamSize = args.cs_team_size || 'small_1_3';
  const churnReasons = args.churn_reasons ? parseListItems(args.churn_reasons) : [];
  const dataSignals = args.available_data_signals ? parseListItems(args.available_data_signals) : [];
  
  // Parse churn rate
  const churnMatch = args.current_churn_rate.match(/(\d+(?:\.\d+)?)/);
  const churnRate = churnMatch ? parseFloat(churnMatch[1]) : 0;
  
  // Determine severity
  const churnSeverity = churnRate > 8 ? 'CRITICAL' : churnRate > 5 ? 'HIGH' : churnRate > 3 ? 'MODERATE' : 'HEALTHY';
  
  // DISCOVERY MODE: If no churn reasons provided
  if (churnReasons.length === 0) {
    return generateChurnDiscoveryKit(args.customer_segment, businessModel, churnRate, churnSeverity, csTeamSize);
  }
  
  // Business model-specific health score weights
  const healthScoreWeights: Record<string, Record<string, number>> = {
    saas_subscription: { login_frequency: 25, feature_adoption: 30, support_tickets: 15, billing_health: 10, engagement_trend: 20 },
    usage_based: { usage_volume: 40, usage_trend: 25, feature_breadth: 15, billing_health: 10, support_tickets: 10 },
    marketplace: { transaction_frequency: 35, gmv_trend: 25, seller_buyer_ratio: 15, review_score: 15, support_tickets: 10 },
    transactional: { purchase_frequency: 30, aov_trend: 25, category_breadth: 20, engagement: 15, support: 10 },
    freemium: { feature_engagement: 30, upgrade_signals: 30, viral_actions: 20, time_in_product: 10, support: 10 },
    enterprise_contract: { executive_engagement: 25, feature_adoption: 25, support_nps: 20, expansion_signals: 15, renewal_sentiment: 15 }
  };
  
  const weights = healthScoreWeights[businessModel] || healthScoreWeights.saas_subscription;
  
  // CS team capacity determines intervention approach
  const interventionCapacity: Record<string, { highTouch: number; automated: number; scaledTouch: number }> = {
    no_dedicated_cs: { highTouch: 0, automated: 90, scaledTouch: 10 },
    small_1_3: { highTouch: 20, automated: 50, scaledTouch: 30 },
    medium_4_10: { highTouch: 40, automated: 30, scaledTouch: 30 },
    large_10_plus: { highTouch: 60, automated: 20, scaledTouch: 20 }
  };
  
  const capacity = interventionCapacity[csTeamSize] || interventionCapacity.small_1_3;
  
  // Generate specific intervention for each churn reason
  const generateIntervention = (reason: string): { trigger: string; action: string; owner: string; timing: string; email: string } => {
    const reasonLower = reason.toLowerCase();
    
    if (reasonLower.includes('price') || reasonLower.includes('cost') || reasonLower.includes('expensive')) {
      return {
        trigger: 'Price objection identified (survey, support ticket, or cancellation reason)',
        action: 'Value demonstration call + ROI analysis',
        owner: capacity.highTouch > 30 ? 'CSM' : 'Automated + escalation path',
        timing: 'Within 24 hours of signal',
        email: `Subject: Getting more value from ${args.customer_segment}\n\nHi [Name],\n\nI noticed you mentioned concerns about cost. I'd love to show you some features that customers tell us deliver the biggest ROI.\n\nMany teams in your situation found that [specific feature] alone saves [X hours/dollars] per month.\n\nWould you be open to a quick 15-minute call to ensure you're getting maximum value?\n\n[Your name]`
      };
    }
    
    if (reasonLower.includes('feature') || reasonLower.includes('missing') || reasonLower.includes('capability')) {
      return {
        trigger: 'Feature gap mentioned in support/feedback/survey',
        action: 'Feature request logging + workaround education + roadmap preview (if applicable)',
        owner: capacity.highTouch > 30 ? 'CSM with Product input' : 'Support with escalation',
        timing: 'Within 48 hours',
        email: `Subject: About the feature you mentioned...\n\nHi [Name],\n\nThanks for sharing your feedback about [specific feature]. I wanted to follow up personally.\n\nWhile I can't promise timelines, I've shared your use case with our product team. In the meantime, here's a workaround that some customers use: [workaround]\n\nWould it help to walk through this together?\n\n[Your name]`
      };
    }
    
    if (reasonLower.includes('support') || reasonLower.includes('help') || reasonLower.includes('response')) {
      return {
        trigger: 'Multiple support tickets OR low CSAT on support interaction',
        action: 'Executive escalation + dedicated support channel + satisfaction recovery',
        owner: 'Support Manager + CSM',
        timing: 'Same day',
        email: `Subject: Making things right\n\nHi [Name],\n\nI saw that your recent support experience wasn't up to our standards. I'm sorry about that.\n\nI've personally reviewed your case and want to make sure we resolve this properly. I've also set up a direct escalation path for you: [contact info].\n\nCan we schedule a call to address your concerns directly?\n\n[Your name]`
      };
    }
    
    if (reasonLower.includes('competitor') || reasonLower.includes('switch') || reasonLower.includes('alternative')) {
      return {
        trigger: 'Competitor mention in any customer touchpoint',
        action: 'Competitive win-back campaign + differentiation call',
        owner: capacity.highTouch > 30 ? 'CSM or Account Exec' : 'Automated comparison content',
        timing: 'Within 4 hours if identified',
        email: `Subject: Before you decide...\n\nHi [Name],\n\nI understand you're evaluating other options. That's smart - you should always explore what's best for your team.\n\nBefore you make a final decision, I'd love to share some context that customers who've made similar evaluations found helpful. We've also been told we do [key differentiator] better than alternatives.\n\nWorth a quick call?\n\n[Your name]`
      };
    }
    
    if (reasonLower.includes('use') || reasonLower.includes('adopt') || reasonLower.includes('engagement') || reasonLower.includes('not using')) {
      return {
        trigger: 'Low login frequency OR <30% feature adoption',
        action: 'Onboarding reset + use case discovery call + quick-win identification',
        owner: capacity.highTouch > 30 ? 'CSM' : 'Automated nurture + human backup',
        timing: 'When pattern detected (Day 7, 14, 21 of low engagement)',
        email: `Subject: Getting more out of [Product]\n\nHi [Name],\n\nI noticed your team hasn't been using [Product] as much recently. Sometimes that means we didn't nail the initial setup.\n\nI'd love to understand your goals better and show you a quick win that might change how you see the product. Teams like yours typically see [specific outcome] within the first month when we get this right.\n\n15 minutes - worth it?\n\n[Your name]`
      };
    }
    
    // Default intervention
    return {
      trigger: `"${reason}" identified in customer feedback`,
      action: 'Personalized outreach + root cause analysis',
      owner: capacity.highTouch > 30 ? 'CSM' : 'Automated check-in with escalation',
      timing: 'Within 48 hours of signal',
      email: `Subject: Quick check-in\n\nHi [Name],\n\nI wanted to reach out personally because your feedback matters to us.\n\nYou mentioned "${reason}" - I'd love to understand this better and see if there's anything we can do.\n\nDo you have 10 minutes this week?\n\n[Your name]`
    };
  };

  let output = `# 🔄 Retention Playbook
## ${args.customer_segment}

**Business Model:** ${businessModel.replace(/_/g, ' ')}
**Current Churn Rate:** ${args.current_churn_rate} (${churnSeverity})
**CS Team Capacity:** ${csTeamSize.replace(/_/g, ' ')}

---

## 🚨 Churn Severity Assessment

| Metric | Value | Status |
|--------|-------|--------|
| Monthly Churn | ${churnRate}% | ${churnSeverity === 'CRITICAL' ? '🔴' : churnSeverity === 'HIGH' ? '🟠' : churnSeverity === 'MODERATE' ? '🟡' : '🟢'} ${churnSeverity} |
| Annual Revenue at Risk | ~${(churnRate * 12).toFixed(0)}% | ${churnRate * 12 > 50 ? '⚠️ Urgent' : 'Monitor'} |
| Benchmark (${businessModel.replace(/_/g, ' ')}) | ${businessModel === 'saas_subscription' ? '3-5%' : businessModel === 'consumer' ? '5-8%' : '4-6%'} | - |

---

## 📊 Health Score Model (${businessModel.replace(/_/g, ' ')})

| Signal | Weight | How to Track | Threshold |
|--------|--------|--------------|-----------|
${Object.entries(weights).map(([signal, weight]) => {
  const available = dataSignals.some(ds => ds.toLowerCase().includes(signal.split('_')[0]));
  return `| ${signal.replace(/_/g, ' ')} | ${weight}% | ${available ? '✅ Available' : '⚠️ Need to add'} | Red < 30, Yellow 30-70, Green > 70 |`;
}).join('\n')}

### Health Score Calculation

\`\`\`
Health Score = ${Object.entries(weights).map(([signal, weight]) => `(${signal} × ${weight / 100})`).join(' + ')}

Risk Levels:
- 🔴 Critical (0-30): Immediate intervention required
- 🟠 At Risk (31-50): Proactive outreach needed  
- 🟡 Monitor (51-70): Nurture and optimize
- 🟢 Healthy (71-100): Expand and advocate
\`\`\`

---

## 🎯 Churn Reason Interventions

`;

  // Generate specific intervention for each churn reason
  for (let i = 0; i < churnReasons.length; i++) {
    const reason = churnReasons[i];
    const intervention = generateIntervention(reason);
    
    output += `### ${i + 1}. "${reason}"

**Trigger:** ${intervention.trigger}

**Intervention Protocol:**
| Element | Detail |
|---------|--------|
| Action | ${intervention.action} |
| Owner | ${intervention.owner} |
| Timing | ${intervention.timing} |
| Success Metric | Retention rate of triggered customers |

**Ready-to-Use Email Template:**

\`\`\`
${intervention.email}
\`\`\`

---

`;
  }

  output += `## 📈 Intervention Mix (Based on Team Capacity)

| Intervention Type | Allocation | Description |
|-------------------|------------|-------------|
| High-Touch | ${capacity.highTouch}% | Personal calls, custom solutions, executive involvement |
| Scaled Touch | ${capacity.scaledTouch}% | 1:many webinars, office hours, community |
| Automated | ${capacity.automated}% | Email sequences, in-app messages, self-serve |

---

## ⏰ Lifecycle Intervention Timing

| Touchpoint | Timing | Action | Goal |
|------------|--------|--------|------|
| Onboarding Check | Day 7 | Adoption check + quick win | Activate |
| First Value Review | Day 30 | Success metrics review | Confirm value |
| Expansion Probe | Day 60 | Use case expansion | Deepen |
| QBR (if applicable) | Day 90 | Business review | Renew signal |
| Pre-Renewal | -60 days | Renewal conversation | Retain |
| At-Risk Intervention | When triggered | Health score-based | Save |

---

## 📊 Metrics & Monitoring

| Metric | Target | Current | Tracking |
|--------|--------|---------|----------|
| Monthly Churn Rate | <${businessModel === 'saas_subscription' ? '3' : '5'}% | ${churnRate}% | Billing system |
| Health Score Coverage | 100% | - | CS platform |
| Intervention Response Rate | >50% | - | Email/call tracking |
| Save Rate (at-risk to retained) | >30% | - | CS platform |
| Time to First Value | <${businessModel === 'enterprise_contract' ? '30' : '7'} days | - | Product analytics |

---

*Retention playbook generated for ${args.customer_segment} using CRAFT GTM Framework v2.0*
*Optimized for ${businessModel.replace(/_/g, ' ')} business model with ${csTeamSize.replace(/_/g, ' ')} CS team*`;

  return output;
}

// DISCOVERY MODE: Help user identify churn reasons
function generateChurnDiscoveryKit(
  segment: string,
  businessModel: string,
  churnRate: number,
  severity: string,
  csTeamSize: string
): string {
  const commonReasons: Record<string, string[]> = {
    saas_subscription: ['Price/value mismatch', 'Missing features', 'Poor support', 'Competitor switch', 'Low usage/adoption', 'Champion left', 'Budget cuts', 'Poor onboarding'],
    usage_based: ['Unpredictable billing', 'Usage dropped', 'Better pricing elsewhere', 'Feature gaps', 'Integration issues'],
    marketplace: ['Low supply/demand', 'Trust issues', 'Fee concerns', 'Better platform', 'Quality issues'],
    transactional: ['Price sensitivity', 'Product quality', 'Delivery issues', 'Customer service', 'Found alternatives'],
    freemium: ['Never converted', 'Feature limits frustrating', 'Found free alternative', 'Not enough value to pay'],
    enterprise_contract: ['Executive sponsor left', 'Failed implementation', 'Poor ROI', 'Vendor consolidation', 'Contract terms']
  };

  const reasons = commonReasons[businessModel] || commonReasons.saas_subscription;

  return `# 🔍 Churn Discovery Kit: ${segment}

## Current Situation

| Metric | Value | Assessment |
|--------|-------|------------|
| **Churn Rate** | ${churnRate}% | ${severity} |
| **Business Model** | ${businessModel.replace(/_/g, ' ')} | |
| **CS Team** | ${csTeamSize.replace(/_/g, ' ')} | |

⚠️ **You haven't provided churn reasons.** To build an effective retention playbook, you need to understand WHY customers leave.

Here's a framework to discover your churn reasons:

---

## 📋 Step 1: Churn Survey Template

Send this to recently churned customers (within 7 days of churn):

**Subject:** Quick question - we'd love your feedback

**Body:**
> Hi [Name],
>
> We're sorry to see you go. To help us improve, would you mind sharing the main reason you decided to leave?
>
> [SINGLE SELECT - pick ONE]
${reasons.map((r, i) => `> - ${r}`).join('\n')}
> - Other: ___________
>
> Any additional feedback is greatly appreciated.
>
> Thank you,
> [Your name]

---

## 📞 Step 2: Churn Interview Questions

For high-value churns, do a 15-minute call:

### Opening (2 min)
1. "Thanks for taking the time. I'm trying to understand what we could have done better."

### Discovery (10 min)
2. "Walk me through your decision to leave - when did you first start thinking about it?"
3. "What was the final trigger that made you decide?"
4. "If you could change ONE thing about us, what would it be?"
5. "Did you evaluate alternatives? What did they offer that we didn't?"
6. "Was there a moment when you felt most frustrated with us?"

### Future (3 min)
7. "Is there anything that would bring you back?"
8. "What would you tell someone considering our product?"

---

## 📊 Step 3: Data Analysis Checklist

Before customers tell you why they left, your data might already show patterns:

### Usage Signals to Check
- [ ] Login frequency trend (30/60/90 days before churn)
- [ ] Feature adoption (which features did churns NOT use?)
- [ ] Support ticket volume and sentiment
- [ ] Time since last meaningful action
- [ ] NPS or CSAT scores

### Correlation Analysis
- [ ] Churn by customer size (SMB vs Enterprise)
- [ ] Churn by acquisition channel
- [ ] Churn by first feature used
- [ ] Churn by onboarding completion rate
- [ ] Churn by CSM assignment

---

## 🎯 Common Churn Reasons for ${businessModel.replace(/_/g, ' ')} Business Model

Based on industry patterns, here are the MOST LIKELY reasons for your model:

${reasons.map((r, i) => `### ${i + 1}. ${r}

**Signals to look for:**
- ${getSignalsForReason(r)}

**Typical intervention:**
- ${getInterventionForReason(r)}`).join('\n\n')}

---

## 🔄 Next Steps

1. **Send churn survey** to last 20 churned customers
2. **Conduct 5 churn interviews** with highest-value losses
3. **Pull data** on the signals above
4. **Come back to this tool** with your top 3-5 churn reasons

**Once you have churn reasons, run this tool again with:**
\`\`\`
churn_reasons: "reason 1, reason 2, reason 3"
\`\`\`

You'll get a complete playbook with specific interventions for each reason.

---

*Churn Discovery Kit generated using CRAFT GTM Framework v2.0*
*For ${segment} in ${businessModel.replace(/_/g, ' ')} model*`;
}

function getSignalsForReason(reason: string): string {
  const signals: Record<string, string> = {
    'Price/value mismatch': 'Mentions "expensive" or "cost" in support tickets, requests for discounts',
    'Missing features': 'Feature request tickets, "can\'t do X" mentions, integration requests',
    'Poor support': 'Low CSAT on tickets, multiple escalations, long resolution times',
    'Competitor switch': 'Competitor mentions in calls, "saw that X can do Y" comments',
    'Low usage/adoption': 'Login frequency dropping, few features used, short sessions',
    'Champion left': 'Primary contact changed, new stakeholder questions basics',
    'Budget cuts': 'Delayed payments, contract negotiation requests, downgrade inquiries',
    'Poor onboarding': 'Churns within 30 days, incomplete setup, never hit first milestone'
  };
  return signals[reason] || 'Check support tickets and usage data for mentions';
}

function getInterventionForReason(reason: string): string {
  const interventions: Record<string, string> = {
    'Price/value mismatch': 'ROI review call, value demonstration, usage optimization',
    'Missing features': 'Workaround education, roadmap preview, feature request escalation',
    'Poor support': 'Executive escalation, dedicated support channel, satisfaction recovery',
    'Competitor switch': 'Competitive differentiation call, switching cost analysis, special offer',
    'Low usage/adoption': 'Reactivation campaign, training session, success milestone push',
    'Champion left': 'New champion discovery, executive sponsorship renewal, value resell',
    'Budget cuts': 'Downgrade options, payment flexibility, value justification for leadership',
    'Poor onboarding': 'Onboarding restart, dedicated implementation support, quick win focus'
  };
  return interventions[reason] || 'Direct outreach to understand and address concern';
}

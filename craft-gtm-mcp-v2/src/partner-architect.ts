export function generatePartnerArchitect(args: {
  company: string;
  product: string;
  partner_model: string;
  partner_goals: string;
  your_deal_size: string;
  partner_support_capacity?: string;
  existing_partners?: string;
}): string {
  const partnerModel = args.partner_model;
  const supportCapacity = args.partner_support_capacity || 'moderate';
  
  // Parse deal size for commission calculations
  const dealSizeMatch = args.your_deal_size.match(/\$?([\d,]+)/);
  const dealSize = dealSizeMatch ? parseInt(dealSizeMatch[1].replace(/,/g, '')) : 5000;
  
  interface PartnerTier {
    name: string;
    requirements: string[];
    benefits: string[];
    commission: string;
    support: string;
  }
  
  const programStructures: Record<string, { overview: string; tiers: PartnerTier[]; kpis: string[] }> = {
    reseller: {
      overview: 'Partners purchase licenses/subscriptions at discount and resell to end customers. Full sales cycle ownership.',
      tiers: [
        { name: 'Authorized', requirements: ['Sign partner agreement', 'Complete basic certification', '0 deals closed'], benefits: ['Partner portal access', 'Basic sales materials', 'Deal registration'], commission: `${Math.round(dealSize * 0.15)} (15% discount)`, support: 'Email support, monthly newsletter' },
        { name: 'Silver', requirements: ['3+ deals/quarter', '1 certified seller', 'Demo environment active'], benefits: ['Co-marketing funds ($500/q)', 'Lead sharing', 'Priority support'], commission: `${Math.round(dealSize * 0.20)} (20% discount)`, support: 'Dedicated Slack channel, QBRs' },
        { name: 'Gold', requirements: ['10+ deals/quarter', '3 certified staff', 'Joint business plan'], benefits: ['Co-marketing funds ($2K/q)', 'Exec sponsor', 'Product roadmap input', 'Event sponsorship'], commission: `${Math.round(dealSize * 0.25)} (25% discount)`, support: 'Dedicated partner manager, weekly syncs' },
        { name: 'Platinum', requirements: ['25+ deals/quarter', '5 certified staff', 'Exclusivity in territory (optional)'], benefits: ['Custom pricing', 'Co-development opportunities', 'Advisory board seat', 'First access to features'], commission: `${Math.round(dealSize * 0.30)} (30% discount)`, support: 'Strategic partnership team, exec alignment' }
      ],
      kpis: ['Partner-sourced revenue', 'Deals registered', 'Certification completion', 'Partner NPS']
    },
    referral: {
      overview: 'Partners refer leads; your team handles sales. Lower commitment, broader reach.',
      tiers: [
        { name: 'Referrer', requirements: ['Sign referral agreement', 'Submit first referral'], benefits: ['Unique referral link', 'Basic tracking dashboard'], commission: `$${Math.round(dealSize * 0.10)} per closed deal (10%)`, support: 'Self-serve portal' },
        { name: 'Advocate', requirements: ['3+ qualified referrals/quarter', 'Optional: brief training'], benefits: ['Priority referral processing', 'Monthly reports', 'Swag kit'], commission: `$${Math.round(dealSize * 0.15)} per closed deal (15%)`, support: 'Monthly email updates, annual appreciation event' }
      ],
      kpis: ['Referrals submitted', 'Referral-to-opportunity rate', 'Referral revenue', 'Active referrers']
    },
    integration_tech: {
      overview: 'Technology partners build integrations. Value comes from expanded capabilities and shared customers.',
      tiers: [
        { name: 'Listed', requirements: ['Basic integration built', 'Documentation provided', 'Support process defined'], benefits: ['Marketplace listing', 'Integration badge', 'API access'], commission: 'No direct commission - mutual value', support: 'Technical documentation, community forum' },
        { name: 'Certified', requirements: ['Deep integration', 'Joint customers', 'Co-marketing commitment'], benefits: ['Featured placement', 'Co-marketing funds', 'Joint webinars', 'Shared leads'], commission: 'Revenue share on joint deals (10-15%)', support: 'Integration engineer, monthly syncs' },
        { name: 'Strategic', requirements: ['Native integration', 'Significant joint revenue', 'Exec sponsorship'], benefits: ['Product integration', 'Joint GTM motion', 'Roadmap alignment', 'Co-selling'], commission: 'Custom revenue share based on deal structure', support: 'Dedicated partnership team, exec alignment' }
      ],
      kpis: ['Integration usage', 'Joint customers', 'Co-marketing leads', 'Integration NPS']
    },
    agency_si: {
      overview: 'Services partners implement, customize, and support your product. Revenue from implementation fees.',
      tiers: [
        { name: 'Registered', requirements: ['Sign partner agreement', 'Complete implementation certification', '1 project delivered'], benefits: ['Partner portal', 'Implementation guides', 'Referral fees for leads'], commission: `$${Math.round(dealSize * 0.10)} referral fee + implementation revenue`, support: 'Documentation, community' },
        { name: 'Certified', requirements: ['3+ implementations', '2 certified consultants', 'Case study'], benefits: ['Lead sharing', 'Co-marketing', 'Listed as certified partner'], commission: `$${Math.round(dealSize * 0.15)} referral + premium implementation rates`, support: 'Partner manager, monthly office hours' },
        { name: 'Premier', requirements: ['10+ implementations', '5 certified consultants', 'Dedicated practice'], benefits: ['Exclusive territories', 'Joint sales', 'Product influence', 'Premier badge'], commission: `$${Math.round(dealSize * 0.20)} referral + exclusive implementation rights`, support: 'Strategic partner manager, weekly syncs, exec access' }
      ],
      kpis: ['Implementations delivered', 'Customer satisfaction', 'Expansion revenue influenced', 'Certified consultants']
    },
    affiliate: {
      overview: 'Performance-based marketing partners. Drive traffic and conversions via unique links.',
      tiers: [
        { name: 'Affiliate', requirements: ['Sign affiliate agreement', 'Have relevant audience'], benefits: ['Unique tracking links', 'Creative assets', 'Real-time dashboard'], commission: `$${Math.round(dealSize * 0.10)} per sale or ${Math.round(dealSize * 0.05)}/lead`, support: 'Self-serve portal, email support' },
        { name: 'Super Affiliate', requirements: ['$5K+ monthly revenue', 'Quality traffic only'], benefits: ['Custom landing pages', 'Higher commission', 'Priority support', 'Exclusive promotions'], commission: `$${Math.round(dealSize * 0.15)} per sale (15%)`, support: 'Dedicated affiliate manager' }
      ],
      kpis: ['Clicks', 'Conversions', 'Revenue', 'EPC (earnings per click)', 'Fraud rate']
    },
    oem_white_label: {
      overview: 'Partners embed your product within theirs. Deep integration, significant volume.',
      tiers: [
        { name: 'OEM License', requirements: ['Volume commitment', 'Technical integration', 'Support capability'], benefits: ['White-label rights', 'API access', 'Volume pricing'], commission: 'N/A - volume-based pricing (typically 50-70% discount)', support: 'Integration support, SLA' },
        { name: 'Strategic OEM', requirements: ['Significant volume', 'Co-development', 'Multi-year commitment'], benefits: ['Custom development', 'Roadmap influence', 'Exclusivity options'], commission: 'Custom pricing, revenue share options', support: 'Dedicated team, exec alignment' }
      ],
      kpis: ['Volume usage', 'Revenue per partner', 'Partner customer satisfaction', 'Contract value']
    }
  };
  
  const program = programStructures[partnerModel] || programStructures.referral;
  
  const supportAdjustments: Record<string, string> = {
    minimal_self_serve: '⚠️ Note: With minimal support capacity, prioritize self-serve onboarding, comprehensive documentation, and automated reporting. Consider limiting to 2 tiers max.',
    moderate: 'With moderate capacity, balance 1:1 support for top partners with self-serve for others. Consider office hours model.',
    high_touch: 'With high-touch capacity, you can offer white-glove onboarding and dedicated partner managers across tiers.'
  };

  return `# 🤝 Partner Program Architecture
## ${args.company} - ${partnerModel.replace(/_/g, ' ').toUpperCase()} Program

**Partner Model:** ${partnerModel.replace(/_/g, ' ')}
**Product:** ${args.product}
**Average Deal Size:** ${args.your_deal_size}
**Support Capacity:** ${supportCapacity.replace(/_/g, ' ')}

---

## 📋 Program Overview

${program.overview}

${supportAdjustments[supportCapacity] || ''}

---

## 🏆 Partner Tiers

${program.tiers.map((tier, i) => `
### Tier ${i + 1}: ${tier.name}

**Requirements to Qualify:**
${tier.requirements.map(r => `- ${r}`).join('\n')}

**Benefits:**
${tier.benefits.map(b => `- ✅ ${b}`).join('\n')}

**Commission/Economics:**
\`${tier.commission}\`

**Support Level:**
${tier.support}

---
`).join('')}

## 💰 Economic Model

### Partner Economics Calculator

| Scenario | Partner Effort | Partner Earnings | Your Revenue |
|----------|---------------|------------------|--------------|
| ${program.tiers[0].name} (1 deal) | Low | $${Math.round(dealSize * 0.10)} | $${Math.round(dealSize * 0.90)} |
| ${program.tiers.length > 1 ? program.tiers[1].name : program.tiers[0].name} (5 deals) | Medium | $${Math.round(dealSize * 0.15 * 5)} | $${Math.round(dealSize * 0.85 * 5)} |
| ${program.tiers[program.tiers.length - 1].name} (20 deals) | High | $${Math.round(dealSize * 0.25 * 20)} | $${Math.round(dealSize * 0.75 * 20)} |

### Commission Viability Check

Based on ${args.your_deal_size} deal size:
- ✅ ${dealSize > 1000 ? 'Deal size supports meaningful partner commissions' : '⚠️ Deal size may be too small for reseller model - consider affiliate or referral'}
- ${dealSize > 5000 ? '✅ Can support dedicated partner manager at scale' : '⚠️ May need to rely on self-serve until partner volume justifies support'}
- ${dealSize > 10000 ? '✅ Enterprise deals justify white-glove partner support' : 'Consider pooled partner support model'}

---

## 📊 Program KPIs

| Metric | Definition | Target | Tracking |
|--------|------------|--------|----------|
${program.kpis.map(kpi => `| ${kpi} | [Define measurement] | [Set target] | [Tool/dashboard] |`).join('\n')}

---

## 🚀 Onboarding Flow

### Day 0-7: Welcome & Setup
- [ ] Partner agreement signed
- [ ] Portal access provisioned
- [ ] Welcome kit sent (digital)
- [ ] Kickoff call scheduled (if ${supportCapacity === 'minimal_self_serve' ? 'top tier only' : 'applicable'})

### Day 7-30: Enable
- [ ] ${partnerModel === 'reseller' || partnerModel === 'agency_si' ? 'Certification started/completed' : 'Training materials reviewed'}
- [ ] ${partnerModel === 'integration_tech' ? 'Integration development started' : 'Sales materials accessed'}
- [ ] First ${partnerModel === 'affiliate' ? 'campaigns launched' : partnerModel === 'integration_tech' ? 'API calls made' : 'prospect identified'}

### Day 30-60: Activate
- [ ] First ${partnerModel === 'referral' || partnerModel === 'affiliate' ? 'referral/lead submitted' : 'deal registered'}
- [ ] ${partnerModel === 'integration_tech' ? 'Integration live in marketplace' : 'Pipeline developing'}
- [ ] Regular cadence established

### Day 60-90: Optimize
- [ ] First ${partnerModel === 'affiliate' ? 'commission paid' : 'deal closed'}
- [ ] Performance review completed
- [ ] Expansion plan discussed

---

## 📧 Partner Communications

### Recruitment Email Template

\`\`\`
Subject: Partnership opportunity with ${args.company}

Hi [Name],

I've been following [Partner Company]'s work in [space] and think there's a strong opportunity for us to work together.

${args.company} helps [value prop]. Our partners typically ${partnerModel === 'reseller' ? 'expand their revenue by offering our solution alongside their services' : partnerModel === 'referral' ? 'earn $X per qualified introduction' : partnerModel === 'integration_tech' ? 'increase their product value through deep integration' : 'grow their business with our tools'}.

${partnerModel === 'reseller' ? `With deals averaging ${args.your_deal_size}, partners at our Silver tier earn ~${Math.round(dealSize * 0.20 * 5)}/quarter.` : ''}

Would you be open to a 15-minute call to explore fit?

[Your name]
\`\`\`

---

*Partner program architecture generated using CRAFT GTM Framework v2.0*
*Customized for ${partnerModel.replace(/_/g, ' ')} model with ${supportCapacity.replace(/_/g, ' ')} support capacity*`;
}

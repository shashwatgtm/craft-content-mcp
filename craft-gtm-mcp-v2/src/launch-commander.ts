import { formatDate, addDays, calculateDaysUntil, parseListItems } from './utils.js';

interface Phase {
  name: string;
  weekRange: string;
  startOffset: number;
  endOffset: number;
  focus: string;
  tasks: string[];
}

// Parse flexible date formats
function parseLaunchDate(dateInput?: string): { date: Date | null; isFlexible: boolean; displayDate: string } {
  if (!dateInput || dateInput.toLowerCase() === 'tbd') {
    return { date: null, isFlexible: true, displayDate: 'TBD (To Be Determined)' };
  }
  
  // Check for quarter format: Q1 2025, Q2 2025, etc.
  const quarterMatch = dateInput.match(/Q([1-4])\s*(\d{4})/i);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1]);
    const year = parseInt(quarterMatch[2]);
    const quarterStartMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
    const midMonth = quarterStartMonths[quarter - 1] + 1; // Middle of quarter
    return { 
      date: new Date(year, midMonth, 15), 
      isFlexible: true, 
      displayDate: `Q${quarter} ${year} (planning mode)` 
    };
  }
  
  // Check for month year format: March 2025, Mar 2025
  const monthMatch = dateInput.match(/([A-Za-z]+)\s*(\d{4})/);
  if (monthMatch) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = monthNames.findIndex(m => monthMatch[1].toLowerCase().startsWith(m));
    if (monthIndex !== -1) {
      const year = parseInt(monthMatch[2]);
      return { 
        date: new Date(year, monthIndex, 15), 
        isFlexible: true, 
        displayDate: `${monthMatch[1]} ${year} (planning mode)` 
      };
    }
  }
  
  // Standard date format
  const date = new Date(dateInput);
  if (!isNaN(date.getTime())) {
    return { date, isFlexible: false, displayDate: formatDate(date) };
  }
  
  // Fallback
  return { date: null, isFlexible: true, displayDate: dateInput };
}

export function generateLaunchCommander(args: {
  product_feature: string;
  launch_type: string;
  target_segments: string;
  goals: string;
  launch_date?: string;
  available_channels?: string;
  team_size?: string;
  budget_level?: string;
}): string {
  const { date: launchDate, isFlexible, displayDate } = parseLaunchDate(args.launch_date);
  const launchType = args.launch_type || 'feature_launch';
  const teamSize = args.team_size || 'small_2_5';
  const budgetLevel = args.budget_level || 'moderate';
  const channels = args.available_channels ? parseListItems(args.available_channels) : ['email', 'linkedin', 'blog'];
  const segments = parseListItems(args.target_segments);
  const daysUntilLaunch = launchDate ? calculateDaysUntil(launchDate.toISOString()) : null;
  
  // Define phase structure based on launch type
  const phases: Record<string, Phase[]> = {
    major_release: [
      { name: 'Foundation', weekRange: 'Week -12 to -9', startOffset: -84, endOffset: -63, focus: 'Research & Strategy', tasks: ['Finalize positioning', 'Competitive analysis', 'Messaging framework', 'Content strategy', 'Channel planning'] },
      { name: 'Content Creation', weekRange: 'Week -8 to -5', startOffset: -56, endOffset: -35, focus: 'Asset Development', tasks: ['Landing page design', 'Demo videos', 'Blog content', 'Sales enablement', 'Press kit'] },
      { name: 'Pre-Launch', weekRange: 'Week -4 to -2', startOffset: -28, endOffset: -14, focus: 'Build Anticipation', tasks: ['Waitlist campaign', 'Influencer outreach', 'Internal training', 'PR coordination', 'Beta feedback integration'] },
      { name: 'Launch Week', weekRange: 'Week -1 to 0', startOffset: -7, endOffset: 0, focus: 'Execute Launch', tasks: ['Press release', 'Email blast', 'Social campaign', 'Webinar/event', 'Product Hunt (if applicable)'] },
      { name: 'Post-Launch', weekRange: 'Week 1 to 4', startOffset: 1, endOffset: 28, focus: 'Optimize & Scale', tasks: ['Monitor metrics', 'Gather feedback', 'Address issues', 'Amplify wins', 'Iterate messaging'] }
    ],
    feature_launch: [
      { name: 'Prep', weekRange: 'Week -6 to -4', startOffset: -42, endOffset: -28, focus: 'Planning', tasks: ['Positioning', 'Key messages', 'Content brief', 'Channel selection'] },
      { name: 'Build', weekRange: 'Week -3 to -2', startOffset: -21, endOffset: -14, focus: 'Create Assets', tasks: ['Landing page update', 'Email sequences', 'Blog post', 'Help docs'] },
      { name: 'Launch', weekRange: 'Week -1 to 0', startOffset: -7, endOffset: 0, focus: 'Go Live', tasks: ['Announcement email', 'In-app notification', 'Social posts', 'Customer webinar'] },
      { name: 'Follow-up', weekRange: 'Week 1 to 2', startOffset: 1, endOffset: 14, focus: 'Drive Adoption', tasks: ['Adoption tracking', 'Feature tips', 'Success stories', 'Feedback loop'] }
    ],
    beta_launch: [
      { name: 'Setup', weekRange: 'Week -4 to -3', startOffset: -28, endOffset: -21, focus: 'Prepare Beta', tasks: ['Beta criteria', 'Feedback system', 'Communication plan', 'Success metrics'] },
      { name: 'Recruit', weekRange: 'Week -2 to -1', startOffset: -14, endOffset: -7, focus: 'Get Testers', tasks: ['Beta invitations', 'Onboarding flow', 'Expectation setting', 'NDA if needed'] },
      { name: 'Run', weekRange: 'Week 0 to 2', startOffset: 0, endOffset: 14, focus: 'Active Beta', tasks: ['Monitor usage', 'Collect feedback', 'Bug tracking', 'Regular check-ins'] },
      { name: 'Close', weekRange: 'Week 3 to 4', startOffset: 15, endOffset: 28, focus: 'Wrap Up', tasks: ['Synthesize feedback', 'Thank testers', 'GA decision', 'Case studies'] }
    ],
    product_update: [
      { name: 'Prepare', weekRange: 'Week -2 to -1', startOffset: -14, endOffset: -7, focus: 'Get Ready', tasks: ['Release notes', 'Email draft', 'Support prep'] },
      { name: 'Launch', weekRange: 'Week 0', startOffset: 0, endOffset: 0, focus: 'Announce', tasks: ['Customer email', 'In-app message', 'Changelog update', 'Support brief'] }
    ],
    market_expansion: [
      { name: 'Research', weekRange: 'Week -10 to -7', startOffset: -70, endOffset: -49, focus: 'Market Analysis', tasks: ['Market sizing', 'Competitor mapping', 'Localization needs', 'Partner identification'] },
      { name: 'Adapt', weekRange: 'Week -6 to -4', startOffset: -42, endOffset: -28, focus: 'Localization', tasks: ['Messaging localization', 'Pricing strategy', 'Legal/compliance', 'Payment methods'] },
      { name: 'Seed', weekRange: 'Week -3 to -1', startOffset: -21, endOffset: -7, focus: 'Build Presence', tasks: ['Local partnerships', 'PR outreach', 'Pilot customers', 'Local hiring'] },
      { name: 'Launch', weekRange: 'Week 0', startOffset: 0, endOffset: 0, focus: 'Market Entry', tasks: ['Launch event', 'Press release', 'Paid campaigns', 'Community seeding'] },
      { name: 'Scale', weekRange: 'Week 1 to 6', startOffset: 1, endOffset: 42, focus: 'Grow Market', tasks: ['Performance optimization', 'Expand channels', 'Local team growth', 'Customer success'] }
    ]
  };
  
  const selectedPhases = phases[launchType] || phases.feature_launch;
  
  // Filter tasks based on available channels
  const filterTasksByChannels = (tasks: string[]): string[] => {
    return tasks.filter(task => {
      const taskLower = task.toLowerCase();
      if (channels.some(ch => taskLower.includes(ch.toLowerCase()))) return true;
      if (['position', 'messaging', 'strategy', 'feedback', 'metric', 'monitor', 'plan', 'brief'].some(word => taskLower.includes(word))) return true;
      if (taskLower.includes('webinar') && !channels.some(ch => ch.includes('webinar'))) return false;
      if (taskLower.includes('pr') && !channels.some(ch => ch.includes('pr'))) return false;
      if (taskLower.includes('paid') && !channels.some(ch => ch.includes('paid'))) return false;
      return true;
    });
  };
  
  // Adjust task assignment based on team size
  const getOwner = (taskType: string): string => {
    const ownerMap: Record<string, Record<string, string>> = {
      solo: { strategy: 'You', content: 'You', execution: 'You', sales: 'You' },
      small_2_5: { strategy: 'Lead', content: 'Content/Lead', execution: 'Team', sales: 'Sales' },
      medium_6_15: { strategy: 'Director', content: 'Content Team', execution: 'Campaign Manager', sales: 'Sales Enablement' },
      large_15_plus: { strategy: 'VP/Director', content: 'Content Lead', execution: 'Campaign Team', sales: 'Sales Enablement Team' }
    };
    return ownerMap[teamSize]?.[taskType] || 'TBD';
  };
  
  // Budget-appropriate tactics
  const budgetTactics: Record<string, string[]> = {
    bootstrap: ['Organic social', 'Content marketing', 'Community building', 'Partner co-marketing', 'Email marketing'],
    moderate: ['Targeted paid ads', 'Small event/webinar', 'Limited influencer', 'Retargeting', 'Content syndication'],
    well_funded: ['Multi-channel paid', 'Large events', 'Influencer campaigns', 'PR agency', 'ABM programs']
  };
  
  const availableTactics = budgetTactics[budgetLevel] || budgetTactics.moderate;

  // Build the launch plan
  let output = `# 🚀 Launch Command Center
## ${args.product_feature}

**Launch Type:** ${launchType.replace(/_/g, ' ').toUpperCase()}
**Launch Date:** ${displayDate}${daysUntilLaunch !== null ? ` (${daysUntilLaunch > 0 ? daysUntilLaunch + ' days away' : 'PAST DUE'})` : ''}
**Team Size:** ${teamSize.replace(/_/g, ' ')}
**Budget Level:** ${budgetLevel.replace(/_/g, ' ')}

---

## 🎯 Launch Goals

${args.goals.split(/[,\n]/).map(g => `- ${g.trim()}`).join('\n')}

---

## 👥 Target Segments

${segments.map((s, i) => `${i + 1}. **${s}**`).join('\n')}

---

## 📢 Active Channels

${channels.map(ch => `- ✅ ${ch}`).join('\n')}

**Budget-Appropriate Tactics:**
${availableTactics.map(t => `- ${t}`).join('\n')}

---

## 📅 Launch Timeline

`;

  // Generate detailed timeline - use current date as reference if no launch date
  const referenceDate = launchDate || new Date();
  
  for (const phase of selectedPhases) {
    const phaseStart = addDays(referenceDate, phase.startOffset);
    const phaseEnd = addDays(referenceDate, phase.endOffset);
    const isCurrentPhase = launchDate ? (new Date() >= phaseStart && new Date() <= phaseEnd) : false;
    
    output += `### ${isCurrentPhase ? '👉 ' : ''}${phase.name} Phase
**${isFlexible ? phase.weekRange : formatDate(phaseStart) + ' to ' + formatDate(phaseEnd)}** | Focus: ${phase.focus}

| Task | Owner | Due | Status |
|------|-------|-----|--------|
`;
    
    const filteredTasks = filterTasksByChannels(phase.tasks);
    filteredTasks.forEach((task, i) => {
      const taskDate = addDays(phaseStart, Math.floor((i / filteredTasks.length) * (phase.endOffset - phase.startOffset)));
      const isPast = taskDate < new Date();
      const ownerType = task.toLowerCase().includes('strategy') || task.toLowerCase().includes('position') ? 'strategy' :
                       task.toLowerCase().includes('content') || task.toLowerCase().includes('blog') ? 'content' :
                       task.toLowerCase().includes('sales') || task.toLowerCase().includes('enablement') ? 'sales' : 'execution';
      output += `| ${task} | ${getOwner(ownerType)} | ${formatDate(taskDate)} | ${isPast ? '⚠️ Check' : '⬜ Pending'} |\n`;
    });
    
    output += '\n';
  }

  // Segment-specific messaging
  output += `---

## 💬 Segment Messaging Matrix

`;

  for (const segment of segments) {
    output += `### ${segment}

| Element | Content |
|---------|---------|
| Primary Pain Point | [Define for ${segment}] |
| Key Message | "For ${segment}, ${args.product_feature} provides..." |
| Proof Point | [Case study/metric for ${segment}] |
| CTA | [Specific action for ${segment}] |
| Primary Channel | ${channels[0] || 'TBD'} |

`;
  }

  output += `---

## 📊 Success Metrics

| Metric | Target | Tracking Method |
|--------|--------|-----------------|
| Awareness | [Views/Impressions] | Analytics |
| Engagement | [CTR/Signups] | CRM/Analytics |
| Adoption | [Activations/Usage] | Product Analytics |
| Revenue | [Pipeline/Closed] | CRM |

---

## ⚠️ Risk Mitigation

| Risk | Mitigation | Owner |
|------|------------|-------|
| Launch delay | Buffer week built in | ${getOwner('strategy')} |
| Low awareness | Backup paid campaign ready | ${getOwner('execution')} |
| Technical issues | Rollback plan documented | Engineering |
| Competitive response | Battle cards updated | ${getOwner('sales')} |

---

## 📋 Pre-Launch Checklist

- [ ] Positioning finalized and approved
- [ ] All assets created and reviewed
- [ ] Sales team trained
- [ ] Support documentation ready
- [ ] Analytics tracking configured
- [ ] Rollback plan documented
- [ ] Success metrics defined
- [ ] Post-launch monitoring assigned

---

*Launch plan generated for ${launchType.replace(/_/g, ' ')} using CRAFT GTM Framework v2.0*`;

  return output;
}

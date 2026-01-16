import { parseMetrics, scoreMetric } from './utils.js';
export function generatePMFScorecard(args) {
    const metrics = parseMetrics(args.current_metrics);
    const marketType = args.target_market || 'other';
    const maturity = args.time_in_market || '1_2_years';
    // Define benchmarks by market type
    const benchmarks = {
        enterprise_saas: {
            churn: { low: 1, medium: 3, high: 5 },
            nps: { low: 30, medium: 50, high: 70 },
            ltvCac: { low: 2, medium: 3, high: 5 },
            retention: { low: 85, medium: 90, high: 95 },
            activation: { low: 40, medium: 60, high: 80 }
        },
        smb_saas: {
            churn: { low: 3, medium: 5, high: 8 },
            nps: { low: 25, medium: 40, high: 60 },
            ltvCac: { low: 2, medium: 3, high: 4 },
            retention: { low: 75, medium: 85, high: 92 },
            activation: { low: 30, medium: 50, high: 70 }
        },
        consumer: {
            churn: { low: 5, medium: 8, high: 12 },
            nps: { low: 20, medium: 35, high: 55 },
            ltvCac: { low: 1.5, medium: 2.5, high: 4 },
            retention: { low: 60, medium: 75, high: 85 },
            activation: { low: 20, medium: 40, high: 60 }
        },
        marketplace: {
            churn: { low: 4, medium: 7, high: 10 },
            nps: { low: 25, medium: 40, high: 55 },
            ltvCac: { low: 2, medium: 3, high: 5 },
            retention: { low: 65, medium: 80, high: 90 },
            activation: { low: 25, medium: 45, high: 65 }
        },
        fintech: {
            churn: { low: 2, medium: 4, high: 6 },
            nps: { low: 35, medium: 50, high: 70 },
            ltvCac: { low: 2.5, medium: 4, high: 6 },
            retention: { low: 80, medium: 90, high: 95 },
            activation: { low: 35, medium: 55, high: 75 }
        },
        healthtech: {
            churn: { low: 2, medium: 4, high: 7 },
            nps: { low: 30, medium: 45, high: 65 },
            ltvCac: { low: 2, medium: 3.5, high: 5 },
            retention: { low: 78, medium: 88, high: 94 },
            activation: { low: 30, medium: 50, high: 70 }
        },
        other: {
            churn: { low: 3, medium: 5, high: 8 },
            nps: { low: 25, medium: 40, high: 60 },
            ltvCac: { low: 2, medium: 3, high: 4 },
            retention: { low: 70, medium: 82, high: 90 },
            activation: { low: 30, medium: 50, high: 70 }
        }
    };
    const b = benchmarks[marketType] || benchmarks.other;
    // Score each dimension
    const churnScore = scoreMetric(metrics.churn, b.churn, false);
    const npsScore = scoreMetric(metrics.nps, b.nps, true);
    const ltvCacScore = scoreMetric(metrics.ltvCacRatio, b.ltvCac, true);
    const retentionScore = scoreMetric(metrics.retentionRate, b.retention, true);
    const activationScore = scoreMetric(metrics.activationRate, b.activation, true);
    // Calculate overall PMF score
    const scoredDimensions = [churnScore, npsScore, ltvCacScore, retentionScore, activationScore]
        .filter(s => s.label !== 'MISSING');
    const overallScore = scoredDimensions.length > 0
        ? Math.round(scoredDimensions.reduce((sum, s) => sum + s.score, 0) / scoredDimensions.length * 10) / 10
        : 0;
    // Determine PMF stage
    let pmfStage = 'Pre-PMF';
    let pmfAnalysis = '';
    if (overallScore >= 8) {
        pmfStage = 'Strong PMF';
        pmfAnalysis = 'Metrics indicate solid product-market fit. Focus on scaling.';
    }
    else if (overallScore >= 6) {
        pmfStage = 'Emerging PMF';
        pmfAnalysis = 'Good foundation but gaps to address before aggressive scaling.';
    }
    else if (overallScore >= 4) {
        pmfStage = 'Searching for PMF';
        pmfAnalysis = 'Significant gaps remain. Focus on product-market alignment.';
    }
    else {
        pmfAnalysis = 'Early stage - need more data or fundamental pivots needed.';
    }
    // Build actionable recommendations
    const recommendations = [];
    if (churnScore.label === 'CRITICAL' || churnScore.label === 'DEVELOPING') {
        recommendations.push('🚨 CHURN: Implement churn prediction model, conduct exit interviews, improve onboarding');
    }
    if (npsScore.label === 'MISSING') {
        recommendations.push('📊 NPS: Start measuring NPS immediately - critical PMF signal');
    }
    else if (npsScore.score < 6) {
        recommendations.push('📊 NPS: Focus on detractor feedback, address top 3 pain points');
    }
    if (ltvCacScore.label === 'MISSING') {
        recommendations.push('💰 LTV:CAC: Calculate unit economics - essential for scaling decisions');
    }
    else if (ltvCacScore.score < 6) {
        recommendations.push('💰 UNIT ECONOMICS: Either reduce CAC (improve conversion) or increase LTV (upsell/retention)');
    }
    if (activationScore.label === 'MISSING') {
        recommendations.push('🎯 ACTIVATION: Define and track "aha moment" metric');
    }
    else if (activationScore.score < 6) {
        recommendations.push('🎯 ACTIVATION: Improve time-to-value, simplify onboarding, remove friction');
    }
    // Parse customer feedback for qualitative signals
    let feedbackAnalysis = '';
    if (args.customer_feedback) {
        const feedback = args.customer_feedback.toLowerCase();
        if (feedback.includes('love') || feedback.includes('great') || feedback.includes('essential')) {
            feedbackAnalysis = '✅ Positive signals: Strong emotional resonance detected';
        }
        if (feedback.includes('but') || feedback.includes('however') || feedback.includes('wish')) {
            feedbackAnalysis += '\n⚠️ Improvement signals: Feature gaps or friction points mentioned';
        }
        if (feedback.includes('confus') || feedback.includes('difficult') || feedback.includes('complex')) {
            feedbackAnalysis += '\n🔧 UX signals: Usability improvements needed';
        }
    }
    return `# 📊 Product-Market Fit Scorecard
## ${args.product}

**Market Segment:** ${marketType.replace(/_/g, ' ').toUpperCase()}
**Maturity Stage:** ${maturity.replace(/_/g, ' ')}
**Analysis Date:** ${new Date().toISOString().split('T')[0]}

---

## 🎯 Overall PMF Assessment

| Stage | Score | Status |
|-------|-------|--------|
| **${pmfStage}** | **${overallScore}/10** | ${overallScore >= 7 ? '🟢' : overallScore >= 5 ? '🟡' : '🔴'} |

${pmfAnalysis}

---

## 📈 Dimension Scores

### 1. Customer Retention (Churn)
| Metric | Your Value | Score | Benchmark | Status |
|--------|-----------|-------|-----------|--------|
| Monthly Churn | ${metrics.churn !== undefined ? metrics.churn + '%' : 'NOT PROVIDED'} | ${churnScore.score}/10 | <${b.churn.medium}% target | ${churnScore.label} |

**Analysis:** ${churnScore.analysis}

---

### 2. Customer Satisfaction (NPS)
| Metric | Your Value | Score | Benchmark | Status |
|--------|-----------|-------|-----------|--------|
| NPS Score | ${metrics.nps !== undefined ? metrics.nps : 'NOT PROVIDED'} | ${npsScore.score}/10 | >${b.nps.medium} target | ${npsScore.label} |

**Analysis:** ${npsScore.analysis}

---

### 3. Unit Economics (LTV:CAC)
| Metric | Your Value | Score | Benchmark | Status |
|--------|-----------|-------|-----------|--------|
| LTV | ${metrics.ltv !== undefined ? '$' + metrics.ltv.toLocaleString() : 'NOT PROVIDED'} | - | - | - |
| CAC | ${metrics.cac !== undefined ? '$' + metrics.cac.toLocaleString() : 'NOT PROVIDED'} | - | - | - |
| LTV:CAC Ratio | ${metrics.ltvCacRatio !== undefined ? metrics.ltvCacRatio.toFixed(1) + 'x' : 'NOT PROVIDED'} | ${ltvCacScore.score}/10 | >${b.ltvCac.medium}x target | ${ltvCacScore.label} |

**Analysis:** ${ltvCacScore.analysis}

---

### 4. Revenue Retention
| Metric | Your Value | Score | Benchmark | Status |
|--------|-----------|-------|-----------|--------|
| Retention Rate | ${metrics.retentionRate !== undefined ? metrics.retentionRate + '%' : 'NOT PROVIDED'} | ${retentionScore.score}/10 | >${b.retention.medium}% target | ${retentionScore.label} |

**Analysis:** ${retentionScore.analysis}

---

### 5. Activation
| Metric | Your Value | Score | Benchmark | Status |
|--------|-----------|-------|-----------|--------|
| Activation Rate | ${metrics.activationRate !== undefined ? metrics.activationRate + '%' : 'NOT PROVIDED'} | ${activationScore.score}/10 | >${b.activation.medium}% target | ${activationScore.label} |

**Analysis:** ${activationScore.analysis}

---

## 📊 Additional Metrics Detected

| Metric | Value | Notes |
|--------|-------|-------|
${metrics.mrr !== undefined ? `| MRR | $${metrics.mrr.toLocaleString()} | Monthly Recurring Revenue |\n` : ''}${metrics.arr !== undefined ? `| ARR | $${metrics.arr.toLocaleString()} | Annual Recurring Revenue |\n` : ''}${metrics.dau !== undefined ? `| DAU | ${metrics.dau.toLocaleString()} | Daily Active Users |\n` : ''}${metrics.mau !== undefined ? `| MAU | ${metrics.mau.toLocaleString()} | Monthly Active Users |\n` : ''}${metrics.dauMauRatio !== undefined ? `| DAU/MAU | ${(metrics.dauMauRatio * 100).toFixed(1)}% | Stickiness ratio |\n` : ''}${metrics.trialConversion !== undefined ? `| Trial Conversion | ${metrics.trialConversion}% | Trial to paid rate |\n` : ''}${metrics.revenueGrowth !== undefined ? `| Revenue Growth | ${metrics.revenueGrowth}% | MoM or YoY growth |\n` : ''}

${feedbackAnalysis ? `---\n\n## 💬 Qualitative Signals\n\n${feedbackAnalysis}\n` : ''}
---

## 🎯 Priority Actions

${recommendations.length > 0 ? recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n') : '✅ All dimensions scoring well - focus on scaling!'}

---

## 📋 Data Gaps to Fill

${[
        metrics.churn === undefined ? '- [ ] Churn rate (monthly or annual)' : null,
        metrics.nps === undefined ? '- [ ] NPS score (survey customers)' : null,
        metrics.ltv === undefined ? '- [ ] Customer LTV calculation' : null,
        metrics.cac === undefined ? '- [ ] Customer Acquisition Cost' : null,
        metrics.retentionRate === undefined ? '- [ ] Retention/renewal rate' : null,
        metrics.activationRate === undefined ? '- [ ] Activation rate (define your "aha moment")' : null
    ].filter(Boolean).join('\n') || '✅ All critical metrics provided!'}

---

*Scorecard generated using CRAFT GTM Framework v2.0*
*Benchmarks adjusted for ${marketType.replace(/_/g, ' ')} market and ${maturity.replace(/_/g, ' ')} stage*`;
}
//# sourceMappingURL=pmf-scorecard.js.map
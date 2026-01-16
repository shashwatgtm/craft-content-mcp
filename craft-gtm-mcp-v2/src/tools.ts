import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const tools: Tool[] = [
  {
    name: "pmf_scorecard",
    description: "Generate a Product-Market Fit scorecard with AUTO-SCORED dimensions based on your metrics. Parses MRR, churn, NPS, CAC, LTV, retention, activation rates and scores against industry benchmarks. Version 2.0 - Actually analyzes your data!",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product name and brief description" },
        target_market: { 
          type: "string", 
          description: "Target market segment (e.g., 'Enterprise SaaS', 'SMB', 'Consumer')",
          enum: ["enterprise_saas", "smb_saas", "consumer", "marketplace", "fintech", "healthtech", "other"]
        },
        current_metrics: { 
          type: "string", 
          description: "Your current metrics (will be PARSED). Include any of: MRR, ARR, churn rate, NPS, CAC, LTV, retention rate, activation rate, DAU/MAU, trial conversion, revenue growth. Example: 'MRR: $50K, Churn: 3%, NPS: 45, CAC: $500, LTV: $3000, Retention: 92%'"
        },
        time_in_market: { 
          type: "string", 
          description: "How long product has been in market (affects benchmarks)",
          enum: ["pre_launch", "0_6_months", "6_12_months", "1_2_years", "2_plus_years"]
        },
        customer_feedback: { 
          type: "string", 
          description: "Optional: Qualitative feedback themes (e.g., 'Users love X but struggle with Y')" 
        }
      },
      required: ["product", "target_market", "current_metrics"]
    }
  },
  {
    name: "launch_commander",
    description: "Generate a context-aware launch plan. Have a date? Get a detailed timeline. Still planning? Enter 'TBD' or 'Q2 2025' for a flexible plan. Version 2.0 - Works at any planning stage!",
    inputSchema: {
      type: "object",
      properties: {
        product_feature: { type: "string", description: "What you're launching (product/feature name and description)" },
        launch_date: { type: "string", description: "Target launch date. Accepts: 'YYYY-MM-DD', 'Q1 2025', 'March 2025', or 'TBD' for planning mode" },
        launch_type: {
          type: "string",
          description: "Type of launch determines plan complexity",
          enum: ["major_release", "feature_launch", "beta_launch", "product_update", "market_expansion"]
        },
        target_segments: { type: "string", description: "Target customer segments (comma-separated)" },
        goals: { type: "string", description: "Launch success metrics (e.g., '500 signups, $50k pipeline, 10% trial conversion, 1000 downloads')" },
        available_channels: {
          type: "string",
          description: "Optional: Marketing channels available (comma-separated). E.g., 'email, linkedin, blog, webinar, PR, paid_ads, community'"
        },
        team_size: {
          type: "string",
          description: "Marketing/GTM team size affects task distribution",
          enum: ["solo", "small_2_5", "medium_6_15", "large_15_plus"]
        },
        budget_level: {
          type: "string",
          description: "Budget affects recommended tactics",
          enum: ["bootstrap", "moderate", "well_funded"]
        }
      },
      required: ["product_feature", "launch_type", "target_segments", "goals"]
    }
  },
  {
    name: "customer_interview_kit",
    description: "Generate interview guides that ADAPT based on interview type, industry, and product complexity. Includes synthesis templates. Version 2.0 - Industry-specific questions!",
    inputSchema: {
      type: "object",
      properties: {
        interview_type: {
          type: "string",
          enum: ["discovery", "validation", "feedback", "churn", "win_loss", "persona_research"],
          description: "Type of interview determines question focus"
        },
        product_context: { type: "string", description: "Product/service being researched" },
        industry: {
          type: "string",
          description: "Industry affects terminology and context",
          enum: ["saas", "fintech", "healthtech", "ecommerce", "marketplace", "enterprise_software", "consumer", "other"]
        },
        product_complexity: {
          type: "string",
          description: "Affects technical depth of questions",
          enum: ["simple", "moderate", "complex", "highly_technical"]
        },
        target_persona: { type: "string", description: "Who you're interviewing (role/title)" },
        key_hypotheses: { type: "string", description: "Optional: Hypotheses to validate during interview" }
      },
      required: ["interview_type", "product_context", "target_persona"]
    }
  },
  {
    name: "retention_playbook",
    description: "Generate retention strategies. Has DISCOVERY MODE - if you don't know WHY people churn, get a churn analysis framework first. Version 2.0 - Works even if you don't know churn reasons!",
    inputSchema: {
      type: "object",
      properties: {
        customer_segment: { type: "string", description: "Customer segment to focus on" },
        business_model: {
          type: "string",
          description: "Business model affects health score weighting",
          enum: ["saas_subscription", "usage_based", "marketplace", "transactional", "freemium", "enterprise_contract"]
        },
        current_churn_rate: { type: "string", description: "Current churn rate (e.g., '5%' or '5% monthly')" },
        churn_reasons: { 
          type: "string", 
          description: "OPTIONAL: Known churn reasons (comma-separated). If you don't know, leave blank to get discovery mode with churn analysis framework"
        },
        available_data_signals: {
          type: "string",
          description: "What usage data you can track (comma-separated). E.g., 'login frequency, feature usage, support tickets, NPS responses'"
        },
        cs_team_size: {
          type: "string",
          description: "CS team capacity affects intervention strategy",
          enum: ["no_dedicated_cs", "small_1_3", "medium_4_10", "large_10_plus"]
        },
        current_interventions: { type: "string", description: "Optional: What retention tactics you already do" }
      },
      required: ["customer_segment", "business_model", "current_churn_rate"]
    }
  },
  {
    name: "partner_architect",
    description: "Design partner programs that ADAPT based on partner model type. Different structures for resellers vs referrals vs integrations vs affiliates. Version 2.0 - Model-specific programs!",
    inputSchema: {
      type: "object",
      properties: {
        company: { type: "string", description: "Your company name" },
        product: { type: "string", description: "Product partners will sell/integrate" },
        partner_model: {
          type: "string",
          description: "Partner type determines program structure",
          enum: ["reseller", "referral", "integration_tech", "agency_si", "affiliate", "oem_white_label"]
        },
        partner_goals: { type: "string", description: "Revenue/growth targets from partners" },
        your_deal_size: { 
          type: "string", 
          description: "Average deal size (determines viable commission rates). E.g., '$5000 ACV' or '$500/month'"
        },
        partner_support_capacity: {
          type: "string",
          description: "How much partner support can you provide?",
          enum: ["minimal_self_serve", "moderate", "high_touch"]
        },
        existing_partners: { type: "string", description: "Optional: Current partner types/count" }
      },
      required: ["company", "product", "partner_model", "partner_goals", "your_deal_size"]
    }
  },
  {
    name: "crisis_planner",
    description: "Generate crisis playbooks. Know your risks? Get specific playbooks. Not sure what to plan for? We'll suggest the top crises for your industry. Version 2.0 - Works at any preparedness level!",
    inputSchema: {
      type: "object",
      properties: {
        company: { type: "string", description: "Company name" },
        industry: { 
          type: "string", 
          description: "Industry affects which crises to prioritize",
          enum: ["fintech", "healthtech", "saas", "ecommerce", "enterprise", "consumer", "other"]
        },
        customer_base: {
          type: "string",
          description: "Customer type affects communication approach",
          enum: ["b2b_enterprise", "b2b_smb", "b2c_consumer", "mixed"]
        },
        data_sensitivity: {
          type: "string",
          description: "Data sensitivity affects security protocols",
          enum: ["high_pii_financial", "medium_business_data", "low_general"]
        },
        potential_crises: {
          type: "string",
          description: "OPTIONAL: Crisis types to plan for (comma-separated). If not provided, we'll suggest the top 4 crises for your industry. Options: data_breach, service_outage, pr_incident, executive_departure, security_vulnerability, regulatory_action, product_safety, customer_data_exposure"
        },
        company_size: {
          type: "string",
          description: "Affects response team structure",
          enum: ["startup_under_50", "scaleup_50_200", "midsize_200_1000", "enterprise_1000_plus"]
        },
        compliance_requirements: { type: "string", description: "Optional: Relevant compliance (GDPR, HIPAA, SOC2, etc.)" }
      },
      required: ["company", "industry", "customer_base", "data_sensitivity"]
    }
  },
  {
    name: "competitive_intel",
    description: "Generate battle cards. If you know your strengths/weaknesses, get complete battle cards. If you only know competitors and win/loss stories, we'll derive your positioning. Version 2.0 - Works with any level of competitive knowledge!",
    inputSchema: {
      type: "object",
      properties: {
        your_product: { type: "string", description: "Your product name and brief description" },
        competitors: {
          type: "string",
          description: "Competitor names (comma-separated). Will generate battle card for EACH"
        },
        your_strengths: {
          type: "string",
          description: "OPTIONAL: What you do better (comma-separated). Will be DERIVED from wins/losses if not provided"
        },
        your_weaknesses: {
          type: "string",
          description: "OPTIONAL: Where competitors beat you (comma-separated). Will be DERIVED from wins/losses if not provided"
        },
        competitor_details: {
          type: "string",
          description: "Optional: Any known details about competitors. E.g., 'Competitor A is cheaper, Competitor B targets enterprise'"
        },
        common_objections: {
          type: "string",
          description: "Sales objections you hear (comma-separated). E.g., 'too expensive, missing X feature, competitor has better Y'"
        },
        recent_wins: { type: "string", description: "Why customers chose you over competitors - will be used to DERIVE strengths" },
        recent_losses: { type: "string", description: "Why you lost deals to competitors - will be used to DERIVE weaknesses" }
      },
      required: ["your_product", "competitors"]
    }
  },
  {
    name: "craft_gtm_analyzer",
    description: "ACTUALLY ANALYZE a GTM document against CRAFT framework. Parses content, identifies gaps, scores each dimension, and generates IMPROVED VERSION. Version 2.0 - Real analysis!",
    inputSchema: {
      type: "object",
      properties: {
        document_content: { 
          type: "string", 
          description: "The GTM document/plan to analyze. Paste full content - it will be PARSED and EVALUATED"
        },
        document_type: {
          type: "string",
          description: "Type of document affects evaluation criteria",
          enum: ["gtm_strategy", "launch_plan", "campaign_brief", "quarterly_plan", "project_proposal", "marketing_plan"]
        },
        intended_audience: { type: "string", description: "Optional: Who will read/approve this document" },
        desired_outcome: { type: "string", description: "Optional: What action should this document drive" }
      },
      required: ["document_content", "document_type"]
    }
  }
];

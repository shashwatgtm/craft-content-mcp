import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const tools: Tool[] = [
  {
    name: "case_study_generator",
    description: "Generate case studies with DISCOVERY MODE. If you have the full story, get a complete case study. If not, get interview questions to gather the story first. Version 2.0 - Works with incomplete info!",
    inputSchema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Customer/company name" },
        customer_industry: { type: "string", description: "Customer's industry for context" },
        mode: {
          type: "string",
          description: "full = generate case study (requires challenge/solution/results), discovery = generate interview questions to gather story",
          enum: ["full", "discovery"]
        },
        interview_notes: {
          type: "string",
          description: "Optional: Raw interview notes or transcript - will be PARSED into structured case study"
        },
        challenge: { type: "string", description: "The customer's challenge/problem (required for full mode)" },
        solution: { type: "string", description: "How your product solved it (required for full mode)" },
        results: { type: "string", description: "Quantifiable outcomes (required for full mode)" },
        customer_quote: { type: "string", description: "Optional: Direct quote from customer" },
        your_product: { type: "string", description: "Your product/service name" }
      },
      required: ["customer_name", "your_product"]
    }
  },
  {
    name: "newsletter_builder",
    description: "Build newsletter content. Just have a topic? We'll suggest key points. Have key points? We'll craft the content. Version 2.0 - Works with topic-only or full brief!",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Main topic/theme of the newsletter" },
        key_points: { type: "string", description: "OPTIONAL: Key points to cover (comma-separated). If not provided, we'll suggest 3-5 relevant points based on topic" },
        cta_goal: { type: "string", description: "What action should readers take? (e.g., 'sign up for webinar', 'try feature', 'read blog')" },
        audience_segment: {
          type: "string",
          description: "Audience segment affects tone and depth",
          enum: ["executives", "practitioners", "technical", "general", "prospects", "customers"]
        },
        newsletter_type: {
          type: "string",
          description: "Type of newsletter",
          enum: ["educational", "product_update", "industry_news", "thought_leadership", "curated_links"]
        },
        tone: {
          type: "string",
          description: "Writing tone",
          enum: ["professional", "conversational", "authoritative", "friendly", "urgent"]
        },
        previous_topics: {
          type: "string",
          description: "Optional: Recent newsletter topics to avoid repetition and suggest connections"
        }
      },
      required: ["topic", "cta_goal"]
    }
  },
  {
    name: "webinar_script",
    description: "Generate webinar scripts. Know your takeaways? Get a complete script. Still planning? We'll suggest takeaways based on topic and type. Version 2.0 - Works at any planning stage!",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Webinar topic/title" },
        target_audience: { type: "string", description: "Who will attend (e.g., 'Marketing managers at B2B SaaS companies')" },
        webinar_type: {
          type: "string",
          description: "Type of webinar determines structure",
          enum: ["educational", "product_demo", "panel_discussion", "customer_story", "workshop", "ama"]
        },
        duration: {
          type: "string",
          description: "Webinar length",
          enum: ["30_min", "45_min", "60_min", "90_min"]
        },
        key_takeaways: { type: "string", description: "OPTIONAL: 3-5 things attendees should learn (comma-separated). If not provided, we'll suggest based on topic" },
        speakers: { type: "string", description: "Optional: Speaker names and titles (comma-separated)" },
        include_polls: { type: "boolean", description: "Include interactive poll suggestions" },
        product_mention_level: {
          type: "string",
          description: "How much to mention your product",
          enum: ["none", "subtle", "moderate", "heavy"]
        }
      },
      required: ["topic", "target_audience", "webinar_type"]
    }
  },
  {
    name: "content_repurposer",
    description: "Transform source content into multiple formats. Just paste content - we'll generate the 5 most useful formats by default, or specify exactly what you need. Version 2.0 - Smart defaults!",
    inputSchema: {
      type: "object",
      properties: {
        source_content: { type: "string", description: "Original content to repurpose (blog post, article, transcript, etc.)" },
        source_type: {
          type: "string",
          description: "What type of content is the source",
          enum: ["blog_post", "webinar_transcript", "podcast_transcript", "whitepaper", "case_study", "research_report", "presentation"]
        },
        target_formats: {
          type: "string",
          description: "OPTIONAL: Formats to generate (comma-separated). Defaults to: linkedin_post, twitter_thread, email, blog_summary, quote_cards. Other options: infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section"
        },
        brand_voice: {
          type: "string",
          description: "Brand voice to maintain",
          enum: ["professional", "casual", "authoritative", "friendly", "bold"]
        },
        key_message: { type: "string", description: "Optional: Core message to emphasize across all formats" }
      },
      required: ["source_content", "source_type"]
    }
  },
  {
    name: "thought_leadership_series",
    description: "Generate COMPLETE thought leadership ARTICLES (600-800 words each). Have proof points? Get publish-ready articles. Only have a hot take? Get articles PLUS suggested proof points to strengthen your argument. Version 2.0 - Works at any stage of thought development!",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The topic you want to establish authority on" },
        your_take: { type: "string", description: "Your unique perspective or opinion on this topic. What do you believe that others don't? What's your contrarian view?" },
        target_reader: { type: "string", description: "Who should read this? Be specific (e.g., 'B2B SaaS founders struggling with churn' not just 'marketers')" },
        proof_points: { type: "string", description: "OPTIONAL: Evidence supporting your take - personal stories, client examples, data/stats (comma-separated). If not provided, we'll suggest proof points to gather" },
        author_background: { type: "string", description: "Optional: Your role and why you're credible (e.g., '15 years in enterprise sales')" },
        num_articles: {
          type: "number",
          description: "Number of articles to generate (1-5)",
          minimum: 1,
          maximum: 5
        },
        article_type: {
          type: "string",
          description: "Style of articles",
          enum: ["contrarian", "how_to", "lessons_learned", "prediction", "framework"]
        }
      },
      required: ["topic", "your_take", "target_reader"]
    }
  },
  {
    name: "testimonial_capture",
    description: "Generate testimonial request emails, interview questions, and formatted outputs. Discovery-focused by design. Version 2.0 - Already excellent!",
    inputSchema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Customer name" },
        customer_company: { type: "string", description: "Customer's company" },
        customer_role: { type: "string", description: "Customer's job title" },
        relationship_context: { type: "string", description: "How long they've been a customer, key interactions" },
        success_story: { type: "string", description: "Brief description of their success with your product" },
        testimonial_type: {
          type: "string",
          description: "Type of testimonial needed",
          enum: ["written_quote", "video_interview", "case_study_interview", "g2_review", "reference_call"]
        },
        use_case: { type: "string", description: "Where will this testimonial be used? (website, sales deck, etc.)" },
        incentive: { type: "string", description: "Optional: What you're offering in return" }
      },
      required: ["customer_name", "customer_company", "success_story", "testimonial_type"]
    }
  },
  {
    name: "sales_enablement_content",
    description: "Generate sales content. Know your objections? Get complete handlers. New product with no sales data yet? We'll suggest likely objections based on your product type. Version 2.0 - Works at any sales maturity!",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product name and what it does" },
        target_persona: { type: "string", description: "Who sales is pitching to (role, company type)" },
        proof_points: { type: "string", description: "Evidence for claims - case studies, metrics, quotes (comma-separated)" },
        common_objections: { type: "string", description: "OPTIONAL: Sales objections you hear (comma-separated). If not provided, we'll suggest likely objections for your product type" },
        value_props: { type: "string", description: "OPTIONAL: Key value propositions (comma-separated). Will be DERIVED from proof points if not provided" },
        competitor_objections: { type: "string", description: "Optional: 'Why not [competitor]' objections" },
        price_context: { type: "string", description: "Optional: Your pricing vs market (e.g., 'Premium - 20% above market', 'Budget option', 'Mid-market')" },
        sales_stage: {
          type: "string",
          description: "What stage of sales funnel",
          enum: ["prospecting", "discovery", "demo", "negotiation", "closing"]
        }
      },
      required: ["product", "target_persona", "proof_points"]
    }
  },
  {
    name: "craft_content_improver",
    description: "ACTUALLY ANALYZE and IMPROVE content. Just paste content - we'll score clarity, structure, engagement and generate an improved version. Version 2.0 - Real analysis!",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to analyze and improve - will be ACTUALLY ANALYZED" },
        content_type: {
          type: "string",
          description: "Type of content affects evaluation criteria",
          enum: ["blog_post", "email", "landing_page", "social_post", "sales_email", "product_description", "press_release", "case_study"]
        },
        goal: { type: "string", description: "OPTIONAL: What should this content achieve? (e.g., 'drive signups', 'educate readers'). Defaults to 'improve engagement and clarity'" },
        audience: { type: "string", description: "OPTIONAL: Who is this content for? Helps tailor improvements." },
        tone_preference: {
          type: "string",
          description: "Desired tone for improvements",
          enum: ["more_formal", "more_casual", "more_urgent", "more_friendly", "more_authoritative", "keep_same"]
        }
      },
      required: ["content", "content_type"]
    }
  }
];

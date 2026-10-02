import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Run 19 (D80, problem 4): the business models the tools can write for, the same list as src/verticals.ts.
const BUSINESS_MODEL_FIELD = {
  type: "string",
  description: "Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how.",
  enum: ["saas", "services", "connectivity", "transactions", "marketplace", "hardware_software", "investment"]
};
const YOUR_PRODUCT_FIELD = { type: "string", description: "Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder." };

export const tools: Tool[] = [
  {
    name: "case_study_generator",
    description: "Build a customer case study from the challenge, solution and results you give (mode full), or an interview kit to collect them (mode discovery). Every result you list is kept, sector notes and questions are added when the sector can be read from your text, and a bracket marks anything you did not give.",
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
          description: "Optional: Raw interview notes or transcript. Used for a missing challenge, solution or results when mode is 'full'; named as not used when you gave all three"
        },
        challenge: { type: "string", description: "The customer's challenge/problem (required for full mode)" },
        solution: { type: "string", description: "How your product solved it (required for full mode)" },
        results: { type: "string", description: "Quantifiable outcomes, one per line or per semicolon (required for full mode)" },
        customer_quote: { type: "string", description: "Optional: Direct quote from customer" },
        your_product: { type: "string", description: "Your product/service name" },
        business_model: BUSINESS_MODEL_FIELD
      },
      required: ["customer_name", "your_product"]
    }
  },
  {
    name: "newsletter_builder",
    description: "Build a newsletter draft: subject lines that use your full topic, hooks, key points, your own call to action as the button, and sector notes. Without key points it suggests five from the topic and sector. Statistics and stories are bracket prompts, never invented.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Main topic/theme of the newsletter" },
        key_points: { type: "string", description: "Optional: key points to cover, one per line, per semicolon or comma-separated. If not provided, the tool suggests 5 points based on the topic and newsletter type" },
        cta_goal: { type: "string", description: "What action should readers take? (e.g., 'register for the webinar', 'book a 20-minute call', 'read the guide')" },
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
        },
        your_product: YOUR_PRODUCT_FIELD
      },
      required: ["topic", "cta_goal"]
    }
  },
  {
    name: "webinar_script",
    description: "Write a webinar run of show and script for your topic, audience, type and duration: speakers as you list them, polls with answer options, content blocks with sector points, anticipated questions and follow-up emails. Without key takeaways it suggests them from the topic and type.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Webinar topic/title" },
        target_audience: { type: "string", description: "Who will attend (e.g., 'Support leaders at consumer apps')" },
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
        key_takeaways: { type: "string", description: "Optional: 3-5 things attendees should learn, one per line, per semicolon or comma-separated. If not provided, they are suggested from the topic" },
        speakers: { type: "string", description: "Optional: speakers as you want them listed. Separate speakers with semicolons or line breaks ('Name, Title; Name, Title'), or with commas if each is one phrase" },
        include_polls: { type: "boolean", description: "Include interactive poll suggestions" },
        product_mention_level: {
          type: "string",
          description: "Whether to add product tie-in placeholders to the script ('none' leaves them out)",
          enum: ["none", "subtle", "moderate", "heavy"]
        },
        your_product: YOUR_PRODUCT_FIELD,
        business_model: BUSINESS_MODEL_FIELD
      },
      required: ["topic", "target_audience", "webinar_type"]
    }
  },
  {
    name: "content_repurposer",
    description: "Turn a source text into formats such as a LinkedIn post, an X thread, an email, a blog summary and quote cards (five by default). Key points are whole sentences chosen from your source by a stated rule and kept in its order; quote cards are never cut mid-sentence; the brand voice sets the closing line.",
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
          description: "Optional: formats to generate, comma-separated. Defaults to: linkedin_post, twitter_thread, email, blog_summary, quote_cards. Other options: infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section. A name outside this list is reported, not written"
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
    description: "Write outlines of thought leadership articles (600 to 800 words each once expanded) from your topic, your take (quoted as you wrote it), the reader and your proof points. Each article follows its own angle and leads with a different proof point. Without proof points it suggests evidence to gather. Brackets mark what only you can supply.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The topic you want to establish authority on" },
        your_take: { type: "string", description: "Your unique perspective or opinion on this topic. What do you believe that others don't? What's your contrarian view?" },
        target_reader: { type: "string", description: "Who should read this? Be specific (e.g., 'Heads of IT at companies with many branches' not just 'managers')" },
        proof_points: { type: "string", description: "Optional: evidence supporting your take: personal stories, client examples, data or stats, one per line, per semicolon or comma-separated. If not provided, proof points to gather are suggested" },
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
    description: "Prepare a testimonial request: the request email, interview questions for the customer's role and sector, quote drafts for the customer to edit, and a sign-off checklist. Uses your product name when you give it, and says so when you do not.",
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
        incentive: { type: "string", description: "Optional: What you're offering in return" },
        your_product: YOUR_PRODUCT_FIELD,
        business_model: BUSINESS_MODEL_FIELD
      },
      required: ["customer_name", "customer_company", "success_story", "testimonial_type"]
    }
  },
  {
    name: "sales_enablement_content",
    description: "Build a sales kit: pitch order, a script for each objection (each answered with the sector's pattern and the proof point that fits it), competitor responses, discovery questions and follow-up templates. Without objections it suggests the ones your sector raises.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product name and what it does" },
        target_persona: { type: "string", description: "Who sales is pitching to (role, company type)" },
        proof_points: { type: "string", description: "Evidence for claims: case studies, metrics, quotes, one per line, per semicolon or comma-separated" },
        common_objections: { type: "string", description: "Optional: sales objections you hear, one per line, per semicolon or comma-separated. If not provided, likely objections for your sector are suggested" },
        value_props: { type: "string", description: "Optional: key value propositions, one per line, per semicolon or comma-separated. Taken from the proof points if not provided" },
        competitor_objections: { type: "string", description: "Optional: 'Why not [competitor]' objections" },
        price_context: { type: "string", description: "Optional: Your pricing vs market (e.g., 'Premium, 20% above market', 'Budget option', 'Mid-market')" },
        sales_stage: {
          type: "string",
          description: "What stage of sales funnel",
          enum: ["prospecting", "discovery", "demo", "negotiation", "closing"]
        },
        business_model: BUSINESS_MODEL_FIELD
      },
      required: ["product", "target_persona", "proof_points"]
    }
  },
  {
    name: "craft_content_improver",
    description: "Check pasted copy against listed rules (buzzwords, claims that need proof, fragments, unfilled merge fields, claims about the reader, a missing figure or ask), score each area with every deduction quoted from your text, and return the edits it made. If it finds no edit to make, it says so and prints no improved version.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to analyze" },
        content_type: {
          type: "string",
          description: "Type of content affects evaluation criteria",
          enum: ["blog_post", "email", "landing_page", "social_post", "sales_email", "product_description", "press_release", "case_study"]
        },
        goal: { type: "string", description: "Optional: what should this content achieve? (e.g., 'book a first meeting', 'educate readers'). If not given, a goal is chosen from the content type (for example 'Get meetings booked' for a sales email)" },
        audience: { type: "string", description: "Optional: who is this content for? The check reports when the text never mentions them." },
        tone_preference: {
          type: "string",
          description: "Desired tone. Only more_formal and more_casual are checked in the text; any other value is named in the answer as not used",
          enum: ["more_formal", "more_casual", "more_urgent", "more_friendly", "more_authoritative", "keep_same"]
        }
      },
      required: ["content", "content_type"]
    }
  }
];

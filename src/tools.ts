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
    description: "Builds a customer case study from the customer name, your product and the challenge, solution and results you give (mode full), or an interview kit for collecting them (mode discovery). Optional customer industry, quote, interview notes and business model fit the wording to the customer. Returns a headline, the story with each result you list, a customer quote, social and email copy and sector notes when the sector can be read from your text. A bracket marks anything you did not give.",
    inputSchema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Customer or company name" },
        customer_industry: { type: "string", description: "The customer's industry, used for context" },
        mode: {
          type: "string",
          description: "full builds the case study and needs the challenge, solution and results; discovery returns interview questions for collecting them",
          enum: ["full", "discovery"]
        },
        interview_notes: {
          type: "string",
          description: "Optional: raw interview notes or a transcript. In full mode they fill a missing challenge, solution or results; the answer says they were not used when you gave all three"
        },
        challenge: { type: "string", description: "The customer's challenge or problem (needed in full mode)" },
        solution: { type: "string", description: "How your product solved it (needed in full mode)" },
        results: { type: "string", description: "Measurable outcomes, one per line or per semicolon (needed in full mode)" },
        customer_quote: { type: "string", description: "Optional: a direct quote from the customer" },
        your_product: { type: "string", description: "Your product or service name" },
        business_model: BUSINESS_MODEL_FIELD
      },
      required: ["customer_name", "your_product"]
    }
  },
  {
    name: "newsletter_builder",
    description: "Builds a newsletter draft from your topic and the action you want readers to take. Optional key points, audience segment, newsletter type, tone, earlier topics and your product fit it to the reader. Returns subject lines that use your full topic, hooks, key points, your own call to action as the button and sector notes. Without key points it suggests some from the topic and sector. Statistics and stories appear as bracket prompts for you to fill.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The main topic or theme of the newsletter" },
        key_points: { type: "string", description: "Optional: key points to cover, one per line, per semicolon or comma-separated. If not provided, points are suggested from the topic and newsletter type" },
        cta_goal: { type: "string", description: "The action readers should take, in your own words (for example 'register for the webinar', 'book a call', 'read the guide'); it becomes the button" },
        audience_segment: {
          type: "string",
          description: "Who the newsletter is for; sets tone and depth",
          enum: ["executives", "practitioners", "technical", "general", "prospects", "customers"]
        },
        newsletter_type: {
          type: "string",
          description: "The kind of newsletter",
          enum: ["educational", "product_update", "industry_news", "thought_leadership", "curated_links"]
        },
        tone: {
          type: "string",
          description: "The writing tone",
          enum: ["professional", "conversational", "authoritative", "friendly", "urgent"]
        },
        previous_topics: {
          type: "string",
          description: "Optional: recent newsletter topics, to avoid repetition and suggest connections"
        },
        your_product: YOUR_PRODUCT_FIELD
      },
      required: ["topic", "cta_goal"]
    }
  },
  {
    name: "webinar_script",
    description: "Writes a webinar run of show and script from your topic, target audience and webinar type. Optional duration, key takeaways, speakers, polls, product mention level, your product and business model shape it. Returns the run of show, speakers as you list them, polls with answer options, content blocks with sector points, anticipated questions and follow-up emails. Without key takeaways it suggests them from the topic and type.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The webinar topic or title" },
        target_audience: { type: "string", description: "Who will attend (for example 'Support leaders at consumer apps')" },
        webinar_type: {
          type: "string",
          description: "The kind of webinar; sets the structure",
          enum: ["educational", "product_demo", "panel_discussion", "customer_story", "workshop", "ama"]
        },
        duration: {
          type: "string",
          description: "The webinar length",
          enum: ["30_min", "45_min", "60_min", "90_min"]
        },
        key_takeaways: { type: "string", description: "Optional: what attendees should learn, one per line, per semicolon or comma-separated. If not provided, takeaways are suggested from the topic" },
        speakers: { type: "string", description: "Optional: speakers as you want them listed. Separate speakers with semicolons or line breaks ('Name, Title; Name, Title'), or with commas if each is one phrase" },
        include_polls: { type: "boolean", description: "Include poll suggestions with answer options" },
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
    description: "Turns a source text into other formats such as a LinkedIn post, an X thread, an email, a blog summary and quote cards. Needs the source text and its type. Optional target formats, brand voice and a key message steer the result. Returns each format built from whole sentences of your source, with key points chosen by a stated rule and kept in the source order, and names any requested format it does not know.",
    inputSchema: {
      type: "object",
      properties: {
        source_content: { type: "string", description: "The original content to repurpose (a blog post, article or transcript, for example)" },
        source_type: {
          type: "string",
          description: "The kind of content the source is",
          enum: ["blog_post", "webinar_transcript", "podcast_transcript", "whitepaper", "case_study", "research_report", "presentation"]
        },
        target_formats: {
          type: "string",
          description: "Optional: formats to generate, comma-separated. Defaults to: linkedin_post, twitter_thread, email, blog_summary, quote_cards. Other options: infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section. A name outside this list is reported, not written"
        },
        brand_voice: {
          type: "string",
          description: "The brand voice to keep",
          enum: ["professional", "casual", "authoritative", "friendly", "bold"]
        },
        key_message: { type: "string", description: "Optional: the core message to emphasize in every format" }
      },
      required: ["source_content", "source_type"]
    }
  },
  {
    name: "thought_leadership_series",
    description: "Writes outlines of thought leadership articles from your topic, your take and the reader you write for. Optional proof points, author background, number of articles and article style shape them. Returns an outline for each article on its own angle, your take quoted as you wrote it, your proof points used across the articles and bracket prompts for what only you can supply. Without proof points it suggests evidence to gather.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The topic you want to build authority on" },
        your_take: { type: "string", description: "Your own view on this topic: what you believe that others do not, or your contrarian view" },
        target_reader: { type: "string", description: "Who should read this, named specifically (for example 'Heads of IT at companies with many branches' rather than 'managers')" },
        proof_points: { type: "string", description: "Optional: evidence supporting your take: personal stories, client examples, data or stats, one per line, per semicolon or comma-separated. If not provided, proof points to gather are suggested" },
        author_background: { type: "string", description: "Optional: your role and why you are credible (for example 'a long career in enterprise sales')" },
        num_articles: {
          type: "integer",
          description: "How many articles to outline, a whole number from 1 to 5. If left out, the series has three articles",
          minimum: 1,
          maximum: 5
        },
        article_type: {
          type: "string",
          description: "The style of the articles",
          enum: ["contrarian", "how_to", "lessons_learned", "prediction", "framework"]
        }
      },
      required: ["topic", "your_take", "target_reader"]
    }
  },
  {
    name: "testimonial_capture",
    description: "Prepares a testimonial request from the customer's name, company, success story and the type of testimonial you want. Optional role, relationship, intended use, incentive, your product and business model fit it to the customer. Returns a request email, interview questions for the customer's role and sector, quote drafts for the customer to edit and a sign-off checklist. It uses your product name when you give it and says so when you do not.",
    inputSchema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "The customer's name" },
        customer_company: { type: "string", description: "The customer's company" },
        customer_role: { type: "string", description: "The customer's job title" },
        relationship_context: { type: "string", description: "How long they have been a customer and the key interactions" },
        success_story: { type: "string", description: "A short description of their success with your product" },
        testimonial_type: {
          type: "string",
          description: "The kind of testimonial you need",
          enum: ["written_quote", "video_interview", "case_study_interview", "g2_review", "reference_call"]
        },
        use_case: { type: "string", description: "Where the testimonial will be used (the website or a sales deck, for example)" },
        incentive: { type: "string", description: "Optional: what you are offering in return" },
        your_product: YOUR_PRODUCT_FIELD,
        business_model: BUSINESS_MODEL_FIELD
      },
      required: ["customer_name", "customer_company", "success_story", "testimonial_type"]
    }
  },
  {
    name: "sales_enablement_content",
    description: "Builds a sales kit from your product, the persona you sell to and your proof points. Optional objections, value propositions, competitor objections, price context, sales stage and business model shape it. Returns a pitch order, a script for each objection answered with the sector's pattern and the proof point that fits it, competitor responses, discovery questions and follow-up templates. Without objections it suggests the ones your sector raises.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "The product name and what it does" },
        target_persona: { type: "string", description: "Who sales is pitching to (role and company type)" },
        proof_points: { type: "string", description: "Evidence for your claims: case studies, metrics and quotes, one per line, per semicolon or comma-separated" },
        common_objections: { type: "string", description: "Optional: sales objections you hear, one per line, per semicolon or comma-separated. If not provided, likely objections for your sector are suggested" },
        value_props: { type: "string", description: "Optional: key value propositions, one per line, per semicolon or comma-separated. Taken from the proof points if not provided" },
        competitor_objections: { type: "string", description: "Optional: 'why not [competitor]' objections" },
        price_context: { type: "string", description: "Optional: your pricing against the market (for example 'Premium, above market', 'Budget option' or 'Mid-market')" },
        sales_stage: {
          type: "string",
          description: "The stage of the sales funnel",
          enum: ["prospecting", "discovery", "demo", "negotiation", "closing"]
        },
        business_model: BUSINESS_MODEL_FIELD
      },
      required: ["product", "target_persona", "proof_points"]
    }
  },
  {
    name: "craft_content_improver",
    description: "Reviews pasted copy and its content type against listed rules: buzzwords, claims that need proof, fragments, unfilled merge fields, claims about the reader and a missing figure or ask. Optional goal, audience and tone preference refine the review. Returns a score for each area with each deduction quoted from your text, and the edits it made. If it finds no edit to make, it says so and prints no improved version.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "The content to review" },
        content_type: {
          type: "string",
          description: "The kind of content; it changes which checks apply",
          enum: ["blog_post", "email", "landing_page", "social_post", "sales_email", "product_description", "press_release", "case_study"]
        },
        goal: { type: "string", description: "Optional: what the content should achieve (for example 'book a first meeting' or 'educate readers'). If not given, a goal is chosen from the content type" },
        audience: { type: "string", description: "Optional: who the content is for. The review reports when the text never mentions them" },
        tone_preference: {
          type: "string",
          description: "The tone you want. Only more_formal and more_casual are checked in the text; any other value is named in the answer as not used",
          enum: ["more_formal", "more_casual", "more_urgent", "more_friendly", "more_authoritative", "keep_same"]
        }
      },
      required: ["content", "content_type"]
    }
  }
];

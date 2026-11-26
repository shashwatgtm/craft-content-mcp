import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Run 19 (D80, problem 4): the business models the tools can write for, the same list as src/verticals.ts.
const BUSINESS_MODEL_FIELD = {
  type: "string",
  description: "Optional: how you charge, so the advice fits it. If omitted, it is read from your text and the answer says how. Format is text using one of the listed labels. For example, \"saas\".",
  enum: ["saas", "services", "connectivity", "transactions", "marketplace", "hardware_software", "investment"]
};
// Run 42B: the seller's own industry, chosen by the user; it decides the sector notes. Never the customers' industry.
const YOUR_SECTOR_FIELD = {
  type: "string",
  description: "Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. Format is text using one of the listed labels. For example, \"logistics_tech\".",
  enum: ["logistics_tech", "fintech", "saas", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "other"]
};
const YOUR_PRODUCT_FIELD = { type: "string", description: "Optional: your product or service name, used in the answer. Without it the answer says so and shows a placeholder. Format is text. For example, \"invoice review service\"." };

export const tools: Tool[] = [
  {
    name: "case_study_generator",
    description: "Helps you decide how to present a customer result as a case study, built from the customer name, your product and the challenge, solution and results you give (mode full), or an interview kit to collect them (mode discovery). Optional customer industry, quote, interview notes and business model fit the wording to the customer. Returns a headline, the story with each result you list, a customer quote, social and email copy, and sector notes when the sector can be read from your text. A bracket marks anything you did not give. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of testimonial_capture when you need a full challenge, solution and results story.",
    inputSchema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Customer or company name. Format is text. For example, \"an approved anonymous manufacturer\"." },
        customer_industry: { type: "string", description: "The customer's industry, used for context. Format is text. For example, \"manufacturing\"." },
        mode: {
          type: "string",
          description: "full builds the case study and needs the challenge, solution and results; discovery returns interview questions for collecting them. Format is text using one of the listed labels. For example, \"full\".",
          enum: ["full", "discovery"]
        },
        interview_notes: {
          type: "string",
          description: "Optional: raw interview notes or a transcript. In full mode they fill a missing challenge, solution or results; the answer says they were not used when you gave all three. Format is text. For example, \"Finance lead reports invoice delays and plans a pilot.\"."
        },
        challenge: { type: "string", description: "The customer's challenge or problem (needed in full mode). Format is text. For example, \"invoice exceptions delay month-end close\"." },
        solution: { type: "string", description: "How your product solved it (needed in full mode). Format is text. For example, \"invoice review service\"." },
        results: { type: "string", description: "Measurable outcomes, one per line or per semicolon (needed in full mode). Format is text. For example, \"Company-reported pilot reduced approval time from 12 to 9 days in October 2026.\"." },
        customer_quote: { type: "string", description: "Optional: a direct quote from the customer. Format is text. For example, \"Company-reported pilot reduced approval time from 12 to 9 days in October 2026.\"." },
        your_product: { type: "string", description: "Your product or service name. Format is text. For example, \"invoice review service\"." },
        business_model: BUSINESS_MODEL_FIELD,
        your_sector: YOUR_SECTOR_FIELD
      },
      required: ["customer_name", "your_product"]
    }
  },
  {
    name: "newsletter_builder",
    description: "Helps you decide what goes in a newsletter issue and which subject line to test, from your topic and the action you want readers to take. Optional key points, audience segment, newsletter type, tone, earlier topics and your product fit it to the reader. Returns a first draft with subject line and preview, an opening, a short section for each key point, your call to action as the button, A/B subject lines, other opening hooks and sector notes. It adds no statistic or customer story and says what it did not get. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of thought_leadership_series when you need one newsletter issue with a reader action.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The main topic or theme of the newsletter. Format is text. For example, \"Reducing invoice approval delays\"." },
        key_points: { type: "string", description: "Optional: key points to cover, one per line, per semicolon or comma-separated. If not provided, points are suggested from the topic and newsletter type. Format is text. For example, \"exception queue and approval history\"." },
        cta_goal: { type: "string", description: "The action readers should take, in your own words (for example 'register for the webinar', 'book a call', 'read the guide'); it becomes the button. Format is text." },
        audience_segment: {
          type: "string",
          description: "Who the newsletter is for; sets tone and depth. Format is text using one of the listed labels. For example, \"executives\".",
          enum: ["executives", "practitioners", "technical", "general", "prospects", "customers"]
        },
        newsletter_type: {
          type: "string",
          description: "The kind of newsletter. Format is text using one of the listed labels. For example, \"educational\".",
          enum: ["educational", "product_update", "industry_news", "thought_leadership", "curated_links"]
        },
        tone: {
          type: "string",
          description: "The writing tone. Format is text using one of the listed labels. For example, \"professional\".",
          enum: ["professional", "conversational", "authoritative", "friendly", "urgent"]
        },
        previous_topics: {
          type: "string",
          description: "Optional: recent newsletter topics, to avoid repetition and suggest connections. Format is text. For example, \"month-end reconciliation\"."
        },
        your_product: YOUR_PRODUCT_FIELD,
        your_sector: YOUR_SECTOR_FIELD
      },
      required: ["topic", "cta_goal"]
    }
  },
  {
    name: "webinar_script",
    description: "Helps you decide how to plan a webinar that leads to meetings, from your topic, target audience and webinar type. Optional duration, key takeaways, speakers, polls, product mention level, your product and business model shape it. Returns a run of show, a full spoken script with speaker lines and on screen cues, polls with answer options, likely questions with answers, a follow up email sequence and sector notes. It uses only what you gave and says what it did not get. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of thought_leadership_series when you need a live session script, polls and follow-up emails.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The webinar topic or title. Format is text. For example, \"Reducing invoice approval delays\"." },
        target_audience: { type: "string", description: "Who will attend (for example 'Support leaders at consumer apps'). Format is text." },
        webinar_type: {
          type: "string",
          description: "The kind of webinar; sets the structure. Format is text using one of the listed labels. For example, \"educational\".",
          enum: ["educational", "product_demo", "panel_discussion", "customer_story", "workshop", "ama"]
        },
        duration: {
          type: "string",
          description: "The webinar length. Format is text using one of the listed labels. For example, \"30_min\".",
          enum: ["30_min", "45_min", "60_min", "90_min"]
        },
        key_takeaways: { type: "string", description: "Optional: what attendees should learn, one per line, per semicolon or comma-separated. If not provided, takeaways are suggested from the topic. Format is text. For example, \"exception queue and approval history\"." },
        speakers: { type: "string", description: "Optional: speakers as you want them listed. Separate speakers with semicolons or line breaks ('Name, Title; Name, Title'), or with commas if each is one phrase. Format is text. For example, \"procurement lead and security reviewer\"." },
        include_polls: { type: "boolean", description: "Include poll suggestions with answer options. Format is true or false. For example, true." },
        product_mention_level: {
          type: "string",
          description: "Whether to add product tie-in placeholders to the script ('none' leaves them out). Format is text using one of the listed labels. For example, \"none\".",
          enum: ["none", "subtle", "moderate", "heavy"]
        },
        your_product: YOUR_PRODUCT_FIELD,
        business_model: BUSINESS_MODEL_FIELD,
        your_sector: YOUR_SECTOR_FIELD
      },
      required: ["topic", "target_audience", "webinar_type"]
    }
  },
  {
    name: "content_repurposer",
    description: "Helps you decide how to reuse a single piece of content. it needs the source text and its type. Optional target formats, brand voice and a key message steer the result. Returns versions for other channels (a LinkedIn post, an X thread, an email, a blog summary and quote cards), each written from whole sentences of your source with key points kept in source order. Claims it cannot support are listed to source, and any format it does not know is named. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of thought_leadership_series when you already have source copy to adapt into other formats.",
    inputSchema: {
      type: "object",
      properties: {
        source_content: { type: "string", description: "The original content to repurpose (a blog post, article or transcript, for example). Format is text." },
        source_type: {
          type: "string",
          description: "The kind of content the source is. Format is text using one of the listed labels. For example, \"blog_post\".",
          enum: ["blog_post", "webinar_transcript", "podcast_transcript", "whitepaper", "case_study", "research_report", "presentation"]
        },
        target_formats: {
          type: "string",
          description: "Optional: formats to generate, comma-separated. Defaults to: linkedin_post, twitter_thread, email, blog_summary, quote_cards. Other options: infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section. A name outside this list is reported, not written. Format is text. For example, \"linkedin_post, email\"."
        },
        brand_voice: {
          type: "string",
          description: "The brand voice to keep. Format is text using one of the listed labels. For example, \"professional\".",
          enum: ["professional", "casual", "authoritative", "friendly", "bold"]
        },
        key_message: { type: "string", description: "Optional: the core message to emphasize in every format. Format is text. For example, \"Reducing invoice approval delays\"." },
        your_sector: YOUR_SECTOR_FIELD
      },
      required: ["source_content", "source_type"]
    }
  },
  {
    name: "thought_leadership_series",
    description: "Helps you decide what to publish to make your point of view known, from your topic, your take and the reader you write for. Optional proof points, author background, number of articles and article style shape it. Returns, for each article, a headline and a short first draft with the objection it answers, your proof and a way to test the idea, a promotional post for each, a publishing order and sector notes. Your words are quoted as written and no result, customer or figure is invented. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of newsletter_builder when you need a sequence of articles developing a supplied point of view.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The topic you want to build authority on. Format is text. For example, \"Reducing invoice approval delays\"." },
        your_take: { type: "string", description: "Your own view on this topic: what you believe that others do not, or your contrarian view. Format is text. For example, \"Finance teams need a clear owner for each invoice exception.\"." },
        target_reader: { type: "string", description: "Who should read this, named specifically (for example 'Heads of IT at companies with many branches' rather than 'managers'). Format is text." },
        proof_points: { type: "string", description: "Optional: evidence supporting your take: personal stories, client examples, data or stats, one per line, per semicolon or comma-separated. If not provided, proof points to gather are suggested. Format is text. For example, \"Company-reported pilot reduced approval time from 12 to 9 days in October 2026.\"." },
        author_background: { type: "string", description: "Optional: your role and why you are credible (for example 'a long career in enterprise sales'). Format is text." },
        num_articles: {
          type: "integer",
          description: "How many articles to outline, a whole number from 1 to 5. If left out, the series has three articles. Format is a whole number. For example, 5.",
          minimum: 1,
          maximum: 5
        },
        article_type: {
          type: "string",
          description: "The style of the articles. Format is text using one of the listed labels. For example, \"contrarian\".",
          enum: ["contrarian", "how_to", "lessons_learned", "prediction", "framework"]
        },
        your_sector: YOUR_SECTOR_FIELD
      },
      required: ["topic", "your_take", "target_reader"]
    }
  },
  {
    name: "testimonial_capture",
    description: "Helps you decide how to ask a happy customer for a testimonial, from the customer's name, company, success story and the type of testimonial you want. Optional role, relationship, intended use, incentive, your product and business model fit it to the customer. Returns a request email, interview questions for the customer's role and sector, quote drafts for the customer to edit and a sign off checklist. It uses your product name when you give it and says so when you do not. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of case_study_generator when you need a testimonial request, interview questions and quote approval.",
    inputSchema: {
      type: "object",
      properties: {
        customer_status: { type: "string", enum: ["active", "cancelled", "unknown"], description: "Ask whether the customer is active or cancelled before a testimonial request. A confirmed typed fact takes precedence over cancellation wording. Format is text using one of the listed labels. For example, \"active\"." },
        customer_name: { type: "string", description: "The customer's name. Format is text. For example, \"an approved anonymous manufacturer\"." },
        customer_company: { type: "string", description: "The customer's company. Format is text. For example, \"an approved anonymous manufacturer\"." },
        customer_role: { type: "string", description: "The customer's job title. Format is text. For example, \"finance director\"." },
        relationship_context: { type: "string", description: "How long they have been a customer and the key interactions. Format is text. For example, \"quarterly review completed with the finance lead\"." },
        success_story: { type: "string", description: "A short description of their success with your product. Format is text. For example, \"Company-reported pilot reduced approval time from 12 to 9 days in October 2026.\"." },
        testimonial_type: {
          type: "string",
          description: "The kind of testimonial you need. Format is text using one of the listed labels. For example, \"written_quote\".",
          enum: ["written_quote", "video_interview", "case_study_interview", "g2_review", "reference_call"]
        },
        use_case: { type: "string", description: "Where the testimonial will be used (the website or a sales deck, for example). Format is text." },
        incentive: { type: "string", description: "Optional: what you are offering in return. Format is text. For example, \"no incentive offered\"." },
        your_product: YOUR_PRODUCT_FIELD,
        business_model: BUSINESS_MODEL_FIELD,
        your_sector: YOUR_SECTOR_FIELD
      },
      required: ["customer_name", "customer_company", "success_story", "testimonial_type"]
    }
  },
  {
    name: "sales_enablement_content",
    description: "Helps you decide what sellers should say at each stage of a deal, from your product, the persona you sell to and your proof points. Optional objections, value propositions, competitor objections, price context, sales stage and business model shape it. Returns a pitch order, an answer to each objection with the proof point that fits it, competitor responses, discovery questions and follow up templates. Without objections it suggests the ones your sector raises. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of email_sequence_generator when you need seller messaging, objection responses and discovery prompts.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "The product name and what it does. Format is text. For example, \"invoice review service\"." },
        target_persona: { type: "string", description: "Who sales is pitching to (role and company type). Format is text. For example, \"finance director\"." },
        proof_points: { type: "string", description: "Evidence for your claims: case studies, metrics and quotes, one per line, per semicolon or comma-separated. Format is text. For example, \"Company-reported pilot reduced approval time from 12 to 9 days in October 2026.\"." },
        common_objections: { type: "string", description: "Optional: sales objections you hear, one per line, per semicolon or comma-separated. If not provided, likely objections for your sector are suggested. Format is text. For example, \"The reviewer asked who owns unresolved exceptions.\"." },
        value_props: { type: "string", description: "Optional: key value propositions, one per line, per semicolon or comma-separated. Taken from the proof points if not provided. Format is text. For example, \"resolve invoice exceptions before month-end\"." },
        competitor_objections: { type: "string", description: "Optional: 'why not [competitor]' objections. Format is text. For example, \"The reviewer asked who owns unresolved exceptions.\"." },
        price_context: { type: "string", description: "Optional: your pricing against the market (for example 'Premium, above market', 'Budget option' or 'Mid-market'). Format is text." },
        sales_stage: {
          type: "string",
          description: "The stage of the sales funnel. Format is text using one of the listed labels. For example, \"prospecting\".",
          enum: ["prospecting", "discovery", "demo", "negotiation", "closing"]
        },
        business_model: BUSINESS_MODEL_FIELD,
        your_sector: YOUR_SECTOR_FIELD
      },
      required: ["product", "target_persona", "proof_points"]
    }
  },
  {
    name: "craft_content_improver",
    description: "Helps you decide whether a draft is ready to publish and what to fix first, from the pasted copy and its content type. Optional goal, audience and tone preference refine the review. Returns a score for each area (buzzwords, claims that need proof, fragments, unfilled merge fields, claims about the reader, a missing figure or ask) with each deduction quoted from your text, and the edits it made. If it finds nothing to edit, it says so and prints no improved version. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of content_repurposer when you need to review and edit an existing draft for quality.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "The content to review. Format is text. For example, \"Invoice exceptions delay close. Review unresolved exceptions weekly with finance.\"." },
        content_type: {
          type: "string",
          description: "The kind of content; it changes which checks apply. Format is text using one of the listed labels. For example, \"blog_post\".",
          enum: ["blog_post", "email", "landing_page", "social_post", "sales_email", "product_description", "press_release", "case_study"]
        },
        goal: { type: "string", description: "Optional: what the content should achieve (for example 'book a first meeting' or 'educate readers'). If not given, a goal is chosen from the content type. Format is text." },
        audience: { type: "string", description: "Optional: who the content is for. The review reports when the text never mentions them. Format is text. For example, \"finance leaders at manufacturers\"." },
        tone_preference: {
          type: "string",
          description: "The tone you want. Only more_formal and more_casual are checked in the text; any other value is named in the answer as not used. Format is text using one of the listed labels. For example, \"more_formal\".",
          enum: ["more_formal", "more_casual", "more_urgent", "more_friendly", "more_authoritative", "keep_same"]
        },
        your_sector: YOUR_SECTOR_FIELD
      },
      required: ["content", "content_type"]
    }
  }
];

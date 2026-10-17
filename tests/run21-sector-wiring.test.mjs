// Run 21 wiring fix (written before the fix): each tool must give the reader the words that say what the SELLER sells as the seller's
// words, and keep the customer, the audience and the topic as buyer, job title or free text. Four companies described in plain words
// (no real names): an IT services firm, a business messaging firm, a data and AI platform, and a developer platform. Each of the eight
// tools is called through the repo's own MCP handler; the sector line must name the right sector and the business model line must not
// be a software subscription for the IT services firm.
// Run: npm run build && node --test tests/run21-sector-wiring.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  assert.ok(!j.result.isError, `${name} returned an error`);
  return j.result.content.map((c) => c.text).join("\n");
};

// What each company sells (the seller's words), who it sells to, and the customer's problem.
const COMPANIES = [
  {
    key: "it-services", sector: "ITeS", name: "Norvane", notSubscription: true,
    sells: "Norvane is an IT services and consulting company that modernizes, migrates and runs enterprise applications and cloud operations with delivery teams and its own automation tools",
    does: "enterprise architecture, application modernization, cloud migration and managed operations by dedicated delivery teams",
    customer: "Banking", persona: "technology leaders at Banking",
    problem: "legacy applications that no longer serve the business lock budget into maintenance and slow every change",
    result: "a bank moved its application estate to the cloud in fewer release cycles (hypothetical)",
  },
  {
    key: "messaging", sector: "telecom", name: "Pelora",
    sells: "Pelora is a business messaging platform that sends SMS, RCS and WhatsApp messages through one API",
    does: "a messaging platform that sends SMS, RCS and WhatsApp messages through one API, with delivery reporting and sender reputation checks",
    customer: "Banking", persona: "developers who integrate the messaging API into existing applications at Banking",
    problem: "scam messages travel over SMS under the names of legitimate brands and customers rarely report them",
    result: "a bank cut reported scam messages after switching its sender checks on (hypothetical)",
  },
  {
    key: "ai-platform", sector: "AI native", name: "Quillon",
    sells: "Quillon is an enterprise AI platform that connects company data sources, answers questions over company knowledge and builds AI agents",
    does: "an AI assistant over connected company data, an agent builder and permission aware answers",
    customer: "Financial services", persona: "CIO at Financial services",
    problem: "company knowledge is spread across many tools, so people cannot find what they need and AI answers stay generic",
    result: "a large employer saw more staff use the assistant each week (hypothetical)",
  },
  {
    key: "dev-platform", sector: "software", name: "Tavira",
    sells: "Tavira is a software development platform for source code management, CI/CD pipelines and test automation",
    does: "source code management, build and deploy pipelines, test automation and release management for engineering teams",
    customer: "Financial services", persona: "CTO at Financial services",
    problem: "teams use many separate development tools, so review, testing and release fall behind coding",
    result: "an engineering team shortened its release cycle after it moved to one pipeline (hypothetical)",
  },
];

// The calls: the same shapes the tools receive from a real user. The product is given by NAME in the product field, and its description
// sits where the user would put it for that tool.
const CALLS = {
  case_study_generator: (c) => ({ customer_name: `a ${c.name} customer`, customer_industry: c.customer, your_product: c.name, mode: "full", challenge: c.problem, solution: c.does, results: c.result }),
  newsletter_builder: (c) => ({ topic: `How teams at ${c.customer} can tackle ${c.problem}, from ${c.name}`, key_points: `${c.problem}; ${c.does}`, cta_goal: `book a conversation about ${c.name}`, newsletter_type: "thought_leadership", your_product: c.name }),
  webinar_script: (c) => ({ topic: `How teams at ${c.customer} can address ${c.problem}, with ${c.name}`, target_audience: c.persona, webinar_type: "educational", duration: "45_min", key_takeaways: `${c.problem}; ${c.does}`, your_product: c.name }),
  content_repurposer: (c) => ({ source_content: `${c.sells}: what to do about ${c.problem}\n${c.persona} often deal with ${c.problem}.\n${c.does}. ${c.result}.`, source_type: "blog_post", key_message: `${c.name}: ${c.does}` }),
  thought_leadership_series: (c) => ({ topic: c.does, your_take: `${c.name} sees ${c.problem}, and the fix is to change how the work is organized`, target_reader: c.persona, proof_points: c.result, author_background: `${c.name} team (${c.does})`, num_articles: 3, article_type: "framework" }),
  testimonial_capture: (c) => ({ customer_name: `contact at a ${c.name} customer`, customer_company: `a ${c.name} customer (${c.customer})`, customer_role: c.persona, success_story: `${c.sells}. ${c.result}`, testimonial_type: "written_quote", use_case: "the website and the sales deck", your_product: c.name }),
  sales_enablement_content: (c) => ({ product: `${c.name}, ${c.does}`, target_persona: c.persona, proof_points: c.result, common_objections: `How is ${c.name} different?`, value_props: c.does, sales_stage: "discovery" }),
  craft_content_improver: (c) => ({ content: `Subject: Quick question about ${c.problem}\nHi,\nTeams at ${c.customer} often deal with ${c.problem}.\n${c.sells}. ${c.does}.\n${c.result}.\nWould you be open to a 20-minute call next week to see if this fits?\nThanks,\nThe ${c.name} team`, content_type: "sales_email", audience: c.persona }),
};

const lines = (text) => ({
  sector: (text.match(/Sector: ([^\n]*?)\.\*?(?:\s|$)/) || [])[1] || "",
  model: (text.match(/Business model: ([^\n]*?)(?:\.\*|\n|$)/) || [])[1] || "",
});

for (const [tool, build] of Object.entries(CALLS)) {
  for (const c of COMPANIES) {
    test(`${tool} reads ${c.key} as ${c.sector}`, async () => {
      const text = await call(tool, build(c));
      const { sector, model } = lines(text);
      assert.match(sector, new RegExp(`read from your inputs as ${c.sector}\\b`), `sector line was: ${sector}`);
      if (c.notSubscription) assert.doesNotMatch(model, /^software subscription/, `model line was: ${model}`);
    });
  }
}

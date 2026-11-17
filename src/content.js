// Every section of the site, keyed by the `section` field in hotspots.js. This
// is the single source of truth: the drawer renders from it at runtime, and
// tools/gen-seo.mjs will emit a crawlable copy into index.html.
//
// Bootstrapped from thawani.netlify.app (avijit-thawani/webpage) and the older,
// much longer avi-jit.github.io. A lot of the good material lives only in the
// old site - the film work, the contraptions, the robotics win, the performance
// stuff - so it is pulled forward here.
//
// `object` records which thing in the room opens each section, and `zone` which
// of the three parts of Avi's own description it belongs to: tinkerer,
// researcher, storyteller. The room is laid out in those three zones, left to
// right, so the triad is the actual structure of the page rather than a slogan
// on top of it.

export const HERO = {
  name: 'Avijit Thawani',
  tagline: 'Tinkerer, researcher, storyteller.',
};

// Projects are data rather than hand-written markup, so every one gets the same
// card: a cover, a name, one or two sentences, and where to go. `img` is a file
// in assets/thumbs/; a project with none gets a lettered placeholder so the grid
// stays even. `fit: 'contain'` is for logos and odd-shaped art that must not be
// cropped, and `dark` keeps a dark cover for art drawn in light ink. `links` is [label, url] pairs, and the first one is also where the
// cover points.
const GH = 'https://github.com/avijit-thawani/';

const RECENT = [
  { name: 'Indian swing seats', img: 'cover-india-swing-map.webp',
    text: 'An interactive map of India\u2019s 543 Lok Sabha seats: the NDA\u2019s lead in 2019 and 2024, and how far each seat moved between them.',
    links: [['Live', 'https://india-swing-map.netlify.app/'], ['Code', GH + 'india-swing-map']] },
  { name: 'Pahunchi', img: 'cover-pahunchi.webp',
    text: 'A pretend phone call that talks back: an AI dad, mom or friend in an Indian voice, for walking home or cab rides at night.',
    links: [['Live', 'https://phoney-call.netlify.app'], ['Code', GH + 'pahunchi']] },
  { name: 'Sense', img: 'cover-sense.webp',
    text: 'A thumb-sized camera that describes the world to a blind person through earphones. Tap for what is in front of you, or hold and ask.',
    links: [['Code', GH + 'sense']] },
  { name: 'Living Survey', img: 'cover-living-survey.webp',
    text: 'A literature survey that lives in your README and updates itself. No hosting, no API keys.',
    links: [['Code', GH + 'living-survey'], ['Example', GH + 'compositional-generalization-lit-review']] },
  { name: 'Sikander', img: 'cover-sikander.webp',
    text: 'A turn-based battle game set in 326 BC, played in the browser. Plain HTML, CSS and JavaScript with no build step.',
    links: [['Code', GH + 'sikander']] },
  { name: 'Read Party', img: 'cover-read-party.webp',
    text: 'Read the same book together, in sync, from different devices. A fork of Koodo Reader.',
    links: [['Live', 'https://readparty-app.netlify.app/'], ['Code', GH + 'read-party']] },
  { name: 'Saras Mandarin', img: 'cover-saras-mandarin.webp',
    text: 'Learn Mandarin with HSK1, LLMs and spaced repetition.',
    links: [['Live', 'https://saras-mandarin.netlify.app/'], ['Code', GH + 'mandarin']] },
  { name: 'Sketch to image', img: 'cover-ipad.webp',
    text: 'Draw the composition on an iPad with an Apple Pencil, pick a style, and the model renders the part a prompt cannot express.',
    links: [['Code', GH + 'ipad']] },
  { name: 'Typst agent harness', img: 'cover-typst.webp',
    text: 'Agentic LaTeX to Typst conversion, with compile and visual-fidelity feedback loops.',
    links: [['Code', GH + 'typst-agent-harness']] },
  { name: 'TESS planet candidates', img: 'cover-tess.webp',
    text: 'Two new planet-candidate signals from a 1,098-star search at 60 to 100 pc, preregistered on Zenodo. With Niyati.',
    links: [['Code', GH + 'tess-niyati-avijit']] },
  { name: 'Chess trainer',
    text: 'An opening trainer in the browser, with Stockfish running locally as WebAssembly.',
    links: [['Code', GH + 'chess-trainer']] },
  { name: 'Avi Trivia',
    text: 'A trivia card game.',
    links: [['Live', 'https://avi-trivia.netlify.app/'], ['Code', GH + 'trivia']] },
  { name: 'This room', img: 'cover-room.webp',
    text: 'The site you\u2019re on, built from one flat illustration plus a depth map, displaced in a shader.',
    links: [['Code', GH + 'portfolio-room']] },
];

const EARLIER = [
  { name: 'PineGap.ai', img: 'pinegap.svg', fit: 'contain', dark: true,
    text: 'A VC-backed startup disrupting equity research with LLMs. As founding MLE/LLM engineer I finetune models, build RAG pipelines, custom evals and LangChains, and ship them to production.',
    links: [['Site', 'https://www.pinegap.ai/']] },
  { name: 'Saras', img: 'saras.webp', fit: 'contain',
    text: 'A personal AI tutor as a Telegram bot. Won a $1,500 grant at the New Venture Seed Contest and placed third at USC Trojan Tank.',
    links: [['Bot', 'https://t.me/saras_gpt_bot']] },
  { name: 'Ballpark', img: 'ballpark.webp', fit: 'contain',
    text: 'Wordle for numbers, a game that quietly improves your numeracy. Built with Harsh.',
    links: [['Play', 'https://ball-park.netlify.app']] },
  { name: 'Living Surveys (v1)', img: 'survey.webp',
    text: 'The first version: an open-source lit-review tool so you can stop having FOMO about academia, on GitHub Actions, Semantic Scholar and Netlify. Built with Eshaan.',
    links: [['Code', 'https://github.com/EshaanAgg/Research-Literature-Manager'], ['Talk', 'https://youtu.be/FUIq9-lJ9ag']] },
  { name: 'DesignAR', img: 'designar.webp',
    text: 'Our augmented reality app. National finalist and worldwide #6 at Microsoft Imagine Cup 2016, plus the Samsung VR Appathon. The startup drew several VC offers.',
    links: [] },
  { name: '2020 Election guide', img: 'election.webp',
    text: 'A data story built with journalists from the USC Annenberg Media Interactive Desk.',
    links: [['View', 'https://annenberginteractives.com/2020-2021/voting-information-by-state/']] },
  { name: 'COVID-19 India', img: 'covid.webp',
    text: 'Built between arranging oxygen for dying relatives, recovering myself, and chasing a submission deadline: an attempt to visualize the scale of the Indian crisis so Americans could comprehend it.',
    links: [['View', 'https://avi-jit.github.io/covid-india/scatter#']] },
];

function card(p) {
  const href = p.links[0]?.[1];
  const art = p.img
    ? `<img${p.fit === 'contain' ? ' class="fit"' : ''} src="assets/thumbs/${p.img}" alt="" loading="lazy">`
    : `<span class="blank" aria-hidden="true">${p.name}</span>`;
  const cls = p.dark ? 'cover dark' : 'cover';
  const cover = href
    ? `<a class="${cls}" href="${href}" tabindex="-1" aria-hidden="true">${art}</a>`
    : `<span class="${cls}">${art}</span>`;
  const links = p.links.map(([label, url]) => `<a href="${url}">${label}</a>`).join('');
  return `<article class="card">${cover}
    <div class="card-body"><h4>${p.name}</h4><p>${p.text}</p>
    ${links ? `<div class="links">${links}</div>` : ''}</div></article>`;
}

export const SECTIONS = {
  about: {
    object: 'framed portrait on the wall',
    zone: 'researcher',
    chip: 'About',
    title: 'About me',
    tagline: 'Tinkerer, researcher, storyteller',
    body: `
      <p>Friends (as if I have any) call me <strong>Avi</strong>. Three words
      cover most of it: <strong>tinkerer</strong>, <strong>researcher</strong>,
      <strong>storyteller</strong> \u2014 and this room is arranged in exactly
      those three parts.</p>
      <p>I\u2019m a PhD from the University of Southern California, where I
      worked on language modelling \u2014 specifically on helping models
      <em>tokenize and represent text better</em>.</p>
      <p>I did my undergrad and masters in Computer Science at
      <a href="https://www.iitbhu.ac.in/dept/cse">IIT BHU</a>, Varanasi. Since
      then I\u2019ve been splitting my time between research and building things
      people actually use.</p>
      <p>Outside of that I make films, write fiction, and have an ongoing
      weakness for mechanical contraptions.</p>`,
  },

  research: {
    object: 'whiteboard or pinned paper stack (tokenization scribbles)',
    zone: 'researcher',
    chip: 'Research',
    title: 'Research',
    tagline: 'Tokenization & numeracy',
    body: `
      <p>My research focuses on helping language models tokenize and represent
      text better. The through-line: the input layer is the least examined part
      of the stack, and a lot of what looks like a reasoning failure is really a
      representation failure.</p>
      <ul>
        <li><strong>Does Subword Vocabulary hold back Machine Translation?</strong>
        (2024) \u2014 <a href="https://openreview.net/pdf?id=D0fEYV_Ru4">OpenReview</a>,
        <a href="https://github.com/avi-otterai/factorizer">code</a></li>
        <li><strong>Learn Your Tokens: Word-Pooled Tokenization for Language
        Modeling</strong> \u2014 EMNLP 2023 Findings.
        <a href="https://aclanthology.org/2023.findings-emnlp.662/">Anthology</a>,
        <a href="https://arxiv.org/abs/2310.11628">arXiv</a>,
        <a href="https://github.com/avi-jit/eTok">code</a></li>
        <li><strong>Estimating Numbers without Regression</strong> \u2014 Negative
        Insights @ EACL 2023.
        <a href="https://arxiv.org/abs/2310.06204">arXiv</a></li>
        <li><strong>Numeracy enhances Literacy in Language Models</strong> \u2014
        EMNLP 2021.
        <a href="https://aclanthology.org/2021.emnlp-main.557">Anthology</a>,
        <a href="https://github.com/avi-jit/numeracy-literacy">code</a></li>
        <li><strong>Representing Numbers in NLP: a Survey and a Vision</strong>
        \u2014 NAACL 2021.
        <a href="https://www.aclweb.org/anthology/2021.naacl-main.53">Anthology</a>,
        <a href="https://arxiv.org/abs/2103.13136">arXiv</a></li>
        <li><strong>Are Online Reviews of Physicians Biased Against Female
        Providers?</strong> \u2014 MLHC 2019.
        <a href="https://www.mlforhc.org/s/Thawani.pdf">PDF</a></li>
        <li><strong>SWOW-8500: Word Association task for Intrinsic Evaluation of
        Word Embeddings</strong> \u2014 RepEval @ NAACL 2019.
        <a href="https://www.aclweb.org/anthology/W19-2006">Anthology</a></li>
      </ul>
      <p>Full list on
      <a href="https://scholar.google.com/citations?user=i67YV2QAAAAJ">Google Scholar</a>,
      <a href="https://www.semanticscholar.org/author/Avijit-Thawani/37574242">Semantic Scholar</a>,
      <a href="https://dblp.uni-trier.de/pid/208/4386.html">DBLP</a> and
      <a href="https://orcid.org/0000-0002-4289-3607">ORCID</a>.</p>`,
  },

  build: {
    object: 'the computer monitor (deep zoom - the signature moment)',
    zone: 'tinkerer',
    chip: 'Projects',
    title: 'Projects',
    tagline: 'Open source, products & hacks',
    body: `
      <p>Things I\u2019ve built and shipped: weekend hacks, open-source tools,
      and products with a small team. Most of the recent ones are on
      <a href="https://github.com/avijit-thawani">GitHub</a>.</p>
      <h3>Recent &amp; open source</h3>
      <div class="cards">${RECENT.map(card).join('')}</div>
      <h3>Products &amp; earlier work</h3>
      <div class="cards">${EARLIER.map(card).join('')}</div>
      <p>I also like helping startups build proof-of-concepts and streamline
      their AI/NLP work, in mobility APIs or fintech. Reach out if you want to
      chat.</p>`,
  },

  labs: {
    object: 'conference lanyards and badges on a hook',
    zone: 'researcher',
    chip: 'Work',
    title: 'Where I\u2019ve worked',
    tagline: 'Labs, internships & mentors',
    body: `
      <p>I\u2019ve been lucky in my mentors. Roughly newest first:</p>
      <ul class="media logos">
        <li>
          <img src="assets/thumbs/usc.webp" alt="USC" loading="lazy">
          <span><strong>USC</strong> \u2014 thesis committee:
          <a href="http://jaypujara.org">Jay Pujara</a>,
          <a href="http://swabhs.com">Swabha Swayamdipta</a>,
          <a href="https://dyogatama.github.io/">Dani Yogatama</a>.</span>
        </li>
        <li>
          <img src="assets/thumbs/msr.webp" alt="Microsoft Research" loading="lazy">
          <span><strong><a href="https://www.microsoft.com/en-us/research/lab/microsoft-health-futures/">Microsoft Research Health Futures</a></strong>,
          Cambridge UK \u2014 Stephanie Hyland, Flora Liu, Shruthi Bannur.
          Summer 2023.</span>
        </li>
        <li>
          <img src="assets/thumbs/alexa.webp" alt="Amazon Alexa" loading="lazy">
          <span><strong>Amazon Alexa Conversations</strong>, Lab126 Sunnyvale \u2014
          Rohan Mukherjee, Hann Wang,
          <a href="https://www.amazon.science/author/arjit-biswas">Arijit Biswas</a>.
          Summer 2022.</span>
        </li>
        <li>
          <img src="assets/thumbs/ai2.webp" alt="Allen Institute for AI" loading="lazy">
          <span><strong>Allen Institute for AI (Aristo)</strong> \u2014
          <a href="http://ashwinkalyan.com/">Ashwin Kalyan</a>, Peter Clark.
          Summer 2021.</span>
        </li>
        <li>
          <img src="assets/thumbs/neu.webp" alt="Northeastern University" loading="lazy">
          <span><strong>Northeastern University</strong>, Boston \u2014
          <a href="http://www.byronwallace.com/">Byron Wallace</a>. Summer 2018.</span>
        </li>
        <li>
          <img src="assets/thumbs/sutd.webp" alt="SUTD" loading="lazy">
          <span><strong>Singapore University of Technology and Design</strong> \u2014
          Yuen Chau. Summer 2016. Recruited onto the Singapore Smart City project
          for sensor work; ended up volunteering to model national weather data
          as well.</span>
        </li>
        <li>
          <img src="assets/thumbs/samsung.webp" alt="Samsung Research" loading="lazy">
          <span><strong>Samsung Research</strong>, Bengaluru \u2014 analyzed logged
          employee entry/exit data for the R&amp;D director. Attendance peaks
          around free lunch.</span>
        </li>
        <li>
          <img src="assets/thumbs/iitbhu.webp" alt="IIT BHU" loading="lazy">
          <span><strong><a href="https://www.iitbhu.ac.in/dept/cse">IIT BHU</a></strong>,
          Varanasi \u2014 undergrad and masters in Computer Science.</span>
        </li>
      </ul>`,
  },

  film: {
    object: 'film camera or clapperboard on a shelf',
    zone: 'storyteller',
    chip: 'Film',
    title: 'Film',
    tagline: 'I love storytelling',
    body: `
      <figure class="still">
        <a href="https://www.youtube.com/watch?v=Uy_3XKqsJZk">
          <img src="assets/thumbs/film.webp" width="630" height="297" loading="lazy"
               alt="Title card for the short film Stopping by Woods">
        </a>
        <figcaption>Stopping by Woods \u2014 watch on YouTube</figcaption>
      </figure>
      <p>My most popular <a href="https://www.youtube.com/watch?v=Uy_3XKqsJZk">short
      film</a> has over <strong>65,000 views</strong> on YouTube. It took two
      years and 50+ volunteer cast and crew.</p>
      <p>Other productions: a
      <a href="https://www.facebook.com/fmc.iitbhu/videos/747155185437805/">documentary
      on a World War 2 jet</a>, a
      <a href="https://www.facebook.com/fmc.iitbhu/videos/807030382783618/">comedy
      sketch</a> on how our college hotspot resembles Facebook-ing, and a
      romantic short that is still, embarrassingly, uncompiled.</p>`,
  },

  writing: {
    object: 'typewriter, or notebook and fountain pen',
    zone: 'storyteller',
    chip: 'Writing',
    title: 'Writing',
    tagline: 'Articles, stories, novels',
    body: `
      <p>I write articles, stories, newspapers,
      <a href="https://thawani.notion.site">blogs</a>, songs and novels.</p>
      <ul>
        <li><strong>Published articles</strong> in
        <a href="https://theprint.in/campus-voice/will-panjshir-become-a-taiwan-afghanistans-story-matches-with-china/732849/">The Print</a>
        and <a href="https://www.isi.edu/news/38134/do-humans-trust-ai-coworkers/">ISI News</a>.</li>
        <li><strong>Sci-fi novel</strong>: <em>DNA Revolution</em> \u2014 Venezuela
        in a politico-military crisis on the eve of a breakthrough in
        genetics.</li>
        <li><strong>Short stories</strong>: <em>Martyrs\u2019 Horizon</em>,
        inspired by a Chicken Soup book I read.</li>
        <li><strong>Newspapers</strong>: the college newsletter
        <a href="https://issuu.com/thequest_iitbhu">Quest</a> at IIT BHU, and the
        school newsletter at City Montessori School.</li>
        <li><strong>Blogs</strong>: old ones on
        <a href="https://medium.com/@avijitthawani">Medium</a>, newer ones on
        <a href="https://thawani.notion.site">Notion</a>.</li>
      </ul>`,
  },

  stage: {
    object: 'a theatre mask',
    zone: 'storyteller',
    chip: 'On stage',
    title: 'On stage',
    tagline: 'Improv, comedy, dance, rap, theatre',
    body: `
      <p>A running habit of getting on stage without quite enough
      preparation.</p>
      <ul>
        <li><strong>Improv</strong> \u2014 the long-running one. I\u2019ve been
        doing improv for over two years across Los Angeles, Mountain View and
        New York City, and I <strong>host improv meetups</strong> as well as
        attending them.</li>
        <li><strong>Stand-up comedy</strong> at the Lit Club and The Tripling
        Bistro.</li>
        <li><strong>Street play</strong> on blood donation, at a slum near
        campus.</li>
        <li><strong>Skit</strong> on media corruption \u2014 I played Rahul
        Gandhi.</li>
        <li><strong>Dance</strong>, from Bhangra through Govinda to Hip-Hop.</li>
        <li><strong>Rap</strong> in Hindi and English, inspired by
        <a href="https://www.youtube.com/watch?v=_8oL_FKr1zw">Kartavyo</a>, the
        Sanskrit-English rap song.</li>
        <li>Plus festival management, and a robo-soccer team.</li>
      </ul>`,
  },

  making: {
    object: 'a Rube Goldberg contraption, or a workbench with a small robot',
    zone: 'tinkerer',
    chip: 'Making',
    title: 'Making things',
    tagline: 'Contraptions, robots, crafts',
    body: `
      <figure class="still">
        <img src="assets/thumbs/contraption.webp" width="360" height="180" loading="lazy"
             alt="The Rube Goldberg contraption built for Goldberg\u2019s Alley">
      </figure>
      <p>I\u2019m a big fan of mechanical contraptions \u2014 the inventive
      devices Tom builds to trap Jerry \u2014 so I built my own, at a contest
      called Goldberg\u2019s Alley. One action leads to another and finally to a
      reaction, usually Tom caught in his own trap.</p>
      <p><strong>Robotics</strong>: stood first at a robot-making and handling
      event. Still
      <a href="https://www.facebook.com/avijit.thawani/posts/796281477100748">the
      best day of my life</a> \u2014 if I\u2019d scripted the day I couldn\u2019t
      have made it any better.</p>
      <p><strong>Crafts</strong>: helped my friend Akash co-found
      <a href="https://www.facebook.com/handypresents/">HandyPresents</a>, making
      personalised handmade gifts \u2014 the handwritten-greeting-card company
      from <em>Her</em>, but with more than letters.</p>
      <p><strong>Sketching</strong>: my brother
      <a href="https://www.instagram.com/sidart.thawani/">Siddharth</a> and I
      cartooned obsessively as kids. He still does. I once sketched a comic on
      Hanuman in three hours.</p>
      <p>As an undergrad I also deployed campus-wide analytics on the intranet
      portal, including hourly internet-usage stats.</p>`,
  },

  reading: {
    object: 'the bookshelf',
    zone: 'researcher',
    chip: 'Reading',
    title: 'Reading & learning',
    tagline: 'Lifelong learner',
    body: `
      <p>I\u2019m an avid reader of both non-fiction and fiction. Currently
      loving Murakami; I try to keep
      <a href="https://www.goodreads.com/user/show/4791083-avijit-thawani">Goodreads</a>
      updated. Long-running favourites include Minsky\u2019s
      <em>Society of Mind</em>, which I read after supper for a year because you
      cannot get through three pages without stopping to think.</p>
      <p>I\u2019m a big fan of
      <a href="https://ncase.me/remember">spaced repetition</a>, and I collect
      classes the way other people collect records: Interactive Journalism,
      Chinese History, Macroeconomics, Social Entrepreneurship, Self-Defense,
      Improv, Hip-Hop Dance, Cognitive Neuroscience, Film Appreciation, African
      History.</p>`,
  },

  travel: {
    object: 'a pinned world map on the wall',
    zone: 'storyteller',
    chip: 'Travel',
    title: 'Travel',
    tagline: 'Four countries and counting',
    body: `
      <p>I\u2019ve been lucky enough to live in four countries and travel a lot.
      Highlights: skydiving over Auckland, hiking inside the Grand Canyon,
      inspecting the fortifications at King\u2019s Landing in Dubrovnik, standing
      under the Wanaka Tree, and getting a book signed by Shashi Tharoor in
      Cambridge.</p>
      <ul>
        <li><strong>Europe</strong>: London, Berlin, Amsterdam, Utrecht,
        Florence, Pisa, Bruges, Dubrovnik, Dublin, Killarney, Galway,
        Cambridge</li>
        <li><strong>United States</strong>: Baltimore, New York, Philadelphia,
        Boston, Los Angeles, Santa Barbara, San Diego, San Francisco, Michigan,
        Pittsburgh</li>
        <li><strong>Asia</strong>: Beijing, Singapore, Kuala Lumpur, Seoul,
        Kathmandu, Tokyo</li>
        <li><strong>New Zealand</strong>: Auckland, Queenstown, Wanaka,
        Makarora</li>
        <li><strong>India</strong>: from Manali and Shimla down to Rameshwaram
        and Pondicherry, via Varanasi, Mumbai, Goa, Kolkata and Puri</li>
      </ul>`,
  },

  contact: {
    object: 'an envelope in a letter tray on the desk',
    zone: 'researcher',
    chip: 'Contact',
    title: 'Contact',
    tagline: 'Say hi',
    body: `
      <p>Happy to chat about tokenization, LLM products, or filmmaking.</p>
      <ul>
        <li><a class="email-link" href="#" data-u="avijit.thawani" data-d="gmail.com">Email</a></li>
        <li><a href="https://www.overleaf.com/read/pfvrgckrmmqv">Resume</a></li>
        <li><a href="https://www.linkedin.com/in/avi-jit/">LinkedIn</a></li>
        <li><a href="https://twitter.com/thawani_avijit">Twitter</a></li>
        <li><a href="https://instagram.com/avijit_thawani">Instagram</a></li>
        <li><a href="https://github.com/avijit-thawani">GitHub</a></li>
      </ul>`,
  },
};

# Trust, Leaks, and Unsustainable Compute: The Month That Exposed AI's Fault Lines

*March 2026 didn't just showcase AI's capabilities — it exposed the fractures underneath. A flagship video product killed by its own economics. Half a million lines of source code spilled onto the public internet. A cybersecurity model so powerful it discovered unknown vulnerabilities autonomously. And the biggest funding round in history closing on the same day as one of the biggest security incidents. The cracks in the AI industry's foundation were visible all month — if you knew where to look.*

## Sora's Quiet Death: When Compute Economics Kill a Product

On March 24, OpenAI posted a notice that stunned the AI video community: **Sora, its AI video-generation platform, would be discontinued** — just six months after its public launch, which had itself included an integrated social media platform for sharing AI-generated videos.

The shutdown came with 30 days' notice. The stated reason was straightforward: **unsustainable economics**. Generating one minute of Sora-quality video required compute that cost OpenAI multiples of what API customers were paying. At any commercially viable price point, demand was insufficient to justify the infrastructure.

Internally, the cost was described as "economically irreconcilable."

### The Disney Domino

The Sora shutdown triggered an immediate and high-profile casualty: **Disney's planned $1 billion partnership with OpenAI collapsed**. The Financial Times reported the deal never fully materialized as OpenAI shifted strategic direction. Deadline quoted a Disney insider who said bluntly that "the deal is not moving forward."

Disney, which had been exploring AI video generation for its studios, issued a diplomatic statement: "As the nascent AI field advances rapidly, we respect OpenAI's decision." Behind the language, a billion-dollar partnership evaporated in a news cycle.

### The Wider Implications

The Sora shutdown is a useful corrective to one of the AI industry's most persistent assumptions: that any capability that works at research scale will naturally become a viable commercial product.

It won't, if the economics don't close.

The compute cost of high-fidelity video generation is fundamentally different from text generation. Text inference is cheap and getting cheaper. Video inference is expensive and, at Sora's quality level, was getting more expensive as users demanded higher resolution and longer outputs. The gap between what customers would pay and what it cost to serve them wasn't narrowing — it was widening.

Enterprise video AI budgets immediately redirected toward **Runway Gen-4, Pika, Seedance 2.0, and Google's Veo 2** — competitors with more efficient architectures or business models better suited to the current cost structure. The market for AI video generation didn't die; it just rejected the assumption that brute-force quality at any compute cost is a viable product strategy.

OpenAI indicated the next version would use a "more efficient architecture" before any public relaunch. Translation: Sora as shipped was a technology demonstration that couldn't survive contact with commercial reality.

## The Claude Code Leak: 500,000 Lines in the Open

If Sora's shutdown exposed economic fault lines, the Claude Code leak on March 31 exposed security ones.

Security researcher Chaofan Shou discovered that Anthropic's Claude Code — their flagship agentic CLI tool generating $2.5 billion in annual revenue, with 80% coming from enterprise customers — had its **entire source code exposed through a source map file accidentally published to the npm registry**.

The exposure was total. Within hours, the ~500,000-line codebase was widely mirrored across GitHub, enabling thorough public analysis. Anthropic attributed the leak to human error during packaging, not a breach.

### What the Code Revealed

The analysis community found several previously unknown systems:

- **"Self-Healing Memory"** — a system allowing Claude Code to autonomously repair and update its own operational context
- **"KAIROS"** — an autonomous background agent running tasks independently of direct user interaction
- **"Undercover Mode"** — a controversial feature that appears designed to submit contributions to open-source repositories without identifying them as originating from Claude

The Undercover Mode revelation was particularly damaging. If Claude Code was contributing to open-source projects while concealing its AI origin, it undermines the trust assumptions that open-source collaboration depends on. The open-source community's reaction was swift and angry.

### The Supply Chain Attack That Wasn't (But Also Was)

Compounding the chaos, a **concurrent but unrelated supply chain attack** hit the npm ecosystem on the same day. Malicious versions of the widely-used `axios` HTTP library were published between 00:21 and 03:29 UTC on March 31, containing an embedded Remote Access Trojan. Anyone who installed or updated Claude Code via npm during that window may have pulled in the compromised dependency.

The coincidence of timing — Anthropic's accidental code exposure happening within hours of a targeted npm supply chain attack — created a perfect storm of security concern for the enterprise customers who generate the vast majority of Claude Code's revenue.

### The Pragmatic Engineer's observation was telling: some repositories had rewritten the leaked code entirely in Python within the day, attempting to stay online while evading copyright enforcement. The incident demonstrated both the vulnerability of publishing commercial code through public package managers and the speed at which AI can be used to transform and redistribute code.

## Claude Mythos: The Cybersecurity Model That Found Zero-Days

In one of the most consequential — and unsettling — reveals of the month, details of Anthropic's unreleased **Claude Mythos** model leaked on March 26 via an accidentally published blog post.

Anthropic described Mythos as "by far the most powerful model" they've released and a "step change in capabilities" beyond Claude Opus 4.6. Early access had been given to cybersecurity researchers.

The reason for the cybersecurity focus became clear when Anthropic's red team site published evaluation results: **Mythos Preview fully autonomously identified and then exploited a 17-year-old remote code execution vulnerability in FreeBSD** that allows root access on any machine running NFS. The vulnerability, triaged as CVE-2026-4747, had been unknown to the security community for nearly two decades.

An AI model finding genuine zero-day vulnerabilities autonomously is a watershed moment. It validates the dual-use concern that AI safety researchers have warned about for years: the same capability that can secure software can also break it. An AI that can autonomously discover and exploit vulnerabilities is an extraordinary defensive tool in the right hands — and an extraordinary weapon in the wrong ones.

The UK AI Security Institute (AISI) conducted independent evaluations of Mythos Preview and published findings confirming its cyber capabilities while noting they "cannot say for sure whether Mythos Preview would be able to attack well-defended systems." The hedging was notable: AISI was careful not to overstate the capability, but also notably did not dismiss it.

## The $122 Billion Close

On March 31 — the same day the Claude Code leak made global headlines — OpenAI announced it had **closed a $122 billion funding round at an $852 billion valuation**. The timing was either coincidental or a masterclass in burying unfavorable news under a bigger headline.

The numbers are extraordinary by any standard:

- **$122 billion** in committed capital — the largest private funding round in history
- **$852 billion** post-money valuation — larger than most public companies
- **$2 billion** in monthly revenue
- **900 million** weekly active ChatGPT users
- **$3 billion** from retail investors alone, in a move unprecedented for a pre-IPO AI company

The funding will support expanded compute infrastructure, multi-cloud and chip partnerships, and the development of a unified AI "superapp" — a single platform combining ChatGPT's conversational AI with broader productivity, search, and creative tools.

Crunchbase data showed AI companies raised an estimated **$297 billion in Q1 2026**, with 22 transactions exceeding $10 billion — the most large corporate AI deals in any quarter on record.

### The Paradox: Funding Up, Stocks Down

The funding numbers exist in tension with public market performance. As of April 1, the Magnificent Seven AI stocks were all down: Nvidia -8%, Alphabet -9%, Amazon -8%, Meta -12%, Microsoft -22%.

Private investors are pouring record capital into AI. Public investors are marking AI stocks down. The disconnect suggests either that private markets are irrationally exuberant, that public markets are overly pessimistic, or — most likely — that the market hasn't yet decided whether the massive infrastructure spending now will generate returns that justify the investment.

OpenAI's move to develop a **GitHub rival** code-hosting platform, reported by Reuters on March 3, illustrates the strategic ambition the funding enables. Building a code-hosting platform to compete with Microsoft's GitHub — while Microsoft remains a major OpenAI investor — signals that OpenAI's long-term strategy involves owning the full developer stack, not just the model layer.

## The Fault Lines

Pull these threads together and March 2026 reveals an AI industry with extraordinary momentum — and equally extraordinary vulnerabilities:

**Economic fault lines**: Sora proved that not every AI capability translates into a viable product. Compute economics create real constraints, and those constraints favor modalities where inference is cheap (text, structured data) over those where inference is expensive (high-resolution video). Companies building products on expensive inference should be stress-testing their unit economics before, not after, launch.

**Security fault lines**: The Claude Code leak demonstrated that AI's most valuable commercial code can be exposed by a single packaging error. The concurrent npm supply chain attack showed that the dependency chains AI tools rely on are themselves attack surfaces. The OWASP Agentic AI Top 10 — published earlier in March — listed supply chain vulnerabilities as a top-three risk. The month validated that ranking.

**Capability fault lines**: Claude Mythos finding unknown zero-day vulnerabilities autonomously crosses a line that the AI safety community has warned about. The capability is real. The dual-use risk is real. And the governance frameworks for managing it are, at best, in draft form.

**Trust fault lines**: Claude Code's Undercover Mode — submitting AI-generated code to open-source repositories without disclosure — represents a trust violation that goes beyond Anthropic. If AI companies are systematically concealing AI's role in software production, the trust infrastructure of open-source collaboration is compromised. And trust, once lost in open source, is exceptionally hard to rebuild.

**Financial fault lines**: $297 billion in Q1 funding and $852 billion valuations coexist with declining AI stock prices and a product (Sora) killed by its own economics within six months. The market is simultaneously betting everything on AI and marking down the companies building it. The resolution of this contradiction will define the next phase of the AI industry.

March 2026 was the month the AI industry's stress fractures became visible at the surface. None of these fault lines are fatal — yet. But they are structural, and they will shape how the next chapter of AI development plays out. The companies and institutions that acknowledge and address these fractures will be better positioned than those that pretend the foundation is solid when it clearly is not.

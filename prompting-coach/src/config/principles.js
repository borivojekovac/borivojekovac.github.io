/**
 * Coaching Principles Configuration
 * Defines the AIM/MAP/DEBUG/OCEAN methodology for prompt coaching
 */

/**
 * @typedef {Object} Principle
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} framework - Framework this belongs to (AIM, MAP, DEBUG, OCEAN)
 * @property {string} description - What this principle checks
 * @property {string} question - Question to ask the user
 * @property {string[]} examples - Example improvements
 * @property {number} order - Order in the coaching sequence
 * @property {string} evaluationPrompt - Prompt template for LLM evaluation
 */

/**
 * AIM Framework - Actor, Input, Mission
 * Establishes the foundational context for the prompt
 */
const AIM_PRINCIPLES = [
  {
    id: 'aim-actor',
    name: 'Actor (A)',
    framework: 'AIM',
    description: 'Define who or what role the AI should assume',
    question: 'Have you specified what role or persona the AI should take on?',
    examples: [
      'You are an experienced software architect...',
      'Act as a professional technical writer...',
      'You are a patient and encouraging coding tutor...',
    ],
    order: 1,
    evaluationPrompt: `Evaluate if this prompt clearly defines an Actor (role/persona for the AI).
Look for:
- Explicit role definition (e.g., "You are a...", "Act as...")
- Clear expertise level or specialization
- Appropriate persona for the task

If missing or weak, suggest how to add a clear actor definition.`,
  },
  {
    id: 'aim-input',
    name: 'Input (I)',
    framework: 'AIM',
    description: 'Clarify what information or context is being provided',
    question: 'Is the input data or context clearly presented and formatted?',
    examples: [
      'Given the following code snippet: [code]',
      'Based on this customer feedback: [feedback]',
      'Using the data from the attached CSV file...',
    ],
    order: 2,
    evaluationPrompt: `Evaluate if this prompt clearly presents the Input (context/data).
Look for:
- Clear delineation of input data
- Proper formatting of provided information
- Context that helps understand the input

If missing or weak, suggest how to better present the input.`,
  },
  {
    id: 'aim-mission',
    name: 'Mission (M)',
    framework: 'AIM',
    description: 'State the specific task or goal to accomplish',
    question: 'Is the mission/task clearly and specifically stated?',
    examples: [
      'Your task is to review this code for security vulnerabilities...',
      'Generate a summary that highlights the key points...',
      'Create a step-by-step tutorial for beginners...',
    ],
    order: 3,
    evaluationPrompt: `Evaluate if this prompt clearly states the Mission (task/goal).
Look for:
- Explicit task statement
- Clear deliverable or outcome expected
- Specific scope of what to accomplish

If missing or weak, suggest how to clarify the mission.`,
  },
];

/**
 * MAP Framework - Memory, Assets, Actions, Prompt
 * Provides resources and structure for execution
 */
const MAP_PRINCIPLES = [
  {
    id: 'map-memory',
    name: 'Memory',
    framework: 'MAP',
    description: 'Reference relevant background knowledge or previous context',
    question: 'Have you included relevant background information or prior context?',
    examples: [
      'Remember that this project uses TypeScript and React...',
      'In our previous conversation, we established that...',
      'The company style guide requires...',
    ],
    order: 4,
    evaluationPrompt: `Evaluate if this prompt includes appropriate Memory (background/context).
Look for:
- Relevant background information
- Prior context or constraints
- Domain-specific knowledge references

If missing or weak, suggest what memory/context could be added.`,
  },
  {
    id: 'map-assets',
    name: 'Assets',
    framework: 'MAP',
    description: 'Provide examples, templates, or reference materials',
    question: 'Have you included examples or templates to guide the output?',
    examples: [
      'Here is an example of the desired output format: [example]',
      'Use this template as a starting point: [template]',
      'Reference this documentation: [docs]',
    ],
    order: 5,
    evaluationPrompt: `Evaluate if this prompt provides Assets (examples/templates/references).
Look for:
- Example outputs or formats
- Templates to follow
- Reference materials or documentation

If missing or weak, suggest what assets could improve the prompt.`,
  },
  {
    id: 'map-actions',
    name: 'Actions',
    framework: 'MAP',
    description: 'Define the specific steps or process to follow',
    question: 'Have you outlined the steps or process the AI should follow?',
    examples: [
      'First, analyze the requirements. Then, design the solution. Finally, implement...',
      'Step 1: Review the code. Step 2: Identify issues. Step 3: Suggest fixes...',
      'Follow this process: 1) Understand 2) Plan 3) Execute 4) Verify',
    ],
    order: 6,
    evaluationPrompt: `Evaluate if this prompt defines clear Actions (steps/process).
Look for:
- Sequential steps to follow
- Clear process or workflow
- Logical order of operations

If missing or weak, suggest how to add structured actions.`,
  },
  {
    id: 'map-prompt',
    name: 'Prompt Structure',
    framework: 'MAP',
    description: 'Ensure the prompt is well-organized and formatted',
    question: 'Is the prompt well-structured with clear sections and formatting?',
    examples: [
      'Using headers to separate sections',
      'Bullet points for lists of requirements',
      'Code blocks for technical content',
    ],
    order: 7,
    evaluationPrompt: `Evaluate if this prompt has good Prompt Structure (organization/formatting).
Look for:
- Clear section organization
- Appropriate use of formatting (headers, lists, code blocks)
- Logical flow of information

If missing or weak, suggest structural improvements.`,
  },
];

/**
 * DEBUG Framework - Chain of Thought, Verifier, Refinement
 * Techniques for improving reasoning and accuracy
 */
const DEBUG_PRINCIPLES = [
  {
    id: 'debug-cot',
    name: 'Chain of Thought',
    framework: 'DEBUG',
    description: 'Encourage step-by-step reasoning',
    question: 'Have you asked the AI to think through the problem step by step?',
    examples: [
      'Think through this step by step...',
      'Explain your reasoning as you work through this...',
      'Break down your analysis into clear steps...',
    ],
    order: 8,
    evaluationPrompt: `Evaluate if this prompt encourages Chain of Thought reasoning.
Look for:
- Requests for step-by-step thinking
- Encouragement to show reasoning
- Instructions to break down complex problems

If missing, suggest how to add chain of thought prompting.`,
  },
  {
    id: 'debug-verifier',
    name: 'Verifier',
    framework: 'DEBUG',
    description: 'Include self-checking or validation steps',
    question: 'Have you asked the AI to verify or validate its output?',
    examples: [
      'After generating, review your output for errors...',
      'Verify that your solution meets all requirements...',
      'Double-check your calculations and logic...',
    ],
    order: 9,
    evaluationPrompt: `Evaluate if this prompt includes Verifier (self-checking) instructions.
Look for:
- Requests to verify output
- Self-checking instructions
- Validation against requirements

If missing, suggest how to add verification steps.`,
  },
  {
    id: 'debug-refinement',
    name: 'Refinement',
    framework: 'DEBUG',
    description: 'Allow for iterative improvement of the output',
    question: 'Have you set up the prompt for potential refinement or iteration?',
    examples: [
      'Provide your initial response, then we can refine it...',
      'Start with a draft and highlight areas for improvement...',
      'Generate multiple options so we can select the best...',
    ],
    order: 10,
    evaluationPrompt: `Evaluate if this prompt allows for Refinement (iteration/improvement).
Look for:
- Openness to iteration
- Request for multiple options
- Acknowledgment of refinement process

If missing, suggest how to enable refinement.`,
  },
];

/**
 * OCEAN Framework - Original, Concrete, Evident, Assertive, Narrative
 * Quality attributes for effective prompts
 */
const OCEAN_PRINCIPLES = [
  {
    id: 'ocean-original',
    name: 'Original',
    framework: 'OCEAN',
    description: 'Ensure the prompt is specific and not generic',
    question: 'Is your prompt specific to your unique situation rather than generic?',
    examples: [
      'Instead of "write code", specify "write a Python function that validates email addresses"',
      'Include specific constraints unique to your project',
      'Reference your actual data or requirements',
    ],
    order: 11,
    evaluationPrompt: `Evaluate if this prompt is Original (specific, not generic).
Look for:
- Specific details rather than generic requests
- Unique constraints or requirements
- Customization to the actual situation

If too generic, suggest how to make it more specific.`,
  },
  {
    id: 'ocean-concrete',
    name: 'Concrete',
    framework: 'OCEAN',
    description: 'Use specific, measurable terms rather than vague language',
    question: 'Are your requirements concrete and measurable rather than vague?',
    examples: [
      'Instead of "make it fast", specify "response time under 100ms"',
      'Instead of "good quality", specify "follows PEP 8 style guide"',
      'Use numbers, formats, and specific criteria',
    ],
    order: 12,
    evaluationPrompt: `Evaluate if this prompt is Concrete (specific, measurable).
Look for:
- Measurable criteria
- Specific numbers or thresholds
- Clear, unambiguous language

If vague, suggest how to make requirements more concrete.`,
  },
  {
    id: 'ocean-evident',
    name: 'Evident',
    framework: 'OCEAN',
    description: 'Make expectations and constraints clearly visible',
    question: 'Are all expectations and constraints explicitly stated?',
    examples: [
      'Explicitly state output format requirements',
      'Clearly list all constraints and limitations',
      'Make implicit assumptions explicit',
    ],
    order: 13,
    evaluationPrompt: `Evaluate if this prompt makes expectations Evident (explicit).
Look for:
- Explicit output format requirements
- Clearly stated constraints
- No hidden assumptions

If implicit, suggest how to make expectations more evident.`,
  },
  {
    id: 'ocean-assertive',
    name: 'Assertive',
    framework: 'OCEAN',
    description: 'Use confident, direct language',
    question: 'Is your prompt written in confident, direct language?',
    examples: [
      'Use "Generate..." instead of "Could you maybe generate..."',
      'Use "The output must..." instead of "It would be nice if..."',
      'Be direct about requirements, not tentative',
    ],
    order: 14,
    evaluationPrompt: `Evaluate if this prompt is Assertive (confident, direct).
Look for:
- Direct, imperative language
- Confident tone
- Clear commands rather than suggestions

If tentative, suggest how to make it more assertive.`,
  },
  {
    id: 'ocean-narrative',
    name: 'Narrative',
    framework: 'OCEAN',
    description: 'Provide context through storytelling when appropriate',
    question: 'Have you provided narrative context that helps understand the "why"?',
    examples: [
      'Explain the business context or user story',
      'Describe the problem being solved',
      'Share the motivation behind the request',
    ],
    order: 15,
    evaluationPrompt: `Evaluate if this prompt includes appropriate Narrative (context/story).
Look for:
- Business or user context
- Problem description
- Motivation or background story

If lacking context, suggest how to add narrative elements.`,
  },
];

/**
 * All principles in coaching order
 */
export const PRINCIPLES = [
  ...AIM_PRINCIPLES,
  ...MAP_PRINCIPLES,
  ...DEBUG_PRINCIPLES,
  ...OCEAN_PRINCIPLES,
];

/**
 * Principles grouped by framework
 */
export const FRAMEWORKS = {
  AIM: AIM_PRINCIPLES,
  MAP: MAP_PRINCIPLES,
  DEBUG: DEBUG_PRINCIPLES,
  OCEAN: OCEAN_PRINCIPLES,
};

/**
 * Get a principle by ID
 * @param {string} id
 * @returns {Principle|undefined}
 */
export function getPrincipleById(id) {
  return PRINCIPLES.find(p => p.id === id);
}

/**
 * Get principles for a specific framework
 * @param {string} framework
 * @returns {Principle[]}
 */
export function getPrinciplesByFramework(framework) {
  return FRAMEWORKS[framework] || [];
}

/**
 * Get the next principle after the given one
 * @param {string} currentId
 * @returns {Principle|null}
 */
export function getNextPrinciple(currentId) {
  const currentIndex = PRINCIPLES.findIndex(p => p.id === currentId);
  if (currentIndex === -1 || currentIndex === PRINCIPLES.length - 1) {
    return null;
  }
  return PRINCIPLES[currentIndex + 1];
}

/**
 * Get total number of principles
 * @returns {number}
 */
export function getTotalPrinciples() {
  return PRINCIPLES.length;
}

/**
 * System prompt for the coaching assistant
 */
export const COACH_SYSTEM_PROMPT = `You are an expert prompt engineering coach helping users improve their prompts using the AIM/MAP/DEBUG/OCEAN methodology.

Your role is to:
1. Evaluate prompts against specific principles
2. Provide constructive, actionable feedback
3. Suggest concrete improvements with examples
4. Be encouraging while being thorough

When evaluating a principle:
- Be specific about what's present or missing
- Provide concrete suggestions for improvement
- Give examples when helpful
- Keep feedback concise but actionable

Respond in a friendly, professional tone. Focus on helping the user understand WHY each principle matters and HOW to apply it.`;

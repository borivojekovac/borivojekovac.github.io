import DataManager from "./dataManager.js";

class Config {

    debug = true;
    controlPanelVisible = true;
    openAiApiKey = "";
    openAiBaseModel = "gpt-4o-mini";
    openAiSentimentModel = "gpt-3.5-turbo";
    creatorPersona = "You are a helpful agent which responds to user prompts and tries to make the User happy. You do not talk about yourself. You NEVER ask questions. You ALWAYS provide STRAIGHT responses to user's prompts. You DO NOT comment on feedback, but instead correct your previous response to match the expectations and get a positive feedback.";
    reviewerPersona = `You are a validator of statements. You receive a set of validation instructions, followed by a statement. If the statement is valid per these instructions, you respond with a simple "Yes". Otherwise, you respond with a "No" and add an explaination on how to adjust the statement in order to pass validation.`;
    sentimentCheckerPersona = `You are an agent who assesses whether a sentence is positive or negative. Sentence which starts with a "Yes", is always positive; otherwise it's negative. You ALWAYS respond with a single word: "positive" or "negative".`;
    creatorPrompt = "Roses are red, violets are blue...";
    reviewerPrompt = "There need to be one or more numbers in the response.";
    temperature = 0.9;
    maxTokens = 2048;
    maxIterations = 5;

    constructor() {

    }

    async load() {

        for (const valueName in this) {

            this[valueName] = await DataManager.get(`config.${valueName}`, this[valueName]);
        }
    }

    async save() {

        for (const valueName in this) {

            await DataManager.set(`config.${valueName}`, this[valueName]);
        }
    }
};

export default Config;
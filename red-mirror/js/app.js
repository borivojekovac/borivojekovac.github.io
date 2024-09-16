import DataManager from "./dataManager.js";

class App {

    commandHistory = [];
    ui = {};

    config = {
        openAiApiKey: "",
        openAiBaseModel: "gpt-4o-mini",
        openAiSentimentModel: "gpt-3.5-turbo",
        creatorPersona: "You are a helpful agent which responds to user prompts and tries to make the User happy. You do not talk about yourself. You NEVER ask questions. You ALWAYS provide STRAIGHT responses to user's prompts. You DO NOT comment on feedback, but instead correct your previous response to match the expectations and get a positive feedback.",
        creatorPrompt: "Roses are red, violets are blue... ",
        reviewerPersona: `You are a reviewer of agent's answers. You receive an agent's response and instructions on how to validate that response. If the response is valid per these instruction, you respond with a simple "Yes". Otherwise, you respond with a "No" and an explaination for agent to adjust his response in order to pass validation.`,
        reviewerPrompt: "There need to be one or more numbers in the response.",
        temperature: 0.9,
        maxTokens: 2048,
        maxIterations: 5
    };

    async loadConfig() {

        for (const valueName in this.config) {

            this.config[valueName] = await DataManager.get(`config.${valueName}`, this.config[valueName]);
        }
    }

    async saveConfig() {

        for (const valueName in this.config) {

            await DataManager.set(`config.${valueName}`, this.config[valueName]);
        }
    }

    constructor() {

        window.requestAnimationFrame(this.onUpdateFrame.bind(this));

        this.ui.buttonPlay = document.querySelector("#buttonPlay");
        this.ui.inputChatGPTApiKey = document.querySelector("#inputChatGPTApiKey");
        this.ui.comboBaseModel = document.querySelector("#comboBaseModel");
        this.ui.comboSentimentModel = document.querySelector("#comboSentimentModel");
        this.ui.inputTemperature = document.querySelector("#inputTemperature");
        this.ui.inputMaxTokens = document.querySelector("#inputMaxTokens");
        this.ui.inputMaxIterations = document.querySelector("#inputMaxIterations");
        this.ui.inputCreatorPersona = document.querySelector("#inputCreatorPersona");
        this.ui.inputCreatorPrompt = document.querySelector("#inputCreatorPrompt");
        this.ui.inputReviewerPersona = document.querySelector("#inputReviewerPersona");
        this.ui.inputReviewerPrompt = document.querySelector("#inputReviewerPrompt");
        this.ui.responseText = document.querySelector("#responseText");

        this.init();
    }

    async init() {

        await this.loadConfig();

        this.ui.inputChatGPTApiKey.value = this.config.openAiApiKey;
        this.ui.comboBaseModel.value = this.config.openAiBaseModel;
        this.ui.comboSentimentModel.value = this.config.openAiSentimentModel;
        this.ui.inputTemperature.value = this.config.temperature;
        this.ui.inputMaxTokens.value = this.config.maxTokens;
        this.ui.inputMaxIterations.value = this.config.maxIterations;
        this.ui.inputCreatorPersona.value = this.config.creatorPersona;
        this.ui.inputCreatorPrompt.value = this.config.creatorPrompt;
        this.ui.inputReviewerPersona.value = this.config.reviewerPersona;
        this.ui.inputReviewerPrompt.value = this.config.reviewerPrompt;

        this.ui.inputChatGPTApiKey.addEventListener("change", this.onConfigChanged.bind(this));
        this.ui.comboBaseModel.addEventListener("change", this.onConfigChanged.bind(this));
        this.ui.comboSentimentModel.addEventListener("change", this.onConfigChanged.bind(this));
        this.ui.inputTemperature.addEventListener("change", this.onConfigChanged.bind(this));
        this.ui.inputMaxTokens.addEventListener("change", this.onConfigChanged.bind(this));
        this.ui.inputMaxIterations.addEventListener("change", this.onConfigChanged.bind(this));
        this.ui.inputCreatorPersona.addEventListener("change", this.onConfigChanged.bind(this));
        this.ui.inputCreatorPrompt.addEventListener("change", this.onConfigChanged.bind(this));
        this.ui.inputReviewerPersona.addEventListener("change", this.onConfigChanged.bind(this));
        this.ui.inputReviewerPrompt.addEventListener("change", this.onConfigChanged.bind(this));

        this.ui.buttonPlay.addEventListener("click", this.onPlayClicked.bind(this));
    }

    async outputText(text) {

        return await this.output(`<span class="text">${text}<span>`);
    }

    async outputError(error) {

        return await this.output(`<span class="error">${error}<span>`);
    }

    async outputHighlight(text) {

        return await this.output(`<span class="highlight">${text}<span>`);
    }

    async output(html) {

        var div = document.createElement("div");
        div.className = "output";
        div.innerHTML = html;

        this.ui.responseText.appendChild(div);
        div.scrollIntoView();

        return html;
    }

    onConfigChanged() {

        this.config.openAiApiKey = this.ui.inputChatGPTApiKey.value;
        this.config.openAiBaseModel = this.ui.comboBaseModel.value;
        this.config.openAiSentimentModel = this.ui.comboSentimentModel.value;
        this.config.temperature = this.ui.inputTemperature.value;
        this.config.maxTokens = this.ui.inputMaxTokens.value;
        this.config.maxIterations = this.ui.inputMaxIterations.value;
        this.config.creatorPersona = this.ui.inputCreatorPersona.value;
        this.config.creatorPrompt = this.ui.inputCreatorPrompt.value;
        this.config.reviewerPersona = this.ui.inputReviewerPersona.value;
        this.config.reviewerPrompt = this.ui.inputReviewerPrompt.value;

        this.saveConfig();
    }

    async invokeModel(model, persona, prompt, previousMessages) {

        var messages = previousMessages ?? [];

        if (!messages.length && persona.trim().length) {

            messages.push({
                "role": "system", "content": persona
            });
        }

        messages.push({ "role": "user", "content": prompt });

        var requestData = {
            model: model,
            messages: messages
        };

        if (this.config.temperature) {

            requestData.temperature = this.config.temperature * 1.0;
        }

        if (this.config.maxTokens) {

            requestData.max_tokens = this.config.maxTokens * 1;
        }

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ this.config.openAiApiKey }`
                },
                body: JSON.stringify(requestData)
            }
        );

        const data = await response.json();

        if (response.ok) {

            messages.push(data.choices[0].message);

            return {
                ok: true,
                response: data.choices[0].message.content,
                messages: messages
            };
        }

        return {
            ok: false,
            error: data.error.message
        }
    }

    async createAssistant(name, persona, tools, model, temperature) {

        try {

            const response = await fetch(
                "https://api.openai.com/v1/assistants",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                        "OpenAI-Beta": "assistants=v2"
                    },
                    body: JSON.stringify({
    
                        "name": name,
                        "instructions": persona,
                        "tools": tools,
                        "model": model,
                        "temperature": temperature * 1.0
                    })
                }
            );
    
            const assistant = await response.json();

            if (assistant.error) {

                throw new Error(assistant.error.message);
            }

            return assistant;
        }
        catch (ex) {

            throw new Error(`Couldn't create agent: ${ex.message}`);
        }
    }

    async createThread() {

        try {

            const response = await fetch(
                "https://api.openai.com/v1/threads",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                        "OpenAI-Beta": "assistants=v2"
                    }
                }
            );
    
            const thread = await response.json();

            if (thread.error) {

                throw new Error(thread.error.message);
            }

            return thread;
        }
        catch (ex) {

            throw new Exception(`Couldn't create a thread: ${ex.message}`)
        }
    }

    async sendMessage(threadId, content) {

        try {

            const response = await fetch(
                `https://api.openai.com/v1/threads/${threadId}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                        "OpenAI-Beta": "assistants=v2"
                    },
                    body: JSON.stringify({
                        "role": "user",
                        "content": content
                    })
                }
            );
    
            const message = await response.json();

            if (message.error) {

                throw new Error(message.error.message);
            }
    
            return message;
        }
        catch (ex) {

            throw new Error(`Couldn't sent message: ${ex.message}`);
        }
    }

    async getReply(threadId, assistantId) {

        try {


            var response = await fetch(
                `https://api.openai.com/v1/threads/${threadId}/runs`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                        "OpenAI-Beta": "assistants=v2"
                    },
                    body: JSON.stringify({
                        "assistant_id": assistantId
                    })
                }
            );
    
            var run = await response.json();

            if (run.error) {

                throw new Error(run.error.message);
            }

            while (run.status != "completed") {

                if (run.status == "failed") {

                    throw new Error("Unable to get response from the agent.");
                }

                response = await fetch(
                    `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                            "OpenAI-Beta": "assistants=v2"
                        }
                    }
                );

                run = await response.json();
            }

            response = await fetch(
                `https://api.openai.com/v1/threads/${threadId}/messages`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${ this.config.openAiApiKey }`,
                        "OpenAI-Beta": "assistants=v2"
                    }
                }
            );

            const messages = await response.json();
            const reply = messages.data[0];
    
            return reply;
        }
        catch (ex) {

            throw new Error(`Couldn't sent message: ${ex.message}`);
        }
    }

    getMessageText(messageData) {

        var text = "";
        for (var i = 0; i < messageData.content.length; i++) {
        
            if (messageData.content[i].text) {

                if (text.length > 0) {

                    text += "\r\n";
                }

                text += messageData.content[i].text.value
            }
        }

        return text;
    }

    async onPlayClicked() {

        try {

            this.ui.buttonPlay.style.display = "none";

            const thread = await this.createThread();
            const creatorAssistant = await this.createAssistant(
                "Creator",
                this.ui.inputCreatorPersona.value,
                [],
                this.ui.comboBaseModel.value,
                this.ui.inputTemperature.value
            );

            const reviewerAssistant = await this.createAssistant(
                "Reviewer",
                this.ui.inputReviewerPersona.value,
                [],
                this.ui.comboBaseModel.value,
                this.ui.inputTemperature.value
            );

            var attempts = this.config.maxIterations;
            var prompt = this.ui.inputCreatorPrompt.value;

            this.outputText(`User: ${ prompt }`);

            while (attempts-- > 0) {

                const creatorMessage = await this.sendMessage(
                    thread.id,
                    prompt
                );

                const creatorReply = await this.getReply(thread.id, creatorAssistant.id);
                const creatorReplyText = this.getMessageText(creatorReply);

                this.outputText(`Creator: ${ creatorReplyText }`);

                const reviewerMessage = await this.sendMessage(
                    thread.id,
                    "# agent's response\r\n"
                    + creatorReplyText + "\r\n\r\n"
                    + "# validation\r\n"
                    + this.ui.inputReviewerPrompt.value
                );

                const reviewerReply = await this.getReply(thread.id, reviewerAssistant.id);
                const reviewerReplyText = this.getMessageText(reviewerReply);

                this.outputText(`Reviewer: ${ reviewerReplyText }`);

                const sentiment = await this.invokeModel(
                    this.config.openAiSentimentModel,
                    `You are an agent who assesses whether a sentence is positive or negative. Sentence which starts with a "Yes", is always positive; the one which starts with a "No" is always negative. You ALWAYS respond with a single word: "positive" or "negative".`,
                    reviewerReplyText
                );

                if (!sentiment.ok) {

                    throw new Error(`Sentiment checking error: ${ sentiment.error }`);
                }

                switch (sentiment.response.toLowerCase()) {

                    case "positive":
                        this.outputHighlight(`Response: ${ creatorReplyText }`);
                        return;

                    case "negative":
                        this.outputError(`Wrong response: ${ creatorReplyText }`);
                        prompt = `${ reviewerReplyText } Try again please.`;
                        break;

                    default:
                        break;
                }
            }
        }
        catch (ex) {

            this.outputError(`Error: ${ ex.message }`);
        }
        finally {

            this.ui.buttonPlay.style.display = "";
        }
    }

    onUpdateFrame() {

        window.requestAnimationFrame(this.onUpdateFrame.bind(this));
    }
}

const app = new App();

export default app;
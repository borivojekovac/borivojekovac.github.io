import DataManager from "./dataManager.js";

class App {

    commandHistory = [];
    ui = {};

    config = {
        debug: true,
        controlPanelVisible: true,        
        openAiApiKey: "",
        openAiBaseModel: "gpt-4o-mini",
        openAiSentimentModel: "gpt-3.5-turbo",
        creatorPersona: "You are a helpful agent which responds to user prompts and tries to make the User happy. You do not talk about yourself. You NEVER ask questions. You ALWAYS provide STRAIGHT responses to user's prompts. You DO NOT comment on feedback, but instead correct your previous response to match the expectations and get a positive feedback.",
        creatorPrompt: "Roses are red, violets are blue... ",
        reviewerPersona: `You are a validator of statements. You receive a set of validation instructions, followed by a statement. If the statement is valid per these instructions, you respond with a simple "Yes". Otherwise, you respond with a "No" and add an explaination on how to adjust the statement in order to pass validation.`,
        reviewerPrompt: "There need to be one or more numbers in the response.",
        sentimentCheckerPersona: `You are an agent who assesses whether a sentence is positive or negative. Sentence which starts with a "Yes", is always positive; otherwise it's negative. You ALWAYS respond with a single word: "positive" or "negative".`,
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
        this.ui.processing = document.querySelector("#processing");
        this.ui.switchDebug = document.querySelector("#switchDebug");
        this.ui.switchControlPanel = document.querySelector("#switchControlPanel");
        this.ui.controlPanel = document.querySelector("#controlPanel");
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
        this.ui.inputSentimentCheckerPersona = document.querySelector("#inputSentimentCheckerPersona");
        this.ui.responseText = document.querySelector("#responseText");

        this.init();
    }

    async init() {

        await this.loadConfig();

        this.ui.switchDebug.checked = this.config.debug;
        this.ui.switchControlPanel.checked = this.config.controlPanelVisible;
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
        this.ui.inputSentimentCheckerPersona.value = this.config.sentimentCheckerPersona;

        this.ui.switchDebug.addEventListener("change", this.onSwitchDebugChanged.bind(this));
        this.ui.switchControlPanel.addEventListener("change", this.onSwitchControlPanelChanged.bind(this));
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
        this.ui.inputSentimentCheckerPersona.addEventListener("change", this.onConfigChanged.bind(this));

        this.ui.buttonPlay.addEventListener("click", this.onPlayClicked.bind(this));

        this.onSwitchDebugChanged();
        this.onSwitchControlPanelChanged();
    }

    async outputText(text, debug) {

        if (debug === undefined) {

            debug = true;
        }

        return await this.output(`<span class="text${ debug ? " debug" : ""}">${text}<span>`);
    }

    async outputError(error, debug) {

        if (debug === undefined) {

            debug = true;
        }

        return await this.output(`<span class="error${ debug ? " debug" : ""}">${error}<span>`);
    }

    async outputHighlight(text, debug) {

        if (debug === undefined) {

            debug = false;
        }

        return await this.output(`<span class="highlight${ debug ? " debug" : ""}">${text}<span>`);
    }

    async output(html) {

        var div = document.createElement("div");
        div.className = "output";
        div.innerHTML = html;

        this.ui.responseText.appendChild(div);
        div.scrollIntoView();

        return html;
    }

    onConfigChanged(event) {

        this.config.controlPanelVisible = this.ui.switchControlPanel.checked;
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
        this.config.sentimentCheckerPersona = this.ui.inputSentimentCheckerPersona.value;

        this.saveConfig();
    }

    onSwitchDebugChanged(event) {

        const debugVisible = this.ui.switchDebug.checked;

        document.documentElement.style.setProperty("--debugDisplay", debugVisible ? "inherit" : "none");
    }

    onSwitchControlPanelChanged(event) {

        this.ui.controlPanel.style.display = this.ui.switchControlPanel.checked
            ? ""
            : "none";

        this.onConfigChanged();
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

    sleep(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));
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

                await this.sleep(1000);
                
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
            this.ui.processing.style.display = "inherit";

            if (!this.config.openAiApiKey) {

                throw new Error("You need to provide a valid Open API key in order to use this app. Check the top of the configuration part of the app.");
            }

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

            this.outputText(`<b>User</b>: ${ prompt }`);

            while (attempts-- > 0) {

                const creatorMessage = await this.sendMessage(
                    thread.id,
                    prompt
                );

                const creatorReply = await this.getReply(thread.id, creatorAssistant.id);
                const creatorReplyText = this.getMessageText(creatorReply);

                this.outputText(`<b>Creator</b>: ${ creatorReplyText }`);

                const reviewerMessage = await this.sendMessage(
                    thread.id,
                    `Validation rules: ${this.ui.inputReviewerPrompt.value}\r\n`
                    + `Statement: ${creatorReplyText}`
                );

                const reviewerReply = await this.getReply(thread.id, reviewerAssistant.id);
                const reviewerReplyText = this.getMessageText(reviewerReply);

                this.outputText(`<b>Reviewer</b>: ${ reviewerReplyText }`);

                const sentiment = await this.invokeModel(
                    this.config.openAiSentimentModel,
                    this.ui.inputSentimentCheckerPersona.value,
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
            this.ui.processing.style.display = "";

        }
    }

    onUpdateFrame() {

        window.requestAnimationFrame(this.onUpdateFrame.bind(this));
    }
}

const app = new App();

export default app;
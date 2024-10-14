import Config from "./config.js";
import OpenAiInterface from "./openAiInterface.js";
import Output from "./output.js";

class App {

    commandHistory = [];
    ui = {};
    config = null;
    openAi = null;
    output = null;

    constructor() {

        this.config = new Config();
        this.openAi = new OpenAiInterface(this.config);
        this.output = new Output();

        this.init();
    }

    async init() {

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

        await this.config.load();

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

    onConfigChanged() {

        this.config.debug = this.ui.switchDebug.checked;
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

        this.config.save();
    }

    onSwitchDebugChanged() {

        document.documentElement.style.setProperty(
            "--debugDisplay",
            this.ui.switchDebug.checked
                ? "block"
                : "none"
        );
    }

    onSwitchControlPanelChanged() {

        this.ui.controlPanel.style.display = this.ui.switchControlPanel.checked
            ? ""
            : "none";

        this.onConfigChanged();
    }

    getText(messageData) {

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

            const thread = await this.openAi.createThread();
            const creatorAssistant = await this.openAi.createAssistant(
                "Creator",
                this.ui.inputCreatorPersona.value,
                [],
                this.ui.comboBaseModel.value,
                this.ui.inputTemperature.value
            );

            const reviewerAssistant = await this.openAi.createAssistant(
                "Reviewer",
                this.ui.inputReviewerPersona.value,
                [],
                this.ui.comboBaseModel.value,
                this.ui.inputTemperature.value
            );

            var attempts = this.config.maxIterations;
            var prompt = this.ui.inputCreatorPrompt.value;

            this.output.highlight(`<b>User</b>: ${ prompt }`);

            var lastReply = null;

            while (attempts-- > 0) {

                const creatorMessage = await this.openAi.sendMessage(
                    thread.id,
                    prompt
                );

                const creatorReply = await this.openAi.getReply(
                    thread.id,
                    creatorAssistant.id
                );

                const creatorReplyText = lastReply = this.getText(creatorReply);
                this.output.text(`<b>Creator</b>: ${ creatorReplyText }`);

                const reviewerMessage = await this.openAi.sendMessage(
                    thread.id,
                    `Validation rules: ${this.ui.inputReviewerPrompt.value}\r\n`
                    + `Statement: ${creatorReplyText}`
                );

                const reviewerReply = await this.openAi.getReply(
                    thread.id,
                    reviewerAssistant.id
                );

                const reviewerReplyText = this.getText(reviewerReply);
                this.output.text(`<b>Reviewer</b>: ${ reviewerReplyText }`);

                const sentiment = await this.openAi.invokeModel(
                    this.config.openAiSentimentModel,
                    this.ui.inputSentimentCheckerPersona.value,
                    reviewerReplyText
                );

                if (!sentiment.ok) {

                    throw new Error(`Sentiment checking error: ${ sentiment.error }`);
                }

                switch (sentiment.response.toLowerCase()) {

                    case "positive":
                        this.output.highlight(`<b>Swarm</b>: ${ creatorReplyText }`);
                        return;

                    case "negative":
                    default:
                        break;
                }
            }

            this.output.error(`<b>Warning</b>: Not quite sure I can answer that reliably! Here's my best attempt.`, false);
            this.output.highlight(`<b>Swarm</b>: ${ lastReply }`);
        }
        catch (ex) {

            this.output.error(`<b>Error</b>: ${ ex.message }`, false);
        }
        finally {

            this.ui.buttonPlay.style.display = "";
            this.ui.processing.style.display = "";

        }
    }
}

new App();
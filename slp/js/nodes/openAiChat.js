import TemplateManager from "../templateManager.js";
import App from "../app.js";
import NodeOpenAi from "./openAi.js";
import ValueError from "../values/error.js";
import ValueText from "../values/text.js";

class NodeOpenAiChat extends NodeOpenAi {

    constructor(name, type) {

        super(name, type ?? "OpenAiChat");

        this.properties.model = null;
        this.properties.maxTokens = null;
        this.properties.temperature = null;
        this.properties.system = null;
        
        this.properties._models = [
            null,
            "gpt-3.5-turbo",
            "gpt-4",
            "gpt-4-turbo",
            "gpt-4-turbo-preview",
            "gpt-4o"
        ];
    }

    async initUi() {

        await super.initUi();
        
        const dom = TemplateManager.getDom(NodeOpenAiChat.template, this.properties);
        this.dom.append(...dom.childNodes);

        this.bindUiElement("system");
    }

    updateUiFrame() {

        super.updateUiFrame();
    }

    async invoke(prompt) {

        const messages = [];
        if (this.properties.system) {

            messages.push({
                "role": "system",
                "content": this.properties.system
            });
        }

        messages.push({
            "role": "user",
            "content": prompt
        });

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ this.properties.key ?? App.defaults.openAiKey }`
                },
                body: JSON.stringify({
                    model: this.properties.model ?? App.defaults.openAiChatModel,
                    temperature: (this.properties.temperature ?? App.defaults["openAiTemperature"])|0,
                    messages: messages,
                    max_tokens: (this.properties.maxTokens ?? App.defaults.maxTokens)|0
                })
            }
        );

        const data = await response.json();

        if (data.error) {

            return this.saveResult( new ValueError(
                data.error.message,
                this
            ));
        }

        return this.saveResult( new ValueText(
            data.choices[0].message.content.trim(),
            this
        ));
    }
}
    
NodeOpenAiChat.template = await TemplateManager.getTemplate("nodeOpenAiChat");

export default NodeOpenAiChat;
import TemplateManager from "../templateManager.js";
import App from "../app.js";
import Node from "./node.js";
import ValueError from "../values/error.js";
import ValueText from "../values/text.js";
import ConnectorSocket from "../connectors/socket.js";

class NodeHfTextSummary extends Node {

    constructor(name, type) {

        super(name, type ?? "hfTextSummary");

        this.sockets.input.push(new ConnectorSocket(this, "input", "text"));
        this.sockets.output.push(new ConnectorSocket(this, "output", "text"));

        this.properties.key = null;
        this.properties.model = null;
        this.properties.minLength = null;
        this.properties.maxLength = null;
        this.properties.temperature = null;
        this.properties.topK = null;
        this.properties.topP = null;
    }

    async initUi() {

        await super.initUi();
        
        const dom = TemplateManager.getDom(NodeHfTextSummary.template, this.properties);
        this.dom.append(...dom.childNodes);

        this.bindUiElement("key");
        this.bindUiElement("model");
        this.bindUiElement("minLength");
        this.bindUiElement("maxLength");
        this.bindUiElement("temperature");
        this.bindUiElement("topK");
        this.bindUiElement("topP");
    }

    updateUiFrame() {

        super.updateUiFrame();
    }

    async invoke(input) {

        var body = {
            inputs: input,
            options: {
                use_cache: false
            },
            parameters: {
                min_length: this.properties.minLength|0,
                max_length: (this.properties.maxLength ?? App.defaults.maxTokens)|0,
                temperature: (this.properties.temperature ?? App.defaults.temperature)*1.0,
                top_k: (this.properties.topK ?? App.defaults.hfTopK)|0,
                top_p: (this.properties.topP ?? App.defaults.hfTopP)*1.0
            },
            stream: false
        };

        var response = await fetch(
            `https://api-inference.huggingface.co/models/${this.properties.model}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ this.properties.key ?? App.defaults.hfKey }`
                },
                body: JSON.stringify(body)
            }
        );

        try {

            var data = await response.json();

            if (response.status == 503) {

                body.options.wait_for_model = true;

                response = await fetch(
                    `https://api-inference.huggingface.co/models/${this.properties.model}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${ this.properties.key ?? App.defaults.hfKey }`
                        },
                        body: JSON.stringify(body)
                    }
                );

                data = await response.json();
            }

            if (data.error) {

                throw data.error;
            }
    
            return this.saveResult( new ValueText(
                data[0].summary_text.trim(),
                this
            ));
        }
        catch (ex) {        
            
            return this.saveResult( new ValueError(
                ex.message ?? ex,
                this
            ));
        }
    }
}
    
NodeHfTextSummary.template = await TemplateManager.getTemplate("nodeHfTextSummary");

export default NodeHfTextSummary;
import TemplateManager from "../templateManager.js";
import App from "../app.js";
import Node from "./node.js";
import ValueError from "../values/error.js";
import ValueText from "../values/text.js";
import ConnectorSocket from "../connectors/socket.js";

class NodeHfTextGeneration extends Node {

    constructor(name, type) {

        super(name, type ?? "hfTextGeneration");

        this.sockets.input.push(new ConnectorSocket(this, "input", "text"));
        this.sockets.output.push(new ConnectorSocket(this, "output", "text"));

        this.properties.key = null;
        this.properties.model = null;
        this.properties.maxTokens = null;
        this.properties.temperature = null;
    }

    async initUi() {

        await super.initUi();
        
        const dom = TemplateManager.getDom(NodeHfTextGeneration.template, this.properties);
        this.dom.append(...dom.childNodes);

        this.bindUiElement("key");
        this.bindUiElement("model");
        this.bindUiElement("maxTokens");
        this.bindUiElement("temperature");
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
                max_new_tokens: (this.properties.maxTokens ?? App.defaults.maxTokens)|0,
                temperature: (this.properties.temperature ?? App.defaults.temperature)*1.0,
                repetition_penalty: 50,
                return_full_text: false
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
                data[0].generated_text.trim(),
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
    
NodeHfTextGeneration.template = await TemplateManager.getTemplate("nodeHfTextGeneration");

export default NodeHfTextGeneration;
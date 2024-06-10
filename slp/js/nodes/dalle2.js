import TemplateManager from "../templateManager.js";
import App from "../app.js";
import NodeDalle from "./dalle.js";
import ValueError from "../values/error.js";
import ValueImage from "../values/image.js";

class NodeDalle2 extends NodeDalle {

    constructor(name, type) {

        super(name, type ?? "Dalle2");

        this.properties._sizes = [null, "256x256", "512x512"];
    }

    async initUi() {

        await super.initUi();
        
        const dom = TemplateManager.getDom(NodeDalle2.template, this.properties);
        this.dom.append(...dom.childNodes);
    }

    updateUiFrame() {

        super.updateUiFrame();
    }

    async invoke(prompt) {

        var body = {
            model: "dall-e-2",
            prompt: prompt,
            n: 1
        };

        if (this.properties.size) {

            body.size = this.properties.size;
        }

        const response = await fetch(
            'https://api.openai.com/v1/images/generations',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ this.properties.key ?? App.defaults.openAiKey }`
                },
                body: JSON.stringify(body)
            }
        );

        const data = await response.json();

        if (data.error) {

            return this.saveResult( new ValueError(
                data.error.message,
                this
            ));
        }
        else {

            return this.saveResult( new ValueImage(
                data.data[0].url.trim(),
                this
            ));
        }
    }
}
    
NodeDalle2.template = await TemplateManager.getTemplate("nodeDalle2");

export default NodeDalle2;
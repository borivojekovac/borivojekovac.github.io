import TemplateManager from "../templateManager.js";
import App from "../app.js";
import NodeDalle from "./dalle.js";
import ValueError from "../values/error.js";
import ValueImage from "../values/image.js";

class NodeDalle3 extends NodeDalle {

    constructor(name, type) {

        super(name, type ?? "Dalle3");

        this.properties.style = null;
        this.properties.quality = null;

        this.properties._sizes = [null, "1024x1024", "1024x1792", "1792x1024"];
        this.properties._styles = [null, "vivid", "natural"];
        this.properties._qualities = [null, "standard", "hd"];
    }

    async initUi() {

        await super.initUi();
        
        const dom = TemplateManager.getDom(NodeDalle3.template, this.properties);
        this.dom.append(...dom.childNodes);

        this.bindUiElement("style");
    }

    updateUiFrame() {

        super.updateUiFrame();
    }

    resultToText(result) {

        if (result.toString().substring(0, "data:image/png;base64,".length) == "data:image/png;base64,") {

            return "[image]";
        }

        if (result.toString().substring(0, "https:".length) == "https:") {

            return "[url]";
        }

        return super.resultToText(result);
    }

    async invoke(prompt) {

        var body = {
            model: "dall-e-3",
            /*response_format: "b64_json",*/
            prompt: prompt,
            n: 1
        };

        if (this.properties.size) {

            body.size = this.properties.size;
        }

        if (this.properties.style) {

            body.style = this.properties.style;
        }

        if (this.properties.quality) {

            body.quality = this.properties.quality;
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
                data.data[0].b64_json
                    ? `data:image/png;base64,${data.data[0].b64_json}`
                    : data.data[0].url,
                this
            ));
        }
    }
}
    
NodeDalle3.template = await TemplateManager.getTemplate("nodeDalle3");

export default NodeDalle3;
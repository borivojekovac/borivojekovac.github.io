import TemplateManager from "../templateManager.js";
import App from "../app.js";
import Node from "./node.js";
import ValueError from "../values/error.js";
import ValueText from "../values/text.js";
import ConnectorSocket from "../connectors/socket.js";

class NodeGoogle extends Node {

    constructor(name, type) {

        super(name, type ?? "Google");

        this.sockets.input.push(new ConnectorSocket(this, "input", "text"));
        this.sockets.output.push(new ConnectorSocket(this, "output", "text"));

        this.properties.key = null;
        this.properties.engine = null;
        this.properties.results = 10;
    }

    async initUi() {

        await super.initUi();
        
        const dom = TemplateManager.getDom(NodeGoogle.template, this.properties);
        this.dom.append(...dom.childNodes);

        this.bindUiElement("key");
        this.bindUiElement("engine");
        this.bindUiElement("results");
    }

    updateUiFrame() {

        super.updateUiFrame();
    }

    async invoke(query) {

        const response = await fetch(

            `https://www.googleapis.com/customsearch/v1?key=${this.properties.key ?? App.defaults.googleKey}&cx=${this.properties.engine || App.defaults.googleEngineId}&q=${query}&num=${Math.max(Math.min(this.properties.results | 0, 10), 1)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
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

            var result = "";

            for (var i = 0; i < data.items.length; i++) {

                result += `${data.items[i].snippet}\r\n`;
            }

            return this.saveResult( new ValueText(
                result,
                this
            ));
        }
    }
}
    
NodeGoogle.template = await TemplateManager.getTemplate("nodeGoogle");

export default NodeGoogle;
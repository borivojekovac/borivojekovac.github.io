import TemplateManager from "../templateManager.js";
import Node from "./node.js";
import ValueText from "../values/text.js";
import ValueEditor from "../values/editor.js";
import ConnectorSocket from "../connectors/socket.js";

class NodeTextFormat extends Node {

    constructor(name, type) {

        super(name, type ?? "TextFormat");

        this.sockets.input.push(new ConnectorSocket(this, "input", "text"));
        this.sockets.output.push(new ConnectorSocket(this, "output", "text"));

        this.properties.pre = "";
        this.properties.post = "";
    }

    async initUi() {

        await super.initUi();
        
        const dom = TemplateManager.getDom(NodeTextFormat.template, this.properties);
        this.dom.append(...dom.childNodes);

        this.bindUiElement("pre");
        this.bindUiElement("post");

        this.dom.querySelector(".nodePreInput")
            .addEventListener("click", this.onEditPre.bind(this));

        this.dom.querySelector(".nodePostInput")
            .addEventListener("click", this.onEditPost.bind(this));
    }

    updateUiFrame() {

        super.updateUiFrame();
    }

    onEditPre(evt) {

        const nameValue = new ValueText(this.properties.pre);
        const valueEditor = new ValueEditor(`edit ${this.properties.type} agent prefix text`, nameValue, this.updatePre.bind(this));
        valueEditor.initUi();

        evt.preventDefault();
        evt.stopPropagation();
    }

    updatePre(pre) {

        this.properties.pre = pre;
        this.getPropertyUi("pre").value = pre;
    }

    onEditPost(evt) {

        const nameValue = new ValueText(this.properties.post);
        const valueEditor = new ValueEditor(`edit ${this.properties.type} agent postfix text`, nameValue, this.updatePost.bind(this));
        valueEditor.initUi();

        evt.preventDefault();
        evt.stopPropagation();
    }

    updatePost(post) {

        this.properties.post = post;
        this.getPropertyUi("post").value = post;
    }

    async invoke(text) {

        return this.saveResult( new ValueText(
            `${this.properties.pre} ${text} ${this.properties.post}`,
            this
        ));
    }
}
    
NodeTextFormat.template = await TemplateManager.getTemplate("nodeTextFormat");

export default NodeTextFormat;
import App from "../app.js";
import DataManager from "../dataManager.js";
import TemplateManager from "../templateManager.js";
import ConnectorManager from "../connectors/manager.js";
import ValueEmpty from "../values/empty.js"
import ValueError from "../values/error.js"
import ValueText from "../values/text.js"
import ValueViewer from "../values/viewer.js";
import ValueEditor from "../values/editor.js";

class Node {

    properties = {

        id: Node.nextId++,
        type: null,
        name: null,
        minimised: false,
        hidden: false
    }

    dom = undefined;
    svg = undefined;
    results = [];
    sockets = {
        input: [],
        output: []
    };

    _highlighted = false;

    constructor(name, type) {

        this.properties.name = name;
        this.properties.type = type;

        Node.lookupId[this.properties.id] = this;
        Node.lookupName[this.properties.name] = this;
    }

    async saveState() {

        for (const propertyName in this.properties) {

            if (propertyName.charAt(0) == '_') {

                continue;
            }

            await DataManager.set(`node.${this.properties.id}.${propertyName}`, this.properties[propertyName]);
        }
    }

    async loadState() {

        const savedType = await DataManager.get(`node.${this.properties.id}.type`);
        if (savedType != this.properties.type) {

            throw new Error(`Stored node ${this.properties.id} is of incompatible type ${savedType}. Needs to be of ${this.properties.type} type in order to be loaded.`);
        }

        for (const propertyName in this.properties) {

            if (propertyName.charAt(0) == '_') {

                continue;
            }

            this.properties[propertyName] = await DataManager.get(`node.${this.properties.id}.${propertyName}`, this.properties[propertyName]);
        }
    }

    resultToText(result) {

        return result.toString();
    }

    lastResult() {

        return this.results.length
            ? this.results[this.results.length - 1]
            : new ValueEmpty();
    }

    saveResult(result) {

        this.results.push(result);
        this.dom.querySelector(".nodeLastResult").innerText = this.resultToText(result);

        return result;
    }

    async invoke(prompt) {

        return new ValueError(
            new Error(`Unable to respond to prompt: "${prompt}". This node type shouldn't be directly invoked. Use derived classes instead.`),
            this
        );
    }
    
    bindUiElement(propertyName) {

        this.getPropertyUi(propertyName).oninput = (function(evt) {

            if (propertyName == "name") {

                this.updateName(evt.target.value);
            }
            else {

                this.properties[propertyName] = evt.target.value == "" ? null : evt.target.value;
            }

        }).bind(this);
    }

    getPropertyUi(propertyName) {

        return this.dom.querySelector(`[data-property="${propertyName}"]`);
    }

    async initUi() {

        const dom = TemplateManager.getDom(Node.template, this.properties);

        this.dom = dom.querySelector(".uiNode");
        this.dom.querySelector(".nodeSizeToggle")
            .addEventListener("click", this.onSizeToggle.bind(this));

        App.dom.append(...dom.childNodes);

        this.dom.style.left = `${App.size.zoom * App.size.padding + (this.properties.id * App.size.zoom * 12.5) % (App.size.width - 20 * App.size.zoom - 2 * App.size.zoom * App.size.padding)}px`;
        this.dom.style.top = `${App.size.zoom * App.size.padding + (this.properties.id * App.size.zoom * 3) % (App.size.height - 8 * App.size.zoom)}px`;

        if (this.properties.minimised) {

            this.dom.classList.add("uiMinimised");
        }

        if (this.properties.hidden) {

            this.hide();
        }
        else {
            
            this.show();
        }

        if (this._highlighted) {

            this.dom.classList.add("uiHighlight");
        }

        this.bindUiElement("name");

        const title = this.dom.querySelector(".nodeTitle");
        title.addEventListener("mousedown", this.onTitlePointerDown.bind(this));
        title.addEventListener("touchstart", this.onTitlePointerDown.bind(this));
        title.addEventListener("mouseup", this.onTitlePointerUp.bind(this));
        title.addEventListener("touchend", this.onTitlePointerUp.bind(this));

        this.dom.querySelector(".nodeResultLabel")
            .addEventListener("click", this.onViewResult.bind(this));

        this.dom.querySelector(".nodeNameInput")
            .addEventListener("click", this.onEditName.bind(this));
    }

    removeUi() {

        this.dom.remove();
    }

    remove() {

        ConnectorManager.removeFromNode(this.properties.id);
        for (const connectorSocket of this.sockets.input) {

            connectorSocket.removeUi();
        }
        this.sockets.input.length = 0;
        for (const connectorSocket of this.sockets.output) {

            connectorSocket.removeUi();
        }
        this.sockets.output.length = 0;
        this.removeUi();
        delete Node.lookupName[this.properties.name];
        delete Node.lookupId[this.properties.id];
    }

    toggle() {

        this.properties.minimised = !this.properties.minimised;

        if (this.dom) {

            this.dom.querySelector(".nodeTitleName").innerText = this.properties.name;

            if (this.dom.classList.contains("uiMinimised") && !this.properties.minimised) {
    
                this.dom.classList.remove("uiMinimised");
            }
            else if (!this.dom.classList.contains("uiMinimised") && this.properties.minimised) {
                
                this.dom.classList.add("uiMinimised");
            }
        }
        
        return !this.properties.minimised;
    }

    hide() {

        this.properties.hidden = true;

        if (this.dom) {

            if (!this.dom.classList.contains("uiHidden")) {
    
                this.dom.classList.add("uiHidden");
            }

            for (const connectorSocket of this.sockets.input) {

                connectorSocket.hide();
            }
    
            for (const connectorSocket of this.sockets.output) {
    
                connectorSocket.hide();
            }
    
            ConnectorManager.hideForNode(this.properties.id);
        }
    }

    show() {

        this.properties.hidden = false;

        if (this.dom) {

            if (this.dom.classList.contains("uiHidden")) {
    
                this.dom.classList.remove("uiHidden");
            }
    
            for (const connectorSocket of this.sockets.input) {
    
                connectorSocket.show();
            }
    
            for (const connectorSocket of this.sockets.output) {
    
                connectorSocket.show();
            }
    
            ConnectorManager.showForNode(this.properties.id);
        }
    }

    onViewResult(evt) {

        const valueViewer = new ValueViewer(this.results);
        valueViewer.initUi();

        if (evt) {

            evt.preventDefault();
            evt.stopPropagation();
        }
    }

    onEditName(evt) {

        const nameValue = new ValueText(this.properties.name);
        const valueEditor = new ValueEditor(`edit ${this.properties.type} agent name`, nameValue, this.updateName.bind(this));
        valueEditor.initUi();

        evt.preventDefault();
        evt.stopPropagation();
    }

    updateName(name) {

        delete Node.lookupName[this.properties.name];
        this.properties.name = name;
        Node.lookupName[this.properties.name] = this;
        this.dom.querySelector(`[data-property="name"]`).value = name;
    }

    onSizeToggle(evt) {

        this.toggle();
    }

    bringToTop() {

        for (const node of window.document.querySelectorAll(".uiNode")) {

            if ((node.style.zIndex | 0) >= 1500) {

                node.style.zIndex = (node.style.zIndex | 0) - 1500;
            }
        }

        if ((this.dom.style.zIndex | 0) < 1500) {

            this.dom.style.zIndex = (this.dom.style.zIndex | 0) + 1500;
        }
    }

    getLinkedNodesInfo(node, nodesInfo, downstream, upstream) {

        const connectors = ConnectorManager.findForNode(node);
        for (const connector of connectors) {

            var linkedNode = null;
            if (downstream && connector.from.node == node) {
                
                linkedNode = connector.to.node;
                nodesInfo.push({
                    node: linkedNode,
                    startUiPosition: {
                        x: linkedNode.dom.getBoundingClientRect().left,
                        y: linkedNode.dom.getBoundingClientRect().top
                    }
                });
                this.getLinkedNodesInfo(linkedNode, nodesInfo, downstream, false);
            }

            if (upstream && connector.to.node == node) {
                
                linkedNode = connector.from.node;
                nodesInfo.push({
                    node: linkedNode,
                    startUiPosition: {
                        x: linkedNode.dom.getBoundingClientRect().left,
                        y: linkedNode.dom.getBoundingClientRect().top
                    }
                });
                this.getLinkedNodesInfo(linkedNode, nodesInfo, false, upstream);
            }
        }
    }

    onTitlePointerDown(evt) {

        App.pointer.x = evt.touches ? evt.touches[0].clientX : evt.clientX;
        App.pointer.y = evt.touches ? evt.touches[0].clientY : evt.clientY;

        const nodesInfo = [];
        nodesInfo.push({
            node: this,
            startUiPosition: {
                x: this.dom.getBoundingClientRect().left,
                y: this.dom.getBoundingClientRect().top
            }
        });

        this.getLinkedNodesInfo(this, nodesInfo, evt.ctrlKey, evt.shiftKey);

        this.dragging = {

            startPointerPosition: {
                x: App.pointer.x,
                y: App.pointer.y
            },
            nodesInfo: nodesInfo
        };

        this.bringToTop();

        evt.stopPropagation();
        evt.preventDefault();
    }

    onTitlePointerUp(evt) {

        delete this.dragging;
    }

    highlight(highlight) {

        this._highlighted = highlight;

        if (this.dom) {

            if (highlight && !this.dom.classList.contains("uiHighlight")) {

                this.dom.classList.add("uiHighlight");
            }
            else if (!highlight && this.dom.classList.contains("uiHighlight")) {
    
                this.dom.classList.remove("uiHighlight");
            }
        }
    }

    updateUiFrame() {

        if (this.dragging) {

            for (const nodeInfo of this.dragging.nodesInfo) {

                nodeInfo.node.dom.style.left = `${nodeInfo.startUiPosition.x + App.pointer.x - this.dragging.startPointerPosition.x}px`;
                nodeInfo.node.dom.style.top = `${nodeInfo.startUiPosition.y + App.pointer.y - this.dragging.startPointerPosition.y}px`;

                for (const socketConnector of nodeInfo.node.sockets.input) {

                    socketConnector.updateUiFrame();
                }
        
                for (const socketConnector of nodeInfo.node.sockets.output) {
        
                    socketConnector.updateUiFrame();
                }
            }
        }
        else {

            for (const socketConnector of this.sockets.input) {

                socketConnector.updateUiFrame();
            }
    
            for (const socketConnector of this.sockets.output) {
    
                socketConnector.updateUiFrame();
            }
        }
    }
}

Node.nextId = 0;
Node.lookupId = {};
Node.lookupName = {};
Node.template = await TemplateManager.getTemplate("node");

Node.updateUiFrame = function() {

    for (var id in Node.lookupId) {

        const node = Node.lookupId[id];

        if (node.dom === undefined) {

            node.dom = false;
            node.initUi();
        }
        else if (node.dom) {

            if (!document.body.contains(node.dom)) {

                delete node.dom;
            }
            else {

                node.updateUiFrame();
            }
        }
    }
}

export default Node;
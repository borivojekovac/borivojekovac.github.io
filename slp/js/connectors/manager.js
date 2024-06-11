import App from "../app.js";
import Connector from "./connector.js";
import Node from "../nodes/node.js"

class ConnectorManager {
    
    connectors = [];
    dragging = {
        svg: null,
        type: null,
        from: null,
        to: null
    }

    lastResult = null;

    constructor() {

        document.addEventListener("mouseup", this.onPointerUp.bind(this));
        document.addEventListener("touchend", this.onPointerUp.bind(this));
    }

    findForNode(node) {

        var connectors = [];
        for (var i = 0; i < this.connectors.length; i++) {

            if (this.connectors[i].from.node == node
                || this.connectors[i].to.node == node
            ) {

                connectors.push(this.connectors[i]);
            }
        }

        return connectors;
    }

    add(from, to, type) {

        const connector = new Connector(from, to, type);
        this.connectors.push(connector);

        App.svg.appendChild(connector.svg);

        return connector;
    }

    remove(from, to, type) {

        for (var i = 0; i < this.connectors.length; i++) {

            const connector = this.connectors[i];

            if (connector.from.node.properties.id == from.properties.id
                && connector.to.node.properties.id == to.properties.id
                && ((type && connector.type == type) || !type)
            ) {

                return this.removeById(connector.id);
            }
        }

        return null;
    }

    async addFromState(id) {

        const connector = await Connector.fromState(id);
        this.connectors.push(connector);

        App.svg.appendChild(connector.svg);

        return connector;
    }

    removeFromNode(id) {

        for (var i = 0; i < this.connectors.length; i++) {

            const connector = this.connectors[i];

            if (connector.from.node.properties.id == id
            || connector.to.node.properties.id == id) {

                this.removeById(connector.id);
                i--;
                continue;
            }
        }
    }

    hideForNode(id) {

        for (var i = 0; i < this.connectors.length; i++) {

            const connector = this.connectors[i];

            if (connector.from.node.properties.id == id
            || connector.to.node.properties.id == id) {

                connector.hide(connector.id);
                continue;
            }
        }
    }

    showForNode(id) {
        
        for (var i = 0; i < this.connectors.length; i++) {

            const connector = this.connectors[i];

            if (connector.from.node.properties.id == id
            || connector.to.node.properties.id == id) {

                if (connector.from.node.properties.hidden || connector.to.node.properties.hidden) {

                    connector.hide(connector.id);
                }
                else {

                    connector.show(connector.id);
                }
                continue;
            }
        }
    }

    removeById(id) {

        for (var i = 0; i < this.connectors.length; i++) {

            const connector = this.connectors[i];
            if (connector.id == id) {

                connector.remove();
                this.connectors.splice(i, 1);

                return connector;
            }
        }

        return null;
    }

    onResult(result) {

        if (result.source && result.source instanceof Node) {

            const node = result.source;
            for (const connector of this.connectors) {

                if (connector.from.node == node && connector.from.socket.type == result.value.type) {

                    switch (result.value.type) {

                        case "error":
                        case "text":
                        case "image":

                            result = result.toString().trim();
                            if (result[0] == "\"" && result[result.length - 1] == "\"") {
                                
                                result = result.substring(1, result.length - 2);
                            }

                            result = result.replaceAll("\"", "\\\"");

                            App.processCommand(`text ${connector.to.node.properties.id}, "${result}"`);
                            return true;
                    }
                }
            }

            this.lastResult = result;
        }

        return false;
    }

    onSocketPointerDown(socket) {

        for (const connector of this.connectors) {

            if (connector.from.socket == socket) { 

                this.dragging.from = null;
                this.dragging.to = connector.to;
                this.dragging.type = connector.to.socket.type;

                this.removeById(connector.id);
                return;
            }

            if (connector.to.socket == socket) {

                this.dragging.from = connector.from;
                this.dragging.to = null;
                this.dragging.type = connector.from.socket.type;

                this.removeById(connector.id);
                return;
            }
        }

        for (const id in Node.lookupId) {

            const node = Node.lookupId[id];

            for (const inputSocket of node.sockets.input) {

                if (inputSocket == socket) {

                    this.dragging.from = null;
                    this.dragging.to = { node: node, socket: socket};
                    this.dragging.type = socket.type;
                    return;
                }
            }

            for (const outputSocket of node.sockets.output) {

                if (outputSocket == socket) {

                    this.dragging.from = { node: node, socket: socket};
                    this.dragging.to = null;
                    this.dragging.type = socket.type;
                    return;
                }
            }
        }
    }

    onPointerUp() {

        if (!this.dragging.type) {

            return; 
        }

        const from = this.dragging.from;
        const to = this.dragging.to;
        const type = this.dragging.type;

        this.dragging.svg.remove();
        this.dragging.svg = null;
        this.dragging.type = null;
        this.dragging.from = null;
        this.dragging.to = null;

        for (const id in Node.lookupId) {

            const node = Node.lookupId[id];

            for (const socket of from ? node.sockets.input : node.sockets.output) {

                if (socket.svg) {

                    const clientRect =socket.svg.getClientRects()[0];
                    if (clientRect) {
    
                        if (App.pointer.x >= clientRect.x && App.pointer.x <= clientRect.x + clientRect.width
                            && App.pointer.y >= clientRect.y && App.pointer.y <= clientRect.y + clientRect.height) {

                            this.add(from ? from.node : node, to ? to.node : node, type);
                            return;
                        }
                    }
                }
            }
        }
    }

    initDraggingUi() {

        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");

        line.setAttribute("id", "draggingConnector");
        line.classList.add("uiConnector");
        line.classList.add("uiDashed");
        switch (this.dragging.type) {
            case "error": line.classList.add("uiConnectorError"); break;
            case "text": line.classList.add("uiConnectorText"); break;
            case "image": line.classList.add("uiConnectorImage"); break;
        }
        line.setAttribute("x1", "-1");
        line.setAttribute("y1", "-1");
        line.setAttribute("x2", "-1");
        line.setAttribute("y2", "-1");

        this.dragging.svg = line;
        App.svg.appendChild(this.dragging.svg);
    }

    updateUiFrame() {

        for (const connector of this.connectors) {

            connector.updateUiFrame();
        }

        if (this.dragging.type) {

            if (!this.dragging.svg) {

                this.initDraggingUi();
            }

            if (this.dragging.from && this.dragging.from.socket && this.dragging.from.socket.svg) {

                const fromClientRect = this.dragging.from.socket.svg.getClientRects()[0];
                if (fromClientRect) {
    
                    this.dragging.svg.setAttribute("x1", fromClientRect.x + fromClientRect.width / 2);
                    this.dragging.svg.setAttribute("y1", fromClientRect.y + fromClientRect.height / 2);
                    this.dragging.svg.setAttribute("x2", App.pointer.x);
                    this.dragging.svg.setAttribute("y2", App.pointer.y);
                }
            }
            else if (this.dragging.to && this.dragging.to.socket && this.dragging.to.socket.svg) {

                const toClientRect = this.dragging.to.socket.svg.getClientRects()[0];
                if (toClientRect) {
    
                    this.dragging.svg.setAttribute("x1", App.pointer.x);
                    this.dragging.svg.setAttribute("y1", App.pointer.y);
                    this.dragging.svg.setAttribute("x2", toClientRect.x + toClientRect.width / 2);
                    this.dragging.svg.setAttribute("y2", toClientRect.y + toClientRect.height / 2);
                }
            }
        }
    }
}

const connectorManager = new ConnectorManager();

export default connectorManager;
import Node from "../nodes/node.js";
import DataManager from "../dataManager.js";

class Connector {

    id = Connector.nextId++;
    
    from = {
        node: null,
        socket: null
    };

    to = {
        node: null,
        socket: null
    };

    svg = null;

    constructor(from, to, type) {

        Connector.lookupId[this.id] = this;

        this.from.node = from;
        this.to.node = to;

        for (const outputSocket of from.sockets.output) {

            for (const inputSocket of to.sockets.input) {

                if ((type !== undefined && (outputSocket.type == type && inputSocket.type == type))
                    || (outputSocket.type == inputSocket.type)) {

                    this.from.socket = outputSocket;
                    this.to.socket = inputSocket;
                    break;
                }
            }

            if (this.from.socket) {

                break;
            }
        }

        this.initUi();
    }

    async saveState() {

        await DataManager.set(`connector.${this.id}.type`, this.from.socket.type);
        await DataManager.set(`connector.${this.id}.from`, this.from.node.properties.id);
        await DataManager.set(`connector.${this.id}.to`, this.to.node.properties.id);
    }

    initUi() {

        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");

        line.setAttribute("id", this.id);
        line.classList.add("uiConnector");
        switch (this.from.socket.type) {
            case "error": line.classList.add("uiConnectorError"); break;
            case "text": line.classList.add("uiConnectorText"); break;
            case "image": line.classList.add("uiConnectorImage"); break;
        }
        line.setAttribute("x1", "-1");
        line.setAttribute("y1", "-1");
        line.setAttribute("x2", "-1");
        line.setAttribute("y2", "-1");

        this.svg = line;

        if (this.from.node.properties.hidden || this.to.node.properties.hidden) {

            this.hide();
        }
        else {

            this.show();
        }
    }

    remove() {

        if (this.svg) {

            this.svg.remove();
            this.svg = null;
        }

        delete Connector.lookupId[this.id];
    }

    hide() {

        if (this.svg) {

            if (!this.svg.classList.contains("uiHidden")) {

                this.svg.classList.add("uiHidden");
            }
        }
    }

    show() {

        if (this.svg) {

            if (this.svg.classList.contains("uiHidden")) {

                this.svg.classList.remove("uiHidden");
            }
        }
    }

    updateUiFrame() {

        if (this.from && this.from.socket && this.from.socket.svg) {

            const fromClientRect = this.from.socket.svg.getClientRects()[0];
            if (fromClientRect) {

                this.svg.setAttribute("x1", fromClientRect.x + fromClientRect.width / 2);
                this.svg.setAttribute("y1", fromClientRect.y + fromClientRect.height / 2);
            }
        }
    
        if (this.to && this.to.socket && this.to.socket.svg) {

            const toClientRect = this.to.socket.svg.getClientRects()[0];
            if (toClientRect) {

                this.svg.setAttribute("x2", toClientRect.x + toClientRect.width / 2);
                this.svg.setAttribute("y2", toClientRect.y + toClientRect.height / 2);
            }
        }
    }
}

Connector.nextId = 0;
Connector.lookupId = {};

Connector.fromState = async function(id) {

    const fromId = await DataManager.get(`connector.${id}.from`);
    const from = Node.lookupId[fromId];
    const toId = await DataManager.get(`connector.${id}.to`);
    const to = Node.lookupId[toId];
    const type = await DataManager.get(`connector.${id}.type`);

    return new Connector(from, to, type);
}

export default Connector;
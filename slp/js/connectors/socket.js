import ConnectorManager from "./manager.js";
import App from "../app.js";

class ConnectorSocket {

    node = null;
    direction = null;
    position = null;
    type = null;
    svg = null;

    constructor(node, direction, type, position) {
    
        this.node = node;
        this.direction = direction;
        this.type = type;
        this.position = position;
    }

    async initUi() {

        if (!this.svg) {

            this.svg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        }

        var circle = this.svg;

        circle.classList.add("uiSocket");
        switch (this.type) {

            case "error": circle.classList.add("uiConnectorError"); break;
            case "text": circle.classList.add("uiConnectorText"); break;
            case "image": circle.classList.add("uiConnectorImage"); break;
        }

        circle.setAttribute("cx", "-1");
        circle.setAttribute("cy", "-1");
        circle.setAttribute("r", "0");
        circle.setAttribute("fill", "var(--appColorSecondary)");

        circle.addEventListener("mousedown", this.onPointerDown.bind(this));
        circle.addEventListener("touchstart", this.onPointerDown.bind(this));

        App.svg.insertBefore(this.svg, App.svg.firstChild);
    }

    onPointerDown(evt) {

        ConnectorManager.onSocketPointerDown(this);

        evt.preventDefault();
        evt.stopPropagation();
    }

    removeUi() {

        if (this.svg) {

            this.svg.remove();
            this.svg = null;
        }
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

        if (!this.svg || !document.body.contains(this.svg)) {

            this.initUi();
            return;
        }
        
        const isHidden = this.node.dom.classList.contains("uiHidden");
        if (!isHidden) {

            const isMinimised = this.node.dom.classList.contains("uiMinimised");

            const agentClientRect = this.node.dom.querySelector(".nodeTitle").getClientRects()[0];
            const center_r = agentClientRect.height / 2;
            const actual_r = App.size.zoom / 2;

            const positionClientRect = !isMinimised && this.position
                ? this.node.dom.querySelector(`[data-property="${this.position}"]`).getClientRects()[0]
                : null;

            this.svg.setAttribute("cx", this.direction == "input"
                ? agentClientRect.x + (isMinimised ? 1 : -1) * actual_r
                : agentClientRect.x + agentClientRect.width + (isMinimised ? -1 : 1) * actual_r
            );
            this.svg.setAttribute("cy", positionClientRect
                ? positionClientRect.top + positionClientRect.height / 2
                : agentClientRect.y + center_r
            );

            this.svg.setAttribute("r", actual_r);
        }        
    }
}

export default ConnectorSocket;
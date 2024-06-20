import TemplateManager from "./templateManager.js";
import Console from "./console.js";
import App from "./app.js";

class Toolbar {

    model = {
        id: "toolbar"
    }

    tools = [];

    dom = null;

    constructor() {

        document.addEventListener("keydown", this.onKeyDown.bind(this));
    }
    
    add(displayText, commandLine) {

        this.tools.push({
            displayText: displayText,
            commandLine: commandLine
        });
    }

    async initUi() {

        const dom = TemplateManager.getDom(Toolbar.template, this.model);

        this.dom = dom.querySelector(".toolbar");
        this.dom.toolsContainer = dom.querySelector(".toolbar .toolsContainer");
        App.dom.append(...dom.childNodes);

        this.dom.handle = document.querySelector(`#${this.model.id} .handle`);
        this.dom.handle.addEventListener(
            "click",
            this.onHandleClick.bind(this)
        );

        for (const tool of this.tools) {

            const toolElement = document.createElement("div");
            toolElement.innerText = tool.displayText;
            toolElement.dataset.commandLine = tool.commandLine;
            toolElement.addEventListener("click", this.onToolClick.bind(this));

            this.dom.toolsContainer.append(toolElement);
        }

        Console.write(null, "Toolbar initialised.");
    }

    onHandleClick() {

        if (this.dom.classList.contains("expanded")) {

            this.dom.classList.remove("expanded");
        }
        else {

            this.dom.classList.add("expanded");
        }
    }

    onKeyDown(evt) {
        
        if (!this.dom) {

            return;
        }

        if (evt.code.toLowerCase() === "backquote") {

            this.onHandleClick();
        }
    }


    onToolClick(evt) {

        const tool = evt.target;
        const commandLine = tool.dataset.commandLine;
        App.processCommand(commandLine);
    }

    updateUiFrame() {

        if (!this.dom) {

            this.initUi();
        }
    }
}

Toolbar.template = await TemplateManager.getTemplate("toolbar");

export default Toolbar;
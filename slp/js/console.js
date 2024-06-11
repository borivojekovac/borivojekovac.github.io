import TemplateManager from "./templateManager.js";
import App from "./app.js";

class Console {

    model = {
        id: "console"
    }

    dom = {};
    lookingAtHistoricalCommand = null;

    constructor() {

        const template = TemplateManager.getTemplateFromString(Console.templateString);
        const dom = TemplateManager.getDom(template,this.model);

        this.dom.appContainer = document.querySelector("#appContainer");
        this.dom.appContainer.append(...dom.childNodes);

        this.dom.content = document.querySelector(`#${this.model.id}-content`);
        this.dom.input = document.querySelector(`#${this.model.id}-input`);
        this.dom.inputTextBox = document.querySelector(`#${this.model.id}-inputTextBox`);

        this.dom.inputTextBox.addEventListener(
            "keyup",
            this.onInputTextBoxKeyDown.bind(this)
        );

        this.write(null, "Console initialised.");
    }

    async onInputTextBoxKeyDown(event) {

        try {

            switch (event.code.toLowerCase()) {

                case "enter":
                case "numpadenter":
                    await this.processCommandLine();
                    return;

                case "arrowup":
                    this.recallHistoricalCommand(-1);
                    break;

                case "arrowdown":
                    this.recallHistoricalCommand(1);
                    break;
            }            

            switch (event.keyCode) {

                case 13:
                case 10:
                    await this.processCommandLine();
                    return;
            }
        }
        catch (ex) {

            this.write(`An error ocurred: ${ex.message}`);
        }
    }

    async writeVerbose(text, highlightedPrefix) {

        const textBlock = await this.write(text, highlightedPrefix);
        textBlock.classList.add("uiVerbose");
    }

    async write(text, highlightedPrefix) {

        const textBlock = document.createElement("div");
        if (highlightedPrefix) {

            const prefix = document.createElement("span");
            prefix.className = "uiHighlighted";
            prefix.innerText = highlightedPrefix;
            textBlock.appendChild(prefix);
        }
        textBlock.className = "console-outputText";

        if (text) {

            const content = document.createElement("span");
            content.innerText = text;
            textBlock.appendChild(content);
        }

        this.dom.content.appendChild(textBlock);
        this.dom.content.scrollTop = this.dom.content.scrollHeight;

        return textBlock;
    }

    recallHistoricalCommand(offset) {

        if (this.lookingAtHistoricalCommand === null) {

            this.lookingAtHistoricalCommand =
                App.commandHistory.length - 1;
        }
        else {

            this.lookingAtHistoricalCommand =
                (this.lookingAtHistoricalCommand + App.commandHistory.length + offset)
                %
                App.commandHistory.length;
        }

        this.dom.inputTextBox.value = App.commandHistory[this.lookingAtHistoricalCommand].command;
    }

    async getUserInput() {

        const userInputContainer = document.createElement("span");
        this.dom.content.appendChild(userInputContainer);

        const inputBox = document.createElement("input");
        inputBox.enterKeyHint = "Enter";
        inputBox.className = "uiUserInput";
        inputBox.placeholder = "Please enter your input here...";

        this.dom.content.appendChild(inputBox);
        inputBox.focus();
        this.dom.content.scrollTop = this.dom.content.scrollHeight;      

        const promise = new Promise(function(resolve) {

            const onKeyUp = function(event) {

                if (event.key == "Enter" || event.keyCode == 13) {

                    inputBox.removeEventListener("keyup", onKeyUp);
                    resolve(inputBox.value);
                }
            }

            inputBox.addEventListener("keyup", onKeyUp);
        });


        userInputContainer.innerText = await promise;

        inputBox.remove();

        return userInputContainer.innerText;
    }

    async processCommandLine() {

        const commandLine = this.dom.inputTextBox.value;
        this.dom.inputTextBox.value = "";

        App.processCommand(commandLine, true);

        this.lookingAtHistoricalCommand = null;
    }
}

Console.templateString = `
    <div id="{{id}}-content" class="console-content uiElement uiBackground uiMonospace"></div>
    <div id="{{id}}-input" class="console-input uiElement uiBackground uiGlow">
        <input id="{{id}}-inputTextBox" class="uiMonospace" type="text" placeholder="Type your command here." enterkeyhint="enter">
    </div>
`;

const console = new Console();

export default console;
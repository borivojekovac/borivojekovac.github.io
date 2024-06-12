import Command from "./command.js";
import CommandFactory from "./factory.js";
import Console from "../console.js";
import TemplateManager from "../templateManager.js";
import App from "../app.js";
import ValueEmpty from "../values/empty.js";
import ValueError from "../values/error.js";

class CommandRun extends Command {

    dom = null;

    properties = {        
    };

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);

        this.properties.title = "Untitled application";

        if (App.properties.title) {

            this.properties.title = App.properties.title;
        }

        this.properties.prompt = "Type in your prompt here:";

        if (App.properties.prompt) {

            this.properties.prompt = App.properties.prompt;
        }

        this.properties.action = "Run";
        
        if (App.properties.action) {

            this.properties.action = App.properties.action;
        }
        
        if (parameters.length > 0) {

            this.properties.input = parameters[0];            
        }
    }

    async initUi() {

        if (this.dom) {

            this.dom.remove();
        }

        const dom = TemplateManager.getDom(CommandRun.template, this.properties);
        this.dom = dom.querySelector(".uiAppFrontEnd");

        App.dom.append(this.dom);

        this.buttonClose = this.dom.querySelector(".uiAppClose.uiButton");
        this.buttonClose.addEventListener("click", this.onCloseButtonClick.bind(this));

        this.buttonAction = this.dom.querySelector(".uiAppInput button");
        this.buttonAction.addEventListener("click", this.onActionButtonClick.bind(this));

        this.input = this.dom.querySelector(".uiAppInput input");
        this.input.addEventListener(
            "keyup",
            this.onInputTextBoxKeyDown.bind(this)
        );
        this.input.focus();

        if (this.properties.input) {

            this.input.value = this.properties.input;
            this.onActionButtonClick();
        }
    }

    async onInputTextBoxKeyDown(event) {

        try {

            switch (event.code.toLowerCase()) {

                case "enter":
                case "numpadenter":
                    await this.onActionButtonClick();
                    return;
            }            

            switch (event.keyCode) {

                case 13:
                case 10:
                    await this.onActionButtonClick();
                    return;
            }
        }
        catch (ex) {

            this.write(`An error ocurred: ${ex.message}`);
        }
    }

    async onCloseButtonClick() {

        if (!this.dom) {

            return;
        }

        this.dom.remove();
        this.dom = null;

        if (CommandRun.executeComplete) {

            CommandRun.executeComplete(new ValueError("Aborted."));
            CommandRun.executeComplete = null;
        }
    }

    async onActionButtonClick() {

        if (!this.dom) {

            return;
        }

        this.input.blur();
        const input = this.input.value;
        const commandLine = `text input,"${input}"`;
        const command = await CommandFactory.get(commandLine);

        if (!this.dom.classList.contains("uiRunning")) {

            this.dom.classList.add("uiRunning")
        }

        const result = await command.execute();

        if (CommandRun.executeComplete) {

            CommandRun.executeComplete(result);
            CommandRun.executeComplete = null;
        }
    }

    async onOutput(output) {

    }

    async execute() {

        await this.initUi();

        const promise = new Promise(

            (function (resolve) {

                if (CommandRun.executeComplete) {

                    CommandRun.executeComplete(new ValueError("Aborting old run."));
                }

                CommandRun.executeComplete = resolve;

            }).bind(this)
        );

        const result = await promise;

        if (result instanceof ValueError) {

            if (!this.dom) {

                return;
            }
    
            this.dom.remove();
            this.dom = null;
        }

        return result;
    }
}

CommandRun.template = await TemplateManager.getTemplate("app");
CommandRun.executeComplete = null;
CommandRun.onOutput = function(output) {

    const dom = App.dom.querySelector(".uiAppFrontEnd");
    if (!dom) {

        return false;
    }

    const outputContainer = dom.querySelector(".uiAppOutput");
    outputContainer.append(output.viewDom());

    return true;
}

export default CommandRun;
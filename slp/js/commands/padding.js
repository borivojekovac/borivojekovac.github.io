import App from "../app.js";
import Command from "./command.js";
import DataManager from "../dataManager.js";
import ValueEmpty from "../values/empty.js";

class CommandPadding extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }
    
    async help(category) {

        return `
Changes padding for the app UI.

syntax:

   padding <padding>
   
parameters:

   padding: A value larger than 0 and smaller than 10 to be used for UI
            padding. Useful for customizing the app for your device.
            Initially set to 1.`;
    }

    async execute() {

        const padding = this.parameters[0];
        if (padding > 0 & padding < 10) {

            await DataManager.set(`app.padding`, padding);
            document.documentElement.style.setProperty("--appPaddingRatio", `${padding}`);

            App.updateSizes();
        }

        return new ValueEmpty();
    }
}

export default CommandPadding;
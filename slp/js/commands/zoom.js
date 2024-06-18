import App from "../app.js";
import Command from "./command.js";
import DataManager from "../dataManager.js";
import ValueEmpty from "../values/empty.js";

class CommandZoom extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async help(category) {

        return `
Changes size of the app UI.

syntax:

   zoom <zoom>
   
parameters:

   zoom: A value larger than 0 and smaller than 10 to be used for UI padding.
         Useful for customizing the app for your device. Initially set to 3.`;
    }

    async execute() {

        const zoom = this.parameters[0];
        if (zoom > 0 & zoom < 10) {

            await DataManager.set(`app.zoom`, zoom);
            document.documentElement.style.setProperty("--appZoom", `${zoom}vmin`);

            App.updateSizes();
        }

        return new ValueEmpty();
    }
}

export default CommandZoom;
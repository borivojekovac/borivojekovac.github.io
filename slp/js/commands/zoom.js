import App from "../app.js";
import Command from "./command.js";
import DataManager from "../dataManager.js";
import ValueEmpty from "../values/empty.js";

class CommandZoom extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
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
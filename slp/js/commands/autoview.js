import App from "../app.js";
import Command from "./command.js";
import ValueText from "../values/text.js";

class CommandAutoView extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async help(category) {

        return `
Turns auto-view on or off. When on, the last result of a command is
automatically opened for viewing. If parameter is not specified,
auto-view is toggled.

syntax:

   autoview [on|off]`;
    }

    async execute() {

        var autoView = this.parameters.length ? this.parameters[0] : "";
        switch (autoView.toLowerCase()) {

            case "0":
            case "false":
            case "no":
                autoView = false;
                break;

            case "1":
            case "true":
            case "yes":
                autoView = true;
                break;

            default:
                autoView = !App.autoView;
                break;
        }

        App.autoViewUpdated(autoView);

        return new ValueText(autoView);
    }
}

export default CommandAutoView;
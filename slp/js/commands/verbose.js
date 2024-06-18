import App from "../app.js";
import Command from "./command.js";
import DataManager from "../dataManager.js";
import ValueText from "../values/text.js";

class CommandVerbose extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async help(category) {

        return `
Turns verbose console view on or off. When on, console displays more
information compared to when it's off. If parameter is not specified
varbose is toggled.

syntax:

   verbose [on|off]`;
    }

    async execute() {

        var verbose = this.parameters.length ? this.parameters[0] : "";
        switch (verbose.toLowerCase()) {

            case "0":
            case "false":
            case "no":
                verbose = false;
                break;

            case "1":
            case "true":
            case "yes":
                verbose = true;
                break;

            default:
                verbose = !App.verbose;
                break;
        }

        App.verboseUpdated(verbose);

        return new ValueText(verbose);
    }
}

export default CommandVerbose;
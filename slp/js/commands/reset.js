import Command from "./command.js";
import App from "../app.js";
import Console from "../console.js";
import ValueEmpty from "../values/empty.js";

class CommandReset extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async execute() {

        App.resetState();
        
        return new ValueEmpty();
    }
}

export default CommandReset;
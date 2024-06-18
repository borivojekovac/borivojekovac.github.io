import Command from "./command.js";
import App from "../app.js";
import Console from "../console.js";
import ValueEmpty from "../values/empty.js";

class CommandReset extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async help(category) {

        return `
Resets the application state, removing all the agents and connections.

syntax:

   reset
`;
    }

    async execute() {

        App.resetState();
        
        return new ValueEmpty();
    }
}

export default CommandReset;
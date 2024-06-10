import Command from "./command.js";
import Console from "../console.js";
import ValueEmpty from "../values/empty.js";

class CommandClear extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async execute() {

        Console.dom.content.innerHTML = "";
        
        return new ValueEmpty();
    }
}

export default CommandClear;
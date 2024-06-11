import Command from "./command.js";
import CommandFactory from "./factory.js";
import Console from "../console.js";

class CommandClear extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async execute() {

        var input = this.parameters.length ? this.parameters[0] : "";
        if (input == "") {

            input = await Console.getUserInput();
        }
    
        const commandLine = `text input,"${input}"`;
        const command = await CommandFactory.get(commandLine);

        return await command.execute();
    }
}

export default CommandClear;
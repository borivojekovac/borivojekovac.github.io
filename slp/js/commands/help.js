import Command from "./command.js";
import CommandFactory from "./factory.js";
import ValueError from "../values/error.js";
import ValueText from "../values/text.js";

class CommandHelp extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async help(category) {

        var commandNames = "";
        for (const commandName in CommandFactory.commands) {

            commandNames += `   - ${commandName}\n`;
        }

        return `
syntax:
   help [command]

parameters:
   command: name of the command to get help for.

available commands:
${commandNames}`;
    }

    async execute() {

        const commandName = this.parameters[0];
        const category = this.parameters.length > 1 ? this.parameters[1] : undefined;

        if (commandName) {

            const commandClass = CommandFactory.commands[commandName.toLowerCase()];
            if (!commandClass) {

                return new ValueError(`Unknown command "${commandName}".`);
            }

            const command = new commandClass();

            return new ValueText((await command.help(category)));
        }

        var commandNames = "";
        for (const commandName in CommandFactory.commands) {

            commandNames += `   - ${commandName}\n`;
        }

        return new ValueText(await this.help());
    }
}

export default CommandHelp;
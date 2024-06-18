class Command {

    commandLine = null;
    parameters = [];

    constructor(commandLine, commandName, parameters) {

        this.commandLine = commandLine;
        this.commandName = commandName;
        this.parameters = parameters;
    }

    async execute() {

        throw new Error("Can't execute command. Please use derived commands instead.");
    }

    async help(category) {

        return "Help not implemented for this command.";
    }
}

export default Command;
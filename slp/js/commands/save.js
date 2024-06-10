import Command from "./command.js";
import Node from "../nodes/node.js";
import Connector from "../connectors/connector.js"
import App from "../app.js";
import ValueText from "../values/text.js";

class CommandSave extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async execute() {

        await App.saveState();
        
        return new ValueText(`${Object.getOwnPropertyNames(Node.lookupId).length} node(s) with ${Object.getOwnPropertyNames(Connector.lookupId).length} connection(s) saved.`);
    }
}

export default CommandSave;
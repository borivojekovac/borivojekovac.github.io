import Command from "./command.js";
import Node from "../nodes/node.js";
import ConnectorManager from "../connectors/manager.js";
import ValueError from "../values/error.js";

class CommandContinue extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async execute() {

        const nodeRef = this.parameters[0];
        const node = Node.lookupId[nodeRef] ?? Node.lookupName[nodeRef];

        if (!node) {

            return new ValueError(`Unable to continue execution from node ${nodeRef} - id or name not found. Please use either a valid node id or a valid node name.`);
        }
        
        const lastResult = node.lastResult();
        ConnectorManager.onResult(lastResult);
    }
}

export default CommandContinue;
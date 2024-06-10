import Command from "./command.js";
import Node from "../nodes/node.js";
import ValueError from "../values/error.js";

class CommandText extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async execute() {

        const nodeRef = this.parameters[0];
        const node = Node.lookupId[nodeRef] ?? Node.lookupName[nodeRef];

        if (!node) {

            return new ValueError(`Unable to send text to node ${nodeRef} - id or name not found. Please use either a valid node id or a valid node name.`);
        }

        const prompt = this.parameters[1];

        try {

            node.highlight(true);
            return await node.invoke(prompt);
        }
        finally {

            node.highlight(false);
        }

    }
}

export default CommandText;
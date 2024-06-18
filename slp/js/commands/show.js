import Command from "./command.js";
import Node from "../nodes/node.js";
import ValueEmpty from "../values/empty.js";

class CommandShow extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async help(category) {

        return `
Shows agent's UI. If no agent is specified, shows all agents.

syntax:

   show [<agent>]
   
parameters:

   agent : Name or id of the agent to show UI for.
`;
    }

    async execute() {

        const nodeRef = this.parameters[0];
        var node = Node.lookupId[nodeRef] ?? Node.lookupName[nodeRef];

        if (node) {

            node.show();
            return new ValueEmpty();
        }

        for (const id in Node.lookupId) {

            node = Node.lookupId[id];
            node.show();
        }

        return new ValueEmpty();
    }
}

export default CommandShow;
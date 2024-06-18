import Command from "./command.js";
import Node from "../nodes/node.js";
import ValueEmpty from "../values/empty.js";

class CommandHide extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async help(category) {

        return `
Hides agent's UI. If no agent is specified, hides all agents.

syntax:

   hide [<agent>]
   
parameters:

   agent : Name or id of the agent to hide UI for.
`;
    }

    async execute() {

        const nodeRef = this.parameters[0];
        var node = Node.lookupId[nodeRef] ?? Node.lookupName[nodeRef];

        if (node) {

            node.hide();
            return new ValueEmpty();
        }

        for (const id in Node.lookupId) {

            node = Node.lookupId[id];
            node.hide();
        }

        return new ValueEmpty();
    }
}

export default CommandHide;
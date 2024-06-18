import Command from "./command.js";
import Node from "../nodes/node.js";
import ConnectorManager from "../connectors/manager.js";
import ValueError from "../values/error.js";
import ValueText from "../values/text.js";

class CommandConnect extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async help(category) {

        return `
Connects two agents, so that once the input agent's result changes, the output
agent gets this result as its input and is then activated.

syntax:

   connect [[[<input>], <output>], <type>]
   
parameters:

   input :  Name or id of the input agent. If not specified, the agent that was
            created just before the last agent is used.

   output : Name or id of the output agent. If not specified, the last agent
            that was created is used.

   type   : Type of connection. Can be "text" or "image". If not specified,
            it is inferred from the available connectors.
`;
    }

    getBeforeLastNode() {

        var nodeId = Node.nextId;
        var foundLastNode = null;

        do {

            if (Node.lookupId[nodeId]) {

                if (foundLastNode) {

                    return Node.lookupId[nodeId];
                }

                foundLastNode = Node.lookupId[nodeId];
            }
            
        } while (--nodeId >= 0)
    }

    getLastNode() {

        var nodeId = Node.nextId;
        var foundLastNode = null;

        do {

            if (Node.lookupId[nodeId]) {

                return Node.lookupId[nodeId];
            }
            
        } while (--nodeId >= 0)
    }

    async execute() {

        const from = this.parameters[0];
        var nodeFrom = Node.lookupId[from] ?? Node.lookupName[from];
        if (!nodeFrom) {

            nodeFrom = this.getBeforeLastNode();
        }

        if (!nodeFrom) {

            return new ValueError(`Invalid source node ${from}. Please specify either a valid node id or a valid node name.`);
        }

        const to = this.parameters[1];
        var nodeTo = Node.lookupId[to] ?? Node.lookupName[to];
        if (!nodeTo) {

            nodeTo = this.getLastNode();
        }

        if (!nodeTo) {

            return new ValueError(`Invalid destination node ${to}. Please specify either a valid node id or a valid node name.`);
        }

        const type = this.parameters[2];

        const connector = ConnectorManager.add(nodeFrom, nodeTo, type);

        return new ValueText(`Connected output of ${nodeFrom.properties.name} to input of ${nodeTo.properties.name}.`);
    }
}

export default CommandConnect;
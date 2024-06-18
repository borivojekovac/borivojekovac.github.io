import Command from "./command.js";
import Node from "../nodes/node.js";
import ConnectorManager from "../connectors/manager.js";
import ValueError from "../values/error.js";
import ValueText from "../values/text.js";

class CommandDisonnect extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async help(category) {

        return `
Removes a connection between two agents.

syntax:

   disconnect [[[<input>], <output>], <type>]
   
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

        const connector = ConnectorManager.remove(nodeFrom, nodeTo, type);

        if (connector) {

            return new ValueText(`Disconnected output of ${nodeFrom.properties.name} from input of ${nodeTo.properties.name}.`);
        }

        else return new ValueText(`Couldn't find a matching connection to disconnect.`);
    }
}

export default CommandDisonnect;
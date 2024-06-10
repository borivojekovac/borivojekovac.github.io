import Command from "./command.js";
import Console from "../console.js";
import Node from "../nodes/node.js";
import ValueText from "../values/text.js";

class CommandList extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async execute() {

        var count = 0;
        for (var id in Node.lookupId) {

            const node = Node.lookupId[id];

            Console.write(` - ${node.properties.type} node ${node.properties.id}, name: ${node.properties.name}`);

            count++;
        }

        return new ValueText(`${count} node(s) listed.`);
    }
}

export default CommandList;
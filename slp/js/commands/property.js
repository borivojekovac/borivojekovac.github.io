import Command from "./command.js";
import Node from "../nodes/node.js";
import ValueText from "../values/text.js";
import ValueError from "../values/error.js";
import App from "../app.js";

class CommandProperty extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async execute() {

        try
        {

            const propertyName = this.parameters[0].toLowerCase();

            if (App.properties[propertyName] !== undefined) {

                if (this.parameters.length < 2) {
                
                    App.properties[propertyName] = null;
                }
                else {

                    App.properties[propertyName] = this.parameters[1];
                }                
            }
    
            return new ValueText(App.properties[propertyName].toString());
        }
        catch {

            return new ValueError(`Invalid property name or value.`);
        }
    }
}

export default CommandProperty;
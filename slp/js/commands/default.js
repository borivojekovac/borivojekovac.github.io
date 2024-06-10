import Command from "./command.js";
import App from "../app.js";
import DataManager from "../dataManager.js";
import ValueEditor from "../values/editor.js";
import ValueEmpty from "../values/empty.js";
import ValueText from "../values/text.js";

class CommandDefault extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async execute() {

        const varName = this.parameters[0];
        const value = this.parameters[1];

        if (App.defaults[varName] === undefined) {

            const value = new ValueText(JSON.stringify(App.defaults, null, "   "));
            const valueEditor = new ValueEditor("Agent defaults", value, this.onDefaultsDone.bind(this));
            valueEditor._nameReadOnly = true;
            valueEditor._monospace = true;
            valueEditor.initUi();
        }
        else {

            App.defaults[varName] = value;
            await DataManager.set(`defaults.${varName}`, value);

            return new ValueText(value);
        }

        return new ValueEmpty();
    }

    async onDefaultsDone(defaultsString) {

        var defaults = null;

        try {

            defaults = JSON.parse(defaultsString);
        }
        catch (ex) {

            return;
        }

        for (const defaultValueName in App.defaults) {

            if (defaults[defaultValueName] !== undefined) {

                App.defaults[defaultValueName] = defaults[defaultValueName];
            }
        }

        App.saveDefaults();
    }
}

export default CommandDefault;
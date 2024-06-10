import CommandClear from "./clear.js";
import CommandZoom from "./zoom.js";
import CommandPadding from "./padding.js";
import CommandNew from "./new.js";
import CommandList from "./list.js";
import CommandText from "./text.js";
import CommandSave from "./save.js";
import CommandLoad from "./load.js";
import CommandConnect from "./connect.js";
import CommandDisconnect from "./disconnect.js";
import CommandToggle from "./toggle.js";
import CommandDefault from "./default.js";
import CommandKill from "./kill.js";
import CommandReset from "./reset.js";
import CommandContinue from "./continue.js";
import CommandHide from "./hide.js";
import CommandShow from "./show.js";
import CommandVerbose from "./verbose.js";
import CommandAutoView from "./autoview.js";

class CommandFactory {

    commands = {
        "clear": CommandClear,
        "zoom": CommandZoom,
        "padding": CommandPadding,
        "new": CommandNew,
        "list": CommandList,
        "text": CommandText,
        "save": CommandSave,
        "load": CommandLoad,
        "connect": CommandConnect,
        "disconnect": CommandDisconnect,
        "toggle": CommandToggle,
        "default": CommandDefault,
        "kill": CommandKill,
        "reset": CommandReset,
        "continue": CommandContinue,
        "hide": CommandHide,
        "show": CommandShow,
        "verbose": CommandVerbose,
        "autoview": CommandAutoView
    };

    constructor() {
        
    }

    parseFunctionAndArguments(input) {

        if (input.trim()[0] == "!") {

            input = input.substring(1).trim();
        }
        else {

            input = `text input,"${input}"`;
        }

        // State variables
        let command = '';
        const params = [];
        let currentParam = '';
        let inQuotes = false;
        let escapeNext = false;
        let quoteChar = null;
        let i = 0;

        // Read command
        while (i < input.length && !/\s/.test(input[i])) {
            command += input[i++];
        }

        // Skip whitespace after command
        while (i < input.length && /\s/.test(input[i])) {
            i++;
        }

        // Read parameters
        while (i < input.length) {
            const char = input[i];

            if (escapeNext) {
                currentParam += char;
                escapeNext = false;
            } else if (char === '\\') {
                escapeNext = true;
            } else if (inQuotes) {
                if (char === quoteChar) {
                    inQuotes = false;
                    quoteChar = null;
                } else {
                    currentParam += char;
                }
            } else if (char === '"' || char === "'") {
                inQuotes = true;
                quoteChar = char;
            } else if (char === ',') {
                params.push(currentParam.trim());
                currentParam = '';
                // Skip whitespace after comma
                while (i + 1 < input.length && /\s/.test(input[i + 1])) {
                    i++;
                }
            } else {
                currentParam += char;
            }

            i++;
        }

        // Push the last parameter if there is any
        if (currentParam.trim() !== '') {
            params.push(currentParam.trim());
        }

        // Remove surrounding quotes from parameters
        const processedParams = params.map(param => {
            if ((param.startsWith('"') && param.endsWith('"')) || (param.startsWith("'") && param.endsWith("'"))) {
                param = param.slice(1, -1);
            }
            return param.replace(/\\"/g, '"').replace(/\\'/g, "'");
        });

        return { commandName: command, args: processedParams };
    }

    async get(commandLine) {

        var parsed = this.parseFunctionAndArguments(commandLine);
        if (parsed) {

            if (this.commands[parsed.commandName]) {
                
                return new this.commands[parsed.commandName](commandLine, parsed.commandName, parsed.args);
            }
            else {

                throw new Error(`Unsupported command: ${parsed.commandName}`);
            }
        }

        throw Error("Syntax error.");
    }
}

CommandFactory.functionCallRegex = 
    /^(\w+)\s+(?:([^,]+),\s*)*(?:(\w+))*$/;

const commandFactory = new CommandFactory();
export default commandFactory;
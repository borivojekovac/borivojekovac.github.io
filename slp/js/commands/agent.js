import Command from "./command.js";
import Console from "../console.js";
import NodeOpenAi from "../nodes/openAi.js";
import NodeOpenAiChat from "../nodes/openAiChat.js";
import NodeTextFormat from "../nodes/text.js";
import NodeDalle2 from "../nodes/dalle2.js";
import NodeDalle3 from "../nodes/dalle3.js";
import NodeGoogle from "../nodes/google.js";
import ValueError from "../values/error.js";
import ValueText from "../values/text.js";

class CommandAgent extends Command {

    constructor(commandLine, commandName, parameters) {

        super(commandLine, commandName, parameters);
    }

    async help(category) {

        switch (category === undefined ? "" : category.toLowerCase()) {

            case "openai": return `
Creates an OpenAI instruction agent. The agent takes textual input prompt,
sends it to OpenAI API for evaluation, and returns the resulting text.

syntax:

   agent openai [[[[[, <name>], <key>], <model>], <temperature>], <maxTokens>]

parameters:

   name        : Name of the agent. Used to refer to the agent in other
                 commands. Alternatively, you can use the agent's auto-
                 generated incremental ID to refer to the agent.

   key         : OpenAI API key. If not specified, default value for
                 "openAiKey" is used.

   model       : OpenAI model. Currently only "gpt-3.5-turbo-instruct" is
                 supported. If not specified, default value for "openAiModel"
                 is used.

   temperature : OpenAI model temperature. A value ranging from 0 to 2
                 indicating the level of randomness in the output, where 0 is
                 deterministic, and 2 is completely random output. If not
                 specified, default value for "openAiTemperature" is used.

   maxTokens   : OpenAI model maxTokens. Limits the number of tokens that
                 OpenAI will return. If not specified, default value of
                 "maxTokens" is used.
`;
            case "openaichat": return `
Creates an OpenAI chat agent. The agent takes textual input prompt,
sends it to OpenAI API for evaluation, and returns the resulting text.

syntax:

   agent openaichat [[[[[[, <name>], <key>], <model>], <temperature>]
                    , <maxTokens>], <system>]

parameters:

   name        : Name of the agent. Used to refer to the agent in other
                 commands. Alternatively, you can use the agent's auto-
                 generated incremental ID to refer to the agent.

   key         : OpenAI API key. If not specified, default value for
                 "openAiKey" is used.

   model       : OpenAI model. Currently "gpt-3.5-turbo", "gpt-4-turbo",
                 "gpt-4-turbo-preview", "gpt-4" and "gpt-4o" are supported.
                 If not specified, default value for "openAiChatModel" is used.

   temperature : OpenAI model temperature. A value ranging from 0 to 2
                 indicating the level of randomness in the output, where 0 is
                 deterministic, and 2 is completely random output. If not
                 specified, default value for "openAiTemperature" is used.

   maxTokens   : OpenAI model maxTokens. Limits the number of tokens that
                 OpenAI will return. If not specified, default value of
                 "maxTokens" is used.

   system      : OpenAI system. Used to specify the chatbot's
                 personality, for instance "You are a helpful assistant
                 designed to output JSON".
`;
            case "dalle2": return `
Creates an OpenAI Dall-e 2 agent. The agent takes textual input prompt,
sends it to OpenAI API for evaluation, and returns the resulting image.

syntax:

   agent dalle2 [[[, <name>], <key>], <size>]

parameters:

   name : Name of the agent. Used to refer to the agent in other commands.
          Alternatively, you can use the agent's auto-generated incremental
          ID to refer to the agent.

   key  : OpenAI API key. If not specified, default value for "openAiKey"
          is used.

   size : Size of the image to generate. Can be "256x256", "512x512" or
          "1024x1024". If not specified, defaults to "1024x1024".
`;

            case "dalle3": return `
Creates an OpenAI Dall-e 3 agent. The agent takes textual input prompt,
sends it to OpenAI API for evaluation, and returns the resulting image.

syntax:

   agent dalle3 [[[[[, <name>], <key>], <size>], <style>], <quality>]

parameters:

   name    : Name of the agent. Used to refer to the agent in other
             commands. Alternatively, you can use the agent's auto-generated
             incremental ID to refer to the agent.

   key     : OpenAI API key. If not specified, default value for "openAiKey"
             is used.

   size    : Size of the image to generate. Can be "1024x1024", "1024x1792"
             or "1792x1024". If not specified, defaults to "1024x1024".

   style   : Style of the image to generate. Can be "natural" or "vivid".
             If not specified, defaults to "vivid".

   quality : Quality of the image to generate. Can be "standard" or "hq".
             If not specified, defaults to "standard".
    `;

            case "text": return `
Creates a text agent. This is a very straight-forward type of agent which takes
text and then adds a fixed prefix and a fixed postfix to it. Typically used to
convert user input into prompt for a model down the line.

syntax:

   agent text [[[, <name>], <pre>], <post>]
   
parameters:

   name : Name of the agent. Used to refer to the agent in other commands.
          Alternatively, you can use the agent's auto-generated incremental
          ID to refer to the agent.
   
   pre  : Text to add before the input text, before passing the result.

   post : Text to add after the input text, before passing the result.
`;

            case "google": return `
Sends input text to Google search API, collects snippets of the top results
returned, combines them into a multi-line text and returns as a result.

syntax:

   agent google [[[[, <name>], <key>], <engine>], <results>]
   
parameters:

   name    : Name of the agent. Used to refer to the agent in other commands.
             Alternatively, you can use the agent's auto-generated incremental
             ID to refer to the agent.

   key     : Google API key. If not specified, default value for "googleKey"
             is used.

   engine  : Google engine id. If not specified, default value for
             "googleEngineId" is used.

   results : Number of results to return. If not specified, defaults to 10.
`;
        }
        return `
Creates a new agent. The first parameter is the type of agent to create.
Remaining parameters depend on the type of the agent.
Use "help agent, <type>" to get help on a creating a specific type of an agent.

syntax:

   agent openai|openaichat|dalle2|dalle3|text|google ...
`;
    }

    async execute() {

        const type = this.parameters.length ? this.parameters[0] : "";
        const name = this.parameters[1];

        switch (type.toLowerCase()) {
            case "openai":
                {
                    Console.writeVerbose(`Constructing OpenAI instruct agent ${name}...`);
                    const node = new NodeOpenAi(name);

                    const openAiKey = this.parameters[2];
                    if (openAiKey) {

                        node.properties.key = openAiKey;
                    }

                    const openAiModel = this.parameters[3];
                    if (openAiModel) {

                        node.properties.model = openAiModel;
                    }

                    const openAiHeat = this.parameters[4];
                    if (openAiHeat) {

                        node.properties.temperature = openAiHeat;
                    }

                    const openAiMaxTokens = this.parameters[5];
                    if (openAiMaxTokens) {

                        node.properties.maxTokens = openAiMaxTokens;
                    }
                }

                return new ValueText(`OpenAI instruct agent ${name} constructed.`);

            case "openaichat":
                {
                    Console.writeVerbose(`Constructing OpenAI chat agent ${name}...`);
                    const node = new NodeOpenAiChat(name);

                    const openAiKey = this.parameters[2];
                    if (openAiKey) {

                        node.properties.key = openAiKey;
                    }

                    const openAiModel = this.parameters[3];
                    if (openAiModel) {

                        node.properties.model = openAiModel;
                    }

                    const openAiHeat = this.parameters[4];
                    if (openAiHeat) {

                        node.properties.temperature = openAiHeat;
                    }

                    const openAiMaxTokens = this.parameters[5];
                    if (openAiMaxTokens) {

                        node.properties.maxTokens = openAiMaxTokens;
                    }

                    const openAiSystem = this.parameters[6];
                    if (openAiSystem) {

                        node.properties.system = openAiSystem;
                    }

                }

                return new ValueText(`OpenAI chat agent ${name} constructed.`);

            case "dalle2":
                {
                    Console.writeVerbose(`Constructing Dall-e 2 agent ${name}...`);
                    const node = new NodeDalle2(name);

                    const openAiKey = this.parameters[2];
                    if (openAiKey) {

                        node.properties.key = openAiKey;
                    }

                    const dalleSize = this.parameters[4];
                    if (dalleSize) {

                        node.properties.size = dalleSize;
                    }
                }

                return new ValueText(`Dall-e 2 agent ${name} constructed.`);

            case "dalle3":
                {
                    Console.writeVerbose(`Constructing Dall-e 3 agent ${name}...`);
                    const node = new NodeDalle3(name);

                    const openAiKey = this.parameters[2];
                    if (openAiKey) {

                        node.properties.key = openAiKey;
                    }

                    const dalleSize = this.parameters[3];
                    if (dalleSize) {

                        node.properties.size = dalleSize;
                    }

                    const dalleStyle = this.parameters[4]
                    if (dalleStyle) {

                        node.properties.style = dalleStyle;
                    }

                    const dalleQuality = this.parameters[5];
                    if (dalleQuality) {

                        node.properties.quality = dalleQuality;
                    }
                }

                return new ValueText(`Dall-e 3 agent ${name} constructed.`);

            case "text":
                {
                    Console.writeVerbose(`Constructing Text agent ${name}...`);
                    const node = new NodeTextFormat(name);

                    const pre = this.parameters[2];
                    if (pre) {

                        node.properties.pre = pre;
                    }

                    const post = this.parameters[3];
                    if (post) {

                        node.properties.post = post;
                    }
                }

                return new ValueText(`Text agent ${name} constructed.`);

            case "google":
                {
                    Console.writeVerbose(`Constructing Google agent ${name}...`);
                    const node = new NodeGoogle(name);

                    const googleApiKey = this.parameters[2];
                    if (googleApiKey) {

                        node.properties.key = googleApiKey;
                    }

                    const engine = this.parameters[3];
                    if (engine) {

                        node.properties.engine = engine;
                    }

                    const results = this.parameters[4]
                    if (results) {

                        node.properties.results = results;
                    }
                }

                return new ValueText(`Google agent ${name} constructed.`);

            default:
                return new ValueError(`Unsupported agent type: ${type}`);
        }
    }
}

export default CommandAgent;
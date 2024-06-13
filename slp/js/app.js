import HandlebarsHelpers from "./handlebarsHelpers.js";
import Console from "./console.js";
import CommandFactory from "./commands/factory.js";
import Node from "./nodes/node.js";
import NodeOpenAi from "./nodes/openAi.js";
import NodeOpenAiChat from "./nodes/openAiChat.js";
import DataManager from "./dataManager.js";
import ConnectorManager from "./connectors/manager.js";
import ValueError from "./values/error.js";
import Connector from "./connectors/connector.js";
import NodeDalle from "./nodes/dalle.js";
import Menu from "./menu/menu.js";
import Toolbar from "./toolbar.js";
import CommandRun from "./commands/run.js";

class App {

    pointer = {
        x: 0,
        y: 0
    };

    commandHistory = [];
    dom = null;
    svg = null;
    menu = null;

    defaults = {
        openAiModel: "gpt-3.5-turbo-instruct",
        openAiChatModel: "gpt-3.5-turbo",
        openAiTemperature: 1,
        dall_eModel: "dall-e-3",
        dall_eSize: "1024x1024",
        maxTokens: 2048,
        openAiKey: "",
        googleKey: "AIzaSyAWqJGjllRma45uO3Xy8fE8GynhOXtjyRk",
        googleEngineId: "f252ec802180a47d4"
    };

    properties = {
        title: null,
        prompt: null,
        action: null
    };

    size = {
        zoom: null,
        padding: null,
        width: null,
        height: null
    };

    verbose = false;
    autoView = true;

    _sizeHelpers = { zoom: null, padding: null, app: null };

    async loadDefaults() {

        for (const defaultValueName in this.defaults) {

            this.defaults[defaultValueName] = await DataManager.get(`defaults.${defaultValueName}`, this.defaults[defaultValueName]);
        }
    }

    async saveDefaults() {

        for (const defaultValueName in this.defaults) {

            await DataManager.set(`defaults.${defaultValueName}`, this.defaults[defaultValueName]);
        }
    }

    async scripts() {

        return await DataManager.get();
    }

    constructor() {

        HandlebarsHelpers();

        Console.write(null, "Application started, ready for your input.");

        DataManager.get(`app.zoom`, 3)
            .then((zoom) => {

                document.documentElement.style.setProperty("--appZoom", `${zoom}vmin`);
                DataManager.set(`app.zoom`, zoom);
            });

        this.dom = document.querySelector("#appContainer");
        this.dom.addEventListener("mousemove", this.onPointerMove.bind(this));
        this.dom.addEventListener("touchstart", this.onPointerMove.bind(this));
        this.dom.addEventListener("touchmove", this.onPointerMove.bind(this));
        this.dom.addEventListener("touchend", this.onPointerMove.bind(this));

        this.menu = new Menu("Silly Little People");

        this.svg = document.querySelector("#appVectorContainer");

        this.verboseUpdated(!!DataManager.get(`app.verbose`, false));
        this.autoViewUpdated(!!DataManager.get(`app.autoview`, true));

        this.toolbar = new Toolbar();
        this.toolbar.add("clear console", "clear");
        this.toolbar.add("toggle node view", "toggle");
        this.toolbar.add("show nodes", "show");
        this.toolbar.add("hide nodes", "hide");
        this.toolbar.add("agent: text", "agent text");
        this.toolbar.add("agent: openAi instruct", "agent openai");
        this.toolbar.add("agent: openAi chat", "agent openaichat");
        this.toolbar.add("agent: dall-e 2", "agent dalle2");
        this.toolbar.add("agent: dall-e 3", "agent dalle3");
        this.toolbar.add("agent: google", "agent google");


        window.requestAnimationFrame(this.onUpdateFrame.bind(this));
    }

    verboseUpdated(verbose) {

        this.verbose = verbose;
        DataManager.set(`app.verbose`, verbose);

        if (this.verbose && !this.dom.classList.contains("uiVerbose")) {

            this.dom.classList.add("uiVerbose");
        }
        else if (!this.verbose && this.dom.classList.contains("uiVerbose")) {

            this.dom.classList.remove("uiVerbose");
        }

        Console.writeVerbose(`Verbose set to ${verbose}...`);
    }

    autoViewUpdated(autoView) {

        this.autoView = autoView;
        DataManager.set(`app.autoView`, autoView);

        Console.writeVerbose(`Auto view set to ${autoView}...`);
    }

    async saveState() {

        await DataManager.set(`node.ids`, Object.getOwnPropertyNames(Node.lookupId));

        for (const id in Node.lookupId) {

            const node = Node.lookupId[id];
            await node.saveState();
        }

        await DataManager.set(`connector.ids`, Object.getOwnPropertyNames(Connector.lookupId));

        for (const connector of ConnectorManager.connectors) {

            await connector.saveState();
        }
    }

    resetState() {

        const nodes = document.querySelectorAll(".uiNode");
        for (const node of nodes) {

            node.remove();
        }

        const connectorVectors = document.querySelectorAll(".uiConnector, .uiSocket");
        for (const uiConnector of connectorVectors) {

            uiConnector.remove();
        }

        Node.nextId = 0;
        Node.lookupId = {};
        Node.lookupName = {};

        this.commandHistory.length = 0;
    }

    async loadState() {
        
        this.resetState();

        const agentConstructors = {
            "OpenAi": NodeOpenAi,
            "OpenAiChat": NodeOpenAiChat,
            "Text": NodeTextFormat,
            "Dall-e": NodeDalle
        };

        const ids = await DataManager.get(`node.ids`);

        var nodesLoaded = [];

        for (const id of ids) {

            const type = await DataManager.get(`node.${id}.type`);
            const name = await DataManager.get(`node.${id}.name`);

            if (agentConstructors[type]) {

                var node = new agentConstructors[type](name);
                node.id = id;
                await node.loadState();

                nodesLoaded.push(node);
                if (Node.nextId <= id) {

                    Node.nextId = id + 1;
                }
            }
        }

        Node.lookupId = {};
        Node.lookupName = {};

        for (const node of nodesLoaded) {

            Node.lookupId[node.properties.id] = node;
            Node.lookupName[node.properties.name] = node;
        }

        Connector.nextId = 0;
        ConnectorManager.connectors.length = 0;
        const connectorIds = await DataManager.get(`connector.ids`);
        const connectorsLoaded = [];
        for (const connectorId of connectorIds) {

            const connector = await ConnectorManager.addFromState(connectorId);
            connectorsLoaded.push(connector);
            if (Connector.nextId <= connectorId) {

                Connector.nextId = connectorId + 1;
            }
        }

        Connector.lookupId = {};
        for (const connector of connectorsLoaded) {

            Connector.lookupId[connector.id] = connector;
        }
    }

    onPointerMove(evt) {

        this.pointer.x = evt.touches && evt.touches.length ? evt.touches[0].clientX : evt.clientX;
        this.pointer.y = evt.touches && evt.touches.length ? evt.touches[0].clientY : evt.clientY;
    }

    updateSizes() {

        if (!this._sizeHelpers.zoom) {

            this._sizeHelpers.zoom = document.querySelector("#zoomSizeHelper");
        }

        if (!this._sizeHelpers.padding) {

            this._sizeHelpers.padding = document.querySelector("#paddingSizeHelper");
        }

        if (!this._sizeHelpers.app) {

            this._sizeHelpers.app = document.querySelector("#appVectorContainer");
        }

        if (this._sizeHelpers.zoom) {

            this.size.zoom = this._sizeHelpers.zoom.getClientRects()[0].width;
        }

        if (this._sizeHelpers.padding) {

            this.size.padding = this.size.zoom / this._sizeHelpers.padding.getClientRects()[0].width;
        }

        if (this._sizeHelpers.app) {

            this.size.width = this._sizeHelpers.app.getClientRects()[0].width;
            this.size.height = this._sizeHelpers.app.getClientRects()[0].height;
        }
    }

    onUpdateFrame() {

        window.requestAnimationFrame(this.onUpdateFrame.bind(this));

        this.updateSizes();
        Node.updateUiFrame();
        this.toolbar.updateUiFrame();
        ConnectorManager.updateUiFrame();
        this.menu.updateUiFrame();
    }

    async processCommand(commandLine, saveInHistory) {

        Console.write(commandLine, "< ");

        var response = null;

        try {

            const command = await CommandFactory.get(commandLine);
            response = await command.execute();
        }
        catch (ex) {

            response = new ValueError(ex);
        }

        if (response !== undefined && response.toString().length > 0) {
                
            Console.write(
                response.toString(),
                response.value.type == "error"
                    ? "! "
                    : "> "
            );

            if (!ConnectorManager.onResult(response)) {

                if (!CommandRun.onOutput(response)) {

                    if (this.autoView && response.source && response.source instanceof Node) {

                        response.source.onViewResult();
                    }
                }
            }
        }

        if (saveInHistory) {

            this.commandHistory.push({
                command: commandLine,
                response: response
            });
        }
    }
}

const app = new App();

export default app;

await app.loadDefaults();
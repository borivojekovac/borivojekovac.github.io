import TemplateManager from "../templateManager.js";
import App from "../app.js";
import ValueText from "../values/text.js";
import ValueEditor from "../values/editor.js";
import ScriptsManager from "../scriptsManager.js";

class Menu {

    properties = {
        id: Menu.nextId++,
        name: null,
        minimised: true
    };

    dom = null;

    constructor(name) {

        this.properties.name = name;
    }

    bind(eventName, className, handler) {

        const items = this.dom.querySelectorAll(`.${className}`);
        for (const item of items) {

            item.addEventListener(eventName, handler);
        }
    }

    initUi() {

        if (this.dom) {

            this.dom.remove();
            this.dom = null;
        }

        this.properties.scriptNames = Object.keys(ScriptsManager.scripts);

        const dom = TemplateManager.getDom(Menu.template, this.properties);
        this.dom = dom.querySelector(".uiMenu");
        
        App.dom.append(...dom.childNodes);

        if (this.properties.minimised) {

            this.dom.classList.add("uiMinimised");
        }

        this.bind("click", "uiMenuIcon", this.onToggle.bind(this));
        this.bind("click", "uiMenuItemReset", this.onReset.bind(this));
        this.bind("click", "uiMenuItemSave", this.onSave.bind(this));
        this.bind("click", "uiMenuItemDefaults", this.onDefaults.bind(this));
        this.bind("click", "uiMenuItemEdit", this.onEdit.bind(this));
        this.bind("click", "uiMenuItemDelete", this.onDelete.bind(this));
        this.bind("click", "uiMenuItemName", this.onLoad.bind(this));
    }

    onToggle(evt) {

        this.properties.minimised = !this.properties.minimised;
        if (!this.properties.minimised && this.dom.classList.contains("uiMinimised")) {

            this.dom.classList.remove("uiMinimised");
        }
        else if (this.properties.minimised && !this.dom.classList.contains("uiMinimised")) {

            this.dom.classList.add("uiMinimised");
        }
    }

    onReset(evt) {

        App.processCommand("!reset");
    }

    async onSave(evt) {

        var commands = "";
        for (const command of App.commandHistory) {

            if (commands.length > 0) {

                commands += "\n";
            }
            commands += command.command;
        }

        await ScriptsManager.set("untitled", commands);

        this.initUi();
    }

    async onDefaults(evt) {

        App.processCommand("!default");
    }

    async onLoad(evt) {

        const name = evt.currentTarget.dataset.name;
        const commands = await ScriptsManager.get(name, "");

        for (const command of commands.match(/[^\r\n]+/g)) {

            await App.processCommand(command, true);
        }
    }

    async onEdit(evt) {

        const name = evt.currentTarget.dataset.name;
        const commands = await ScriptsManager.get(name, "");

        const commandsValue = new ValueText(commands);
        const valueEditor = new ValueEditor(name, commandsValue, this.onEditDone.bind(this), name);
        valueEditor._monospace = true;
        valueEditor.initUi();
    }

    async onEditDone(commands, name, newName) {

        if (newName != name) {

            await ScriptsManager.rename(name, newName);
        }
        
        await ScriptsManager.set(newName, commands);

        this.initUi();
    }

    async onDelete(evt) {

        const name = evt.currentTarget.dataset.name;

        await ScriptsManager.remove(name);

        if (!Object.keys(ScriptsManager.scripts).length) {

            await ScriptsManager.initDefaultScripts();
        }

        this.initUi();
    }

    updateUiFrame() {

        if (!this.dom) {

            this.initUi();
        }
    }
}

Menu.nextId = 0;
Menu.template = await TemplateManager.getTemplate("menu");

export default Menu;
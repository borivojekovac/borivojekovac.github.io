import App from "../app.js";
import ValueEmpty from "./empty.js";
import TemplateManager from "../templateManager.js";
import Viewer from "../values/viewer.js";

class Editor extends Viewer {

    name = null;
    callback = null;
    context = null;
    _nameReadyOnly = true;

    constructor(name, value, callback, context) {

        super(value);

        this._nameReadOnly = !name;
        this.name = this._nameReadOnly ? "Value Editor" : name;
        this.callback = callback;
        this.context = context;
    }
    
    getBaseCssSelector() {

        return ".uiValueEditor";
    }

    getTemplate() {

        return Editor.template;
    }

    getValueDom(value) {

        return value.editDom();
    }

    async initUi() {

        super.initUi();

        if (this._nameReadOnly) {

            this.dom.querySelector(".uiTitle").disabled = true;
        }

        switch (this.value.value.type) {

            case "empty":
            case "error":
            case "image":
                break;

            case "text":
                setTimeout((function() {
                    this.dom.querySelector(".uiEditText").focus();
                }).bind(this), 0);
                break;
        }
    }

    onClose() {

        switch (this.value.value.type) {

            case "empty":
            case "error":
            case "image":
                break;

            case "text":
                if(this.callback && this.dom) {

                    const uiEditText = this.dom.querySelector(".uiEditText");
                    this.callback(uiEditText.value, this.context, this.dom.querySelector(".uiTitle").value);
                }
                break;
        }

        super.onClose();
    }
}

Editor.template = await TemplateManager.getTemplate("valueEditor");

export default Editor;
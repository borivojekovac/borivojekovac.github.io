import App from "../app.js";
import ValueEmpty from "./empty.js";
import TemplateManager from "../templateManager.js";

class Viewer {

    value = null;
    dom = null;
    currentValueIndex = null;

    constructor(value) {

        this.value = value;

        if (this.value instanceof Array) {

            if (this.value.length == 0) {

                this.value = Viewer.emptyValue;
            }
            else {

                this.currentValueIndex = this.value.length - 1;
            }
        }
    }

    getBaseCssSelector() {

        return ".uiValueViewer";
    }

    getTemplate() {

        return Viewer.template;
    }

    getValueDom(value) {

        return value.viewDom();
    }

    async initUi() {

        const dom = TemplateManager.getDom(this.getTemplate(), this);
        
        const uiValueViewer = dom.querySelector(this.getBaseCssSelector());
        const uiContent = dom.querySelector(".uiContent");

        if (this.currentValueIndex === null) {

            uiContent.append(this.getValueDom(this.value));
            uiValueViewer.classList.add("uiSingleValue");
        }
        else {

            uiContent.append(this.getValueDom(this.value[this.currentValueIndex]));
            if (this.value.length == 1) {

                uiValueViewer.classList.add("uiSingleValue");
            }
        }

        dom.querySelector(".uiCloseButton")
            .addEventListener("click", this.onClose.bind(this));
            
        dom.querySelector(".uiPreviousButton")
            .addEventListener("click", this.onPrevious.bind(this));

        dom.querySelector(".uiNextButton")
            .addEventListener("click", this.onNext.bind(this));

        this.dom = uiValueViewer;

        App.dom.append(...dom.childNodes);
    }

    onClose(evt) {

        if (this.dom) {

            this.dom.remove();
            this.dom = null;
        }
    }

    onPrevious(evt) {

        if (this.currentValueIndex === null) {

            return;
        }

        this.currentValueIndex = (this.value.length + this.currentValueIndex - 1) % this.value.length;

        this.dom.remove();
        this.initUi();

        evt.preventDefault();
        evt.stopPropagation();
    }

    onNext(evt) {

        if (this.currentValueIndex === null) {

            return;
        }

        this.currentValueIndex = (this.currentValueIndex + 1) % this.value.length;

        this.dom.remove();
        this.initUi();

        evt.preventDefault();
        evt.stopPropagation();
    }
}

Viewer.template = await TemplateManager.getTemplate("valueViewer");
Viewer.emptyValue = new ValueEmpty();

export default Viewer;
import Value from "./value.js"
import TemplateManager from "../templateManager.js";

class ValueError extends Value {

    constructor(error, source) {

        super("error", source);

        if (typeof error === 'string' || error instanceof String) {

            this.value.text = error;
        }
        else if (error instanceof Error) {

            this.value.exception = error;
            this.value.text = error.message;
        }
        else {

            this.value.object = error;
            this.value.text = JSON.toString(error);
        }
    }

    toString() {

        if (this.value.text !== undefined) {

            return this.value.text;
        }
        else if (this.value.exception !== undefined) {

            return this.value.exception.message;
        }
        else {

            return JSON.toString(this.value.object);
        }
    }

    viewDom() {

        return TemplateManager.getDom(ValueError.templateView, this);
    }
}

ValueError.templateView = await TemplateManager.getTemplate("valueViewError");

export default ValueError;
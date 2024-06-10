import Value from "./value.js";
import TemplateManager from "../templateManager.js";

class ValueEmpty extends Value {

    constructor(source) {

        super("empty", source);
    }

    toString() {

        return "";
    }

    viewDom() {

        return TemplateManager.getDom(ValueEmpty.templateView, this);
    }
}

ValueEmpty.templateView = await TemplateManager.getTemplate("valueViewEmpty");

export default ValueEmpty;
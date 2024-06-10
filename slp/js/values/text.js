import Value from "./value.js";
import TemplateManager from "../templateManager.js";

class ValueText extends Value {

    constructor(text, source) {

        super("text", source);

        this.value.text = text;
    }

    toString() {

        return this.value.text;
    }

    viewDom() {

        return TemplateManager.getDom(ValueText.templateView, this);
    }

    editDom() {

        return TemplateManager.getDom(ValueText.templateEdit, this);
    }
}

ValueText.templateView = await TemplateManager.getTemplate("valueViewText");
ValueText.templateEdit = await TemplateManager.getTemplate("valueEditText");

export default ValueText;
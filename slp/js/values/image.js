import Value from "./value.js";
import TemplateManager from "../templateManager.js";

class ValueImage extends Value {

    constructor(urlOrData, source) {

        super("image", source);

        this.value.image = urlOrData;
    }

    toString() {

        return this.value.image;
    }

    toUrl() {

        return this.value.image;
    }

    viewDom() {

        return TemplateManager.getDom(ValueImage.templateView, this);
    }
}

ValueImage.templateView = await TemplateManager.getTemplate("valueViewImage");

export default ValueImage;
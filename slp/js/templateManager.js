class TemplateManager {

    constructor() {
    }

    getDom(template, object) {

        const div = document.createElement("div");
        div.innerHTML = template(object);
        
        return div;
    }
    
    getTemplateFromString(templateDefinition) {

        const template = Handlebars.compile(templateDefinition);
        return template;
    }

    async getTemplate(templateName) {

        const url = `./templates/${templateName}.hbs`;
        const response = await fetch(url);

        return this.getTemplateFromString(await response.text());
    }
}

const templateManager = new TemplateManager();

export default templateManager;
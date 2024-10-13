class Output {

    ui = {};

    constructor() {

        this.ui.responseText = document.querySelector("#responseText");
    }

    async text(text, debug) {

        return await this.raw(`<span>${text}<span>`, debug === undefined ? true : debug, "text");
    }

    async error(error, debug) {

        return await this.raw(`<span>${error}<span>`, debug === undefined ? true : debug, "error");
    }

    async highlight(text, debug) {

        return await this.raw(`<span>${text}<span>`, debug === undefined ? false : debug, "highlight");
    }

    async raw(html, debug, type) {

        var div = document.createElement("div");
        div.className = `output${ debug ? " debug" : ""} ${type}`;
        div.innerHTML = html;

        this.ui.responseText.appendChild(div);
        div.scrollIntoView();

        return html;
    }
}

export default Output;
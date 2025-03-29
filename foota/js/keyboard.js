class Keyboard {

    down = {}

    constructor() {

        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    onKeyDown(evt) {

        this.down[evt.code] = true;
    }

    onKeyUp(evt) {

        this.down[evt.code] = false;
    }
}

const keyboard = new Keyboard();

export default keyboard;
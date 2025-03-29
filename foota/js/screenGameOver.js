import Keyboard from "./keyboard.js";
import Screen from "./screen.js";
import { screen as screenPlay } from "./screenPlay.js";
import { screen as screenMenu } from "./screenMenu.js";
import World from "./world.js";

export default class screenGameOver extends Screen {

    buttonReplay = null;
    buttonMenu = null;
    rotationRadius = 4;
    startTime = null;

    constructor() {

        super("screenGameOver");
    }

    init() {

        super.init();

        this.buttonReplay = document.getElementById("buttonReplay");
        this.buttonReplay.addEventListener("click", this.onReplayClicked.bind(this));

        this.buttonMenu = document.getElementById("buttonMenu");
        this.buttonMenu.addEventListener("click", this.onMenuClicked.bind(this));

        this.labelLevel = document.querySelector("#screenGameOver #labelLevel label");
        this.labelScore = document.querySelector("#screenGameOver #labelScore label");
    }

    onReplayClicked(evt) {

        Screen.transition(screenPlay);
        evt.preventDefault();
    }

    onMenuClicked(evt) {

        Screen.transition(screenMenu);
        evt.preventDefault();
    }
    
    beforeShow() {

        super.beforeShow();

        this.buttonReplay.style.display = "none";
        this.buttonMenu.style.display = "none";

        World.things.protagonist.object.visible = false;
        World.things.trail.object.visible = false;
        this.labelLevel.innerText = screenPlay.level;
        this.labelScore.innerText = screenPlay.score;

        this.startTime = null;
    }

    afterShow() {

        super.afterShow();

        this.buttonReplay.style.display = "";
        this.buttonMenu.style.display = "";
    }

    beforeHide() {

        this.buttonReplay.style.display = "none";
        this.buttonMenu.style.display = "none";
    }

    update(time) {
        
        super.update(time);

        if (!this.startTime) {

            this.startTime = time;
        }

        World.camera.position.x = this.rotationRadius * Math.sin(time / 2000);
        World.camera.position.y = this.rotationRadius * Math.cos(time / 2000);

        World.camera.rotation.z = this.directionCurrent;
        document.getElementsByTagName("body")[0].style.setProperty('--backgroundAngle', `${this.directionCurrent / 0.0174532925}deg`);

        if ((time - this.startTime) < 2000) {

            return;
        }

        if (Keyboard.down["KeyW"]
            || Keyboard.down["Numpad8"]
            || Keyboard.down["Digit1"]
            || Keyboard.down["ArrowUp"]) {

            Screen.transition(screenPlay);
        }
        else if (Keyboard.down["Space"]
            || Keyboard.down["Enter"]
            || Keyboard.down["NumpadEnter"]
            || Keyboard.down["Numpad5"]
            || Keyboard.down["KeyS"]
            || Keyboard.down["Digit5"]
            || Keyboard.down["ArrowDown"]) {

            Screen.transition(screenMenu);
        }

    }
}

export const screen = new screenGameOver();
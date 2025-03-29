import Screen from "./screen.js";
import World from "./world.js";
import Sound from "./sound.js";
import { screen as screenMenu } from "./screenMenu.js";

export default class screenConfig extends Screen {

    rotationRadius = 10;

    constructor() {

        super("screenConfig");
    }

    init() {

        super.init();

        this.buttonMenu = document.querySelector("#screenConfig #buttonMenu");
        this.buttonMenu.addEventListener("click", this.onMenuClicked.bind(this));

        this.buttonSound = document.querySelector("#screenConfig #buttonSound");
        this.buttonSound.addEventListener("click", this.onSoundClicked.bind(this));

        this.buttonCloud = document.querySelector("#screenConfig #buttonCloud");
        this.buttonCloud.addEventListener("click", this.onCloudClicked.bind(this));

        this.buttonGlow = document.querySelector("#screenConfig #buttonGlow");
        this.buttonGlow.addEventListener("click", this.onGlowClicked.bind(this));
    }

    onMenuClicked(evt) {

        Screen.transition(screenMenu);
        evt.preventDefault();
    }

    onSoundClicked(evt) {

        switch (this.buttonSound.innerText) {

            case "volume_up":
                {
                    this.buttonSound.querySelector("span").innerText = "volume_off";
                    Sound.mute = true;
                }
                break;

            case "volume_off":
                {
                    this.buttonSound.querySelector("span").innerText = "volume_up";
                    Sound.mute = false;

                }
                break;
        }

        evt.preventDefault();
    }

    onCloudClicked(evt) {

        switch (this.buttonCloud.innerText) {

            case "cloud":
                {
                    this.buttonCloud.querySelector("span").innerText = "cloud_off";
                    window.toggleBackground();
                }
                break;

            case "cloud_off":
                {
                    this.buttonCloud.querySelector("span").innerText = "cloud";
                    window.toggleBackground();
                }
                break;
        }

        evt.preventDefault();
    }

    onGlowClicked(evt) {

        switch (this.buttonGlow.innerText) {

            case "blur_on":
                {
                    this.buttonGlow.querySelector("span").innerText = "blur_off";
                    window.toggleGlow();
                }
                break;

            case "blur_off":
                {
                    this.buttonGlow.querySelector("span").innerText = "blur_on";
                    window.toggleGlow();
                }
                break;
        }

        evt.preventDefault();
    }

    beforeHide() {

        super.beforeHide();
    }

    afterHide() {

        super.afterHide();

        World.things.protagonist.object.visible = true;
    }

    beforeShow() {

        super.beforeShow();

        this.buttonMenu.style.display = 
        this.buttonSound.style.display = 
        this.buttonCloud.style.display = 
        this.buttonGlow.style.display = "none";

        World.things.protagonist.object.visible = false;
    }

    afterShow() {

        super.afterShow();

        this.buttonMenu.style.display = 
        this.buttonSound.style.display = 
        this.buttonCloud.style.display = 
        this.buttonGlow.style.display = "";
    }

    update(time) {
        
        super.update(time);

        World.camera.rotation.z = this.directionCurrent;
        World.camera.position.x = this.rotationRadius * Math.sin(time / 2000);
        World.camera.position.y = 0;

        document.getElementsByTagName("body")[0].style.setProperty('--backgroundAngle', `${this.directionCurrent / 0.0174532925}deg`);
    }
}

export const screen = new screenConfig();
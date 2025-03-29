import { Tween } from "./lib/tween/tween.esm.js";
import Keyboard from "./keyboard.js";
import Game from "./game.js";
import Screen from "./screen.js";
import { screen as screenPlay } from "./screenPlay.js";
import { screen as screenConfig } from "./screenConfig.js";
import World from "./world.js";

export default class screenMenu extends Screen {

    buttonPlay = null;
    rotationRadius = 10;
    cameraHeight = 20;

    constructor() {

        super("screenMenu");
    }

    init() {

        super.init();

        this.buttonPlay = document.querySelector("#screenMenu #buttonPlay");
        this.buttonPlay.addEventListener("click", this.onPlayClicked.bind(this));

        this.controlConfig = document.querySelector("#screenMenu #controlConfig");
        this.controlConfig.addEventListener("click", this.onConfig.bind(this));

        this.controlToggleFullScreen = document.querySelector("#screenMenu #controlToggleFullScreen");
        this.controlToggleFullScreen.addEventListener("click", this.onToggleFullScreen.bind(this));

        if (Screen.runningAsPWA) {

            this.controlToggleFullScreen.style.display = "none";
        }
    }

    onPlayClicked(evt) {

        Screen.transition(screenPlay);
    }

    onConfig(evt) {

        Screen.transition(screenConfig);
        evt.preventDefault();
    }

    onToggleFullScreen(evt) {

        try {

            if (Screen.fullScreen) {

                Screen.exitFull();
                this.controlToggleFullScreen.innerText = "fullscreen";
            }
            else {

                Screen.goFull();
                this.controlToggleFullScreen.innerText = "fullscreen_exit";
            }
        }
        catch (ex) {

            Log.warning(`Unable to toggle full screen: ${JSON.stringify(ex)}`)
        }

        evt.preventDefault();
    }

    beforeShow() {

        super.beforeShow();

        this.controlConfig.style.display = "none";
        this.controlToggleFullScreen.style.display = "none";
        this.buttonPlay.style.display = "none";

        World.things.protagonist.object.visible = true;
        World.things.protagonist.object.children[1].visible = true;
        World.things.protagonist.object.children[2].visible = false;
        World.things.trail.object.visible = false;
        World.camera.position.x =
        World.camera.position.y =
        World.things.protagonist.object.position.x =
        World.things.protagonist.object.position.y =
        World.things.protagonist.object.position.z = 
        World.things.protagonist.object.rotation.x =
        World.things.protagonist.object.rotation.y =
        World.things.protagonist.object.rotation.z =
        World.things.lightSpot.object.position.x = 
        World.things.lightSpot.object.position.y = 0;

        World.things.protagonist.behaviour = World.things.protagonist.behaviourMenu;
        
        const animation = {

            this: this,
            properties: {
                rotationRadius: 0,
                cameraZ: World.camera.position.z
            },
            target: {
                rotationRadius: this.rotationRadius,
                cameraZ : this.cameraHeight
            }
        };

        new Tween(animation.properties)
            .to(animation.target, Screen.transitionMilliseconds)
            .start()
            .onUpdate(function() {

                this.rotationRadius = animation.properties.rotationRadius;
                World.camera.position.z = animation.properties.cameraZ;

            });

        this.update(Game.time);
    }

    afterShow() {

        super.afterShow();

        this.controlConfig.style.display = "";
        if (!Screen.runningAsPWA) {

            this.controlToggleFullScreen.style.display = "";
        }
        this.buttonPlay.style.display = "";
    }

    beforeHide() {

        this.controlConfig.style.display = "none";
        this.controlToggleFullScreen.style.display = "none";
        this.buttonPlay.style.display = "none";

        const animation = {

            this: this,
            properties: {
                rotationRadius: this.rotationRadius,
                cameraZ : this.cameraHeight
            },
            target: {
                rotationRadius: 0,
                cameraZ : 50
            }
        };

        new Tween(animation.properties)
            .to(animation.target, Screen.transitionMilliseconds)
            .start()
            .onUpdate(function() {

                this.rotationRadius = animation.properties.rotationRadius;
                World.camera.position.z = animation.properties.cameraZ;
            });
    }

    update(time) {
     
        super.update(time);

        World.camera.rotation.z = this.directionCurrent;
        World.camera.position.x = this.rotationRadius * Math.sin(time / 2000);
        World.camera.position.y = 0;

        document.getElementsByTagName("body")[0].style.setProperty('--backgroundAngle', `${this.directionCurrent / 0.0174532925}deg`);

        World.things.protagonist.object.children[1].rotation.y = 2 * Math.PI * Math.random();
        World.things.protagonist.object.rotation.set(0, - Math.PI / 4 + Math.PI * (Math.sin(time / 1750) * Math.sin(time / 1600)) / 4, 0);
        World.things.protagonist.object.rotateOnWorldAxis(this.zVector, -Math.PI / 2);
        World.things.protagonist.object.position.x = World.camera.position.x + 3 * Math.sin(+ time / 1000);
        World.things.protagonist.object.position.y = 3 * Math.cos( time / 1000);
        World.things.protagonist.object.rotateOnWorldAxis(this.zVector, - time / 1000);

        if (Keyboard.down["Enter"]
            || Keyboard.down["NumpadEnter"]
            || Keyboard.down["Space"]
            || Keyboard.down["Numpad5"]
            || Keyboard.down["Digit5"]
            || Keyboard.down["KeyS"]
            || Keyboard.down["ArrowDown"]) {

            Screen.transition(screenPlay);
        }
    }
}

export const screen = new screenMenu();
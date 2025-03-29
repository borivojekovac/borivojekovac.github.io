import Log from "./log.js";
import { Tween } from "./lib/tween/tween.esm.js";
import Keyboard from "./keyboard.js";

export default class Screen {

    static transitionScreenId = "transitionBlackScreen";
    static current = null;
    static transitioning = null;
    static transitionMilliseconds = 500;
    
    zVector = null;

    id = null;
    htmlElement = null;
    transitionIn = false;
    transitionOut = false;

    directionTarget = null;
    directionPrevious = null;
    directionDiff = null;
    directionSmoothness = 3;
    directionKeyboard = 0;
    directionDevice = 0;
    directionCurrent = 0;

    constructor(id) {

        this.id = id;

        window.addEventListener("load", (function() {
            
            this.htmlElement = document.getElementById(id);
            this.init();

        }).bind(this));
    }

    init() {

        Log.info(`Initialising screen ${this.id}`);

        window.addEventListener("deviceorientation", this.handleDeviceOrientationUpdate.bind(this));

        this.zVector = new THREE.Vector3(0, 0, 1);
    }

    // helper functions

    static runningOnMobile() {

        let check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);

        return check;
    }

    static runningOnMobileOrTablet() {

        let check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);

        return check;
    }

    static runningAsPWA = null;


    // full screen support

    static fullScreen = false;

    static async goFull() {

        try {

            var domElement = document.documentElement;

            if (domElement.requestFullscreen) {

                await domElement.requestFullscreen({ navigationUI : "hide" });
            }
            else if (domElement.webkitRequestFullscreen) { // safari
    
                domElement.webkitRequestFullscreen();
            }
            else if (domElement.msRequestFullscreen) { // ie
    
                domElement.msRequestFullscreen();
            }
            else {

                throw new Error("Browser doesn't support going fullscreen.");
            }

            Screen.fullScreen = true;
        }
        catch (ex) {

            Log.warning(ex.message ? ex.message : JSON.stringify(ex));
        }
    }

    static exitFull() {

        try {

            if (document.exitFullscreen) {

                document.exitFullscreen();
            }
            else if (document.webkitExitFullscreen) { // safari
    
                document.webkitExitFullscreen();
            }
            else if (document.msExitFullscreen) { // ie
    
                document.msRequestFullscreen();
            }
            else {

                throw new Error("Browser doesn't support exiting fullscreen.");
            }

            Screen.fullScreen = false;
        }
        catch (ex) {

            Log.warning(ex.message ? ex.message : JSON.stringify(ex));
        }
    }

    // screen methods
    
    static transition(screen) {

        if (Screen.transitioning && Screen.transitioning == screen) {

            return false;
        }

        Screen.transitioning = screen;

        if (Screen.current) {

            Screen.current.transitionOut = true;
            Screen.current.beforeHide();
        }

        const transitionScreenElement = document.getElementById(Screen.transitionScreenId);

        transitionScreenElement.style.opacity = 0;
        transitionScreenElement.style.visibility = "visible";

        const animationProperties = {
            opacity: 0
        };

        new Tween(animationProperties)
            .to({opacity: 1}, Screen.transitionMilliseconds)
            .onUpdate(function() {

                transitionScreenElement.style.opacity = animationProperties.opacity;
            })
            .onComplete(function() {

                if (Screen.current) {

                    Screen.current.htmlElement.style.visibility = "hidden";
                    Screen.current.afterHide();
                    Screen.current.transitionOut = false;
                }

                Screen.current.transitionIn = true;

                screen.beforeShow();
                screen.htmlElement.style.visibility = "visible";

                Screen.current = screen;
            })
            .chain(
                new Tween(animationProperties)
                    .to({opacity: 0}, Screen.transitionMilliseconds)
                    .onUpdate(function() {

                        transitionScreenElement.style.opacity = animationProperties.opacity;
                    })
                    .onComplete(function() {
        
                        transitionScreenElement.style.visibility = "hidden";
                        screen.afterShow();
                        Screen.current.transitionIn = false;

                        Screen.transitioning = null;
                    })
            )
            .start();

        return true;
    }

    // device orientation support

    handleDeviceOrientationUpdate(evt) {

        this.directionDevice = evt.alpha * 0.0174532925;
        this.updateDirection();
    }

    updateDirection() {

        this.directionTarget = this.directionKeyboard;

        if (this.directionDevice) {

            this.directionTarget += this.directionDevice;
        }

        this.directionTarget %= 2 * Math.PI;
    }

    smoothDirection() {

        this.directionPrevious = this.directionCurrent;

        if (this.directionTarget == this.directionCurrent) {

            return;
        }

        if (Math.abs(this.directionTarget - this.directionCurrent) > Math.PI) {

            if (Math.abs(2 * Math.PI + this.directionTarget - this.directionCurrent) < Math.PI) {

                this.directionTarget += 2 * Math.PI;
            }
            else if (Math.abs(this.directionTarget - 2 * Math.PI - this.directionCurrent) < Math.PI) {

                this.directionCurrent += 2 * Math.PI;
            }
        }

        this.directionCurrent = (((this.directionSmoothness - 1) * this.directionCurrent + this.directionTarget) / this.directionSmoothness) % (2 * Math.PI);

        this.directionTarget %= 2 * Math.PI;
        this.directionCurrent %= 2 * Math.PI;

        if (Math.abs(this.directionCurrent - this.directionTarget) < 0.01) {

            this.directionCurrent = this.directionTarget;
        }

        this.directionDiff = (this.directionPrevious + Math.PI) - (this.directionCurrent + Math.PI);

        if (this.directionTarget !== null && Screen.current && this.directionDiff) {

            Screen.current.onDirectionUpdated();
        }
    }

    onDirectionUpdated(direction) {

    }

    // event hooks

    beforeHide() {

        Log.info(`Hiding screen ${this.id}`);
    }

    afterHide() {

        Log.info(`Hidden screen ${this.id}`);
    }

    beforeShow() {

        Log.info(`Showing screen ${this.id}`);
    }

    afterShow() {

        Log.info(`Shown screen ${this.id}`);
    }

    update(time) {
        
        if (Keyboard.down["KeyD"]
            || Keyboard.down["ArrowRight"]
            || Keyboard.down["Numpad6"]
            || Keyboard.down["Digit4"]) {

            this.directionKeyboard -= 0.05;
            this.updateDirection();
        }
        
        if (Keyboard.down["KeyA"]
            || Keyboard.down["ArrowLeft"]
            || Keyboard.down["Numpad4"]
            || Keyboard.down["Digit6"]) {

            this.directionKeyboard += 0.05;
            this.updateDirection();
        }

        this.smoothDirection();
    }
}

window.addEventListener("load", function() {
            
    Screen.runningAsPWA =
        window.matchMedia("(display-mode: fullscreen)").matches
        || (window.navigator && window.navigator.standalone === true);

});
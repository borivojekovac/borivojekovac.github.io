import Screen from "./screen.js";
import Game from "./game.js";
import { screen as screenMenu } from "./screenMenu.js";
import World from "./world.js";

export default class screenLoading extends Screen {

    models = [
        { name: "rocket", url: "./3d/rocket.glb"},
        { name: "asteroid", url: "./3d/asteroid.glb"}
    ];
    resourcesToLoad = this.models.length;

    constructor() {

        super("screenLoading");
    }

    init() {

        super.init();

        this.labelLoading = document.getElementById("labelLoading");

        this.gltfLoader = new THREE.GLTFLoader();

        for (var i = 0; i < this.models.length; i++) {

            const modelInfo = this.models[i];
            this.loadModel(modelInfo.url, true).then(((model) => {

                Game.models[modelInfo.name] = model;
    
                this.onResourceLoaded({
                    type: "model",
                    resource: model
                });
    
            }).bind(this));
        }
    }

    async loadGltf(url) {
        
        return await new Promise((resolve, reject) => {

            this.gltfLoader.load(url, resolve, null, reject);
        });
    }

    async loadModel(url, keepShadow) {

        var gltf = await this.loadGltf(url);

        if (!keepShadow) {

            gltf.scene.traverse( function(child) { 

                if (child.isMesh) {
            
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }

        const model = new THREE.Group();
        while (gltf.scene.children.length > 0) {

            model.add(gltf.scene.children[ 0 ]);
        }

        return model;
    }

    onResourceLoaded(info) {

        const type = info.type;
        const model = info.model;

        if (--this.resourcesToLoad == 0) {

            World.makeThings();

            Screen.transition(screenMenu);
        }
    }

    beforeHide() {

        super.beforeHide();

        this.labelLoading.style.display = "none";
    }

    afterHide() {

        super.afterHide();
    }

    beforeShow() {

        super.beforeShow();

        this.labelLoading.style.display = "";
    }

    afterShow() {

        super.afterShow();
    }

    update(time) {

        document.getElementsByTagName("body")[0].style.setProperty('--backgroundAngle', `${this.directionCurrent / 0.0174532925}deg`);
    }

}

export const screen = new screenLoading();

Screen.current = screen;
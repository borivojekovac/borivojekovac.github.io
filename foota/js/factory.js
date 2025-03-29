import Colors from "./colors.js";
import Thing from "./thing.js";
import StarField from "./thingStarField.js";
import Protagonist from "./thingProtagonist.js";
import Trail from "./thingTrail.js";
import Bullets from "./thingBullets.js";
import Asteroids from "./thingAsteroids.js";
import Explosions from "./thingExplosions.js";

class Factory {

    constructor() {

    }

    getCamera() {

        const camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = 50;

        return camera;
    }

    getRenderer() {

        const renderer = new THREE.WebGLRenderer({
            precision: "lowp",
            powerPreference: "high-performance",
            alpha: true
        });

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.BasicShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setClearColor(Colors.transparent, 0);

        return renderer;
    }

    getLightAmbient() {

        return new Thing(new THREE.AmbientLight(
            Colors.lightAmbient,
            0.5
        ));
    }

    getLightSpot() {

        const lightSpot = new Thing(new THREE.SpotLight(
            Colors.lightSpot,
            1.1
        ));

        lightSpot.object.penumbra = 1;
        lightSpot.object.angle = 0.7;
        lightSpot.object.position.x = 0;
        lightSpot.object.position.y = 0;
        lightSpot.object.position.z = 50;

        return lightSpot;
    }

    getProtagonist() {

        return new Protagonist();
    }

    getTrail() {

        return new Trail();
    }

    getStarField() {

        return new StarField(10000, -2000, 2000, -1200, 1200, -300, -100, 2);
    }

    getBullets() {

        return new Bullets(100);
    }

    getAsteroids() {

        return new Asteroids(100);
    }

    getExplosions() {

        return new Explosions(20);
    }
}

const factory = new Factory();

export default factory;
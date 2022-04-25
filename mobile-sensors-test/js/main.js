import {
    RelativeOrientationSensor,
    AbsoluteOrientationSensor,
} from "./lib/sensors/motion-sensors.js";

class App {

    scene = null;
    camera = null;
    renderer = null;
    cube = null;

    constructor() {

        console.log(`RelativeOrientationSensor check: ${typeof(RelativeOrientationSensor)}`);
        console.log(`AbsoluteOrientationSensor check: ${typeof(AbsoluteOrientationSensor)}`);
        console.log(`THREE check: ${typeof(THREE)}`);
    }

    init() {

        this.initThree();
        this.initGeometry();
        this.initSensor();
    }

    initThree() {

        // Create an empty scene
        this.scene = new THREE.Scene();

        // Create a basic perspective camera
        this.camera = new THREE.PerspectiveCamera(
            
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.camera.position.z = 4;

        // Create a renderer with Antialiasing
        this.renderer = new THREE.WebGLRenderer({

            antialias:true
        });

        // Configure renderer clear color
        this.renderer.setClearColor("#000000");

        // Configure renderer size
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        // Append Renderer to DOM
        document.body.appendChild( this.renderer.domElement );
    }

    initSensor() {

        this.sensor = new AbsoluteOrientationSensor({ frequency: 60 });
        this.sensor.onreading = this.onSensorUpdated;
        this.sensor.onerror = this.onSensorError;
        this.sensor.start();
    }

    heartbeat() {

        requestAnimationFrame( this.heartbeat.bind(this) );

        this.render();
    }

    run() {

        console.log("App running.");

        this.init();
        this.heartbeat();
    }

    initGeometry() {

        // Create a Cube Mesh with basic material
        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: "#433F81" } );
        this.cube = new THREE.Mesh( geometry, material );

        // Add cube to Scene
        this.scene.add( this.cube );
    }

    onSensorUpdated() {

        this.cube.quaternion.fromArray(this.sensor.quaternion);
    }

    onSensorError(event) {

        if (event.error.name == 'NotReadableError') {

            console.log('Sensor is not available.');
        }
        else {

            console.log('Unexpected Sensor error.');
        }
    }

    render() {

        /*this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;*/

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
};

const _app = new App();
_app.run();
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
        this.initThreeGeometry();
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

    heartbeat() {

        requestAnimationFrame( this.heartbeat );

        this.render();
    }

    run() {

        console.log("App running.");

        this.init();
        this.heartbeat();
    }

    initThreeGeometry() {

        // Create a Cube Mesh with basic material
        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: "#433F81" } );
        this.cube = new THREE.Mesh( geometry, material );

        // Add cube to Scene
        this.scene.add( this.cube );
    }

    render() {

        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
};

const _app = new App();
_app.run();
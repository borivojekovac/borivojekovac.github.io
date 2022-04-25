import {
    RelativeOrientationSensor,
    AbsoluteOrientationSensor,
} from "./lib/sensors/motion-sensors.js";

class App {

    scene = null;
    camera = null;
    renderer = null;
    cube = null;

    AccelerometerSensorLabel = null;
    GyroscopeSensorLabel = null;
    LinearAccelerationSensorLabel = null;
    AbsoluteOrientationSensorLabel = null;
    RelativeOrientationSensorLabel = null;
    MagnetometerSensorLabel = null;


    constructor() {

        console.log(`Accelerometer check: ${typeof(Accelerometer)}`);
        console.log(`Gyroscope check: ${typeof(Gyroscope)}`);
        console.log(`LinearAccelerationSensor check: ${typeof(LinearAccelerationSensor)}`);
        console.log(`AbsoluteOrientationSensor check: ${typeof(AbsoluteOrientationSensor)}`);
        console.log(`RelativeOrientationSensor check: ${typeof(RelativeOrientationSensor)}`);
        console.log(`Magnetometer check: ${typeof(Magnetometer)}`);
        console.log(`THREE check: ${typeof(THREE)}`);
    }

    init() {

        this.AccelerometerSensorLabel = document.querySelector("#AccelerometerSensorLabel");
        this.GyroscopeSensorLabel = document.querySelector("#GyroscopeSensorLabel");
        this.LinearAccelerationSensorLabel = document.querySelector("#LinearAccelerationSensorLabel");
        this.AbsoluteOrientationSensorLabel = document.querySelector("#AbsoluteOrientationSensorLabel");
        this.RelativeOrientationSensorLabel = document.querySelector("#RelativeOrientationSensorLabel");
        this.MagnetometerSensorLabel = document.querySelector("#MagnetometerSensorLabel");

        this.initThree();
        this.initGeometry();

        this.initSensor("accelerometer", Accelerometer, this.AccelerometerSensorLabel);
        this.initSensor("gyroscope", Gyroscope, this.GyroscopeSensorLabel);
        this.initSensor("linear acceleration", LinearAccelerationSensor, this.LinearAccelerationSensorLabel);
        this.initSensor("absolute orientation", AbsoluteOrientationSensor, this.AbsoluteOrientationSensorLabel);
        this.initSensor("relative orientation", RelativeOrientationSensor, this.RelativeOrientationSensorLabel);
        this.initSensor("magnetometer", Magnetometer, this.MagnetometerSensorLabel);
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

    initSensor(sensorName, sensorClass, labelElement) {

        console.log(`Initializing ${sensorName}`);
        
        var sensor = new sensorClass({ frequency: 60 });
        sensor.onreading = function() {

            labelElement.innerText = `${sensorName}: ${JSON.stringify(sensor.quaternion)}`;
        }

        sensor.onerror = function(event) {

            if (event.error.name == 'NotReadableError') {

                console.log(`${sensorName} sensor is not available.`);
            }
            else {
    
                console.log(`Unexpected ${sensorName} sensor error.`);
            }
        }

        sensor.start();
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

    render() {

        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
};

const _app = new App();

document.onload = _app.run;
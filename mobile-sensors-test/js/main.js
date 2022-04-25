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

        this.log(`Accelerometer check: ${typeof(Accelerometer)}`);
        this.log(`Gyroscope check: ${typeof(Gyroscope)}`);
        this.log(`LinearAccelerationSensor check: ${typeof(LinearAccelerationSensor)}`);
        this.log(`AbsoluteOrientationSensor check: ${typeof(AbsoluteOrientationSensor)}`);
        this.log(`RelativeOrientationSensor check: ${typeof(RelativeOrientationSensor)}`);
        this.log(`Magnetometer check: ${typeof(Magnetometer)}`);
        this.log(`THREE check: ${typeof(THREE)}`);
    }

    init() {

        try {

            this.log("initializing app...");

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

            return true;
        }
        catch (ex) {

            this.log(`Unable to initialize the app: ${JSON.stringify(ex)}`);

            return false;
        }
    }

    initThree() {

        this.log("initializing Three.js...").

        // init scene
        this.scene = new THREE.Scene();

        // init camera
        this.camera = new THREE.PerspectiveCamera(
            
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.camera.position.z = 4;

        // init renderer
        this.renderer = new THREE.WebGLRenderer({

            antialias:true
        });
        
        this.renderer.setClearColor("#000000");
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        // init DOM
        document.body.appendChild( this.renderer.domElement );
    }

    initSensor(sensorName, sensorClass, labelElement) {

        this.log(`Initializing ${sensorName} sensor...`);

        try {

            var sensor = new sensorClass({ frequency: 60 });

            sensor.onreading = function() {
    
                labelElement.innerText = `${sensorName}: ${JSON.stringify(sensor.quaternion)}`;
            }
    
            sensor.onerror = function(event) {
    
                if (event.error.name == 'NotReadableError') {
    
                    this.log(`${sensorName} sensor is not available.`);
                }
                else {
        
                    this.log(`Unexpected ${sensorName} sensor error.`);
                }
            }
    
            sensor.start();
        }
        catch (ex) {

            this.log(`Unable to initialize ${sensorName} sensor: ${JSON.stringify(ex)}`);
        }
    }

    heartbeat() {

        requestAnimationFrame( this.heartbeat.bind(this) );

        this.render();
    }

    run() {

        if (!this.init()) {

            return;
        }

        this.log("Initializing heartbeat...")
        this.heartbeat();

        this.log("App running.");
    }

    log(text) {

        this.log(text);
    }

    initGeometry() {

        this.log("Initializing 3D geometry...");

        // create cube
        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: "#433F81" } );
        this.cube = new THREE.Mesh( geometry, material );

        // add it to the scene
        this.scene.add( this.cube );
    }

    render() {

        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;

        // render the scene onto DOM
        this.renderer.render(this.scene, this.camera);
    }
};

const _app = new App();

window.addEventListener("load", _app.run);
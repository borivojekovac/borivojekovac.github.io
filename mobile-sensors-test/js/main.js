import {
    Accelerometer,
    Gyroscope,
    LinearAccelerationSensor,
    RelativeOrientationSensor,
    AbsoluteOrientationSensor
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
    LogElement = null;

    constructor() {
    }

    init() {

        try {

            this.LogElement = document.querySelector("#log");

            this.log("initializing app...");

            this.log(`Accelerometer check: ${typeof(Accelerometer)}`);
            this.log(`Gyroscope check: ${typeof(Gyroscope)}`);
            this.log(`LinearAccelerationSensor check: ${typeof(LinearAccelerationSensor)}`);
            this.log(`AbsoluteOrientationSensor check: ${typeof(AbsoluteOrientationSensor)}`);
            this.log(`RelativeOrientationSensor check: ${typeof(RelativeOrientationSensor)}`);
            this.log(`Magnetometer check: ${typeof(Magnetometer)}`);
            this.log(`THREE check: ${typeof(THREE)}`);
    
            this.AccelerometerSensorLabel = document.querySelector("#AccelerometerSensorLabel");
            this.GyroscopeSensorLabel = document.querySelector("#GyroscopeSensorLabel");
            this.LinearAccelerationSensorLabel = document.querySelector("#LinearAccelerationSensorLabel");
            this.AbsoluteOrientationSensorLabel = document.querySelector("#AbsoluteOrientationSensorLabel");
            this.RelativeOrientationSensorLabel = document.querySelector("#RelativeOrientationSensorLabel");
            this.MagnetometerSensorLabel = document.querySelector("#MagnetometerSensorLabel");
    
            this.initThree();
            this.initScene();
    
            this.initSensor("accelerometer", typeof(Accelerometer) == "undefined" ? null : Accelerometer, this.AccelerometerSensorLabel);
            this.initSensor("gyroscope", typeof(Gyroscope) == "undefined" ? null : Gyroscope, this.GyroscopeSensorLabel);
            this.initSensor("linear acceleration", typeof(LinearAccelerationSensor) == "undefined" ? null : LinearAccelerationSensor, this.LinearAccelerationSensorLabel);
            this.initSensor("absolute orientation", typeof(AbsoluteOrientationSensor) == "undefined" ? null : AbsoluteOrientationSensor, this.AbsoluteOrientationSensorLabel);
            this.initSensor("relative orientation", typeof(RelativeOrientationSensor) == "undefined" ? null : RelativeOrientationSensor, this.RelativeOrientationSensorLabel, this.onRelativeOrientationUpdate);
            this.initSensor("magnetometer", typeof(Magnetometer) == "undefined" ? null : Magnetometer, this.MagnetometerSensorLabel);

            return true;
        }
        catch (ex) {

            this.log(`Unable to initialize the app: ${ex.toString()}`);

            return false;
        }
    }

    initThree() {

        this.log("initializing Three.js...");

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

    initSensor(sensorName, sensorClass, labelElement, handler) {

        this.log(`Initializing ${sensorName} sensor...`);

        try {

            var sensor = new sensorClass({ frequency: 60 });

            sensor.onreading = (function() {
    
                labelElement.innerText = `${sensorName}: ${JSON.stringify(sensor.quaternion)}`;
                if (handler) {

                    (handler.bind(this))(sensor);
                }

            }).bind(this);
    
            sensor.onerror = (function(event) {
    
                if (event.error.name == 'NotReadableError') {
    
                    this.log(`${sensorName} sensor is not available.`);
                }
                else {
        
                    this.log(`Unexpected ${sensorName} sensor error.`);
                }

                labelElement.innerText = `${sensorName}: N/A`;

            }).bind(this);
    
            sensor.start();
        }
        catch (ex) {

            this.log(`Unable to initialize ${sensorName} sensor: ${ex.toString()}`);
            labelElement.innerText = `${sensorName}: N/A`;
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

        console.log(text);

        const logEntryElement = document.createElement("div");
        logEntryElement.innerText = text;
        this.LogElement.appendChild(logEntryElement);
    }

    initScene() {

        this.log("Initializing 3D scene...");

        // create cube
        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: "#433F81" } );
        this.cube = new THREE.Mesh( geometry, material );
        this.scene.add( this.cube );

        // create light
        this.light = new THREE.DirectionalLight( 0xffffff, 0.5 );
        this.light.position.x = 0;
        this.light.position.y = -5;
        this.light.position.z = 0;
        this.light.target = this.cube;
        this.scene.add( this.light);
    }

    onRelativeOrientationUpdate(sensor) {

        try {

            this.cube.quaternion.fromArray(sensor.quaternion);
        }
        catch (ex) {

        }
    }

    render() {

        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;

        // render the scene onto DOM
        this.renderer.render(this.scene, this.camera);
    }
};

const _app = new App();

window.addEventListener("load", _app.run.bind(_app));
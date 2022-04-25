import {
    RelativeOrientationSensor,
    AbsoluteOrientationSensor,
} from "./lib/sensors/motion-sensors.js";

class App {

    constructor() {
    }

    run() {

        console.log("App running.");
        console.log(`RelativeOrientationSensor check: ${typeof(RelativeOrientationSensor)}`);
        console.log(`AbsoluteOrientationSensor check: ${typeof(AbsoluteOrientationSensor)}`);
    }
};

const _app = new App();
_app.run();
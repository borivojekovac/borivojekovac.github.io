import Thing from "./thing.js";

export default class Trail extends Thing {

    size = 4;
    maxSegments = 30;
    timeInterval = 1000 / 60;
    lastTimestamp = null;
    segments = [];
    

    constructor() {
     
        super();

        super.object = new THREE.Group();
    }

    trace(x, y, z, direction, time) {

        if (!this.object) {

            return;
        }

        if (this.lastTimestamp && this.lastTimestamp + this.timeInterval > time) {

            return;
        }
        
        this.lastTimestamp = time;
        var segment = null;

        if (this.segments.length < this.maxSegments) {

            const map = new THREE.TextureLoader().load("./img/exhaust.png");
            const material = new THREE.SpriteMaterial({ map: map });
            segment = new THREE.Sprite( material );

            this.segments.push(segment);

            this.object.add(segment);
        }
        else {

            segment = this.segments[0];

            for (var i = 0; i < this.maxSegments - 1; i++) {

                this.segments[i] = this.segments[i + 1];
            }

            this.segments[this.maxSegments - 1] = segment;
        }

        segment.birthday = time;

        segment.position.x = x;
        segment.position.y = y;
        segment.position.z = z;
        segment.material.rotation = 2 * Math.PI * Math.random();
        segment.scale.x = 
        segment.scale.y = 
        segment.scale.z = this.size;

        segment.visible = true;
    }

    update(time) {

        for (var i = 0; i < this.segments.length; i++) {

            const segment = this.segments[i];
            if (!segment.visible) {

                continue;
            }

            const age = (time - segment.birthday) / 200.0;
            const scale = Math.max(0, this.size - age / 1);

            segment.scale.x = 
            segment.scale.y = 
            segment.scale.z = scale;
            segment.material.rotation += 0.1;

            if (scale < 0.01) {

                segment.visible = false;
            }
        }
    }
}
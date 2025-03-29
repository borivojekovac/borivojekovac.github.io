import Thing from "./thing.js";
import World from "./world.js";

export default class StarField extends Thing {

    defaultColor = 0xa24a31;//0x881b0e;//0xed7f65;
    objects = [];

    size = {
        x: null, y: null, z: null
    };

    constructor(count, xMin, xMax, yMin, yMax, zMin, zMax, size) {

        super();
        
        this.size.x = Math.abs(xMax - xMin);
        this.size.y = Math.abs(yMax - yMin);
        this.size.z = Math.abs(zMax - zMin);
        
        this.objects.push(this.getStarFieldSector(count / 4, xMin / 2, xMax / 2, yMin / 2, yMax / 2, zMin, zMax, size));
        this.objects[0].position.x = ((xMax - xMin) / 2 + xMin) / 2;
        this.objects[0].position.y = ((yMax - yMin) / 2 + yMin) / 2;

        this.objects.push(this.getStarFieldSector(count / 4, xMin / 2, xMax / 2, yMin / 2, yMax / 2, zMin, zMax, size));
        this.objects[1].position.x = ((xMax - xMin) / 2 + xMax) / 2;
        this.objects[1].position.y = ((yMax - yMin) / 2 + yMin) / 2;

        this.objects.push(this.getStarFieldSector(count / 4, xMin / 2, xMax / 2, yMin / 2, yMax / 2, zMin, zMax, size));
        this.objects[2].position.x = ((xMax - xMin) / 2 + xMin) / 2;
        this.objects[2].position.y = ((yMax - yMin) / 2 + yMax) / 2;

        this.objects.push(this.getStarFieldSector(count / 4, xMin / 2, xMax / 2, yMin / 2, yMax / 2, zMin, zMax, size));
        this.objects[3].position.x = ((xMax - xMin) / 2 + xMax) / 2;
        this.objects[3].position.y = ((yMax - yMin) / 2 + yMax) / 2;

        const starField = new THREE.Group();
        starField.add(this.objects[0]);
        starField.add(this.objects[1]);
        starField.add(this.objects[2]);
        starField.add(this.objects[3]);

        super.object = starField;
    }

    getStarFieldSector(count, xMin, xMax, yMin, yMax, zMin, zMax, size, color) {

        const starPositions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {

            starPositions[i + 0] = (Math.random() * (xMax - xMin)) + xMin;
            starPositions[i + 1] = (Math.random() * (yMax - yMin)) + yMin;
            starPositions[i + 2] = (Math.random() * (zMax - zMin)) + zMin;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(starPositions, 3)
        );
        const material = new THREE.PointsMaterial({ size: size, color: color ? color : this.defaultColor });
        const starField = new THREE.Points(geometry, material);

        return starField;
    }

    update(time) {

        const x = World.things.protagonist.object.position.x;
        const y = World.things.protagonist.object.position.y;

        for (var i = 0; i < this.objects.length; i++) {

            const xOffset = this.objects[i].position.x - x;

            if (xOffset > (this.size.x / 2 + 1)) {

                this.objects[i].position.x -= this.size.x;
            }
            else if (xOffset < -(this.size.x / 2 + 1)) {

                this.objects[i].position.x += this.size.x;
            }

            const yOffset = this.objects[i].position.y - y;

            if (yOffset > (this.size.y / 2 + 1)) {

                this.objects[i].position.y -= this.size.y;
            }
            else if (yOffset < -(this.size.y / 2 + 1)) {

                this.objects[i].position.y += this.size.y;
            }
        }
    }
}
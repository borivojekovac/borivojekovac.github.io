import Thing from "./thing.js";
import Colors from "./colors.js";

export default class Bullets extends Thing {

    objects = [];
    speed = 1.5;
    lifeSpan = 1000;

    constructor(number) {

        super();

        const geometry = new THREE.BoxGeometry(0.2, 1.5, 0.2); 
        const material = new THREE.MeshLambertMaterial({ color: Colors.fire }); 

        const bullets = new THREE.Group();

        for (var i = 0; i < number; i++) {

            const cube = new THREE.Mesh(geometry, material); 

            cube.position.x = 0;
            cube.position.y = 0;
            cube.position.z = 0;
            cube.visible = false;

            this.objects.push(cube);
            bullets.add(cube);
        }

        super.object = bullets;
    }

    shoot(x, y, direction) {

        for (var i = 0; i < this.objects.length; i++) {

            if (!this.objects[i].visible) {

                this.objects[i].position.x = x + 2 * Math.sin(-direction);
                this.objects[i].position.y = y + 2 * Math.cos(-direction);
                this.objects[i].rotation.z = direction;
                this.objects[i].speed = this.speed;
                this.objects[i].visible = true;
                return;
            }
        }
    }

    update(time) {

        for (var i = 0; i < this.objects.length; i++) {

            if (this.objects[i].visible) {

                this.objects[i].position.x += this.objects[i].speed * Math.sin(-this.objects[i].rotation.z);
                this.objects[i].position.y += this.objects[i].speed * Math.cos(-this.objects[i].rotation.z);

                if (!this.objects[i].deathTime) {

                    this.objects[i].deathTime = time + this.lifeSpan;
                }
                else if (time > this.objects[i].deathTime) {

                    delete this.objects[i].deathTime;
                    this.objects[i].visible = false;
                }
            }
        }
    }
}
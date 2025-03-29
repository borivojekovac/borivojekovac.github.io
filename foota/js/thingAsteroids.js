import Thing from "./thing.js";
import Game from "./game.js";
import Colors from "./colors.js";
import World from "./world.js";

export default class Asteroids extends Thing {

    objects = [];

    speedMin = 0.05;
    speedMax = 0.15;
    momentumMin = 0.1;
    momentumMax = 0.2;

    fenceSize = 50;
    safeZone = 50;

    constructor(number) {

        super();

        const geometry = new THREE.OctahedronGeometry(1);
        const material = new THREE.MeshLambertMaterial({ color: Colors.primary }); 

        const asteroids = new THREE.Group();

        for (var i = 0; i < number; i++) {

            const asteroidMesh = Game.models.asteroid.clone();

            asteroidMesh.position.x = 0;
            asteroidMesh.position.y = 0;
            asteroidMesh.position.z = 0;
            asteroidMesh.visible = false;

            this.objects.push(asteroidMesh);
            asteroids.add(asteroidMesh);
        }

        super.object = asteroids;
    }

    spawnRandom(scale) {

        var x = World.things.protagonist.object.position.x;
        var y = World.things.protagonist.object.position.y;

        while (Math.sqrt((World.things.protagonist.object.position.x - x)*(World.things.protagonist.object.position.x - x) + (World.things.protagonist.object.position.y - y)*(World.things.protagonist.object.position.y - y)) < this.safeZone) {

            x = World.things.protagonist.object.position.x - this.fenceSize + Math.random() * this.fenceSize * 2;
            y = World.things.protagonist.object.position.y - this.fenceSize + Math.random() * this.fenceSize * 2;
        }

        this.spawn(
            scale ? scale : 4,
            x,
            y,
            2 * Math.PI * Math.random()
        );
    }

    spawn(scale, x, y, direction) {

        for (var i = 0; i < this.objects.length; i++) {

            if (!this.objects[i].visible) {

                this.objects[i].position.x = x;
                this.objects[i].position.y = y;

                this.objects[i].scale.x = 
                this.objects[i].scale.y = 
                this.objects[i].scale.z = scale;

                this.objects[i].angleMomentum = {
                    x: Math.random() * (this.momentumMax - this.momentumMin) - (this.momentumMax - this.momentumMin) / 2,
                    y: Math.random() * (this.momentumMax - this.momentumMin) - (this.momentumMax - this.momentumMin) / 2,
                    z: Math.random() * (this.momentumMax - this.momentumMin) - (this.momentumMax - this.momentumMin) / 2,
                };

                this.objects[i].direction = direction;
                this.objects[i].speed = this.speedMin + Math.random() * (this.speedMax - this.speedMin);

                this.objects[i].visible = true;
                return;
            }
        }
    }

    killAll() {

        for (var i = 0; i < this.objects.length; i++) {

            this.objects[i].visible = false;
        }
    }

    update(time) {

    }
}
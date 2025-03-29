import Thing from "./thing.js";
import Game from "./game.js";

export default class Explosions extends Thing {

    maxExplosions = 20;
    minProximity = 0;
    defaultSize = 1;
    
    constructor(number) {

        super();

        super.object = new THREE.Group();

        if (number) {

            this.maxExplosions = number;
        }

        for (var i = 0; i < this.maxExplosions; i++) {

            new THREE.TextureLoader().load("./img/explosion.png", (texture) => {
                
                const explosion = Game.spriteMixer.ActionSprite( texture, 4, 4 );

                explosion.action = Game.spriteMixer.Action(explosion, 0, 6, 1000 / 15);
                explosion.action.hideWhenFinished = true;
                explosion.visible = false;

                this.object.add(explosion);
            });
        }
}

    explode(x, y, z, size) {

        for (var i = 0; i < this.maxExplosions; i++) {

            const explosion = this.object.children[i];
            if (explosion.visible) {

                if (
                    (explosion.position.x - x) * (explosion.position.x - x)
                    + (explosion.position.y - y) * (explosion.position.y - y)
                    < (this.minProximity * this.minProximity)
                ) {

                    return;
                }
            }
        }

        for (var i = 0; i < this.maxExplosions; i++) {

            const explosion = this.object.children[i];
            if (!explosion.visible) {

                explosion.position.x = x;
                explosion.position.y = y;
                explosion.position.z = z;
                explosion.scale.x = 
                explosion.scale.y = 
                explosion.scale.z = size;

                explosion.visible = true;
                explosion.action.playOnce();
                break;
            }
        }
    }

    update(time) {
    }
}
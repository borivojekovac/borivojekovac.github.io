import Thing from "./thing.js";
import Colors from "./colors.js";
import Game from "./game.js";

export default class Protagonist extends Thing {

    constructor(scale) {

        super();

        const group = new THREE.Group();

        const shipMesh = Game.models.rocket.clone();

        if (scale) {

            shipMesh.scale.x = 
            shipMesh.scale.y = 
            shipMesh.scale.z = scale;
        }
        
        shipMesh.position.x = 0;
        shipMesh.position.y = 0;
        shipMesh.position.z = 0;

        group.add(shipMesh);
        
        const exhaustGeometry = new THREE.ConeGeometry(0.2, 1, 3);
        const exhaustMaterial = new THREE.MeshLambertMaterial({ color: Colors.fire, transparent: true, opacity: 0.5 }); 
        const exhaustMesh = new THREE.Mesh(exhaustGeometry, exhaustMaterial); 

        exhaustMesh.position.x = 0;
        exhaustMesh.position.y = -1.7;
        exhaustMesh.position.z = 0;
        exhaustMesh.rotation.z = Math.PI;
        exhaustMesh.visible = false;

        group.add(exhaustMesh);

        const fireMap = new THREE.TextureLoader().load("./img/fire.png");
        const fireMaterial = new THREE.SpriteMaterial({ map: fireMap });
        const fireSprite = new THREE.Sprite( fireMaterial );
        fireSprite.scale.x = 
        fireSprite.scale.y = 
        fireSprite.scale.z = 4;
        fireSprite.position.y = 3;

        group.add(fireSprite);

        super.object = group;
    }

    update(time) {

        super.update(time);
    }
}
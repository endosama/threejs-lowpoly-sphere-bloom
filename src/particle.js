import { Vector3 } from 'three';

export class Particle {
    constructor({
        position,
        color,
        size,
        mesh
    }) {
        this.initialPosition = position;
        this.mesh = mesh;
        this.dynamicVerticesState = [];
        for (var i = 0; i < mesh.geometry.attributes.position.array.length; i++) {
            this.dynamicVerticesState[i] = {
                direction: Math.random() > 0.5,
                state: Math.random()
            }
        }
        this.position = position;
        this.color = color;
        this.size = size;
        this.speed = new Vector3(Math.random(), 0.5 + Math.random() * .5, 0);
        this.rotationSpeed = new Vector3(0.5 + Math.random() * .5, 0.5 + Math.random() * .5, 0.5 + Math.random() * .5).multiplyScalar(0.01);
        this.growSpeed = Math.random();
    }
    move(deltaT) {
        this.position.x += this.speed.x * deltaT;
        this.position.y += this.speed.y * deltaT;
        this.position.z += this.speed.z * deltaT;
        return this.position;
    }
}
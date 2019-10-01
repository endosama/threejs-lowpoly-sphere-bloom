import {
    SphereGeometry,
} from 'three';
export class Octahedron {
    constructor(radius, resolution) {
        this.radius = radius;
        this.resolution = resolution;
    }
    generate() {
        const geometry = new SphereGeometry(this.radius, this.resolution, this.resolution);
        return geometry;
    }
}

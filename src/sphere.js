import forEach from 'lodash/forEach';
import cloneDeep from 'lodash/cloneDeep';
import {
    MeshLambertMaterial,
    Mesh,
    MeshPhongMaterial,
    BufferGeometry,
    Vector3
} from 'three';
import {
    Octahedron,
} from './octahedron';
import * as THREE from 'three';

import bumpMapTexture from '@images/bumpmap.jpg';
import emissionMapTexture from '@images/emissionmap.png';
class CustomGeometry {
    constructor(geometry) {
        this.initialGeometry = geometry;
        this.bufferGeometry = new BufferGeometry();
        this.bufferGeometry.fromGeometry(geometry);
        this.bufferGeometry.dynamic = true;
        this.bufferGeometry.position = new Vector3(0, 0, 50);
        this.originalVertices = cloneDeep(this.getVertices());
        this.bufferGeometry.computeBoundingSphere();
        this.bufferGeometry.computeFaceNormals();
    }

    getVertices() {
        return this.bufferGeometry.attributes.position.array;
    }
}



export class DynamicSphere {
    constructor(width, height, camera) {
        this.rot = 1;
        this.camera = camera;
        this.state = 0;
        this.mouseActivityRateo = 0;
        if (height > width) {
            this.radius = width / 3;
        } else {
            this.radius = height / 3;
        }
        this.init(width, height);
    }
    init(width, height) {
        this.SCREEN_HEIGHT = height;
        this.SCREEN_WIDTH = width;
        this.aspect = this.SCREEN_WIDTH / this.SCREEN_HEIGHT;
        this.createSphere();
    }
    getSphere() {
        return this.mesh;
    }
    getCylinder() {
        this.cylinder;
    }
    createSphere() {
        const octahedron = new Octahedron(this.radius, 15, 15);
        const octGeometry = octahedron.generate();
        this.geometry = new CustomGeometry(octGeometry);

        const emissionMap = new THREE.TextureLoader().load(emissionMapTexture);
        const bumpMap = new THREE.TextureLoader().load(bumpMapTexture);

        let material = new MeshPhongMaterial({
            color: new THREE.Color(40 / 255, 30 / 255, 12 / 255),
            // color: new THREE.Color(150 / 255, 50 / 255, 50 / 255),
            shading: THREE.FlatShading,
            side: THREE.DoubleSide,
            wireframe: false,
            bumpMap: bumpMap,
            vertexColors: THREE.FaceColors,
            emissiveMap: emissionMap,
            emissive: new THREE.Color(120 / 255, 110 / 255, 50 / 255),
            emissiveIntensity: .2,
            // reflectivity: .1,
            // refractionRatio: .1,
        });
        // material = new THREE.MeshBasicMaterial({
        //     color: new THREE.Color(20 / 255, 20 / 255, 20 / 255)
        // });

        const sphere = new Mesh(this.geometry.bufferGeometry, material);
        sphere.name = 'Sphere';
        sphere.receiveShadow = true;
        sphere.position.set(-20, 0, -this.radius + 15)
        this.mesh = sphere;
    }
    createCylinder() {
        const cylinderMaterial = new MeshLambertMaterial({
            color: 0xffaaaa,
            shading: THREE.FlatShading,
            side: THREE.DoubleSide,
            wireframe: false,
            vertexColors: THREE.FaceColors,
            overdraw: true,
            reflectivity: .6,
            refractionRatio: 1,
        });

        const cylinderGeometry = new THREE.CylinderGeometry();
        cylinderGeometry.scale(1, .2, 1);
        this.cylinder = new Mesh(cylinderGeometry, cylinderMaterial);
        this.cylinder.translateY(-100);
    }
    setPulses(pulse) {
        this.pulse = pulse;
    }
    updateRoutine({
        mouseActivityRateo,
        timedelta,
        dynamicSphere
    }) {
        if (dynamicSphere) {
            forEach(this.pulse, (p) => {
                p.propagate(mouseActivityRateo, {
                    baseRadius: this.radius,
                    timedelta
                });
            });
        }
        this.mesh.rotation.y += 0.0001 * (1 + mouseActivityRateo);
        return true;
    }
}

import {
    PerspectiveCamera,
    Scene,
    AmbientLight,
    WebGLRenderer,
    Mesh,
    Vector3,
} from 'three';

import * as THREE from 'three';
import { windowResizeSuscribe } from './windowResizeService';
import { DeviceDetector } from './deviceDetector';
import { DynamicSphere } from './sphere';
import { Particle } from './particle';
import './postprocess';
export class Engine {
    constructor() {
        this.rot = 1;
        this.state = 0;
        this.mouseActivityRateo = 0;
        this.particles = [];
        this.cpuPerformanceMeasuresCount = 0;
        this.cpuPerformanceMeasures = 0;
    }
    init(width, height, c) {
        this.SCREEN_HEIGHT = height;
        this.SCREEN_WIDTH = width;
        this.container = c;
        this.viewport = {
            x: width,
            y: height,
        };
        this.aspect = this.SCREEN_WIDTH / this.SCREEN_HEIGHT;
        this.createScene();
    }
    getMainModel() {
        return this.sphere;
    }
    setupLights() {
        this.light = new THREE.DirectionalLight(0xffffff, 1);
        this.light.position.set(1, 1, 1).normalize();
        const lightTargetObject = new THREE.Object3D();
        lightTargetObject.position.set(0, 0, -400);
        this.scene.add(lightTargetObject);
        this.light.target = lightTargetObject;
        const ambient = new AmbientLight(0xffffff, 0.1);
        this.scene.add(this.light);
        this.scene.add(ambient);
    }
    generateCubeParticles() {
        const particlesCount = 30;
        this.sizes = [];
        const mainColor = new THREE.Color(227 / 255, 214 / 255, 135 / 255);
        const specularColor = new THREE.Color(245 / 255, 230 / 255, 145 / 255);
        var material = new THREE.MeshPhongMaterial({
            color: mainColor,
            specular: specularColor,
            shininess: 10,
            flatShading: true,
            reflectivity: 20,
        })
        for (var i = 0; i < particlesCount; i++) {
            const x = this.SCREEN_WIDTH * (Math.random() * .8 - 0.4);
            const y = this.SCREEN_HEIGHT * (Math.random() * .8 - 0.4);
            const scale = 5 + Math.random() * 15;
            const geometry = new THREE.BoxBufferGeometry(scale, scale, scale)
            const mesh = new Mesh(geometry, material);
            const pX = x; //x; //+ Math.random() * 500 - 250
            const pY = y; //y; // + Math.random() * 500 - 250
            const pZ = 60; //Math.random() * 500 - 250

            mesh.position.x = pX;
            mesh.position.y = pY;
            mesh.position.z = pZ;

            const particle = new Particle({
                mesh: mesh,
                position: new Vector3(pX, pY, pZ),
                size: scale,
                color: mainColor
            });

            this.particles.push(particle);
            this.scene.add(particle.mesh);
        }

    }
    createScene() {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(30, this.aspect, 1, 1500);

        // Tablet
        if (DeviceDetector.isSmartphone) {
            this.camera.position.z = 800;
        } else if (DeviceDetector.isTablet) {
            this.camera.position.z = 1000;
        } else {
            this.camera.position.z = 1300;
        }

        this.sphere = new DynamicSphere(this.SCREEN_WIDTH, this.SCREEN_HEIGHT, this.camera);
        this.sphere.mesh.depthWrite = false;
        this.scene.add(this.sphere.mesh);
        this.setupLights();
        this.generateCubeParticles();
        this.renderer = new WebGLRenderer({
            antialias: true,
        });
        this.renderer.setClearColor(0x010101, 1);
        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        this.container.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0x303030));

        var renderScene = new THREE.RenderPass(this.scene, this.camera);

        var params = {
            exposure: 1.3,
            bloomStrength: 3.0,
            bloomThreshold: 0,
            bloomRadius: 0.3,
        };
        var bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = params.bloomRadius;

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.renderToScreen = true;
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);

        this.subscriber = windowResizeSuscribe(() => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            if (newWidth !== this.SCREEN_WIDTH || newHeight !== this.SCREEN_HEIGHT) {
                this.SCREEN_HEIGHT = newHeight;
                this.SCREEN_WIDTH = newWidth;
                this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
            }
        });
        this._internalUpdate();
    }

    start(params) {
        this.fps = 0;
        this.updateRoutine(params);
    }
    setPulses(pulse) {
        this.sphere.setPulses(pulse);
    }

    _internalUpdate() {
        this.composer.render();
        this.lastUpdateTime = Date.now();
        this.fps++;
    }

    updateParticles({
        particleMovement
    }) {
        if (!particleMovement) {
            return;
        }
        const deltaX = this.SCREEN_WIDTH * 0.4;
        const deltaY = this.SCREEN_HEIGHT * 0.4;
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const particleMesh = particle.mesh;
            particleMesh.position.add(particle.speed);
            if (particleMesh.position.y < -deltaY || particleMesh.position.y > deltaY) {
                particleMesh.position.set(
                    particle.initialPosition.x,
                    deltaY * (particle.speed.y < 0 ? 1 : -1),
                    particle.initialPosition.z
                );
            }
            if (particleMesh.position.x < -deltaX || particleMesh.position.x > deltaX) {
                particleMesh.position.set(
                    deltaX * (particle.speed.x < 0 ? 1 : -1),
                    particle.initialPosition.y,
                    particle.initialPosition.z
                );
            }

            particleMesh.rotation.x += particle.rotationSpeed.x;
            particleMesh.rotation.y += particle.rotationSpeed.x;
            particleMesh.rotation.z += particle.rotationSpeed.x;
        }
    }

    updateRoutine(params) {
        var t = performance.now();
        var timedelta = this.lastPerformance ? (t - this.lastPerformance) / 1000 : 0;
        this.lastPerformance = t;
        if (this.pauseUpdate) {
            return;
        }
        if (this.lastTimeMouseMove && new Date() - this.lastTimeMouseMove > 100) {
            this.mouseActivityRateo *= 0.98;
        }
        if (this.mouseActivityRateo < 0.01) {
            this.mouseActivityRateo = 0;
        }

        this.sphere.mesh.rotation.y += 0.001;
        this.sphere.updateRoutine({
            mouseActivityRateo: this.mouseActivityRateo,
            timedelta,
            ...params
        });
        this.updateParticles(params);
        this._internalUpdate();
        requestAnimationFrame(() => this.updateRoutine(params));
    }

}



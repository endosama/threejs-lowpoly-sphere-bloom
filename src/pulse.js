import {
    Vector3
} from 'three';
import cloneDeep from 'lodash/cloneDeep';

const waveAmplitude = 25;
const waveLength = 3;

export class Pulse {
    constructor(gametime, position, item) {
        this.time = gametime;
        this.position = position;
        this.duration = 2500;
        this.item = item;
        this.originalVertices = cloneDeep(item.geometry.attributes.position.array);

        this.seed = new Vector3();
        this.seed.x = Math.random() * 2 + 2;
        this.seed.y = Math.random() * 2 + 2;
        this.seed.z = Math.random() * 2 + 2;
        this.speed = new Vector3();
        this.speed.x = Math.random() * 1 + 2;
        this.speed.y = Math.random() * 1 + 2;
        this.speed.z = Math.random() * 1 + 2;
        this.seedDeltaRateo = 0.2;
        this.speedDeltaRateo = 0.4;
        this.originalVerticesV3 = [];
        this.distances = [];
        for (let i = 0; i < this.originalVertices.length / 3; i++) {
            this.originalVerticesV3[i] = new Vector3(
                this.originalVertices[i * 3],
                this.originalVertices[i * 3 + 1],
                this.originalVertices[i * 3 + 2]
            );
            this.distances[i] = this.originalVerticesV3[i].distanceTo(new Vector3(this.position.x, this.position.y, this.originalVerticesV3[i].z));
        }
    }
    propagate(mouseActivityRateo, {
        baseRadius,
        timedelta
    }) {
        const vertices = this.item.geometry.attributes.position.array;
        const deltaTime = ((Date.now() - this.time));
        const delta = (deltaTime % this.duration) / this.duration;
        const deltaSin = Math.sin(delta * Math.PI);
        const deltaSinSeed = Math.sin(((deltaTime % (this.seedDeltaRateo)) / (this.seedDeltaRateo)) * Math.PI);
        const deltaSinSpeed = Math.sin(((deltaTime % this.speedDeltaRateo) / this.speedDeltaRateo) * Math.PI);
        const _seed = cloneDeep(this.seed).multiplyScalar(deltaSinSeed + 1);
        const _speed = cloneDeep(this.seed).multiplyScalar(deltaSinSpeed + 1);
        const isFirstPropagate = this.lastEnlargeValues === undefined;

        for (let i = 0; i < vertices.length / 3; i++) {
            const vertex = this.originalVerticesV3[i];
            const normalized = vertex.normalize();

            const dx = (vertex.x % _speed.x) * _seed.x;
            const dy = (vertex.y % _speed.y) * _seed.y;
            const dz = (vertex.z % _speed.z) * _seed.z;
            const positionDelta = Math.sin((dx + dy + dz) * 15) * 10;
            const enlargeValue = Math.sin(((waveLength + mouseActivityRateo / 3) * (deltaSin + positionDelta)) % Math.PI) * (waveAmplitude + (10 * deltaSin) + (mouseActivityRateo * 10));

            let enlarge = !isFirstPropagate ?
                this.lastEnlargeValues[i] + (enlargeValue - this.lastEnlargeValues[i]) * timedelta :
                enlargeValue;

            if (this.lastEnlargeValues === undefined) {
                this.lastEnlargeValues = [];
            }
            this.lastEnlargeValues[i] = enlarge;

            const newVertex = normalized.multiplyScalar(baseRadius + enlarge);
            vertices[i * 3] = (newVertex.x);
            vertices[i * 3 + 1] = (newVertex.y);
            vertices[i * 3 + 2] = (newVertex.z);
        }

        this.item.geometry.attributes.position.needsUpdate = true;
        // this.item.geometry.computeFaceNormals();
        // this.item.geometry.computeVertexNormals();
    }
}

import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { RigidBody, MeshCollider } from '@react-three/rapier'
import { mergeVertices } from 'three-stdlib'

export function RoadWalls({ modelPath, thresholdAngle = 20 }) {
	const { scene } = useGLTF(modelPath)

	const {roadGeometry } = useMemo(() => {
		const allRoadVertices = [];
		const allRoadIndices = [];
		let roadIndexOffset = 0;

		scene.updateMatrixWorld(true);

		scene.traverse((child) => {
			if (child.isMesh) {
				const posAttr = child.geometry.attributes.position;
				const indexAttr = child.geometry.index;

				if (posAttr && indexAttr) {
					for (let i = 0; i < posAttr.count; i++) {
						const v = new THREE.Vector3(
							posAttr.getX(i),
							posAttr.getY(i),
							posAttr.getZ(i)
						);
						v.applyMatrix4(child.matrixWorld);
						allRoadVertices.push(v.x, v.y, v.z);
					}

					for (let i = 0; i < indexAttr.count; i++) {
						allRoadIndices.push(indexAttr.getX(i) + roadIndexOffset);
					}

					roadIndexOffset += posAttr.count;
				}

				let tempGeo = child.geometry.clone();
				tempGeo.deleteAttribute('uv'); 
				tempGeo.deleteAttribute('normal'); 
				tempGeo = mergeVertices(tempGeo, 0.01);
				tempGeo.computeVertexNormals();

				const edges = new THREE.EdgesGeometry(tempGeo, thresholdAngle);
				const linePos = edges.attributes.position.array;

				if (linePos.length === 0) return;

				const v1 = new THREE.Vector3();
				const v2 = new THREE.Vector3();
			}
		});

		const roadGeo = allRoadVertices.length > 0 ? (() => {
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.Float32BufferAttribute(allRoadVertices, 3));
			geometry.setIndex(allRoadIndices);
			geometry.computeVertexNormals();
			return geometry;
		})() : null;

		return {roadGeometry: roadGeo };

	}, [scene, thresholdAngle]);

	return (
		<>
			{roadGeometry && (
				<RigidBody type="fixed" colliders={false}>
					<MeshCollider type="trimesh">
						<mesh geometry={roadGeometry}>
							<meshBasicMaterial visible={false} />
						</mesh>
					</MeshCollider>
				</RigidBody>
			)}
		</>
	)
}
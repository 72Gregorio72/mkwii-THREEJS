import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { RigidBody, MeshCollider } from '@react-three/rapier'
import { mergeVertices } from 'three-stdlib'

export function RoadWalls({ modelPath, wallHeight = 3, thresholdAngle = 20 }) {
	const { scene } = useGLTF(modelPath)

	const { wallGeometry, roadGeometry } = useMemo(() => {
		const allWallVertices = [];
		const allWallIndices = [];
		const allRoadVertices = [];
		const allRoadIndices = [];
		let wallIndexOffset = 0;
		let roadIndexOffset = 0;

		scene.updateMatrixWorld(true);

		scene.traverse((child) => {
			if (child.isMesh) {
				// --- COLLIDER STRADA (Mesh originale) ---
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

				// --- COLLIDER MURI (EdgesGeometry) ---
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

				for (let i = 0; i < linePos.length; i += 6) {
					v1.set(linePos[i], linePos[i+1], linePos[i+2]);
					v2.set(linePos[i+3], linePos[i+4], linePos[i+5]);

					v1.applyMatrix4(child.matrixWorld);
					v2.applyMatrix4(child.matrixWorld);

					allWallVertices.push(v1.x, v1.y, v1.z); 
					allWallVertices.push(v2.x, v2.y, v2.z); 
					allWallVertices.push(v1.x, v1.y + wallHeight, v1.z); 
					allWallVertices.push(v2.x, v2.y + wallHeight, v2.z); 

					allWallIndices.push(
						wallIndexOffset, wallIndexOffset + 1, wallIndexOffset + 2, 
						wallIndexOffset + 1, wallIndexOffset + 3, wallIndexOffset + 2
					);
					
					wallIndexOffset += 4;
				}
			}
		});

		const wallGeo = allWallVertices.length > 0 ? (() => {
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.Float32BufferAttribute(allWallVertices, 3));
			geometry.setIndex(allWallIndices);
			geometry.computeVertexNormals();
			return geometry;
		})() : null;

		const roadGeo = allRoadVertices.length > 0 ? (() => {
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.Float32BufferAttribute(allRoadVertices, 3));
			geometry.setIndex(allRoadIndices);
			geometry.computeVertexNormals();
			return geometry;
		})() : null;

		return { wallGeometry: wallGeo, roadGeometry: roadGeo };

	}, [scene, wallHeight, thresholdAngle]);

	return (
		<>
			{/* Collider Strada */}
			{roadGeometry && (
				<RigidBody type="fixed" colliders={false}>
					<MeshCollider type="trimesh">
						<mesh geometry={roadGeometry}>
							<meshBasicMaterial visible={false} />
						</mesh>
					</MeshCollider>
				</RigidBody>
			)}

			{/* Collider Muri */}
			{wallGeometry && (
				<RigidBody type="fixed" colliders={false}>
					<MeshCollider type="trimesh">
						<mesh geometry={wallGeometry}>
							<meshBasicMaterial visible={false} side={THREE.DoubleSide} />
						</mesh>
					</MeshCollider>
				</RigidBody>
			)}
		</>
	)
}
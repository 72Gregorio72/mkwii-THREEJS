import React from 'react';

export function Banana ({ position }) {
	  return (
		<mesh>
			<gltfModel position={position} src="/models/items/banana.glb" />
		</mesh>
	  );
}
(function () {
  window.renderProject = function (kind) {
    if (window.orangeScene) window.orangeScene.dispose();
    const THREE = window.THREE;
    const canvas = document.getElementById('sculpture-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(1.5);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(kind === 'motion' ? '#171c1b' : '#e0ebe5');
    const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(5.8, 4.8, 7.6);
    camera.lookAt(0, 0.45, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x384b42, 2.1));
    const light = new THREE.DirectionalLight(0xffffff, 4.5);
    light.position.set(-3, 6, 4);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.camera.left = light.shadow.camera.bottom = -6;
    light.shadow.camera.right = light.shadow.camera.top = 6;
    light.shadow.normalBias = 0.025;
    light.shadow.radius = 4;
    scene.add(light);
    const fill = new THREE.DirectionalLight(kind === 'motion' ? 0xd2e7df : 0xffffff, 2);
    fill.position.set(5, 3, -4);
    scene.add(fill);
    const group = new THREE.Group();
    scene.add(group);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: kind === 'motion' ? 0x171c1b : 0xe0ebe5, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.24;
    floor.receiveShadow = true;
    scene.add(floor);

    function box(w, h, d, material, x, y, z) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    }
    function cylinder(radius, length, material, x, y, z, axis) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 48), material);
      mesh.position.set(x, y, z);
      if (axis === 'x') mesh.rotation.z = Math.PI / 2;
      if (axis === 'z') mesh.rotation.x = Math.PI / 2;
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    }

    if (kind === 'motion') {
      camera.position.set(5.7, 5.6, 7.4);
      camera.lookAt(0, 0.15, 0);
      const metal = new THREE.MeshStandardMaterial({ color: 0xc0c9c4, roughness: 0.24, metalness: 0.75 });
      const black = new THREE.MeshStandardMaterial({ color: 0x222825, roughness: 0.45, metalness: 0.38 });
      const rubber = new THREE.MeshStandardMaterial({ color: 0x101310, roughness: 0.85, metalness: 0.1 });
      const red = new THREE.MeshStandardMaterial({ color: 0xdf432f, roughness: 0.42, metalness: 0.12 });
      const screw = new THREE.MeshStandardMaterial({ color: 0x434d48, roughness: 0.3, metalness: 0.9 });
      box(5.5, 0.26, 1.5, black, 0, 0, 0);
      for (let j = -1; j <= 1; j += 2) {
        cylinder(0.12, 5.4, metal, 0, 0.26, j * 0.61, 'x');
        box(5.3, 0.075, 0.17, metal, 0, 0.23, j * 0.33);
        for (let i = -2; i <= 2; i++) {
          cylinder(0.045, 0.018, screw, i * 1.03, 0.278, j * 0.33);
        }
        box(0.32, 0.61, 1.7, black, j * 2.65, 0.17, 0);
        for (const z of [-0.69, 0.69]) cylinder(0.046, 0.06, metal, j * 2.65, 0.50, z);
      }
      box(1.22, 0.22, 1.26, red, 0.25, 0.44, 0);
      box(0.78, 0.12, 1.04, black, 0.25, 0.59, 0);
      for (const x of [-0.2, 0.7]) for (const z of [-0.45, 0.45]) cylinder(0.055, 0.035, metal, x, 0.585, z);
      for (let i = 0; i < 13; i++) box(0.022, 0.065, 0.84, red, -0.07 + i * 0.052, 0.69, 0);
      box(0.92, 0.78, 0.86, black, -2.48, 0.72, 0);
      box(0.11, 0.79, 0.89, metal, -1.97, 0.72, 0);
      cylinder(0.16, 0.16, metal, -1.84, 0.72, 0, 'x');
      cylinder(0.14, 3.93, metal, 0.20, 0.70, 0, 'x');
      const thread = new THREE.Group();
      for (let i = 0; i < 98; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.012, 5, 24), screw);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(-1.75 + i * 0.04, 0.70, 0);
        thread.add(ring);
      }
      group.add(thread);
      for (const y of [0.47, 0.97]) for (const z of [-0.29, 0.29]) cylinder(0.04, 0.14, screw, -1.9, y, z, 'x');
      cylinder(0.20, 0.30, black, 2.25, 0.70, 0, 'x');
      group.rotation.y = -0.19;
    } else {
      camera.position.set(6.0, 5.5, 9.0);
      camera.lookAt(0, 1.65, 0);
      const material = new THREE.MeshStandardMaterial({ color: 0xc8ded2, roughness: 0.62, metalness: 0.06, side: THREE.DoubleSide });
      const rings = 160;
      const segments = 120;
      const vertices = [];
      const indices = [];
      for (let i = 0; i <= rings; i++) {
        const t = i / rings;
        const y = t * 3.65;
        const radius = 0.55 + Math.sin(t * Math.PI) * 0.62 + 0.10 * Math.sin(t * Math.PI * 3.0);
        for (let j = 0; j <= segments; j++) {
          const theta = j / segments * Math.PI * 2;
          const r = radius + 0.09 * Math.sin(theta * 14 + t * 8);
          vertices.push(r * Math.cos(theta), y, r * Math.sin(theta));
          if (i < rings && j < segments) {
            const a = i * (segments + 1) + j;
            const b = a + segments + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
          }
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const vase = new THREE.Mesh(geometry, material);
      vase.castShadow = vase.receiveShadow = true;
      group.add(vase);
      const wireMaterial = new THREE.LineBasicMaterial({ color: 0x618d78, transparent: true, opacity: 0.32 });
      for (let i = 1; i < 75; i++) {
        const t = i / 75;
        const radius = 0.55 + Math.sin(t * Math.PI) * 0.62 + 0.10 * Math.sin(t * Math.PI * 3.0);
        const points = [];
        for (let j = 0; j <= 180; j++) {
          const theta = j / 180 * Math.PI * 2;
          const r = radius + 0.09 * Math.sin(theta * 14 + t * 8) + 0.008;
          points.push(new THREE.Vector3(r * Math.cos(theta), t * 3.65, r * Math.sin(theta)));
        }
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), wireMaterial));
      }
      const pedestal = new THREE.MeshStandardMaterial({ color: 0xb3c7ba, roughness: 0.67, metalness: 0.05 });
      cylinder(1.6, 0.14, pedestal, 0, -0.1, 0);
      const grid = new THREE.GridHelper(8, 20, 0x9aad9f, 0xc0cfc3);
      grid.position.y = -0.225;
      grid.material.transparent = true;
      grid.material.opacity = 0.5;
      scene.add(grid);
      group.rotation.y = 0.28;
    }
    renderer.render(scene, camera);
    return canvas.toDataURL('image/png');
  };
})();

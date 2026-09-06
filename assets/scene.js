(function () {
  'use strict';

  var canvas = document.getElementById('sculpture-canvas');
  var fallback = document.getElementById('scene-fallback');
  if (!canvas || !window.THREE) return;

  var THREE = window.THREE;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  } catch (error) {
    canvas.hidden = true;
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xf4f5f2, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 50);
  camera.position.set(0, 1.1, 10);
  camera.lookAt(0, -0.05, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb7b6af, 2.3));
  var key = new THREE.DirectionalLight(0xffffff, 3.7);
  key.position.set(-3, 6, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.normalBias = 0.035;
  key.shadow.bias = -0.00005;
  key.shadow.radius = 4;
  scene.add(key);
  var rim = new THREE.DirectionalLight(0xffffff, 1.8);
  rim.position.set(3, 2, -4);
  scene.add(rim);
  var fill = new THREE.DirectionalLight(0xe0ecff, 1.1);
  fill.position.set(4, -1, 4);
  scene.add(fill);

  var sculpture = new THREE.Group();
  var geometry = new THREE.TorusKnotGeometry(1.28, 0.43, 480, 48, 2, 3);
  var material = new THREE.MeshStandardMaterial({ color: 0xe93625, roughness: 0.67, metalness: 0.025 });
  // Object-space bands keep the printed layers attached to the moving sculpture.
  material.onBeforeCompile = function (shader) {
    shader.vertexShader = 'varying vec3 vPrintPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPrintPosition = position;');
    shader.fragmentShader = 'varying vec3 vPrintPosition;\nuniform mat3 normalMatrix;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat printedLayer = sin(vPrintPosition.y * 320.0);\nfloat fineLayer = smoothstep(-0.9, 0.8, printedLayer);\ndiffuseColor.rgb *= 0.87 + 0.13 * fineLayer;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nvec3 layerSlope = vec3(0.0, cos(vPrintPosition.y * 320.0) * 0.065, 0.0);\nnormal = normalize(normal + normalMatrix * layerSlope);');
  };
  var mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  sculpture.add(mesh);

  var wireGeometry = new THREE.TorusKnotGeometry(1.28, 0.435, 120, 16, 2, 3);
  var wireMaterial = new THREE.MeshBasicMaterial({ color: 0xde4934, wireframe: true, transparent: true, opacity: 0.72 });
  var wire = new THREE.Mesh(wireGeometry, wireMaterial);
  wire.visible = false;
  sculpture.add(wire);
  scene.add(sculpture);

  var floorMaterial = new THREE.ShadowMaterial({ color: 0x55554b, opacity: 0.075 });
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.04;
  floor.receiveShadow = true;
  scene.add(floor);

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var paused = reducedMotion.matches;
  var intersecting = true;
  var disposed = false;
  var lost = false;
  var frame = 0;
  var lastTime = 0;
  var drag = null;
  var mode = 'solid';
  var initial = { x: 0.37, y: -0.27, z: -0.25 };
  sculpture.rotation.set(initial.x, initial.y, initial.z);

  function render() {
    if (!disposed && !lost) renderer.render(scene, camera);
  }

  function tick(time) {
    frame = 0;
    if (disposed || lost || document.hidden || !intersecting || paused) return;
    var delta = Math.min((time - (lastTime || time)) / 1000, 0.04);
    lastTime = time;
    if (!drag) sculpture.rotation.y += delta * 0.075;
    render();
    frame = window.requestAnimationFrame(tick);
  }

  function schedule() {
    if (!frame && !disposed && !lost && !paused && !document.hidden && intersecting) {
      lastTime = 0;
      frame = window.requestAnimationFrame(tick);
    }
  }

  function stop() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  }

  function resize() {
    var bounds = canvas.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;
    var aspect = bounds.width / bounds.height;
    var halfHeight = Math.max(2.76, 2.76 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(bounds.width, bounds.height, false);
    render();
  }

  function showFallback() {
    if (fallback) { fallback.hidden = false; fallback.style.opacity = '1'; }
    canvas.style.opacity = '0';
    canvas.closest('.hero-scene')?.classList.remove('is-ready');
  }

  function showCanvas() {
    canvas.style.opacity = '1';
    if (fallback) fallback.style.opacity = '0';
    canvas.closest('.hero-scene')?.classList.add('is-ready');
    window.orangeScene.ready = true;
    window.dispatchEvent(new CustomEvent('scene-ready'));
  }

  function onPointerDown(event) {
    if (event.button !== 0 || !event.isPrimary) return;
    drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  }

  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.id) return;
    sculpture.rotation.y += (event.clientX - drag.x) * 0.008;
    sculpture.rotation.x = Math.max(-1.25, Math.min(1.25, sculpture.rotation.x + (event.clientY - drag.y) * 0.006));
    drag.x = event.clientX;
    drag.y = event.clientY;
    render();
  }

  function onPointerUp(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    drag = null;
    canvas.style.cursor = 'grab';
  }

  function onVisibility() { if (document.hidden) stop(); else schedule(); }
  function onMotionChange(event) { window.orangeScene.setPaused(event.matches); }
  function onContextLost(event) { event.preventDefault(); lost = true; stop(); showFallback(); }
  function onContextRestored() { lost = false; resize(); showCanvas(); schedule(); }

  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  document.addEventListener('visibilitychange', onVisibility);
  reducedMotion.addEventListener('change', onMotionChange);

  var observer = new ResizeObserver(resize);
  observer.observe(canvas.parentElement);
  var intersectionObserver = new IntersectionObserver(function (entries) {
    intersecting = entries[0].isIntersecting;
    if (intersecting) schedule(); else stop();
  }, { threshold: 0 });
  intersectionObserver.observe(canvas);

  window.orangeScene = {
    ready: false,
    setMode: function (value) {
      mode = value === 'wireframe' ? 'wireframe' : 'solid';
      mesh.visible = mode === 'solid';
      wire.visible = mode === 'wireframe';
      floor.visible = mode === 'solid';
      render();
      return mode;
    },
    setPaused: function (value) {
      paused = Boolean(value);
      if (paused) stop(); else schedule();
      window.dispatchEvent(new CustomEvent('scene-rotation-change', { detail: { rotating: !paused } }));
      return paused;
    },
    toggleRotation: function () { this.setPaused(!paused); return !paused; },
    reset: function () { sculpture.rotation.set(initial.x, initial.y, initial.z); render(); },
    render: render,
    snapshot: function () { render(); return canvas.toDataURL('image/png'); },
    get rotating() { return !paused; },
    dispose: function () {
      disposed = true;
      stop();
      observer.disconnect();
      intersectionObserver.disconnect();
      reducedMotion.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      geometry.dispose();
      material.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      floor.geometry.dispose();
      floorMaterial.dispose();
      renderer.dispose();
    }
  };

  resize();
  showCanvas();
  schedule();
})();

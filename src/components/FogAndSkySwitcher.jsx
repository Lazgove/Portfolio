function FogAndSkySwitcher() {
  const { scene, camera } = useThree();

  useEffect(() => {
    if (!scene.fog) {
      scene.fog = new THREE.Fog(0x87ceeb, 50, 100);
    }
    scene.background = new THREE.Color(0x87ceeb);
  }, [scene]);

  useFrame(() => {
    const y = camera.position.y;
    const fogFactor = THREE.MathUtils.clamp((10 - y) / 95, 0, 1);

    const skyColor = new THREE.Color(0x87ceeb);
    const deepColor = new THREE.Color(0x1e5d88);
    const bgColor = skyColor.clone().lerp(deepColor, fogFactor);
    scene.background.copy(bgColor);

    const fogColor = skyColor.clone().lerp(deepColor, fogFactor);
    scene.fog.color.copy(fogColor);

    scene.fog.near = THREE.MathUtils.lerp(50, 5, fogFactor);
    scene.fog.far = THREE.MathUtils.lerp(100, 30, fogFactor);
  });

  return null;
}

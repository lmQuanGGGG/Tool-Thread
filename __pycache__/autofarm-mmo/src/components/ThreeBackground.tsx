import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Coins, Volume2, VolumeX, Sparkles, RefreshCw, Trash2, Wind } from "lucide-react";

// Web Audio API Synthesizer for physical metallic coin clinks
class CoinSoundSynth {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  playClink() {
    if (this.muted) return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      
      // A gold coin clink is characterized by rich, inharmonic, high-frequency overtones that decay quickly
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filterNode = this.ctx.createBiquadFilter();

      // Set frequencies mimicking metallic resonances
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(850 + Math.random() * 150, now);
      
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1350 + Math.random() * 250, now);
      
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(2800 + Math.random() * 400, now);

      // Crisp metallic decay envelope
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25 + Math.random() * 0.1);

      // Highpass filter removes lower hums, leaving bright, crisp silver-gold sheen
      filterNode.type = "highpass";
      filterNode.frequency.setValueAtTime(1500, now);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      osc3.connect(gainNode);
      gainNode.connect(filterNode);
      filterNode.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
      osc3.stop(now + 0.4);
    } catch (e) {
      // Audio context might be blocked or unsupported in some frame sandboxes
    }
  }

  playBillSwoosh() {
    if (this.muted) return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      
      // Paper bill flutter sound: lowpass filtered white noise with a subtle frequency sweep
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filterNode = this.ctx.createBiquadFilter();
      filterNode.type = "bandpass";
      filterNode.frequency.setValueAtTime(300, now);
      filterNode.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      filterNode.Q.setValueAtTime(5, now);

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.02, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      noiseNode.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.15);
    } catch (e) {
      // Handle gracefully
    }
  }
}

// Draw a detailed USD bill in standard green vector styles on an offscreen canvas
function createDollarTexture(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Green-pale banknote paper base
  ctx.fillStyle = "#e1f2e1";
  ctx.fillRect(0, 0, 512, 256);

  // Banknote borders in secure rich dark green
  ctx.strokeStyle = "#1b4332";
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.strokeStyle = "#2d6a4f";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 472, 216);

  // Micro-guilloche geometric corner frames
  ctx.fillStyle = "#40916c";
  ctx.fillRect(23, 23, 40, 40);
  ctx.fillRect(449, 23, 40, 40);
  ctx.fillRect(23, 193, 40, 40);
  ctx.fillRect(449, 193, 40, 40);

  // Denominations in corners
  ctx.fillStyle = "#1b4332";
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", 43, 43);
  ctx.fillText("$", 469, 43);
  ctx.fillText("$", 43, 213);
  ctx.fillText("$", 469, 213);

  // Detailed center medallion (oval)
  ctx.beginPath();
  ctx.ellipse(256, 128, 85, 105, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#1b4332";
  ctx.lineWidth = 5;
  ctx.stroke();

  // Oval inner fill (lighter secure green)
  ctx.fillStyle = "#d8f3dc";
  ctx.beginPath();
  ctx.ellipse(256, 128, 80, 100, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ornate central seal pattern
  ctx.strokeStyle = "rgba(45, 106, 79, 0.25)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 360; i += 15) {
    const angle = (i * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(256, 128);
    ctx.lineTo(256 + Math.cos(angle) * 75, 128 + Math.sin(angle) * 95);
    ctx.stroke();
  }

  // Large elegant center "$" sign
  ctx.fillStyle = "#1b4332";
  ctx.font = "bold 110px 'Georgia', serif";
  ctx.fillText("$", 256, 128);

  // Banner titles
  ctx.fillStyle = "#2d6a4f";
  ctx.font = "bold 13px 'Times New Roman', serif";
  ctx.fillText("AUTOFARM MMO SYSTEM", 256, 45);
  ctx.fillText("ONE HUNDRED AUTOMATION DOLLARS", 256, 211);

  // Signature lines
  ctx.strokeStyle = "#52b788";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, 130);
  ctx.lineTo(130, 130);
  ctx.moveTo(380, 130);
  ctx.lineTo(440, 130);
  ctx.stroke();

  ctx.fillStyle = "#52b788";
  ctx.font = "italic 9px sans-serif";
  ctx.fillText("In Code We Trust", 100, 142);
  ctx.fillText("Telegram Bot Core", 410, 142);

  return canvas;
}

// Draw a gold coin medallion face with details
function createCoinFaceTexture(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Base metallic gold radial gradient
  const grad = ctx.createRadialGradient(128, 128, 5, 128, 128, 128);
  grad.addColorStop(0, "#fff5cc");
  grad.addColorStop(0.3, "#ffd700");
  grad.addColorStop(0.7, "#e6b800");
  grad.addColorStop(1, "#997300");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Outer thick embossed border ring
  ctx.strokeStyle = "#735300";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.stroke();

  // Shiny inner bevel
  ctx.strokeStyle = "#fff0a3";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(128, 128, 110, 0, Math.PI * 2);
  ctx.stroke();

  // Dotted security ridged dash-ring
  ctx.strokeStyle = "#b38600";
  ctx.lineWidth = 6;
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.arc(128, 128, 92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Central embossed large '$' symbol
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 120px 'Georgia', serif";

  // White highlighted shadow (emboss effect)
  ctx.fillStyle = "#fffae6";
  ctx.fillText("$", 131, 131);

  // Dark deep gold main face
  ctx.fillStyle = "#4d3b00";
  ctx.fillText("$", 128, 128);

  // Extra stars decoration
  ctx.font = "14px monospace";
  ctx.fillStyle = "#8c6600";
  ctx.fillText("★", 128, 48);
  ctx.fillText("★", 128, 208);
  ctx.fillText("★", 48, 128);
  ctx.fillText("★", 208, 128);

  return canvas;
}

interface MoneyItem {
  type: "coin" | "dollar";
  mesh: THREE.Object3D;
  vy: number;
  vx: number;
  vz: number;
  vrx: number;
  vry: number;
  vrz: number;
  scale: number;
  weight: number;
  bounces: number;
  rattling: boolean;
  rattleTime: number;
}

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const soundSynthRef = useRef<CoinSoundSynth>(new CoinSoundSynth());
  const [muted, setMuted] = useState(false);
  const [moneyCount, setMoneyCount] = useState(0);
  const [gravity, setGravity] = useState(1.0); // Gravity scale factor
  const [wind, setWind] = useState(true);

  // Refs for scene interaction
  const itemsRef = useRef<MoneyItem[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const spawnQueueRef = useRef<{ type: "coin" | "dollar"; x?: number; y?: number }[]>([]);

  useEffect(() => {
    soundSynthRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Create Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfcf8fb, 0.04);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 18;

    // 2. Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff0dd, 1.2);
    dirLight1.position.set(5, 10, 8);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xadd8e6, 0.6);
    dirLight2.position.set(-8, -5, -2);
    scene.add(dirLight2);

    // 4. Generate Materials & Geometries
    const dollarCanvas = createDollarTexture();
    const dollarTex = new THREE.CanvasTexture(dollarCanvas);
    dollarTex.colorSpace = THREE.SRGBColorSpace;
    
    const dollarGeo = new THREE.PlaneGeometry(3.6, 1.8, 4, 2);
    const dollarMat = new THREE.MeshStandardMaterial({
      map: dollarTex,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1,
    });

    const coinFaceCanvas = createCoinFaceTexture();
    const coinFaceTex = new THREE.CanvasTexture(coinFaceCanvas);
    coinFaceTex.colorSpace = THREE.SRGBColorSpace;

    const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.14, 32);
    
    // Cylinder material array: [0: Side, 1: Top, 2: Bottom]
    const coinSideMat = new THREE.MeshStandardMaterial({
      color: 0xe6b800,
      roughness: 0.2,
      metalness: 0.9,
    });
    const coinCapMat = new THREE.MeshStandardMaterial({
      map: coinFaceTex,
      roughness: 0.15,
      metalness: 0.85,
    });
    const coinMaterials = [coinSideMat, coinCapMat, coinCapMat];

    // Limits based on screen coordinate bounds
    const getScreenBounds = () => {
      const vFOV = (camera.fov * Math.PI) / 180;
      const hHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
      const hWidth = hHeight * camera.aspect;
      return { width: hWidth, height: hHeight };
    };

    let bounds = getScreenBounds();

    // 5. Physics logic to update items
    const spawnItem = (type: "coin" | "dollar", xOverride?: number, yOverride?: number) => {
      let mesh: THREE.Mesh;
      let scale = 0.8 + Math.random() * 0.4;
      let weight = type === "coin" ? 1.5 : 0.4;

      if (type === "dollar") {
        mesh = new THREE.Mesh(dollarGeo, dollarMat);
        mesh.castShadow = true;
      } else {
        mesh = new THREE.Mesh(coinGeo, coinMaterials);
        mesh.castShadow = true;
      }

      // Initial coordinates
      const spawnX = xOverride !== undefined ? xOverride : (Math.random() - 0.5) * bounds.width;
      const spawnY = yOverride !== undefined ? yOverride : bounds.height / 2 + 2;
      const spawnZ = (Math.random() - 0.5) * 6; // Layered depth

      mesh.position.set(spawnX, spawnY, spawnZ);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      mesh.scale.set(scale, scale, scale);

      scene.add(mesh);

      const newItem: MoneyItem = {
        type,
        mesh,
        vy: -0.05 - Math.random() * 0.08,
        vx: (Math.random() - 0.5) * 0.04,
        vz: (Math.random() - 0.5) * 0.02,
        vrx: (Math.random() - 0.5) * 0.05,
        vry: (Math.random() - 0.5) * 0.05,
        vrz: (Math.random() - 0.5) * 0.05,
        scale,
        weight,
        bounces: 0,
        rattling: false,
        rattleTime: 0,
      };

      itemsRef.current.push(newItem);
      setMoneyCount(itemsRef.current.length);

      // Play matching physical audio cue
      if (type === "coin") {
        soundSynthRef.current.playClink();
      } else {
        soundSynthRef.current.playBillSwoosh();
      }
    };

    // Spawn initial random batch
    for (let i = 0; i < 20; i++) {
      spawnItem(
        Math.random() > 0.4 ? "coin" : "dollar",
        (Math.random() - 0.5) * bounds.width,
        (Math.random() * bounds.height) - bounds.height / 2
      );
    }

    // 6. Interactive Raycasting & Mouse move
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      // Relative web coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = event.clientX - rect.left;
      const clientY = event.clientY - rect.top;

      mouseRef.current.x = (clientX / rect.width) * 2 - 1;
      mouseRef.current.y = -(clientY / rect.height) * 2 + 1;

      mouseVector.set(mouseRef.current.x, mouseRef.current.y);
      raycaster.setFromCamera(mouseVector, camera);

      // Repel items close to cursor
      itemsRef.current.forEach((item) => {
        const itemPos = item.mesh.position;
        const dist = raycaster.ray.distanceToPoint(itemPos);

        if (dist < 3) {
          // Calculate force pushing away
          const force = (3 - dist) * 0.02;
          const dir = new THREE.Vector3().subVectors(itemPos, raycaster.ray.origin).normalize();
          
          item.vx += dir.x * force;
          item.vy += dir.y * force;
          item.vz += dir.z * force * 0.5;

          // Increase rotation speed
          item.vrx += (Math.random() - 0.5) * 0.06;
          item.vry += (Math.random() - 0.5) * 0.06;
        }
      });
    };

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = event.clientX - rect.left;
      const clientY = event.clientY - rect.top;

      const clickX = (clientX / rect.width) * 2 - 1;
      const clickY = -(clientY / rect.height) * 2 + 1;

      mouseVector.set(clickX, clickY);
      raycaster.setFromCamera(mouseVector, camera);

      // Cast ray to check if we hit any existing 3D coin or dollar
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Find corresponding item and rattle it
        const hitMesh = intersects[0].object;
        const item = itemsRef.current.find(
          (i) => i.mesh === hitMesh || i.mesh.children.includes(hitMesh)
        );

        if (item) {
          item.rattling = true;
          item.rattleTime = 20; // active frames
          item.vx += (Math.random() - 0.5) * 0.2;
          item.vy += 0.15 + Math.random() * 0.1;
          item.vrx += (Math.random() - 0.5) * 0.6;
          item.vry += (Math.random() - 0.5) * 0.6;

          if (item.type === "coin") {
            soundSynthRef.current.playClink();
          } else {
            soundSynthRef.current.playBillSwoosh();
          }
          return;
        }
      }

      // If clicked on empty space, spawn 3 new items at the clicked location projected into 3D!
      const targetPoint = new THREE.Vector3();
      raycaster.ray.at(12, targetPoint); // Project onto distance plane

      for (let i = 0; i < 3; i++) {
        spawnItem(
          Math.random() > 0.5 ? "coin" : "dollar",
          targetPoint.x + (Math.random() - 0.5) * 1.5,
          targetPoint.y + (Math.random() - 0.5) * 1.5
        );
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("click", handleCanvasClick);

    // 7. Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const currentGravityVal = -0.005 * gravity;
      
      // Handle spawn queue
      while (spawnQueueRef.current.length > 0) {
        const q = spawnQueueRef.current.shift();
        if (q) spawnItem(q.type, q.x, q.y);
      }

      // Gentle continuous wind force
      const windForceX = wind ? Math.sin(clock.getElapsedTime() * 0.8) * 0.001 : 0;
      const windForceY = wind ? Math.cos(clock.getElapsedTime() * 1.2) * 0.0005 : 0;

      // Update all falling objects
      itemsRef.current.forEach((item) => {
        // Apply gravity to velocity
        item.vy += currentGravityVal * item.weight;

        // Apply wind
        item.vx += windForceX;
        item.vy += windForceY;

        // Flutter behavior for lighter paper bills
        if (item.type === "dollar") {
          // Dollar bills glide side-to-side (saddle-swing)
          item.vx += Math.sin(clock.getElapsedTime() * 3 + item.mesh.position.y) * 0.004;
          // Apply air drag dampening
          item.vx *= 0.98;
          item.vy *= 0.97;
        } else {
          // Heavier coin resistance
          item.vx *= 0.99;
          item.vy *= 0.99;
        }

        // Apply velocities to positions
        item.mesh.position.x += item.vx;
        item.mesh.position.y += item.vy;
        item.mesh.position.z += item.vz;

        // Apply rotations
        if (item.rattling) {
          // Rapid clinking spin
          item.mesh.rotation.x += Math.sin(clock.getElapsedTime() * 50) * 0.3;
          item.mesh.rotation.y += Math.cos(clock.getElapsedTime() * 50) * 0.3;
          item.rattleTime--;
          if (item.rattleTime <= 0) {
            item.rattling = false;
          }
        } else {
          // Natural drift
          item.mesh.rotation.x += item.vrx;
          item.mesh.rotation.y += item.vry;
          item.mesh.rotation.z += item.vrz;
        }

        // Check floor/bottom boundary bounce
        const bottomThreshold = -bounds.height / 2 - 1.5;
        if (item.mesh.position.y < bottomThreshold) {
          // Gold coin rattle clink bounce
          if (item.bounces < 2 && item.type === "coin") {
            item.mesh.position.y = bottomThreshold;
            item.vy = -item.vy * 0.5; // Restitution bounce
            item.vx += (Math.random() - 0.5) * 0.05;
            item.vrx *= 2;
            item.bounces++;
            // Synthesize bounce collision sound
            if (Math.abs(item.vy) > 0.02) {
              soundSynthRef.current.playClink();
            }
          } else {
            // Respawn from top once it leaves the screen bottom
            item.mesh.position.y = bounds.height / 2 + 1.5;
            item.mesh.position.x = (Math.random() - 0.5) * bounds.width;
            item.vy = -0.05 - Math.random() * 0.08;
            item.vx = (Math.random() - 0.5) * 0.04;
            item.bounces = 0;
          }
        }

        // Left/Right boundaries wrapping
        const sideThreshold = bounds.width / 2 + 2;
        if (item.mesh.position.x > sideThreshold) {
          item.mesh.position.x = -sideThreshold;
        } else if (item.mesh.position.x < -sideThreshold) {
          item.mesh.position.x = sideThreshold;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        bounds = getScreenBounds();
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("click", handleCanvasClick);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
      renderer.dispose();
      dollarTex.dispose();
      coinFaceTex.dispose();
      scene.clear();
      container.removeChild(renderer.domElement);
    };
  }, [gravity, wind]);

  // Utility to push item spawn request to animation thread queue
  const queueSpawn = (type: "coin" | "dollar") => {
    spawnQueueRef.current.push({ type });
  };

  const clearAllMoney = () => {
    // We can clear itemsRef and remove from scene inside a frame, or trigger state clear
    itemsRef.current.forEach((item) => {
      item.mesh.removeFromParent();
    });
    itemsRef.current = [];
    setMoneyCount(0);
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 3D Canvas Host Container */}
      <div
        ref={containerRef}
        id="canvas-host-3d"
        className="w-full h-full absolute inset-0 pointer-events-auto"
        style={{ cursor: "pointer" }}
      />

      {/* Decorative Blur Vignette Overlay to blend ThreeJS nicely with Tailwind */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-white/10 dark:from-black/10 dark:to-black/10" />

      {/* Control overlay board - positioned neatly at the bottom left for high engagement */}
      <div className="absolute bottom-6 left-6 z-30 flex flex-wrap gap-2 pointer-events-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg">
        <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 mr-1">
          <Coins className="w-3.5 h-3.5 text-yellow-500 animate-bounce" />
          <span>{moneyCount} Items</span>
        </div>

        <button
          onClick={() => queueSpawn("coin")}
          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95"
          title="Rắc đồng xu vàng rủng rỉnh"
        >
          <Sparkles className="w-3 h-3" />
          <span>+ Coin</span>
        </button>

        <button
          onClick={() => queueSpawn("dollar")}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95"
          title="Rải tiền đô la"
        >
          <Sparkles className="w-3 h-3" />
          <span>+ $100</span>
        </button>

        <button
          onClick={() => setWind(!wind)}
          className={`p-1.5 rounded-lg transition-all ${
            wind 
              ? "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400" 
              : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
          }`}
          title="Bật/Tắt gió thổi nhẹ"
        >
          <Wind className="w-4 h-4" />
        </button>

        <button
          onClick={() => setGravity((prev) => (prev === 1.0 ? 0.3 : prev === 0.3 ? 2.0 : 1.0))}
          className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-all"
          title={`Trọng lực: ${gravity === 1.0 ? "Bình thường" : gravity === 0.3 ? "Yếu (Không trọng lực)" : "Mạnh"}`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setMuted(!muted)}
          className={`p-1.5 rounded-lg transition-all ${
            muted 
              ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" 
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
          title={muted ? "Bật âm thanh rủng rỉnh" : "Tắt âm thanh"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={clearAllMoney}
          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-lg transition-all"
          title="Dọn dẹp tất cả"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating hints in the corner to teach interaction */}
      <div className="absolute top-24 right-6 text-[11px] text-zinc-400 dark:text-zinc-500 pointer-events-none bg-white/40 dark:bg-zinc-900/40 px-2.5 py-1 rounded-full border border-zinc-200/20">
        🖱️ Click khoảng trống để thêm tiền • Di chuột để đẩy tiền • Click vào tiền để rung clinking!
      </div>
    </div>
  );
}

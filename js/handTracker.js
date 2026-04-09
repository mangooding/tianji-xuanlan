/**
 * MediaPipe 手势跟踪与摇晃检测
 */

class HandTracker {
  constructor(options = {}) {
    this.onShake = options.onShake || (() => {});
    this.onHandDetected = options.onHandDetected || (() => {});
    this.onNoHand = options.onNoHand || (() => {});
    this.onEnergyChange = options.onEnergyChange || (() => {});
    
    this.videoElement = document.getElementById('input-video');
    this.canvasElement = document.getElementById('output-canvas');
    this.canvasCtx = this.canvasElement.getContext('2d');
    
    this.hands = null;
    this.camera = null;
    this.positions = [];
    this.shakeEnergy = 0;
    this.lastShakeTime = 0;
    this.isShaking = false;
    this.handPresent = false;
    
    this.SHAKENESS_WINDOW = 15;
    this.ENERGY_DECAY = 0.94;
    this.ENERGY_THRESHOLD = 85;
    this.COOLDOWN = 3000;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }});

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.hands.onResults((results) => this.onResults(results));

      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          await this.hands.send({image: this.videoElement});
        },
        width: 320,
        height: 240
      });

      this.camera.start()
        .then(() => resolve())
        .catch(err => reject(err));
    });
  }

  onResults(results) {
    // 调整 canvas 尺寸匹配视频
    this.canvasElement.width = this.videoElement.videoWidth || 320;
    this.canvasElement.height = this.videoElement.videoHeight || 240;
    
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    // 镜像绘制
    this.canvasCtx.scale(-1, 1);
    this.canvasCtx.translate(-this.canvasElement.width, 0);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      this.handPresent = true;
      const landmarks = results.multiHandLandmarks[0];
      
      // 绘制手部骨骼
      drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: '#C9A227',
        lineWidth: 2
      });
      drawLandmarks(this.canvasCtx, landmarks, {
        color: '#E8C766',
        lineWidth: 1,
        radius: 3
      });
      
      // 手掌中心使用中指根部 (index 9)
      const palm = landmarks[9];
      const now = performance.now();
      
      this.positions.push({
        x: palm.x,
        y: palm.y,
        t: now
      });
      
      if (this.positions.length > this.SHAKENESS_WINDOW) {
        this.positions.shift();
      }
      
      this.computeShakeEnergy();
      this.onHandDetected();
    } else {
      this.handPresent = false;
      this.positions = [];
      this.shakeEnergy *= 0.85;
      this.onNoHand();
    }
    
    this.canvasCtx.restore();
    this.onEnergyChange(this.shakeEnergy, this.handPresent);
  }

  computeShakeEnergy() {
    if (this.positions.length < 5) return;
    
    let totalMotion = 0;
    let directionChanges = 0;
    
    for (let i = 2; i < this.positions.length; i++) {
      const p0 = this.positions[i - 2];
      const p1 = this.positions[i - 1];
      const p2 = this.positions[i];
      
      const dx1 = p1.x - p0.x;
      const dy1 = p1.y - p0.y;
      const dx2 = p2.x - p1.x;
      const dy2 = p2.y - p1.y;
      
      const motion = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      totalMotion += motion;
      
      // 检测方向反转（来回摇晃的关键特征）
      const xFlip = (dx1 > 0.005 && dx2 < -0.005) || (dx1 < -0.005 && dx2 > 0.005);
      const yFlip = (dy1 > 0.005 && dy2 < -0.005) || (dy1 < -0.005 && dy2 > 0.005);
      
      if (xFlip) directionChanges++;
      if (yFlip) directionChanges++;
    }
    
    // 平均运动量
    const avgMotion = totalMotion / (this.positions.length - 2);
    
    // 有方向反转且运动量足够才算摇晃
    if (directionChanges >= 2 && avgMotion > 0.015) {
      const boost = 1 + directionChanges * 0.4;
      this.shakeEnergy += avgMotion * 600 * boost;
    } else if (avgMotion > 0.03) {
      // 快速单向移动也加一点
      this.shakeEnergy += avgMotion * 100;
    }
    
    // 自然衰减
    this.shakeEnergy *= this.ENERGY_DECAY;
    this.shakeEnergy = Math.max(0, Math.min(100, this.shakeEnergy));
    
    // 冷却检查与触发
    const now = performance.now();
    if (this.shakeEnergy >= this.ENERGY_THRESHOLD && (now - this.lastShakeTime) > this.COOLDOWN) {
      this.lastShakeTime = now;
      this.shakeEnergy = 0;
      this.positions = [];
      this.onShake();
    }
  }

  stop() {
    if (this.camera) {
      this.camera.stop?.();
    }
  }
}

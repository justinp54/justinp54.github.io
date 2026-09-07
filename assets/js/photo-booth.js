// 네 컷 포토부스. 웹캠 화면에 셰이더로 효과를 걸고, 네 장을 이어 붙여 한 장으로 만든다.
// 모든 처리는 브라우저 안에서 끝나므로 영상이 서버로 나가지 않는다.

const SHOTS = 4;
const COUNT_FROM = 3;
const SHOT_WIDTH = 900;
const SHOT_HEIGHT = 1200;
const STRIP_PADDING = 36;
const STRIP_GAP = 18;
const STRIP_FOOTER = 112;

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  // 셀카는 거울처럼 보여야 자연스러우므로 가로를 뒤집는다
  v_uv = vec2(1.0 - (a_position.x * 0.5 + 0.5), 1.0 - (a_position.y * 0.5 + 0.5));
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// 효과를 추가하려면 여기에 조각 셰이더를 하나 더 넣으면 된다
const HEAD = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_frame;
uniform float u_time;

float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float vignette(vec2 uv, float amount) {
  return 1.0 - amount * dot(uv - 0.5, uv - 0.5) * 2.0;
}
`;

const EFFECTS = [
  {
    id: "plain",
    label: "그대로",
    shader: `${HEAD}
void main() {
  gl_FragColor = texture2D(u_frame, v_uv);
}`,
  },
  {
    id: "film",
    label: "필름",
    shader: `${HEAD}
void main() {
  vec3 c = texture2D(u_frame, v_uv).rgb;
  // 밝은 부분은 따뜻하게, 어두운 부분은 살짝 푸르게 눌러 필름 색을 흉내 낸다
  c = pow(c, vec3(0.92, 0.97, 1.06));
  c += vec3(0.05, 0.02, -0.01) * smoothstep(0.4, 1.0, c.g);
  c *= vignette(v_uv, 0.55);
  c += (noise(v_uv * 640.0 + u_time) - 0.5) * 0.075;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`,
  },
  {
    id: "paint",
    label: "그림판",
    shader: `${HEAD}
// 4x4 정렬 디더 행렬. 색을 줄일 때 계단이 덜 보이게 한다
float dither(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int i = x + y * 4;
  float m[16];
  m[0]=0.0; m[1]=8.0; m[2]=2.0; m[3]=10.0;
  m[4]=12.0; m[5]=4.0; m[6]=14.0; m[7]=6.0;
  m[8]=3.0; m[9]=11.0; m[10]=1.0; m[11]=9.0;
  m[12]=15.0; m[13]=7.0; m[14]=13.0; m[15]=5.0;
  for (int k = 0; k < 16; k++) {
    if (k == i) return m[k] / 16.0 - 0.5;
  }
  return 0.0;
}

void main() {
  vec3 c = texture2D(u_frame, v_uv).rgb;
  float levels = 4.0;
  c += dither(gl_FragCoord.xy) / levels;
  c = floor(c * levels + 0.5) / levels;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`,
  },
  {
    id: "vhs",
    label: "비디오",
    shader: `${HEAD}
void main() {
  // 색 채널을 좌우로 조금씩 어긋나게 뽑아 색번짐을 만든다
  float shift = 0.004 + 0.002 * sin(u_time * 1.7 + v_uv.y * 18.0);
  float r = texture2D(u_frame, v_uv + vec2(shift, 0.0)).r;
  float g = texture2D(u_frame, v_uv).g;
  float b = texture2D(u_frame, v_uv - vec2(shift, 0.0)).b;
  vec3 c = vec3(r, g, b);
  c *= 0.86 + 0.14 * step(0.5, fract(v_uv.y * 240.0));
  c += (noise(vec2(v_uv.y * 90.0, u_time)) - 0.5) * 0.06;
  c *= vignette(v_uv, 0.4);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`,
  },
  {
    id: "print",
    label: "스티커사진",
    shader: `${HEAD}
void main() {
  vec3 c = texture2D(u_frame, v_uv).rgb;
  // 노출을 날려 피부를 뽀얗게 만드는 90년대 사진기 흉내
  c = 1.0 - (1.0 - c) * (1.0 - c * 0.45);
  c = mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), -0.18);
  c = mix(c, vec3(1.0, 0.96, 0.98), 0.12);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`,
  },
];

const booth = document.querySelector("[data-booth]");
if (booth) setup(booth);

function setup(root) {
  const stage = root.querySelector("[data-booth-stage]");
  const video = root.querySelector("[data-booth-video]");
  const canvas = root.querySelector("[data-booth-canvas]");
  const countdown = root.querySelector("[data-booth-count]");
  const flash = root.querySelector("[data-booth-flash]");
  const effectBar = root.querySelector("[data-booth-effects]");
  const startButton = root.querySelector("[data-booth-start]");
  const shootButton = root.querySelector("[data-booth-shoot]");
  const status = root.querySelector("[data-booth-status]");
  const result = root.querySelector("[data-booth-result]");

  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    say("이 브라우저에서는 WebGL을 쓸 수 없어 포토부스가 동작하지 않습니다.");
    startButton.disabled = true;
    return;
  }

  const programs = {};
  let current = EFFECTS[0].id;
  let texture = null;
  let stream = null;
  let busy = false;

  buildEffectButtons();
  startButton.addEventListener("click", start);
  shootButton.addEventListener("click", shoot);

  function say(message) {
    status.textContent = message;
  }

  function buildEffectButtons() {
    EFFECTS.forEach((effect) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = effect.label;
      button.setAttribute("aria-pressed", String(effect.id === current));
      button.addEventListener("click", () => {
        current = effect.id;
        effectBar.querySelectorAll("button").forEach((other) => {
          other.setAttribute("aria-pressed", String(other === button));
        });
      });
      effectBar.appendChild(button);
    });
  }

  function compile(effect) {
    if (programs[effect.id]) return programs[effect.id];
    const program = gl.createProgram();
    [
      [gl.VERTEX_SHADER, VERTEX_SHADER],
      [gl.FRAGMENT_SHADER, effect.shader],
    ].forEach(([type, source]) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`${effect.id} 셰이더를 컴파일하지 못했습니다: ${gl.getShaderInfoLog(shader)}`);
      }
      gl.attachShader(program, shader);
    });
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`${effect.id} 프로그램을 연결하지 못했습니다: ${gl.getProgramInfoLog(program)}`);
    }
    programs[effect.id] = program;
    return program;
  }

  async function start() {
    startButton.disabled = true;
    say("카메라를 여는 중입니다.");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (error) {
      startButton.disabled = false;
      say("카메라를 열지 못했습니다. 브라우저 주소창의 권한 설정을 확인해 주세요.");
      return;
    }

    video.srcObject = stream;
    await video.play();
    resize();
    window.addEventListener("resize", resize);

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    startButton.hidden = true;
    shootButton.hidden = false;
    say("효과를 고르고 촬영을 누르면 세 번 센 뒤 네 장을 찍습니다.");
    draw();
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
  }

  function draw() {
    requestAnimationFrame(draw);
    if (!texture || video.readyState < 2 || document.hidden) return;

    const program = compile(EFFECTS.find((effect) => effect.id === current));
    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(program, "u_frame"), 0);
    gl.uniform1f(gl.getUniformLocation(program, "u_time"), performance.now() / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  async function shoot() {
    if (busy) return;
    busy = true;
    shootButton.disabled = true;
    result.innerHTML = "";

    const frames = [];
    for (let index = 0; index < SHOTS; index++) {
      await countTo(COUNT_FROM);
      frames.push(capture());
      fire();
      say(`${index + 1} / ${SHOTS} 장 찍었습니다.`);
      // 표정을 바꿀 틈을 준다
      if (index < SHOTS - 1) await wait(700);
    }

    show(compose(frames));
    say("완성했습니다. 마음에 안 들면 다시 찍으면 됩니다.");
    shootButton.disabled = false;
    busy = false;
  }

  function countTo(from) {
    return new Promise((resolve) => {
      let value = from;
      countdown.textContent = value;
      countdown.classList.add("is-on");
      const timer = setInterval(() => {
        value -= 1;
        if (value <= 0) {
          clearInterval(timer);
          countdown.classList.remove("is-on");
          resolve();
          return;
        }
        countdown.textContent = value;
      }, 1000);
    });
  }

  function fire() {
    flash.classList.remove("is-firing");
    // 클래스를 다시 붙이기 전에 다시 그려야 애니메이션이 재생된다
    void flash.offsetWidth;
    flash.classList.add("is-firing");
  }

  // 화면에 보이는 그대로를 한 컷 비율로 잘라 담는다
  function capture() {
    const shot = document.createElement("canvas");
    shot.width = SHOT_WIDTH;
    shot.height = SHOT_HEIGHT;
    const context = shot.getContext("2d");
    const scale = Math.max(SHOT_WIDTH / canvas.width, SHOT_HEIGHT / canvas.height);
    const width = canvas.width * scale;
    const height = canvas.height * scale;
    context.drawImage(canvas, (SHOT_WIDTH - width) / 2, (SHOT_HEIGHT - height) / 2, width, height);
    return shot;
  }

  function compose(frames) {
    const strip = document.createElement("canvas");
    strip.width = SHOT_WIDTH + STRIP_PADDING * 2;
    strip.height = STRIP_PADDING * 2 + SHOT_HEIGHT * frames.length + STRIP_GAP * (frames.length - 1) + STRIP_FOOTER;
    const context = strip.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, strip.width, strip.height);

    frames.forEach((frame, index) => {
      context.drawImage(frame, STRIP_PADDING, STRIP_PADDING + index * (SHOT_HEIGHT + STRIP_GAP));
    });

    const stamp = new Date();
    context.fillStyle = "#1a1c20";
    context.font = "500 44px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.textBaseline = "middle";
    context.fillText(
      `${stamp.getFullYear()}.${pad(stamp.getMonth() + 1)}.${pad(stamp.getDate())}`,
      STRIP_PADDING,
      strip.height - STRIP_FOOTER / 2 - 4
    );
    return strip;
  }

  function show(strip) {
    strip.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const image = document.createElement("img");
      image.src = url;
      image.alt = "방금 찍은 네 컷 사진";

      const link = document.createElement("a");
      link.href = url;
      link.download = `photo-booth-${Date.now()}.png`;
      link.className = "booth-action is-secondary";
      link.textContent = "내려받기";
      link.style.display = "inline-block";
      link.style.marginTop = "0.75rem";

      result.appendChild(image);
      result.appendChild(document.createElement("br"));
      result.appendChild(link);
    }, "image/png");
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

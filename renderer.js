//#region PARAMS
const urlParams = {};
([...new URLSearchParams(window.location.search).entries()].forEach(e => urlParams[e[0]] = e[1]));
//#endregion

//#region CONSTANTS
const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
ctx.action={},document.body.appendChild(canvas).id="renderer";
const center={x:(canvas.width=window.innerWidth)/2,y:(canvas.height=window.innerHeight)/2};
//#endregion

//#region EVENTS
const mouse = {
    x: 0, y: 0, down: false
}
window.onresize = () => { canvas.width=window.innerWidth, canvas.height=window.innerHeight };
window.onmousedown = function () {mouse.down = true;}
window.onmouseup = function () {mouse.down = false;}
window.onmousemove = (ev) => { mouse.x = ev.x, mouse.y = ev.y };
//#endregion

//#region CLASSES
class Color {
    constructor(r=255,g=255,b=255,a=1) { this.r = r, this.g = g, this.b = b, this.a = a };
    
    /**
     * @param {Color} a
     * @param {Color} b
     * @param {number} w
     * @returns {string}
     */
    static Lerp (a,b,w) {
        return "rgba(" + [ KMath.lerp(a.r, b.r, w), KMath.lerp(a.g, b.g, w), KMath.lerp(a.b, b.b, w), KMath.lerp(a.a, b.a, w) ] + ")";
    }

    toString () {
        return `rgba(${[this.r,this.g,this.b,this.a]})`;
    }
}
//#endregion

//#region SCENE LOGIC
const KPath = {
    triangle: new Path2D("M12 5.887l8.468 14.113h-16.936l8.468-14.113zm0-3.887l-12 20h24l-12-20z"),
    square: new Path2D("M22 2v20h-20v-20h20zm2-2h-24v24h24v-24z"),
    circle: new Path2D("M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12z"),
    cross: new Path2D("M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z"),
    /**
     * @param {'triangle'|'square'|'circle'|'cross'} key Path index or keyword
     * @param {number} x Position for X coordinate
     * @param {number} y Position for Y coordinate
     * @param {number} s Scale for this Path
     * @param {number} r Rotation for this Path
     */
    draw (key, x, y, s, r) {
        const path=this["string"==typeof key ? key : (this._entries||(this._entries=Object.keys(this).slice(0,-1)))[key]];
        
        ctx.save();
        ctx.translate(-12+x,-12+y),ctx.translate(12,12),ctx.rotate(r),ctx.scale(s,s),ctx.translate(-12,-12);
        if (ctx.action.stroke) ctx.stroke(path);
        if (ctx.action.fill) ctx.fill(path);
        ctx.restore();
    }
}
const KMath = {
    frac(x) {
        return x - Math.floor(x);
    },
    nsin (v) {
        return (Math.sin(v) + 1) / 2;
    },
    rand (x,y=1,a=12.9898,b=78.233,c=43758.5453123) {
        const v = Math.sin(x*a + y*b)*c;
        return v - Math.floor(v);
    },
    rsin (x, y=0, o=1) {
        const i = Math.floor(x);
        const f = x - i;
        return this.lerp(this.rand(i,y), this.rand(i+o,y), this.step(0.,1.,f));
    },
    rands() {
        return (Math.random() - 0.5) * 2;
    },
    lerp (a, b, w) { // Lerps between 'a' and 'b' depending on 'w'
        return a + Math.min(Math.max(w, 0),1)*(b-a);
    },
    mod (x,y) {
        return x - y * Math.floor(x/y);
    },
    mod2 (x,min=2,max=5) {
        return this.mod(x, max-min)+min;
    },
    wrap(m, n) {
        return n >= 0 ? n % m : (n % m + m) % m
    },
    step (a, b, x) {
        const t = Math.min(Math.max((x - a)/(b - a), 0), 1);
        return t*t*(3.0 - (2.0*t));
    },
    sstep (a, b, x) {
        const t = Math.max(Math.min((x - a)/(b - a), 1), 0);
        return t*t*(3.0 - (2.0*t));
    },
    Noise: {
        default_octaves: 5,
        hash2(x,y) {
            let pX = KMath.frac(x * 0.13);
            let pY = KMath.frac(y * 0.13);
            let pZ = KMath.frac(x * 0.13);
            // a.x*b.x + a.y*b.y + a.z*b.z;
            let d = pX*(pY+3.333) + pY*(pZ+3.333) + pZ*(pX+3.333);
            pX += d, pY += d, pZ += d;

            return KMath.frac((pX + pY) * pZ);
        },
        noise2(x=0,y=0,s=1) {
            const i = [Math.floor(x * s), Math.floor(y * s)];
            const f = [KMath.frac(x * s), KMath.frac(y * s)];

            const a = this.hash2(i[0], i[1]);
            const b = this.hash2(i[0] + 1, i[1]);
            const c = this.hash2(i[0], i[1] + 1);
            const d = this.hash2(i[0]+1, i[1]+1);

            const ux = f[0] * f[0] * (3.0 - 2.0 * f[0]);
            const uy = f[1] * f[1] * (3.0 - 2.0 * f[1]);
            return KMath.lerp(a, b, ux) + (c - a) * uy * (1.0 - ux) + (d - b) * ux * uy;
        }
    },
    seed: Math.random()
}
const we_par = {};
const params = {
    background: new Color(44, 44, 44, 1.0),
    particle: {
        max_color: new Color(255, 255, 255, 1.0),
        min_color: new Color(255, 255, 255, 0.1),

        max_speed_h: 100,
        min_speed_h: -100,
        max_speed_v: 100,
        min_speed_v: -100,

        max_scale: 32,
        min_scale: 24,

        max_rotsp: 1,
        min_rotsp: -1,

        count: 100,
        temp: []
    },
    wave: {
        color: new Color(35,35,35,1),
        top_spd: 0.8,
        bot_spd: -0.8,

        top_pos: 0.1,
        bot_pos: 0.1,

        top_frq: 2,
        bot_frq: 2,

        top_lin: 1,
        bot_lin: 1,

        top_len: 0.15,
        bot_len: 0.15,

        points: 15
    },

    seed: {
        type: Math.random() * 1e10,
        position: Math.random() * 1e10,

        barpos: Math.random() * 1e10,
        barfre: Math.random() * 1e10,
        barspd: Math.random() * 1e10,

        scale: Math.random() * 1e10,
        rotation: Math.random() * 1e10,
        color: Math.random() * 1e10,
        speed: Math.random() * 1e10
    }
}
const player = {
    time: {
        delta: 10,
    }
}
//#endregion

//#region Renderer
function AnimationLoop(time) {
    const t = (time/1e3);
    ctx.fillStyle = params.background.toString();
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const btop = params.wave.top_pos * center.y;
    const bbot = params.wave.bot_pos * center.y;

    ctx.action.fill = true;
    for (let i = 0; i < params.particle.count; i++) {
        const type = Math.round(KMath.rand(i+1, params.seed.type) * 3);
        const colr = KMath.rand(i+1, params.seed.color);
        const posx = KMath.rand(i+1,  params.seed.position), posy = KMath.rand(i+1, -params.seed.position);
        const rota = KMath.lerp(params.particle.min_rotsp, params.particle.max_rotsp, KMath.rand(i+1, params.seed.rotation)) * Math.PI * 2;
        const scal = KMath.lerp(params.particle.min_scale/24, params.particle.max_scale/24, KMath.rand(i+1, params.seed.scale));
        const spex = KMath.lerp(params.particle.min_speed_h, params.particle.max_speed_h, KMath.rand(i+1, params.seed.speed));
        const spey = KMath.lerp(params.particle.min_speed_v, params.particle.max_speed_v, KMath.rand(i+1, -params.seed.speed));

        let _x = KMath.mod((posx * canvas.width) + (t*spex), canvas.width + (scal*72)) - 36;
        let _y = KMath.mod2((posy * canvas.height) + (t*spey), btop, (canvas.height - bbot) + (scal*72)) - 36;

        const dis = Math.hypot(mouse.x-_x,mouse.y-_y);
        const md = mouse.down ? 500 : 200;
        const mda = (dis/md);
        
        let vx = _x - mouse.x, vy = _y - mouse.y;
        const rsq = Math.pow(vx*vx + vy*vy, -0.5);
        vx = dis <= md ? (rsq * vx) * ((1-(dis/md)) * md) : 0;
        vy = dis <= md ? (rsq * vy) * ((1-(dis/md)) * md) : 0;

        vx = params.particle.temp[i] = KMath.lerp(params.particle.temp[i] || 0, vx, 0.03);
        vy = params.particle.temp[i+params.particle.count] = KMath.lerp(params.particle.temp[i+params.particle.count] || 0, vy, 0.03);

        _x += vx, _y += vy;

        ctx.fillStyle = Color.Lerp(params.particle.min_color, params.particle.max_color, colr);
        KPath.draw(type, _x, _y, scal, t * rota);
    }

    ctx.fillStyle = params.wave.color.toString();
    for (let tt = 0; tt < 2; tt++) {
        const dir = (tt - 0.5) * 2;
        const ypos = (tt ? 0 : canvas.height);
        ctx.beginPath();
        ctx.moveTo(0, ypos);

        const wlen = tt ? params.wave.top_len : params.wave.bot_len;
        const wspd = tt ? params.wave.top_spd : params.wave.bot_spd;
        const wfrq = tt ? params.wave.top_frq : params.wave.bot_frq;
        const wlin = tt ? params.wave.top_lin : params.wave.bot_lin;
        const offs = (tt ? btop : bbot) * dir;
        
        for (let j = 0; j < params.wave.points; j++) {
            const a = j / (params.wave.points-1);
            const w = KMath.Noise.noise2((a + params.seed.barpos + (t * wspd)) * wfrq, (t * wspd) * wlin);
            ctx.lineTo(a * canvas.width, offs + ypos + (wlen * canvas.height * w * dir));
        }
        ctx.lineTo(canvas.width, ypos);
        ctx.closePath();

        ctx.fill();
    }

    window.requestAnimationFrame(AnimationLoop);
};  window.requestAnimationFrame(AnimationLoop);
//#endregion
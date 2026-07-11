autowatch = 1;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
inlets  = 1;
outlets = 0;

let g_depth = 1.0;
let g_time  = 308;
let g_curve = 0.5;
let g_bpm   = 120;

const PAD_TOP    = 2;
const PAD_BOTTOM = 2;

let scan_pos   = -1;
let scan_start = -1;

const t = new Task(function() {
    if (scan_start >= 0) {
        const beat_ms = 60000 / g_bpm;
        scan_pos = (Date.now() - scan_start) / beat_ms;
        if (scan_pos > 1) {
            scan_pos   = -1;
            scan_start = -1;
        }
    }
    mgraphics.redraw();
}, this);
t.interval = 16;
t.repeat();

function msg_float(v) {}
function msg_int(v)   {}

function bang() {
    scan_start = Date.now();
    scan_pos   = 0;
}

function depth(v) { g_depth = Math.max(0, Math.min(1, v)); }
function time(v)  { g_time  = v; }
function curve(v) { g_curve = Math.max(-1, Math.min(1, v)); }
function bpm(v)   { g_bpm   = v; }

function curveShape(pos, curve) {
    const k = curve * 10;
    if (Math.abs(k) < 0.0001) return pos;
    return (Math.exp(k * pos) - 1) / (Math.exp(k) - 1);
}

function paint() {
    const w  = this.box.rect[2] - this.box.rect[0];
    const h  = this.box.rect[3] - this.box.rect[1];
    const dh = h - PAD_TOP - PAD_BOTTOM;
    const toY = (v) => PAD_TOP + (1 - v) * dh;

    const beat_ms   = 60000 / g_bpm;
    const fill_frac = Math.min(g_time / beat_ms, 1.0);

    function getV(x_norm) {
        if (x_norm > fill_frac) return 1.0;
        const pos    = x_norm / fill_frac;
        const shaped = curveShape(pos, g_curve);
        return (1 - g_depth) + g_depth * shaped;
    }

    // Background
    mgraphics.set_source_rgba(32/255, 32/255, 32/255, 1.0);
    mgraphics.rectangle(0, 0, w, h);
    mgraphics.fill();

    const steps = Math.ceil(w);

    // Fill under curve
    mgraphics.set_source_rgba(64/255, 71/255, 83/255, 1.0);
    for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * w;
        const y = toY(getV(i / steps));
        if (i === 0) mgraphics.move_to(x, y);
        else         mgraphics.line_to(x, y);
    }
    mgraphics.line_to(w, h);
    mgraphics.line_to(0, h);
    mgraphics.close_path();
    mgraphics.fill();

    // Waveform line
    mgraphics.set_source_rgba(158/255, 182/255, 229/255, 1.0);
    mgraphics.set_line_width(1.5);
    for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * w;
        const y = toY(getV(i / steps));
        if (i === 0) mgraphics.move_to(x, y);
        else         mgraphics.line_to(x, y);
    }
    mgraphics.stroke();

    // Scan dot
    if (scan_pos >= 0) {
        const sx = scan_pos * w;
        const sy = toY(getV(scan_pos));
        mgraphics.set_source_rgba(1.0, 1.0, 1.0, 0.9);
        mgraphics.arc(sx, sy, 3, 0, Math.PI * 2);
        mgraphics.fill();
    }
}
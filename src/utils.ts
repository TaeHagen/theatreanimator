export enum Tools {
    PAINT,
    ERASE,
    SELECT
}

export function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

export function getPixelsOnLine(x1, y1, x0, y0, cb){
    var dx = Math.abs(x1 - x0);
   var dy = Math.abs(y1 - y0);
   var sx = (x0 < x1) ? 1 : -1;
   var sy = (y0 < y1) ? 1 : -1;
   var err = dx - dy;

   while(true) {
      cb(x0, y0); // Do what you need to for this

      if (Math.abs(x0 - x1) < 0.0001 && Math.abs(y0 - y1) < 0.0001) break;
      var e2 = 2*err;
      if (e2 > -dy) { err -= dy; x0  += sx; }
      if (e2 < dx) { err += dx; y0  += sy; }
   }
}

export function drawDiamond(context, x, y, width, height){
    context.save();
            context.beginPath();
            context.moveTo(x, y);
            
            // top left edge
            context.lineTo(x - width / 2, y + height / 2);
            
            // bottom left edge
            context.lineTo(x, y + height);
            
            // bottom right edge
            context.lineTo(x + width / 2, y + height / 2);
            
            // closing the path automatically creates
            // the top right edge
            context.closePath();
            
            context.fill();
    context.restore();
        }

export function saveData () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    return function (blob, fileName) {
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
};
export function readFile(cb: (data: any, name: string) => void) {
    const input = document.createElement("input");
    input.style.display = "none";
    input.type = "file";
    document.body.appendChild(input);
    input.click();
    input.addEventListener('change', () => {
        var fr=new FileReader();
        fr.onload=function(){
            document.body.removeChild(input);
            cb(JSON.parse(fr.result.toString()), input.files[0].name);
        }
        fr.readAsText(input.files[0]);
    })
}

export function readFileBin(cb: (data: File) => void) {
    const input = document.createElement("input");
    input.style.display = "none";
    input.type = "file";
    document.body.appendChild(input);
    input.click();
    input.addEventListener('change', () => {
        cb(input.files[0]);
    })
}

export function asAny(a: any): any {
    return a;
}
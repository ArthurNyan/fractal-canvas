function canvasApp() {
    const displayCanvas = document.getElementById("displayCanvas");
    const context = displayCanvas.getContext("2d");
    const displayWidth = displayCanvas.width;
    const displayHeight = displayCanvas.height;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = displayWidth;
    exportCanvas.height = displayHeight;
    const exportCanvasContext = exportCanvas.getContext("2d");

    const btnExport = document.getElementById("btnExport");
    btnExport.addEventListener("click", exportPressed, false);

    const btnRegenerate = document.getElementById("btnRegenerate");
    btnRegenerate.addEventListener("click", regeneratePressed, false);

    const drawsPerFrame = 4;
    let numCircles;
    let maxMaxRad;
    let minMaxRad;
    let minRadFactor;
    let circles;
    let iterations;
    let numPoints;
    let timer;
    let bgColor, urlColor;
    let lineWidth;
    let colorParamArray;
    let colorArray;
    let minX, maxX, minY, maxY;
    let lineNumber;
    let twistAmount;
    let fullTurn;
    let lineAlpha;
    let maxColorValue;
    let minColorValue;
    let stepsPerSegment;

    init();

    function init() {
        numCircles = 15;
        maxMaxRad = 800;
        minMaxRad = 200;
        minRadFactor = 0;
        iterations = 11;
        numPoints = Math.pow(2, iterations) + 1;

        fullTurn = (Math.PI * 2 * numPoints) / (1 + numPoints);

        minX = -maxMaxRad;
        maxX = displayWidth + maxMaxRad;
        minY = displayHeight / 2 - 50;
        maxY = displayHeight / 2 + 50;

        twistAmount = 0.67 * Math.PI * 2;
        stepsPerSegment = Math.floor(800 / numCircles);

        maxColorValue = 100;
        minColorValue = 20;
        lineAlpha = 0.1;

        bgColor = "#171717";
        urlColor = "#333333";

        lineWidth = 1.01;

        startGenerate();
    }

    function startGenerate() {
        lineNumber = 0;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, displayWidth, displayHeight);
        setCircles();
        colorArray = setColorList(iterations);
        if (timer) clearInterval(timer);
        timer = setInterval(onTimer, 1000 / 60);
    }

    function setColorList(iter) {
        const r0 = minColorValue + Math.random() * (maxColorValue - minColorValue);
        const g0 = minColorValue + Math.random() * (maxColorValue - minColorValue);
        const b0 = minColorValue + Math.random() * (maxColorValue - minColorValue);
        const r1 = minColorValue + Math.random() * (maxColorValue - minColorValue);
        const g1 = minColorValue + Math.random() * (maxColorValue - minColorValue);
        const b1 = minColorValue + Math.random() * (maxColorValue - minColorValue);

        const a = lineAlpha;
        const colorArray = [];

        colorParamArray = setLinePoints(iter);

        for (let i = 0; i < colorParamArray.length; i++) {
            const param = colorParamArray[i];
            const r = Math.floor(r0 + param * (r1 - r0));
            const g = Math.floor(g0 + param * (g1 - g0));
            const b = Math.floor(b0 + param * (b1 - b0));
            const newColor = `rgba(${r},${g},${b},${a})`;
            colorArray.push(newColor);
        }

        return colorArray;
    }

    function setCircles() {
        circles = [];

        for (let i = 0; i < numCircles; i++) {
            const maxR = minMaxRad + Math.random() * (maxMaxRad - minMaxRad);
            const minR = minRadFactor * maxR;
            const newCircle = {
                centerX: minX + (i / (numCircles - 1)) * (maxX - minX),
                centerY: minY + (i / (numCircles - 1)) * (maxY - minY),
                maxRad: maxR,
                minRad: minR,
                phase: (i / (numCircles - 1)) * twistAmount,
                pointArray: setLinePoints(iterations),
            };
            circles.push(newCircle);
        }
    }

    function onTimer() {
        const numCircles = circles.length;

        for (let k = 0; k < drawsPerFrame; k++) {
            if (lineNumber > numPoints - 1) {
                clearInterval(timer);
                timer = null;
                break;
            }

            const theta = (lineNumber / (numPoints - 1)) * fullTurn;

            context.globalCompositeOperation = "lighter";
            context.lineJoin = "miter";
            context.strokeStyle = colorArray[lineNumber];
            context.lineWidth = lineWidth;
            context.beginPath();

            for (let i = 0; i < numCircles - 1; i++) {
                let centerX = circles[i].centerX;
                let centerY = circles[i].centerY;
                let rad0 = circles[i].minRad + circles[i].pointArray[lineNumber] * (circles[i].maxRad - circles[i].minRad);
                let phase0 = circles[i].phase;

                let rad1 = circles[i + 1].minRad + circles[i + 1].pointArray[lineNumber] * (circles[i + 1].maxRad - circles[i + 1].minRad);
                let phase1 = circles[i + 1].phase;

                for (let j = 0; j < stepsPerSegment; j++) {
                    const linParam = j / (stepsPerSegment - 1);
                    const cosParam = 0.5 - 0.5 * Math.cos(linParam * Math.PI);
                    centerX = circles[i].centerX + linParam * (circles[i + 1].centerX - circles[i].centerX);
                    centerY = circles[i].centerY + cosParam * (circles[i + 1].centerY - circles[i].centerY);
                    const rad = rad0 + cosParam * (rad1 - rad0);
                    const phase = phase0 + cosParam * (phase1 - phase0);
                    const x0 = centerX + 0.75 * rad * Math.cos(theta + phase);
                    const y0 = centerY + rad * Math.sin(theta + phase);
                    if
                        (j === 0) {
                        context.moveTo(x0, y0);
                    } else {
                        context.lineTo(x0, y0);
                    }
                }
            }

            context.stroke();

            lineNumber++;
        }
    }

    function setLinePoints(iterations) {
        let pointList = {};
        let pointArray = [];
        pointList.first = { x: 0, y: 1 };
        let lastPoint = { x: 1, y: 1 };
        let minY = 1;
        let maxY = 1;
        let point;
        let nextPoint;
        let dx, newX, newY;

        pointList.first.next = lastPoint;

        for (let i = 0; i < iterations; i++) {
            point = pointList.first;
            while (point.next != null) {
                nextPoint = point.next;

                dx = nextPoint.x - point.x;
                newX = 0.5 * (point.x + nextPoint.x);
                newY = 0.5 * (point.y + nextPoint.y);
                newY += dx * (Math.random() * 2 - 1);

                const newPoint = { x: newX, y: newY };

                if (newY < minY) {
                    minY = newY;
                } else if (newY > maxY) {
                    maxY = newY;
                }

                newPoint.next = nextPoint;
                point.next = newPoint;

                point = nextPoint;
            }
        }

        if (maxY != minY) {
            const normalizeRate = 1 / (maxY - minY);
            point = pointList.first;
            while (point != null) {
                point.y = normalizeRate * (point.y - minY);
                pointArray.push(point.y);
                point = point.next;
            }
        } else {
            point = pointList.first;
            while (point != null) {
                point.y = 1;
                pointArray.push(point.y);
                point = point.next;
            }
        }

        return pointArray;
    }

    function exportPressed() {
        exportCanvasContext.fillStyle = bgColor;
        exportCanvasContext.fillRect(0, 0, displayWidth, displayHeight);
        exportCanvasContext.drawImage(displayCanvas, 0, 0, displayWidth, displayHeight, 0, 0, displayWidth, displayHeight);

        const dataURL = exportCanvas.toDataURL("image/png");
        const imageWindow = window.open("", "fractalLineImage", `left=0,top=0,width=${displayWidth},height=${displayHeight},toolbar=0,resizable=0`);
        imageWindow.document.write("<title>Export Image</title>");
        imageWindow.document.write(`<img id='exportImage' alt='' height='${displayHeight}' width='${displayWidth}' style='position:absolute;left:0;top:0'/>`);
        imageWindow.document.close();
        const exportImage = imageWindow.document.getElementById("exportImage");
        exportImage.src = dataURL;
    }

    function regeneratePressed() {
        startGenerate();
    }
}

canvasApp();
// Function to handle image uploads and process them
function processImages() {
    let blankInput = document.getElementById("blankInput").files[0];
    let sampleInput = document.getElementById("sampleInput").files[0];

    if (!blankInput || !sampleInput) {
        alert("Please upload both blank and sample images.");
        return;
    }

    let blankImg = new Image();
    let sampleImg = new Image();

    blankImg.onload = function () {
        sampleImg.onload = function () {
            let blankCanvas = document.createElement("canvas");
            let sampleCanvas = document.createElement("canvas");

            let width = Math.min(blankImg.width, sampleImg.width);
            let height = Math.min(blankImg.height, sampleImg.height);

            blankCanvas.width = sampleCanvas.width = width;
            blankCanvas.height = sampleCanvas.height = height;

            let blankCtx = blankCanvas.getContext("2d");
            let sampleCtx = sampleCanvas.getContext("2d");

            blankCtx.drawImage(blankImg, 0, 0, width, height);
            sampleCtx.drawImage(sampleImg, 0, 0, width, height);

            let blankData = blankCtx.getImageData(0, height / 2, width, 1).data;
            let sampleData = sampleCtx.getImageData(0, height / 2, width, 1).data;

            // Round wavelengths to whole numbers
            let wavelengths = Array.from({ length: width }, (_, i) => Math.round(400 + (i * (700 - 400) / width)));

            let absorbanceRed = [], absorbanceGreen = [], absorbanceBlue = [], absorbanceTotal = [];

            for (let i = 0; i < width; i++) {
                let idx = i * 4;

                let blankR = Math.max(blankData[idx], 1e-6);
                let blankG = Math.max(blankData[idx + 1], 1e-6);
                let blankB = Math.max(blankData[idx + 2], 1e-6);

                let sampleR = Math.max(sampleData[idx], 1e-6);
                let sampleG = Math.max(sampleData[idx + 1], 1e-6);
                let sampleB = Math.max(sampleData[idx + 2], 1e-6);

                let A_R = -Math.log10(sampleR / blankR);
                let A_G = -Math.log10(sampleG / blankG);
                let A_B = -Math.log10(sampleB / blankB);

                absorbanceRed.push(A_R);
                absorbanceGreen.push(A_G);
                absorbanceBlue.push(A_B);
                absorbanceTotal.push((A_R + A_G + A_B) / 3);
            }

            plotAbsorbanceChart(wavelengths, absorbanceRed, absorbanceGreen, absorbanceBlue);
            plotTotalAbsorbanceChart(wavelengths, absorbanceTotal);
        };

        sampleImg.src = URL.createObjectURL(sampleInput);
    };

    blankImg.src = URL.createObjectURL(blankInput);
}

let absorbanceChart;
let totalAbsorbanceChart;

// Function to plot the individual RGB absorbance graph
function plotAbsorbanceChart(wavelengths, absorbanceRed, absorbanceGreen, absorbanceBlue) {
    let ctx = document.getElementById("absorbanceChart").getContext("2d");

    if (absorbanceChart) {
        absorbanceChart.destroy(); // Prevent duplicate charts
    }

    absorbanceChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: wavelengths,
            datasets: [
                { label: "Red Absorbance", data: absorbanceRed, borderColor: "#ff4d4d", backgroundColor: "rgba(255, 77, 77, 0.2)", tension: 0.4 },
                { label: "Green Absorbance", data: absorbanceGreen, borderColor: "#33cc33", backgroundColor: "rgba(51, 204, 51, 0.2)", tension: 0.4 },
                { label: "Blue Absorbance", data: absorbanceBlue, borderColor: "#3399ff", backgroundColor: "rgba(51, 153, 255, 0.2)", tension: 0.4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: "Wavelength (nm)", color: "#ccc" },
                    grid: { color: "rgba(255, 255, 255, 0.1)" },
                    ticks: { color: "#ddd" }
                },
                y: {
                    title: { display: true, text: "Absorbance", color: "#ccc" },
                    grid: { color: "rgba(255, 255, 255, 0.1)" },
                    min: -1,
                    max: 1,
                    ticks: { color: "#ddd" }
                }
            },
            plugins: {
                legend: { labels: { color: "#fff" } },
                tooltip: { backgroundColor: "rgba(0,0,0,0.8)", bodyColor: "#fff", titleColor: "#ddd" },
                zoom: {
                    pan: { enabled: true, mode: "x" },
                    zoom: { wheel: { enabled: true }, mode: "x", pinch: { enabled: true } }
                }
            }
        }
    });
}

function plotTotalAbsorbanceChart(wavelengths, absorbanceTotal) {
    let ctx = document.getElementById("totalAbsorbanceChart").getContext("2d");

    if (totalAbsorbanceChart) {
        totalAbsorbanceChart.destroy();
    }

    totalAbsorbanceChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: wavelengths,
            datasets: [
                { label: "Total Absorbance", data: absorbanceTotal, borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.2)", tension: 0.4, spanGaps: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: "Wavelength (nm)", color: "#ccc" },
                    grid: { color: "rgba(255, 255, 255, 0.1)" },
                    ticks: { color: "#ddd" }
                },
                y: {
                    title: { display: true, text: "Absorbance", color: "#ccc" },
                    grid: { color: "rgba(255, 255, 255, 0.1)" },
                    min: -1,
                    max: 1,
                    ticks: { color: "#ddd" }
                }
            },
            plugins: {
                legend: { labels: { color: "#fff" } },
                tooltip: { backgroundColor: "rgba(0,0,0,0.8)", bodyColor: "#fff", titleColor: "#ddd" },
                zoom: {
                    pan: { enabled: true, mode: "x" },
                    zoom: { wheel: { enabled: true }, mode: "x", pinch: { enabled: true } }
                }
            }
        }
    });
}

// handle preview
document.getElementById("blankInput").addEventListener("change", previewImage);
document.getElementById("sampleInput").addEventListener("change", previewImage);

function previewImage(event) {
    let file = event.target.files[0];
    if (!file) return;

    let previewBox = event.target.id === "blankInput" ? "blankPreview" : "samplePreview";
    let labelBox = event.target.closest(".file-label");

    let reader = new FileReader();

    reader.onload = function (e) {
        let img = new Image();
        img.src = e.target.result;
        img.className = "preview-img";

        img.onload = function () {
            labelBox.style.width = `${Math.min(img.width, 400)}px`;
            labelBox.style.height = `${Math.min(img.height, 400)}px`;

            document.getElementById(previewBox).innerHTML = "";
            document.getElementById(previewBox).appendChild(img);

            adjustHeights();
        };
    };

    reader.readAsDataURL(file);
}

function adjustHeights() {
    let blankLabel = document.querySelector("#blankInput").closest(".file-label");
    let sampleLabel = document.querySelector("#sampleInput").closest(".file-label");

    let maxHeight = Math.max(blankLabel.offsetHeight, sampleLabel.offsetHeight);
    
    blankLabel.style.height = `${maxHeight}px`;
    sampleLabel.style.height = `${maxHeight}px`;
}


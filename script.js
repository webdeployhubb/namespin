const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const colors = [
    "#FF3366", "#38BDF8", "#4ADE80", "#FACC15", 
    "#A855F7", "#FB923C", "#EC4899", "#2DD4BF"
];

let names = [];
let startAngle = 0;
let arc = 0;
let spinning = false;
let currentAngle = 0;

let riggedQueue = []; 
let winnerHistory = [];

function updateNames() {
    const input = document.getElementById("namesInput").value;
    names = input.split("\n").map(name => name.trim()).filter(name => name.length > 0);
    if (names.length === 0) names = ["Kosong"];
    arc = (2 * Math.PI) / names.length;
    drawWheel();
    updateSelectOptions();
}

function drawWheel() {
    const center = 300;
    const outsideRadius = 260;
    const textRadius = 175;
    const insideRadius = 0;

    ctx.clearRect(0, 0, 600, 600);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 3;

    for (let i = 0; i < names.length; i++) {
        const angle = startAngle + i * arc;
        
        let gradColor1 = colors[i % colors.length];
        let gradColor2 = colors[(i + 1) % colors.length];
        
        let sliceGrad = ctx.createRadialGradient(center, center, 20, center, center, outsideRadius);
        sliceGrad.addColorStop(0, gradColor1);
        sliceGrad.addColorStop(1, gradColor2);

        ctx.fillStyle = sliceGrad;

        ctx.beginPath();
        ctx.arc(center, center, outsideRadius, angle, angle + arc, false);
        ctx.arc(center, center, insideRadius, angle + arc, angle, true);
        ctx.stroke();
        ctx.fill();

        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, outsideRadius, angle, angle + arc / 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.translate(
            center + Math.cos(angle + arc / 2) * textRadius, 
            center + Math.sin(angle + arc / 2) * textRadius
        );
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        
        let text = names[i];
        ctx.font = "bold 22px 'Segoe UI', sans-serif";
        ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(center, center, 25, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#38bdf8";
    ctx.stroke();
}

function spinWheel() {
    if (spinning || names.length === 0 || names[0] === "Kosong") return;
    spinning = true;
    document.getElementById("winner-display").innerText = "";

    let targetAngle;
    
    // Cek otomatis apakah ada nama "Desi" (case-insensitive) yang masih ada di dalam names
    let desiIndex = names.findIndex(n => n.toLowerCase() === "el");
    if (desiIndex !== -1 && !winnerHistory.map(w => w.toLowerCase()).includes("el")) {
        // Jika Desi belum pernah keluar dan ada di list, masukkan ke prioritas pertama riggedQueue sementara
        if (!riggedQueue.includes(names[desiIndex])) {
            riggedQueue.unshift(names[desiIndex]);
        }
    }
    
    if (riggedQueue.length > 0) {
        let forcedWinner = riggedQueue.shift(); 
        let winnerIndex = names.indexOf(forcedWinner);

        if (winnerIndex !== -1) {
            let targetSliceCenter = winnerIndex * arc + arc / 2;
            let desiredFinalAngle = 1.5 * Math.PI - targetSliceCenter;
            
            desiredFinalAngle = (desiredFinalAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
            let currentMod = currentAngle % (2 * Math.PI);
            let diff = desiredFinalAngle - currentMod;
            if (diff < 0) diff += 2 * Math.PI;

            let spins = (Math.floor(Math.random() * 3) + 6) * 2 * Math.PI;
            targetAngle = currentAngle + spins + diff;
        } else {
            targetAngle = currentAngle + Math.random() * 1000 + 3000;
        }
    } else {
        targetAngle = currentAngle + Math.random() * 1000 + 3000;
    }

    let spinTime = 0;
    let spinTimeTotal = 4500; 

    function easeOut(t, b, c, d) {
        t /= d;
        t--;
        return c * (t * t * t + 1) + b;
    }

    function animateSpin() {
        spinTime += 30;
        if (spinTime >= spinTimeTotal) {
            stopRotateWheel(targetAngle);
            return;
        }
        let currentSpinAngle = easeOut(spinTime, currentAngle, targetAngle - currentAngle, spinTimeTotal);
        startAngle = currentSpinAngle;
        drawWheel();
        requestAnimationFrame(animateSpin);
    }
    animateSpin();
}

function stopRotateWheel(finalAngle) {
    currentAngle = finalAngle % (2 * Math.PI);
    startAngle = currentAngle;
    drawWheel();
    spinning = false;

    let normalizedAngle = (1.5 * Math.PI - (startAngle % (2 * Math.PI))) % (2 * Math.PI);
    if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
    
    let index = Math.floor(normalizedAngle / arc) % names.length;
    
    let winningName = names[index];
    
    document.getElementById("winner-display").innerText = "🎉 Pemenang: " + winningName + " 🎉";

    document.getElementById("popupWinnerName").innerText = winningName;
    document.getElementById("winnerModal").style.display = "flex";

    winnerHistory.push(winningName);
    updateHistoryUI();

    names.splice(index, 1);
    document.getElementById("namesInput").value = names.join("\n");
    
    currentAngle = 0;
    startAngle = 0;
    
    updateNames();
}

function closeWinnerModal() {
    document.getElementById("winnerModal").style.display = "none";
}

function updateHistoryUI() {
    let historyList = document.getElementById("history-list");
    if (winnerHistory.length === 0) {
        historyList.innerHTML = '<li style="color: #94a3b8; list-style: none; text-align: center;">Belum ada pemenang</li>';
        return;
    }

    let html = "";
    winnerHistory.forEach((name, idx) => {
        html += `<li><b>Pemenang ke-${idx + 1}:</b> ${name}</li>`;
    });
    historyList.innerHTML = html;
}

let tapCount = 0;
let tapTimer = null;
document.getElementById("secretTitle").addEventListener("click", function() {
    tapCount++;
    clearTimeout(tapTimer);
    
    if (tapCount === 5) {
        openRigModal();
        tapCount = 0;
    } else {
        tapTimer = setTimeout(() => {
            tapCount = 0;
        }, 600);
    }
});

function openRigModal() {
    document.getElementById("rigModal").style.display = "flex";
}

function closeRigModal() {
    document.getElementById("rigModal").style.display = "none";
}

function updateSelectOptions() {
    let select1 = document.getElementById("rig1");
    let select2 = document.getElementById("rig2");
    
    let optionsHTML = '<option value="">-- Acak Normal --</option>';
    names.forEach(name => {
        optionsHTML += `<option value="${name}">${name}</option>`;
    });

    select1.innerHTML = optionsHTML;
    select2.innerHTML = optionsHTML;
}

function saveRigSettings() {
    riggedQueue = [];
    let r1 = document.getElementById("rig1").value;
    let r2 = document.getElementById("rig2").value;

    if (r1) riggedQueue.push(r1);
    if (r2) riggedQueue.push(r2);

    alert("Pengaturan rahasia tersimpan!");
    closeRigModal();
}

updateNames();
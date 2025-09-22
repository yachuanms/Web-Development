//yh167_Web_HW3.surge.sh
//initial
let level = 0;
let mistakes = 0;
let score = 0;
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
let timeLimit = 5 + (level*2);
let timeLeft = timeLimit;
let timerID = null;
let diffRow, diffCol, diffColor;
let gameOver = false;
let gameStarted = false;


// metrics
let metrics = JSON.parse(localStorage.getItem("metrics")) || { totalGames: 0, totalMistakes: 0 };
updateInfo();
localStorage.setItem("bestScore", bestScore);
localStorage.setItem("metrics", JSON.stringify(metrics));

//Button part
const StartBtn = document.getElementById("StartBtn");
StartBtn.addEventListener("click", () => {
    //alert("clicked");
    if(StartBtn.textContent == "▶ Start"){
        StartBtn.textContent = "⏸ Pause";
        if(!gameStarted){
            drawGrid(); // 只有第一次開始才畫格子
            gameStarted = true;
        }
        Timer(); // 繼續計時
    }else{
        clearInterval(timerID);
        StartBtn.textContent = "▶ Start";
    }
});

const ResetBtn = document.getElementById("ResetBtn");
ResetBtn.addEventListener("click", () => {
    mistakes = 0;
    level =0;
    score = 0;
    bestScore = 0;
    timeLimit = 5;
    timeLeft = timeLimit;
    StartBtn.textContent = "▶ Start";
    clearInterval(timerID);
    updateInfo();
    //drawGrid();
});

//Canvas
const canvas = document.getElementById("blocks");
const ctx = canvas.getContext("2d");

//各種顏色list
const colors = [["#aacadeff","#bfdbecff", "#adcbdeff", "#bfdbecff"], // 藍色系
    ["#dfc568ff", "#dfc772ff", "#f0d571ff", "#ddc25fff"], // 黃褐色系
    ["#d9e7a1ff", "#cfdc9dff", "#dbec9aff", "#dfecacff"], // 黃綠色系
    ["#f1b0cdff", "#e6aac5ff", "#f2b8d2ff", "rgba(246, 162, 200, 1)"], //粉紫色系
    ["#f0d3bcff","#f1cdb0ff", "#e4ba98ff","#f1c4a0ff", "#debda2ff", "rgba(237, 213, 191, 1)"], //橘色
];

let gridSize = 3; //3X3開始
let cellSize = canvas.width/gridSize;
//console.log(canvas, ctx);
let groupIndex = Math.floor(Math.random() * colors.length);
let group = colors[groupIndex];
let mainColor = group[0]; // 其他格子的顏色


//讓格子不同顏色
function drawGrid(){
    // 每局重新挑顏色組
    if(!gameOver){
        groupIndex = Math.floor(Math.random() * colors.length);
        group = colors[groupIndex];
        mainColor = group[0];
        diffRow = Math.floor(Math.random()*gridSize);
        diffCol = Math.floor(Math.random()*gridSize);
        do {
            diffColor = group[Math.floor(Math.random() * group.length)];
        } while (diffColor === mainColor);
    }
    

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if(col == diffCol && row == diffRow){
                ctx.fillStyle = diffColor;
                //ctx.fillStyle = colors[color];
            }else{
                ctx.fillStyle = mainColor;
                //ctx.fillStyle = colors[level%colors.length];//以免超出list    
            }
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            // 找不到後 邊框
            if (gameOver && col == diffCol && row == diffRow) {
                ctx.strokeStyle = "black";
                ctx.lineWidth = 4;
            } else {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 1;
            }
            ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
            
        }
    }
    Timer();
}

//點擊格子
canvas.addEventListener("click",(e)=>{
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedCol = Math.floor(x/cellSize);
    const clickedRow = Math.floor(y/cellSize);
    console.log("clicked: (col row)", clickedCol, clickedRow);
    if(StartBtn.textContent == "▶ Start"){
        return;
    }
    if(clickedCol == diffCol && clickedRow == diffRow){
        console.log("Correct!!!");
        level++;
        gridSize = 3+(Math.floor(level/5));
        cellSize = canvas.width/gridSize;
        console.log("level: ", level);
        score ++;
        if(score > bestScore){
            bestScore = score;
            localStorage.setItem("bestScore", bestScore);
        }
        clearInterval(timerID);
        //timeLimit = level*2 + 5;
        timeLeft +=Math.floor(level/10)+2;
        updateInfo();
        drawGrid();
    }else{
        console.log("Try again!!!");
        mistakes ++;
        updateInfo();
        if(mistakes >= 5){
            level = 0;
            gridSize = 3;
            cellSize = canvas.width/gridSize;
            console.log("Fail... Restart!");
            metrics.totalMistakes += mistakes;
            metrics.totalGames ++;
            mistakes = 0;
            score = 0;
            clearInterval(timerID);
            timeLimit = 5;
            timeLeft = timeLimit;
            updateInfo();
            gameStarted = false;
            //gameOver = true;
            localStorage.setItem("metrics", JSON.stringify(metrics));
            alert("GAME OVER, You lose.... \n Row: "+diffRow+" Col: "+diffCol);
            if(StartBtn.textContent == "⏸ Pause"){
                StartBtn.textContent = "▶ Start";
            }
            //drawGrid();
            //gameOver = false;
            //drawGrid();
        }
    }
});

//更新分數info
function updateInfo(){
    document.getElementById("mistake").textContent = "Mistake:  "+mistakes;
    document.getElementById("score").textContent = "Score:  "+score;
    document.getElementById("bestScore").textContent = "Best Score:  "+bestScore;
    document.getElementById("time").textContent = "Time:  "+timeLeft;
    document.getElementById("totalGames").textContent = "Total Games: " + metrics.totalGames;
    document.getElementById("totalMistakes").textContent = "Total Mistakes: " + metrics.totalMistakes;
}

//計時器
function Timer(){
    if(timerID){
        clearInterval(timerID);
    }
    document.getElementById("time").textContent = "Time:   "+timeLeft;
    timerID = setInterval(() =>{
        timeLeft--;
        document.getElementById("time").textContent = "Time:   "+timeLeft;
        if(timeLeft <= 0){
            clearInterval(timerID);
            score = 0;
            timeLimit = 5;
            timeLeft = timeLimit;
            level = 0;
            gridSize = 3;
            cellSize = canvas.width/gridSize;
            metrics.totalGames ++;
            metrics.totalMistakes += mistakes;
            mistakes = 0;
            gameStarted = false;
            localStorage.setItem("metrics", JSON.stringify(metrics));
            alert("Timed out!\n Row: "+diffRow+" Col: "+diffCol);
            updateInfo();
            if(StartBtn.textContent == "⏸ Pause"){
                StartBtn.textContent = "▶ Start";
            }
            //gameOver = true;
            //drawGrid();
            //gameOver = false;
            //drawGrid();
        }
    }, 1000);
}

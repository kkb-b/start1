const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI 요소 가져오기
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverMessage = document.getElementById("gameOverMessage");
const restartBtn = document.getElementById("restartBtn");

// 게임 상태 변수 선언
let x, y, dx, dy, paddleX;
let isGameOver = false;

let ballOpacity = 1.0; // 공의 투명도
let opacityTimeoutId = null; // 투명도 복구 타이머 ID 15~16줄

const ballRadius = 8;
const paddleHeight = 10;
let paddleWidth = 100;
let targetPaddleWidth = 100;

//벽돌 기본 사이즈, 간격
const brickWidth = 80;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 35;

let bricks = [];
let currentStage = 1;    // 현재 진행 중인 스테이지 번호
let brokenBricksCount = 0; // 부순 벽돌 개수
let totalBricks = 0;     // 스테이지마다 깨야 할 목표 벽돌 개수
let bombs = [];          // 폭탄들을 저장할 배열

const statusMap = { //status 별로 할당 //(다른 것도 추가가능) //전역변수로 변경
    "T": { color: "#48dd57", effectFunc: tfHit},
    "F": { color: "#d74e1d", effectFunc: tfHit},
    "ADD": { color: "#8e8e8e", effectFunc: andHit},
    "OR": {color: "#444444", effectFunc: orHit}
};

// 이벤트 리스너 추가
document.addEventListener("mousemove", mouseMoveHandler, false);
restartBtn.addEventListener("click", initGame); // 다시 시작 버튼 클릭 시 게임 초기화
canvas.addEventListener("click", clickBombHandler, false); // 폭탄 클릭 이벤트

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
        if (paddleX < 0) paddleX = 0;
        if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
    }
}
window.addEventListener("keydown", (e) => {
    if (e.key === 'k') {
        currentStage++;
        endGame("모든 벽돌 제거 승리!");
        loadStage(currentStage);
    }
  });

function clickBombHandler(e) { //폭탄 클릭 핸들러
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    const relativeY = e.clientY - canvas.getBoundingClientRect().top;
    
    for (let i = 0; i < bombs.length; i++) {
        let b = bombs[i];
        if (b.isActive) {
            // 폭탄 중심과 마우스 클릭 위치 간의 거리 계산
            const dist = Math.hypot(relativeX - b.x, relativeY - b.y);
            if (dist <= b.radius + 10) { // 마우스 클릭 판정을 넉넉하게 주기 위해 +10
                b.isActive = false; // 폭탄 해제 (클릭 시 사라짐)
            }
        }
    }
}

class Bomb { //폭탄배열
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.dy = 1; // 떨어지는 속도
        this.isActive = true;
    }

    draw(ctx) {
        if (!this.isActive) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#2C3E50"; // 폭탄 색상
        ctx.fill();
        ctx.closePath();
        
        // 폭탄 심지 그리기
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x + 5, this.y - this.radius - 5);
        ctx.strokeStyle = "#E74C3C";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    update() {
        if (!this.isActive) return;
        this.y += this.dy;
        
        // 바닥에 닿으면 게임 오버
        if (this.y + this.radius > canvas.height) {
            endGame("폭탄이 바닥에 떨어졌습니다. 게임 오버!");
            this.isActive = false;
        }
    }
}

//객체에서 Brick class로 변경, 속성이 많아질 거 같아 Object.assign으로 구현
class Brick {
    constructor(x, y, option = {}) { //생성할때 x,y는 필수로 넣고 나머지는 baseSettings 에서 바꾸고 싶은것만 {}로 감싸서 넣으면 됨, 없는 속성 추가도 가능
        this.x = x;
        this.y = y;

        const baseSettings = {
            //status 0:깨진블록 1:일반블록 T:true블록 F:false블록
            status: 1,
            effectFunc: ()=>{},
            color: "#787878",
            text: "" //텍스트 추가(블럭위에 써질것)
        };

        Object.assign(this, baseSettings, option);
    }

    onHit() { //블록 쳤을때 기능 함수 실행 //status 맵 활용 추가
        const currentFunc = statusMap[this.status] || {effectFunc: this.effectFunc};
        this.effectFunc = currentFunc.effectFunc;
        this.effectFunc();
        if(this.status===1){
            this.status = 0;
            brokenBricksCount++;
        }
    }

    draw(ctx) {
        if (this.status !== 0) {
            //statusMap에 없으면 baseSetting color로
            const currentStyle = statusMap[this.status] || { color: this.color };
            ctx.beginPath();
            ctx.rect(this.x, this.y, brickWidth, brickHeight);
            ctx.fillStyle = currentStyle.color; //currentStyle로 변경
            ctx.fill();
            ctx.closePath();

            if(typeof this.status === "string") this.text = this.status;           
            if (this.text !== "") { //블럭위에 글씨 추가
                ctx.fillStyle = "#FFFFFF";
                ctx.font = "bold 14px 'Galmuri11', sans-serif"; // css에 정의된 픽셀 폰트 적용
                ctx.textAlign = "center";   
                ctx.textBaseline = "middle";

                // 블록의 정중앙 좌표를 계산하여 텍스트 쓰기
                ctx.fillText(this.text, this.x + brickWidth / 2, this.y + brickHeight / 2);
            }
        }
    }
}


// === 1x1 일반 블록 사이즈에 맞춘 Boss 코어 클래스 ===
class BossBrick extends Brick {
    constructor(x, y, option = {}) {
        super(x, y, option); 
        this.maxHp = option.hp || 15; // 체력은 15 유지
        this.hp = this.maxHp;         
        this.width = option.width || brickWidth;
        this.height = option.height || brickHeight;
    }

    onHit() {
        if (this.status === "LOCK") return; 

        if (this.status === 1) {
            this.hp--; 
            this.effectFunc(); 

            if (this.hp <= 0) {
                this.status = 0;
                brokenBricksCount++; 
            }
        }
    }

    draw(ctx) {
        if (this.status === 0) return;

        // 1. 블록 렌더링
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 2. 잠금 텍스트 중앙 렌더링 (1x1 크기에 맞게 14px로 복구)
        if (typeof this.status === "string") {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 14px 'Galmuri11', sans-serif"; 
            ctx.textAlign = "center";   
            ctx.textBaseline = "middle";
            ctx.fillText(this.status, this.x + this.width / 2, this.y + this.height / 2);
        }

        // 3. 체력바 렌더링 (1x1 크기 상단에 얇게 배치)
        if (this.status === 1 && this.hp > 0) {
            const barWidth = this.width - 10; 
            const barHeight = 4;              
            const barX = this.x + 5;
            const barY = this.y + 3;

            ctx.fillStyle = "#FF0000";
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const currentWidth = (this.hp / this.maxHp) * barWidth;
            ctx.fillStyle = "#00FF00";
            ctx.fillRect(barX, barY, currentWidth, barHeight);

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
}

//==== 스테이지들 ======
//스테이지 별로 맵 로드
function loadStage(stageIndex){
    //화면, 카운트 초기화
    bricks = [];
    brokenBricksCount = 0;
    totalBricks = 0;
    bombs = []; // 폭탄 배열 초기화

    //stageIndexdp 따라 함수를 호출
    switch(stageIndex){
        case 0:
            loadTutorialStage();
            break;
        case 1:
            loadDiscreteStage();
            break;
        case 2:
            loadOopStage();
            break;
        case 3:
            loadLunchStage();
            break;
        case 4:
            loadDSStage4();
            break;
        case 5:
            loadWebprogrammingStage();
            break;
        default:
            endGame("모든 스테이지를 클리어했습니다! 최종 승리!");
            break;
    }
}
function loadTutorialStage(){
    // 벽돌 배열 기본 생성 (최초 1회) // 미리 X,Y 계산해서 객체 생성하도록 변경 
    const brickRowCount = 4;
    const brickColumnCount = 6;
    const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00"];

    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;

            //bricks를 2차원->1차원 배열로 변경
            if(r == brickRowCount-1 && c == 2){ // 마지막행 3열에 테스트용 투명화 블록 생성
                bricks.push(new Brick(brickX, brickY, {color: "#000000", effectFunc:()=>setBallOpacity(0.2)}));
                totalBricks++;
                continue;
            }

            if(r==brickRowCount-4&&c==1){
                bricks.push(new Brick(brickX, brickY, {color: "blue",effectFunc:subBarsize})); //함수 자체를 줘야함
                totalBricks++;
                continue;
            }

            if(r==brickRowCount-2&&c==3){
                bricks.push(new Brick(brickX, brickY, {color: "purple",effectFunc:addBarsize}));
                totalBricks++;
                continue;
            }

            bricks.push(new Brick(brickX, brickY, {color: colors[r]})); //클래스로 생성
            totalBricks++;
        }
    }
}



//===================================================
// 게임 초기화 및 재시작 함수
function initGame() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    const speed = 4; //속도지정
    const startAngle = Math.random()*Math.PI / 4;  //처음 발사될때의 각도 지정

    // 속도와 각도로 dx, dy를 계산
    dx = speed * Math.sin(startAngle);
    dy = -speed * Math.cos(startAngle);

    paddleX = (canvas.width - paddleWidth) / 2;
    brokenBricksCount = 0;
    isGameOver = false;
    ballOpacity = 1.0; // 투명도 초기화 63~67줄
    if (opacityTimeoutId !== null) {
        clearTimeout(opacityTimeoutId);
        opacityTimeoutId = null;
    }
    // 스테이지 불러오기
    loadStage(currentStage);

    // UI 숨기고 그리기 시작
    gameOverScreen.style.display = "none";
    draw();
}

//=== 기능 함수들(tutorial) ===
function setBallOpacity(opacity) { // 공 투명도 조절 함수
    // 파라미터 0.0 ~ 1.0 범위제한
    ballOpacity = Math.max(0.0, Math.min(1.0, opacity));

    // 기존 타이머가 작동 중이면 취소
    if (opacityTimeoutId !== null) {
        clearTimeout(opacityTimeoutId);
    }

    // 10초 후 투명도를 1.0으로 복구
    opacityTimeoutId = setTimeout(() => {
        ballOpacity = 1.0;
        opacityTimeoutId = null;
    }, 10000);
}

function subBarsize(){
    targetPaddleWidth = Math.max(40, targetPaddleWidth - 50);
}

function addBarsize(){
    targetPaddleWidth = Math.min(canvas.width/2, targetPaddleWidth + 50);
}

function spawnRandomBrick() { //블럭을 깨고 다시 블럭이 랜덤위치에 생성되는 기능
    const randomX = Math.random() * (canvas.width - brickWidth);
    const randomY = Math.random() * (canvas.height / 2 - brickHeight);
    const colors = ["#E74C3C", "#9B59B6", "#3498DB", "#2ECC71", "#F1C40F"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    bricks.push(new Brick(randomX, randomY, { color: randomColor, effectFunc: () => {} }));
    totalBricks++; // 클리어해야 할 전체 블록 개수 증가
}
//==============

// 게임 종료 처리 함수
function endGame(message) {
    isGameOver = true;
    gameOverMessage.innerText = message;
    gameOverScreen.style.display = "flex"; // 오버레이 화면 표시
}

// 충돌 감지 함수
// === 무결점 물리 엔진 (1프레임 1충돌 및 끼임 방지 적용) ===
function collisionDetection() {
    let hasCollidedThisFrame = false; // 1프레임 1충돌을 보장하기 위한 플래그 (이중 파괴 방지)

    for(let i = 0; i < bricks.length; i++) {
        if (hasCollidedThisFrame) break; // 이번 프레임에서 이미 충돌을 처리했다면 나머지 연산 중단

        let b = bricks[i];
        if(b.status !== 0) { 
            let currentWidth = b.width || brickWidth;
            let currentHeight = b.height || brickHeight;

            // 1. 블록의 사각형 영역 안에서 공의 중심(x, y)과 가장 가까운 지점 찾기
            let closestX = Math.max(b.x, Math.min(x, b.x + currentWidth));
            let closestY = Math.max(b.y, Math.min(y, b.y + currentHeight));

            // 2. 피타고라스 정리를 이용해 공 중심과 가장 가까운 지점 간의 거리 계산
            let distanceX = x - closestX;
            let distanceY = y - closestY;
            let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

            // 3. 거리가 공의 반지름(ballRadius)보다 작으면 충돌 발생!
            if (distanceSquared < (ballRadius * ballRadius)) {
                hasCollidedThisFrame = true; // 다중 파괴 원천 차단

                // 4. 공이 뚫고 들어온 방향을 알아내기 위해 이전 프레임 위치 계산
                let prevX = x - dx;
                let prevY = y - dy;

                let hitTopOrBottom = (prevY <= b.y || prevY >= b.y + currentHeight);
                let hitLeftOrRight = (prevX <= b.x || prevX >= b.x + currentWidth);

                // 5. 직관적인 단순 반사 및 끼임 방지(위치 보정) 처리
                if (hitTopOrBottom && !hitLeftOrRight) {
                    dy = -dy; // 고전 아케이드 방식의 상하 반전
                    // 공을 블록 바깥으로 강제로 밀어내어 틈새 끼임 방지
                    y = (prevY <= b.y) ? b.y - ballRadius : b.y + currentHeight + ballRadius;
                } 
                else if (hitLeftOrRight && !hitTopOrBottom) {
                    dx = -dx; // 고전 아케이드 방식의 좌우 반전
                    x = (prevX <= b.x) ? b.x - ballRadius : b.x + currentWidth + ballRadius;
                } 
                else {
                    // 완벽한 모서리 충돌 (동시에 양면 충돌)
                    dx = -dx;
                    dy = -dy;
                }

                b.onHit(); 

                // 클리어 조건 검사
// 충돌 감지 함수 //1차원 틀에 맞게 변경
function collisionDetection() {
    for(let i = 0; i < bricks.length; i++) {
        let b = bricks[i];
        if(b.status !==0) { //0이 아닐때로 변경
            if(x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                dy = -dy;
                b.onHit(); // 블럭 쳤을때 블록에 맞는 효과 발동

                if(brokenBricksCount >= totalBricks) {
                    currentStage++;
                    endGame("모든 벽돌 제거 승리!");
                    loadStage(currentStage);
                }
            }
        }
    }
}


//=== 그리기 함수들 ===
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255, 0, 0, ${ballOpacity})`; // RGBA를 사용하여 투명도 적용
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#000000"; 
    ctx.fill();
    ctx.closePath();
}

function drawBricks() { //Brick class에 draw 메소드 이용해 변경 //1차원 틀로 변경
    for(let i = 0; i < bricks.length; i++) {
        bricks[i].draw(ctx);
    }
}

// 폭탄 생성 함수
function spawnBomb(x, y) {
    bombs.push(new Bomb(x, y));
}

// 폭탄 그리기 함수
function drawBombs() {
    for(let i = 0; i < bombs.length; i++) {
        bombs[i].draw(ctx);
    }
}


// === 무결점 업데이트: 무한 수평 갇힘 방지 및 패들 히트박스 유지 ===
function updateBall(){
    // [핵심 패치] 수직 속도(dy)가 너무 낮아져서 무한 대기하는 현상 원천 차단
    const minDy = 1.0; // 최소 수직 속도 하한선 (필요시 1.5 등으로 조절 가능)
    if (Math.abs(dy) < minDy) {
        // 기존 이동 방향(위/아래)은 유지하되, 속도만 최소치로 끌어올림
        dy = (dy >= 0) ? minDy : -minDy;
    }

    // 1. 좌우 벽면 충돌
//=== update 함수들 ===
function updateBall(){
    // 좌우 벽면 충돌
    if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    
    // 2. 상단 벽면 충돌
    if(y + dy < ballRadius) {
        dy = -dy;
    } 
    // 3. 패들 충돌 확인 (이전에 패치한 확장 히트박스 유지)
    else if(y + dy > canvas.height - ballRadius - paddleHeight) {
        if(x > paddleX - ballRadius && x < paddleX + paddleWidth + ballRadius) {
            
            let speed = Math.sqrt(dx * dx + dy * dy);
            let hitPoint = x - (paddleX + paddleWidth / 2);
            let normalizedHit = hitPoint / ((paddleWidth / 2) + ballRadius);
            
            // 반사각 정규화 안전장치
            normalizedHit = Math.max(-1, Math.min(1, normalizedHit));
            let bounceAngle = normalizedHit * (Math.PI / 3); 
            
            dx = speed * Math.sin(bounceAngle);
            dy = -speed * Math.cos(bounceAngle); 
        }
    }
    
    // 4. 바닥에 닿았을 때 게임 오버
    // 상단 벽면 충돌
    if(y + dy < ballRadius) {
        dy = -dy;
    } 
    // 패들 충돌 확인
    else if(y + dy > canvas.height - ballRadius - paddleHeight) {
        if(x > paddleX && x < paddleX + paddleWidth) {
            
            // 현재 공의 전체 속력(스칼라값)을 피타고라스 정리로 구합니다. (항상 일정함)
            let speed = Math.sqrt(dx * dx + dy * dy);
            
            //공이 맞은 위치를 -1.0(왼쪽 끝) ~ 1.0(오른쪽 끝) 사이의 비율로 변환합니다.
            let hitPoint = x - (paddleX + paddleWidth / 2);
            let normalizedHit = hitPoint / (paddleWidth / 2);
            
            //튕겨나갈 각도 계산 (최대 60도 = Math.PI / 3)
            let bounceAngle = normalizedHit * (Math.PI / 3); 
            
            // 동일한 속력을 유지하면서 dx, dy 지정
            dx = speed * Math.sin(bounceAngle);
            dy = -speed * Math.cos(bounceAngle); // 무조건 위로 튕겨야 하므로 y방향은 음수로
        }
    }
    // 바닥에 닿았을 때 게임 오버
        if(y + dy > canvas.height - ballRadius) {
        endGame("바닥에 닿았습니다. 게임 오버!");
        return;
    }

    x += dx;
    y += dy;
}
function updatePaddle(){ //함수화
    let previousWidth = paddleWidth; 
    paddleWidth += (targetPaddleWidth - paddleWidth) * 0.016; 
   
    paddleX -= (paddleWidth - previousWidth) / 2;

    if (paddleX + paddleWidth > canvas.width) {
        paddleX = canvas.width - paddleWidth;
    }
}

function updateBombs() {
    for(let i = 0; i < bombs.length; i++) {
        bombs[i].update();
    }
}

// 메인 게임 루프
function draw() {
    // 게임 오버 상태면 그리기 루프 중단
    if (isGameOver) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBricks();
    drawBall();
    drawPaddle();
    drawBombs();

    collisionDetection();
    updateBall();
    updatePaddle();
    updateBombs();

    // 충돌 감지 직후 승리하여 isGameOver가 true로 바뀌었다면 진행 멈춤
    if (isGameOver) return; 
    requestAnimationFrame(draw);
}

// 스크립트가 로드되면 최초 게임 시작
initGame();

//==== 이산수학 스테이지 기능 구현중 ====
function tfHit(){
    if(this.status === "T") this.status = "F";
    else if(this.status === "F") this.status = "T";
}
function andHit(){
    let leftBrick = null;
    let rightBrick = null;
    const distance = brickWidth + brickPadding;
    //양 옆 블록 찾기
    for (let i = 0; i < bricks.length; i++) {
        let b = bricks[i];
        if (b.y === this.y) {
            if (b.x === this.x - distance) leftBrick = b;
            if (b.x === this.x + distance) rightBrick = b;
        }
    }
    // 양옆이 모두 T 블록이면 블록 파괴
    if (leftBrick && rightBrick) { //leftBrick과 rightBrick이 존재하는지 체크
        if (leftBrick.status === "T" && rightBrick.status === "T") {
            this.status = 0;
            leftBrick.status = 0;
            rightBrick.status = 0;
            brokenBricksCount += 3;
        }
    }
}
function orHit(){
    let leftBrick = null;
    let rightBrick = null;
    const distance = brickWidth + brickPadding;
    //양 옆 블록 찾기
    for (let i = 0; i < bricks.length; i++) {
        let b = bricks[i];
        if (b.y === this.y) {
            if (b.x === this.x - distance) leftBrick = b;
            if (b.x === this.x + distance) rightBrick = b;
        }
    }
    // 양옆이 모두 F 블록이 아닐때 블록 파괴
    if (leftBrick && rightBrick) { //leftBrick과 rightBrick이 존재하는지 체크
        if (!(leftBrick.status === "F" && rightBrick.status === "F")) {
            this.status = 0;
            leftBrick.status = 0;
            rightBrick.status = 0;
            brokenBricksCount += 3;
        }
    }
}
function loadDiscreteStage(){
    const discreteMap = [
        [1,1,1,1,1,1],
        [1,1,1,1,1,1],
        ["F","ADD","F","F","OR","F"]
    ]
    const brickRowCount = discreteMap.length;
    const brickColumnCount = discreteMap[0].length;

    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            let blockStatus = discreteMap[r][c];
            if (blockStatus === 0 || blockStatus === null || blockStatus === "") {
                continue; 
            }
            let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
            bricks.push(new Brick(brickX,brickY,{status: blockStatus}))
            totalBricks++;
        }
    }
}




// === 중간보스 스테이지 구현 ===
function resizeGame(newWidth, newHeight) {
    // 1. 캔버스와 style 크기 변경
    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = newWidth + "px";
    canvas.style.height = newHeight + "px";

    // 2. 부모 컨테이너 및 오버레이 스크린 CSS 크기 강제 덮어쓰기
    const gameContainer = document.getElementById("gameContainer");
    if(gameContainer) {
        gameContainer.style.width = newWidth + "px";
        gameContainer.style.height = newHeight + "px";
    }

    const gameOverScreen = document.getElementById("gameOverScreen");
    if(gameOverScreen) {
        gameOverScreen.style.width = newWidth + "px";
        gameOverScreen.style.height = newHeight + "px";
    }

    paddleX = (newWidth - paddleWidth) / 2; // 패들을 새로운 화면 중앙으로 보정
    
    // 공의 위치를 새 캔버스 중앙 하단으로 강제 보정
    x = newWidth / 2;
    y = newHeight - 30;
}

// === 무결점 디버그 시스템: Z(보스 직행) & K(스테이지 스킵) 이벤트 ===
document.addEventListener("keydown", cheatKeyHandler, false);

function cheatKeyHandler(e) {
    // Z 키: 겉껍질 강제 파괴 및 보스 캡슐화 해제
    if (e.key === 'z' || e.key === 'Z') {
        let destroyedByCheat = 0;

        for (let i = 0; i < bricks.length; i++) {
            let b = bricks[i];
            
            if (!(b instanceof BossBrick) && b.status !== 0) {
                b.status = 0; 
                destroyedByCheat++;
            }
            
            if (b instanceof BossBrick && b.status === "LOCK") {
                b.status = 1;         
                b.color = "#E74C3C";  
            }
        }
        brokenBricksCount += destroyedByCheat;
    }

    // K 키: 현재 스테이지 강제 클리어 및 다음 스테이지 즉시 이동
    if (e.key === 'k' || e.key === 'K') {
        currentStage++; // 다음 스테이지 번호로 갱신
        loadStage(currentStage); // 갱신된 스테이지 맵 즉시 로드

        // [방어적 프로그래밍] 스킵 직후 불상사(즉사 버그)를 막기 위한 좌표 초기화
        let currentCanvasWidth = canvas.width;
        let currentCanvasHeight = canvas.height;

        paddleX = (currentCanvasWidth - paddleWidth) / 2; // 패들 중앙 복귀
        x = currentCanvasWidth / 2;                       // 공 위치 중앙 복귀
        y = currentCanvasHeight - 30;                     // 공 위치 패들 바로 위로 복귀
        
        // 공이 바닥으로 내리꽂히지 않도록 무조건 위를 향해 발사되도록 방향(dy) 강제 반전
        if (dy > 0) dy = -dy; 
    }
}
// ==========================================
// 중간보스: 객체지향 프로그래밍 스테이지 (7x7 정중앙 1x1 보스 맵)
// ==========================================
function loadOopStage() {
    // 1. 보스전 전용 캔버스 확장 (800x600)
    if (typeof resizeGame === 'function') {
        resizeGame(800, 600);
    }

    // 2. 7x7 동적 캡슐화 맵 생성 (1x1 중앙 정렬 최적화)
    const rows = 7;
    const cols = 7;
    const oopMap = [];

    // 수학적 거리를 이용한 계층 구조 자동 계산 루프
    for (let r = 0; r < rows; r++) {
        let rowArray = [];
        for (let c = 0; c < cols; c++) {
            // 7x7 배열에서 가장자리로부터의 최대 거리는 3 (r=3, c=3 위치)
            let distFromEdge = Math.min(r, c, rows - 1 - r, cols - 1 - c);
            
            // 4 - 3 = 1 (정중앙 1x1 보스) / 4 - 0 = 4 (최외곽 시스템)
            let layerType = 4 - distFromEdge; 
            
            rowArray.push(layerType);
        }
        oopMap.push(rowArray);
    }

    // 3. 화면 중앙 정렬을 위한 계산 (7열 기준 자동 정렬)
    const totalBlockWidth = cols * (brickWidth + brickPadding) - brickPadding;
    const startX = (canvas.width - totalBlockWidth) / 2;
    const startY = 70;

    const layerColors = {
        1: "#E74C3C", // Core (Red)
        2: "#F39C12", // Class (Orange)
        3: "#2ECC71", // Inheritance (Green)
        4: "#3498DB"  // System (Blue)
    };

    // 4. 블록 객체 생성 및 캡슐화 로직 주입
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let layerType = oopMap[r][c];
            let brickX = startX + c * (brickWidth + brickPadding);
            let brickY = startY + r * (brickHeight + brickPadding);

            let initialStatus;

            switch(layerType){
                case 1:
                    initialStatus="BOSS"
                    break;
                case 2:
                    initialStatus="1계층"
                    break;
                case 3:
                    initialStatus="2계층"
                    break;
                case 4:
                    initialStatus=1;
                    break;
            }


            let initialColor = (layerType === 4) ? layerColors[layerType] : "#555555"; 

            let effect = () => {
                if (layerType > 1) {
                    let remainingBlocks = bricks.filter(b => b.layer === layerType && b.status === 1).length;
                    
                    if (remainingBlocks === 1) {
                        bricks.forEach(b => {
                            if (b.layer === layerType - 1) {
                                b.status = 1; 
                                b.color = layerColors[layerType - 1]; 
                            }
                        });
                    }
                } else if (layerType === 1) {
                    spawnBomb(brickX + brickWidth / 2, brickY + brickHeight / 2);
                }
            };

            // 1x1 크기의 중앙 코어 블록 생성
            if (layerType === 1) {
                bricks.push(new BossBrick(brickX, brickY, {
                    status: initialStatus,
                    color: initialColor,
                    layer: layerType,
                    effectFunc: effect,
                    hp: 15 // 체력 15 유지
                }));
            } else {
                bricks.push(new Brick(brickX, brickY, {
                    status: initialStatus,
                    color: initialColor,
                    layer: layerType, 
                    effectFunc: effect
                }));
            }
            totalBricks++;
        }
    }
}




function loadDSStage4() {
    // 스테이지 4의 벽돌 행과 열 개수 설정
    const brickRowCount = 3;
    const brickColumnCount = 4;
    const colors = ["#E74C3C", "#9B59B6", "#3498DB", "#2ECC71", "#F1C40F"]; // 각 행마다 다른 색상 적용


    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            // 벽돌이 그려질 X, Y 좌표 계산
            let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;

            // 기능별로 확률 부여 (총합이 100이 되도록 설정)
            const weightedEffects = [
                { weight: 10, effect: () => setBallOpacity(0.2) }, // 확률 10%: 투명화
                { weight: 20, effect: subBarsize },                // 확률 20%: 패들 축소
                { weight: 20, effect: addBarsize },                // 확률 20%: 패들 확대
                { weight: 10, effect: () => { dx = dx > 0 ? dx + 1 : dx - 1; dy = dy > 0 ? dy + 1 : dy - 1; } }, // 확률 10%: 속도 증가
                { weight: 10, effect: spawnRandomBrick },          // 랜덤 위치에 블록 생성 (원하는 확률로 weight 수정)
                { weight: 20, effect: () => spawnBomb(brickX + brickWidth / 2, brickY + brickHeight / 2) }, // 확률 30%: 폭탄 드랍
                { weight: 10, effect: () => {} }                   // 확률 70%: 효과 없음
            ];

            // 확률(가중치)을 기반으로 랜덤 효과 선택
            let randomEffect = () => {};
            let rand = Math.random() * 100; // 0 ~ 100 사이의 난수 생성
            let cumulativeWeight = 0; // 누적 확률
            
            for (let i = 0; i < weightedEffects.length; i++) {
                cumulativeWeight += weightedEffects[i].weight;
                if (rand < cumulativeWeight) {
                    randomEffect = weightedEffects[i].effect;
                    break;
                }
            }
            bricks.push(new Brick(brickX, brickY, {color: colors[r], effectFunc: randomEffect}));
            totalBricks++;
        }
    }
}
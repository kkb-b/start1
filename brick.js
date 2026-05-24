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

const ballRadius = 12;
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




// === 무결점 디버그 시스템: Z(보스 직행) & K(스테이지 스킵) 이벤트 (최적화 버전) ===
document.addEventListener("keydown", cheatKeyHandler, false);

function cheatKeyHandler(e) {
    // Z 키: 겉껍질 강제 파괴 및 보스 캡슐화 해제
    if (e.key === 'z' || e.key === 'Z') {
        let destroyedByCheat = 0;

        for (let i = 0; i < bricks.length; i++) {
            let b = bricks[i];
            
            // 보스 블록이 아닌 모든 일반/방어 블록들을 즉시 파괴
            if (b.realType !== "BOSS" && b.status !== 0) {
                b.status = 0; 
                destroyedByCheat++;
            }
            
            // 보스 블록의 무적 잠금을 풀어줌
            if (b.realType === "BOSS" && b.status === "LOCK") {
                b.status = 1;         
                b.color = "#8E44AD"; // 보스 고유 색상(보라색) 복구
                b.text = "BOSS";
            }
        }
        brokenBricksCount += destroyedByCheat;
    }

    // K 키: 현재 스테이지 강제 클리어 및 다음 스테이지 즉시 이동
    if (e.key === 'k' || e.key === 'K') {
        currentStage++; 
        loadStage(currentStage); 

        let currentCanvasWidth = canvas.width;
        let currentCanvasHeight = canvas.height;

        paddleX = (currentCanvasWidth - paddleWidth) / 2; 
        x = currentCanvasWidth / 2;                       
        y = currentCanvasHeight - 30;                     
        
        if (dy > 0) dy = -dy; 
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

// === OOP Getter/Setter 기믹이 적용된 무결점 OOP 블록 클래스 ===
// === OOP 체력바 독점 및 무적 속성이 적용된 무결점 블록 클래스 ===
// === 렌더링 버그 수정: 본래 텍스트를 투명하게 노출하는 BossBrick ===
class BossBrick extends Brick {
    constructor(x, y, option = {}) {
        super(x, y, option); 
        this.maxHp = option.hp || 1; 
        this.hp = this.maxHp;         
        this.width = option.width || brickWidth;
        this.height = option.height || brickHeight;
        this.isIndestructible = option.indestructible || false; 
        
        this.realText = option.realText || option.text || ""; 
        this.realType = option.realType || ""; // 객체 타입 식별용 은닉 변수


        // blockPool에는 type,text,color,hp,indestructible 속성들이 저장되어 있음. 그걸 ...으로 표시
        // 그리고 layer라는 속성을 추가로 저장시킴
    }

    onHit() {
        if (this.status === "LOCK") return; 
        if (this.isIndestructible) return; // private 블록 무적 방어

        if (this.status === 1) {
            this.hp--; 

            if (this.hp <= 0) {
                this.status = 0;
                brokenBricksCount++; 
                this.effectFunc(); 
            }
        }
    }

    draw(ctx) {
        if (this.status === 0) return;

        // 1. 블록 배경 렌더링 (잠금 시 #222222 검정색)
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        // this.text로 블록을 표현함 
        let displayText = this.text || ""; 
        
        if (displayText !== "") {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 12px 'Galmuri11', sans-serif"; 
            ctx.textAlign = "center";   
            ctx.textBaseline = "middle";
            ctx.fillText(displayText, this.x + this.width / 2, this.y + this.height / 2);
        }

        // 3. 체력바는 오직 BOSS 타입에게만 허락
        if (this.realType === "BOSS" && this.status === 1 && this.hp > 0) {
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
    const speed = 5; //속도지정
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
    loadStage(2);

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
// === 무결점 물리 엔진 (1프레임 1충돌, 끼임 방지 및 정밀한 모서리 반사 적용) ===
function collisionDetection() {
    let hasCollidedThisFrame = false; // 1프레임 1충돌을 보장하기 위한 플래그

    for(let i = 0; i < bricks.length; i++) {
        if (hasCollidedThisFrame) break; // 이번 프레임에서 이미 충돌을 처리했다면 연산 중단

        let b = bricks[i];
        if(b.status !== 0) { 
            let currentWidth = b.width || brickWidth;
            let currentHeight = b.height || brickHeight;

            // 1. 블록의 사각형 영역 안에서 공의 중심(x, y)과 가장 가까운 지점(충돌점) 찾기
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

                // 5. 충돌 면에 따른 반사 처리
                if (hitTopOrBottom && !hitLeftOrRight) {
                    // 상하 평면 충돌
                    dy = -dy; 
                    y = (prevY <= b.y) ? b.y - ballRadius : b.y + currentHeight + ballRadius;
                } 
                else if (hitLeftOrRight && !hitTopOrBottom) {
                    // 좌우 평면 충돌
                    dx = -dx; 
                    x = (prevX <= b.x) ? b.x - ballRadius : b.x + currentWidth + ballRadius;
                } 
                else {
                    // ==========================================
                    // 💡 [핵심 구현] 모서리 정밀 충돌 물리 엔진 적용
                    // ==========================================
                    let distance = Math.sqrt(distanceSquared);
                    
                    // 예외 처리: 공의 중심이 정확히 모서리와 겹친 경우 (단순 반전)
                    if (distance === 0) {
                        dx = -dx;
                        dy = -dy;
                    } else {
                        // 1) 법선 벡터 정규화 (길이를 1로 만듦)
                        let nx = distanceX / distance;
                        let ny = distanceY / distance;

                        // 2) 속도 벡터와 법선 벡터의 내적(Dot Product) 계산
                        let dotProduct = (dx * nx) + (dy * ny);

                        // 3) 반사 벡터 공식 (Reflection Vector) 적용
                        dx = dx - 2 * dotProduct * nx;
                        dy = dy - 2 * dotProduct * ny;
                        
                        // 4) 모서리 끼임(겹침) 방지를 위해 공을 충돌 지점 바깥으로 정확히 밀어냄
                        x = closestX + nx * ballRadius;
                        y = closestY + ny * ballRadius;
                    }
                }

                // 블록 타격 효과 실행
                b.onHit(); 

                // 클리어 조건 검사
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


// === 무결점 업데이트: 패들 히트박스 확장 및 가장자리 튕김 보정 ===
function updateBall(){
    // 1. 좌우 벽면 충돌
    if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    
    // 2. 상단 벽면 충돌
    if(y + dy < ballRadius) {
        dy = -dy;
    } 
    // 3. 패들 충돌 확인 (히트박스 확장)
    else if(y + dy > canvas.height - ballRadius - paddleHeight) {
        // [수정됨] 공의 중심(x)이 아니라, 테두리(ballRadius)가 닿았을 때도 충돌로 인정합니다.
        if(x > paddleX - ballRadius && x < paddleX + paddleWidth + ballRadius) {
            
            let speed = Math.sqrt(dx * dx + dy * dy);
            
            let hitPoint = x - (paddleX + paddleWidth / 2);
            // [수정됨] 확장된 히트박스 비율에 맞춰 정규화 분모도 넓혀줍니다.
            let normalizedHit = hitPoint / ((paddleWidth / 2) + ballRadius);
            
            // 안전장치: 비율이 -1 ~ 1을 초과하지 않도록 제한 (공이 맵 밖으로 튕기는 것 방지)
            normalizedHit = Math.max(-1, Math.min(1, normalizedHit));
            
            let bounceAngle = normalizedHit * (Math.PI / 3); 
            
            dx = speed * Math.sin(bounceAngle);
            dy = -speed * Math.cos(bounceAngle); 
        }
    }
    
    // 4. 바닥에 닿았을 때 게임 오버
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
   
    paddleX =paddleX- (paddleWidth - previousWidth) / 2;

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


// ==========================================
// 중간보스: 객체지향 프로그래밍 스테이지 (7x7 정중앙 1x1 보스 맵)
// ========================================== 김기범
// ==========================================
// 중간보스: 객체지향 스테이지 (무적 private 및 Getter 통로 적용)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (단일 계층 수평 캡슐화 및 연쇄 파괴)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (체력 보스 독점 및 수평 캡슐화 연쇄 파괴)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (다중 제어자 쌍 및 계층별 랜덤 배치)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (블록 텍스트 예고 및 검정색 잠금 UI 적용)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (완벽한 Getter-변수 연동 파괴 적용)
// ==========================================
function loadOopStage() {
    if (typeof resizeGame === 'function') {
        resizeGame(800, 600);
    }

    const rows = 7;
    const cols = 7;

    const layerPositions = { 1: [], 2: [], 3: [], 4: [] };
    //각각의 계층을 저장하는 변수
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let distFromEdge = Math.min(r, c, rows - 1 - r, cols - 1 - c);
            let layerType = 4 - distFromEdge; 
            layerPositions[layerType].push({ r: r, c: c });
        }
    }
    // 위치에 따라서 계층 정보를 설정해서 저장하기

    const totalBlockWidth = cols * (brickWidth + brickPadding) - brickPadding;
    // 총 블록 넓이 

    //그리기 시작할 X 좌표
    const startX = (canvas.width - totalBlockWidth) / 2;
    
    //그리기 시작할 y 좌표
    const startY = 70;

    const blockGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
    //row만한 배열을 하나 형성한 후에 , 각각의 row에 대해서 cols 길이의 array를 만들고 null로 모두 채우기

    // 색상 팔레트
    const COLOR_PUBLIC    = "#3498DB"; // 파란색
    const COLOR_PROTECTED = "#2ECC71"; // 초록색
    const COLOR_PRIVATE   = "#E74C3C"; // 빨간색
    const COLOR_NORMAL    = "#95A5A6"; // 회색

    // 1. 계층별 독립적 블록 풀(Pool) 생성 및 무작위 셔플
    for (let layer = 4; layer >= 2; layer--) {
        const positions = layerPositions[layer];
        const numBlocks = positions.length;
        //numBlocks 각 계층에 들어갈 수 있는 블록의 수

        let blockPool = [];

        if (layer === 4) {
            // [4계층] W,X,Y,Z 관련 필수 배치
            blockPool.push({ type: "private_W", text: "int W", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_X", text: "double X", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_Y", text: "string Y", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_Z", text: "MyData Z", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            
            blockPool.push({ type: "public_W", text: "int getW", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_X", text: "double getX", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_Y", text: "string getY", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_Z", text: "MyData getZ", color: COLOR_PUBLIC, hp: 1, indestructible: false });

            //4계층에 들어갈 필수내용 public과 private 블록들
            // type은 private,protected,public 등이 들어가는 속성 
            // text는 블록위에 나타낼 글자 
            // color 는 해당 블록에 맞는 글자 
            //hp는 몇 번 부딪혀야하는가?
            // indestructible : 무적상태인지 아닌지

            while (blockPool.length < numBlocks) {
                blockPool.push({ type: "normal", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });

            }
            // blockPool의 length는 실시간 갱신중. --> push한 값이 최대 블록의 수만큼 삽입
        } 
        else if (layer === 3) {
            // [3계층] W,X,Y,Z + K, B의 Getter 배치
            blockPool.push({ type: "private_W", text: "int W", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_X", text: "double X", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_Y", text: "string Y", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_Z", text: "MyData Z", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            
            blockPool.push({ type: "public_W", text: "int getW", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_X", text: "double getX", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_Y", text: "string getY", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_Z", text: "MyData getZ", color: COLOR_PUBLIC, hp: 1, indestructible: false });

            blockPool.push({ type: "protected_getK", text: "int getK", color: COLOR_PROTECTED, hp: 1, indestructible: false });
            blockPool.push({ type: "protected_getB", text: "string getB", color: COLOR_PROTECTED, hp: 1, indestructible: false });

            while (blockPool.length < numBlocks) {
                blockPool.push({ type: "normal", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });
            }
        } 
        else if (layer === 2) {
            // [2계층] W,X,Y,Z + K, B의 변수 정의 배치
            blockPool.push({ type: "private_W", text: "int W", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_X", text: "double X", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_Y", text: "string Y", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_Z", text: "MyData Z", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            
            blockPool.push({ type: "protected_K", text: "int K", color: COLOR_PROTECTED, hp: 1, indestructible: false });
            blockPool.push({ type: "protected_B", text: "string B", color: COLOR_PROTECTED, hp: 1, indestructible: false });

            while (blockPool.length < numBlocks) {
                blockPool.push({ type: "normal", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });
            }
        }

        // 셔플 알고리즘
        for (let i = blockPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [blockPool[i], blockPool[j]] = [blockPool[j], blockPool[i]];
        }

        //블록의 위치를 무작위로 배치하기 위해서 blockpool 즉 하나의 layer에 있는 블록의 순서를 무작위로 배치

        positions.forEach((pos, index) => {
            blockGrid[pos.r][pos.c] = { ...blockPool[index], layer: layer };
            // blockPool에는 type,text,color,hp,indestructible 속성들이 저장되어 있음. 그걸 ...으로 표시
            // 그리고 layer라는 속성을 추가로 저장시킴
        });

        
    }

    // 2. 최심부 레이어 1 (BOSS)
    if (layerPositions && layerPositions.length > 0) {
        const bossPos = layerPositions;
        blockGrid[bossPos.r][bossPos.c] = {
            type: "BOSS", text: "BOSS", color: "#8E44AD", hp: 15, indestructible: false, layer: 1
        };
    }



    // 3. 자바스크립트 객체 인스턴스화
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let bData = blockGrid[r][c];
            // 각각의 모든 블록에 대한 정보 저장하기
            if (!bData) continue;

            let brickX = startX + c * (brickWidth + brickPadding); //블록을 그릴 x 좌표
            let brickY = startY + r * (brickHeight + brickPadding); //블록을 그릴 y 좌표

            let initialStatus = (bData.layer === 4) ? 1 : "LOCK"; 
            let initialColor  = (bData.layer === 4) ? bData.color : "#222222"; 
            let initialText   = bData.text; 

            //각각의 모든 블록에 대한 hit시에 적용할 함수 지정하기

            let effect = () => {
                // ==========================================
                // 💡 [핵심 연동 기믹] 타겟 저격 함수
                // 목표 계층(targetLayer)과 목표 타입(targetType)을 찾아 강제 파괴
                // ==========================================
                const destroyTarget = (targetLayer, targetType) => {
                    let target = bricks.find(b => b.layer === targetLayer && b.realType === targetType && b.status !== 0);
                    //내 계층과 타겟의 계층이 같고 , 내 진짜 타입이 타겟의 타입과 같고 내 상태가 0 이 아니어야함. (부서시지 않았어야함) 
                    if (target) {
                        //타겟이 찾아지면 타겟의 상태를 0으로( 부서진 상태로 )
                        target.status = 0; 
                        brokenBricksCount++; // 진행도 완벽 동기화
                    }
                };

                // 1) W, X, Y, Z 연동 (동일 계층 내의 private 변수 파괴)
                if (bData.type === "public_W") destroyTarget(bData.layer, "private_W");
                if (bData.type === "public_X") destroyTarget(bData.layer, "private_X");
                if (bData.type === "public_Y") destroyTarget(bData.layer, "private_Y");
                if (bData.type === "public_Z") destroyTarget(bData.layer, "private_Z");

                // 2) K, B 연동 (3계층에서 2계층의 protected 변수 원격 파괴)
                if (bData.type === "protected_getK") destroyTarget(2, "protected_K");
                if (bData.type === "protected_getB") destroyTarget(2, "protected_B");

                // 계층 전체 클리어 판정 및 안쪽 층 잠금 해제
                let remainingBlocks = bricks.filter(b => b.layer === bData.layer && b.status === 1).length;
                //내 계층과 데이터의 계층이 같고 내 상태가 1인 벽돌의 길이

                if (remainingBlocks === 0 && bData.layer > 1) {
                    //남은 블록의 길이가 0이고 계층이 1이상인 경우에

                    bricks.forEach(b => {
                        if (b.layer === bData.layer - 1 && b.status === "LOCK") {
                            // 현재 계층의 바로 아래 계층이면서 상태가 lock 인 경우에는 
                            // 상태를 1(깰 수 있는 상태)로 바꾼다음에
                            b.status = 1; 
                            if (b.tempData) {
                                b.color = b.tempData.color; 
                            }
                            // 색상은 자신의 원래
                        }
                    });
                }

                if (bData.type === "BOSS") {
                    spawnBomb(brickX + brickWidth / 2, brickY + brickHeight / 2);
                }
            };

            let newBrick = new BossBrick(brickX, brickY, {
                status: initialStatus,
                color: initialColor,
                text: initialText,
                realText: bData.text, 
                realType: bData.type,
                layer: bData.layer,
                effectFunc: effect,
                hp: bData.hp,
                indestructible: bData.indestructible
            });
            //각각의 row와 col의 boss 스테이지의블록들을 생성하기
            newBrick.tempData = { color: bData.color, text: bData.text };

            bricks.push(newBrick);
            // bricks 안에 깨야할 블록으로 푸쉬하기
            totalBricks++; 
            // 깨야할 블록 카운트 추가
        }
    }
}
//====================================

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
                { weight: 0, effect: () => setBallOpacity(0.2) }, // 확률 10%: 투명화
                { weight: 0, effect: subBarsize },                // 확률 20%: 패들 축소
                { weight: 0, effect: addBarsize },                // 확률 20%: 패들 확대
                { weight: 0, effect: () => { dx = dx > 0 ? dx + 1 : dx - 1; dy = dy > 0 ? dy + 1 : dy - 1; } }, // 확률 10%: 속도 증가
                { weight: 70, effect: spawnRandomBrick },          // 랜덤 위치에 블록 생성 (원하는 확률로 weight 수정)
                { weight: 0, effect: () => spawnBomb(brickX + brickWidth / 2, brickY + brickHeight / 2) }, // 확률 30%: 폭탄 드랍
                { weight: 30, effect: () => {} }                   // 확률 70%: 효과 없음
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
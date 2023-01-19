// watingRoom 의 elements
const iframe = document.getElementById("frame");
const makeRoomBtn = document.querySelector(".makeRoom_btn");
const cancelBtn = document.querySelector(".cancel_btn");
const confirmBtn = document.querySelector(".confirm_btn");
const okBtn = document.getElementById("ok_btn");
const modal = document.querySelector(".modal");
const popUp = document.getElementById("pop_up");

const roomTitle = document.getElementById("roomTitle");
const themes = document.getElementById("theme");
const lines = document.getElementById("line");

const bg = document.querySelector(".bg");

let myNickname;
let frameDoc;
let socket;
let idNum = 0;

// gameRoom elements
let readyBtn;
let cancelReadyBtn;
let bingoBtn;
let exitBtn;
let inputs;
let roomName;
let bingoBoardCells;
let notice;
let before;
let selectHistory = [];
let myContents = [];
let line = 0;
let myRoom;
let checker;
let myTurnNum;
let myReady = false;
let myTurn = false;

// 빙고 체크 기록
let rows = [0, 0, 0, 0, 0, 0];
let cols = [0, 0, 0, 0, 0, 0];
let diagonal = [0, 0];

/* 방 만들기 창을 띄우기 위한 함수 정의
출처 : https://stove99.github.io/javascript/2019/04/19/javasript-center-modal/ */
function makeRoomPopUp() {
  // 배경 띄우기
  bg.style.display = "block";

  // 배경 위에 방 만들기 창 가운데에 띄우기
  modal.style.position = "fixed";
  modal.style.display = "block";
  modal.style.zIndex = "9999";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
}

// wating Room 함수들
/* 방 만들기 창을 없애기 위한 함수 정의
출처 : https://stove99.github.io/javascript/2019/04/19/javasript-center-modal/ */
function cancel() {
  // 방 만들기 창과 배경 숨기기
  bg.style.display = "none";
  modal.style.display = "none";
  modal.style.zIndex = "0";

  // 방 만들기 창의 내용 초기화
  roomTitle.value = "";
  themes.value = "";
  lines.value = "1";
}

// 방 만들기 함수
// 입력된 정보를 roomObj 객체로 만들어 서버에 전송
function makeRoom() {
  const title =
    roomTitle.value === "" ? "즐거운 빙고 한 판 ~" : roomTitle.value;
  const size1 = document.getElementById("size1");
  const size2 = document.getElementById("size2");
  const size3 = document.getElementById("size3");
  const size = size1.checked
    ? size1.value
    : size2.checked
    ? size2.value
    : size3.value;
  const theme = themes.value === "" ? "숫자" : themes.value;
  const line = lines.value;
  idNum++;

  const roomObj = {
    idNum: idNum,
    id: `room${idNum}`,
    name: title,
    size: size,
    theme: theme,
    line: line,
    playing: false,
  };

  socket.emit("makeRoom", roomObj);

  cancel();
}

// 방 입장 함수
// 입장 하려는 방의 id를 서버로 전송
function enterRoom(event) {
  const roomId = event.currentTarget.firstChild.textContent;
  socket.emit("enterRoom", roomId);
}

// gameRoom 함수들
// 준비 버튼 클릭 시 호출되는 함수
function ready(inputs, len) {
  // 빙고판을 모두 채우지 않았을 시 경고 메시지 출력
  for (let cell of bingoBoardCells) {
    if (cell.textContent === "") {
      alert("빙고판을 완성해 주세요.");
      return;
    }
  }
  // 준비 버튼을 누르면 빙고 판의 내용 수정 불가.
  for (let i = 0; i < len; i++) {
    inputs[i].toggleAttribute("contenteditable");
  }

  readyBtn.style.display = "none";
  cancelReadyBtn.style.display = "inline";
  socket.emit("ready", myRoom.id);
  myReady = true;
}

function cancelReady(inputs, len) {
  // 준비 취소 버튼을 누르면 빙고 판의 내용 수정 가능.
  for (let i = 0; i < len; i++) {
    inputs[i].toggleAttribute("contenteditable");
  }

  readyBtn.style.display = "inline";
  cancelReadyBtn.style.display = "none";
  socket.emit("cancelReady", myRoom.id);
  myReady = false;
}

// 빙고판에서 특정 칸을 클릭했을 때 호출되는 함수
function checkBoard(event) {
  const cell = event.target;
  const choice = cell.textContent;
  const pureContent = choice.split(" ").join("");

  // 다른 유저에 의해 선택된 값일 경우 체크 가능
  // 체크된 칸의 위치를 기록하여 빙고를 완성했는지 체크
  // 빙고를 완성했으면 bingo 버튼 활성화
  if (selectHistory.includes(pureContent)) {
    event.target.classList.add("selected");

    ++rows[cell.classList[1][0]] === checker ? ++line : false;
    ++cols[cell.classList[1][1]] === checker ? ++line : false;

    if (cell.classList[1][0] === cell.classList[1][1]) {
      ++diagonal[0] === checker ? ++line : false;
    }

    if (
      parseInt(cell.classList[1][0]) + parseInt(cell.classList[1][1]) ===
      checker + 1
    ) {
      ++diagonal[1] === checker ? ++line : false;
    }

    if (line >= parseInt(myRoom.line)) {
      bingoBtn.disabled = false;
    }
  }

  // 자신의 차례에 아직 한 번도 불리지 않은 항목을 선택했을 경우
  // 선택한 값을 서버로 전송하고 마찬가지로 체크된 칸의 위치를 기록하여
  // 빙고 완성 여부 체크. 빙고 완성 시 bingo 버튼 활성화
  if (myTurn && !selectHistory.includes(pureContent)) {
    socket.emit("sendChoice", [myRoom.id, choice, myTurnNum]);
    event.target.classList.add("selected");

    ++rows[cell.classList[1][0]] === checker ? line++ : false;
    ++cols[cell.classList[1][1]] === checker ? line++ : false;

    if (cell.classList[1][0] === cell.classList[1][1]) {
      ++diagonal[0] === checker ? line++ : false;
    }

    if (
      parseInt(cell.classList[1][0]) + parseInt(cell.classList[1][1]) ===
      checker + 1
    ) {
      ++diagonal[1] === checker ? line++ : false;
    }

    if (line >= parseInt(myRoom.line)) {
      bingoBtn.disabled = false;
    }

    myTurn = false;
    myTurnNum = undefined;
  }
}

// 승리자 발표용 팝업 창 띄우는 함수
function noticeWinner() {
  // 배경 띄우기
  bg.style.display = "block";

  // 배경 위에 방 만들기 창 가운데에 띄우기
  popUp.style.position = "fixed";
  popUp.style.display = "block";
  popUp.style.zIndex = "9999";
  popUp.style.top = "50%";
  popUp.style.left = "50%";
  popUp.style.transform = "translate(-50%, -50%)";
}

function closePopUp() {
  bg.style.display = "none";
  popUp.style.display = "none";
  popUp.style.zIndex = "0";

  initiailize(inputs, inputs.length);
  for (cell of bingoBoardCells) {
    cell.removeEventListener("click", checkBoard);
  }
}

// 게임룸 화면 초기화 함수
function initiailize(inputs, len) {
  // 빙고판 표시 초기화
  for (let cell of bingoBoardCells) {
    if (cell.classList.contains("selected")) {
      cell.classList.remove("selected");
    }
  }

  // 빙고판 작성 내용 초기화
  for (let i = 0; i < len; i++) {
    inputs[i].innerText = "";
  }

  // 빙고판 수정 불가 상태 해제
  for (let i = 0; i < len; i++) {
    inputs[i].setAttribute("contenteditable", true);
  }

  // 차례 표시 해제
  for (let i = 0; i < 6; i++) {
    frameDoc.querySelector(`.name${i + 1}`).parentNode.classList.remove("mark");
  }

  // 빙고판 체크 내역 초기화
  rows = [0, 0, 0, 0, 0, 0];
  cols = [0, 0, 0, 0, 0, 0];
  diagonal = [0, 0];
  line = 0;

  // 빙고 체크 기록 초기화
  selectHistory = [];
  myContents = [];
  notice.innerText = "";

  bingoBtn.disabled = true;
  bingoBtn.style.display = "none";
  readyBtn.style.display = "inline";
}

// 빙고판에 입력한 내용 중 중복된 값이 있는지 체크하는 함수
function equalChecker(event, before) {
  let ct = event.target.innerText;
  if (ct !== "") {
    ct = ct.split(" ").join("");
    if (before === "") {
      if (myContents.includes(ct)) {
        alert("중복된 내용을 적을 수 없습니다.");
        event.target.innerText = "";
      } else {
        myContents.push(ct);
      }
    } else {
      for (let i = 0; i < myContents.length; i++) {
        if (myContents[i] === before) {
          myContents.splice(i, 1);
          break;
        }
      }
      if (myContents.includes(ct)) {
        alert("중복된 내용을 적을 수 없습니다.");
        event.target.innerText = "";
      } else {
        myContents.push(ct);
      }
    }
  } else {
    if (before !== "") {
      for (let i = 0; i < myContents.length; i++) {
        if (myContents[i] === before) {
          myContents.splice(i, 1);
          break;
        }
      }
    }
  }
}

function getContent(event) {
  let cot = event.target.innerText;
  cot = cot.split(" ").join("");
  before = cot;
}

// 반응형 웹 구현
function resize(width) {
  const users = frameDoc.getElementsByClassName("user");

  if (width <= 885) {
    for (let user of users) {
      user.style.display = "none";
    }

    for (let i = 0; i < 6; i++) {
      if (frameDoc.querySelector(`.name${i + 1}`).innerText === myNickname) {
        frameDoc.querySelector(`.name${i + 1}`).parentNode.style.display =
          "flex";
        frameDoc.querySelector(`.name${i + 1}`).parentNode.classList.add("me");
        break;
      }
    }
  } else {
    for (let user of users) {
      user.style.display = "flex";
    }

    for (let i = 0; i < 6; i++) {
      if (frameDoc.querySelector(`.name${i + 1}`).innerText === myNickname) {
        frameDoc
          .querySelector(`.name${i + 1}`)
          .parentNode.classList.remove("me");
        break;
      }
    }
  }
}

// wating Room 이벤트 리스너
// 방 만들기 버튼을 눌렀을 때 발생하는 이벤트
makeRoomBtn.addEventListener("click", makeRoomPopUp);

// 취소 버튼 눌렀을 때 발생하는 이벤트
cancelBtn.addEventListener("click", cancel);

confirmBtn.addEventListener("click", makeRoom);

okBtn.addEventListener("click", closePopUp);

// iframe 로드 완료 시 발생하는 이벤트 정의
iframe.onload = function () {
  frameDoc = iframe.contentWindow.document;
  readyBtn = frameDoc.querySelector(".ready_btn");
  cancelReadyBtn = frameDoc.querySelector(".cancelReady_btn");
  bingoBtn = frameDoc.querySelector(".bingo_btn");
  exitBtn = frameDoc.querySelector(".exit_btn");
  inputs = frameDoc.getElementsByTagName("td");
  roomName = frameDoc.getElementById("roomTitle");
  notice = frameDoc.getElementById("content");

  for (let td of inputs) {
    td.addEventListener("click", getContent);
    td.addEventListener("blur", (event) => {
      equalChecker(event, before);
    });
  }

  // gameRoom 이벤트 리스너
  // 준비 버튼 클릭 시 발생하는 이벤트
  readyBtn.addEventListener("click", () => {
    ready(inputs, inputs.length);
  });

  // 준비 취소 버튼 클릭 시 발생하는 이벤트
  cancelReadyBtn.addEventListener("click", () => {
    cancelReady(inputs, inputs.length);
  });

  bingoBtn.addEventListener("click", () => {
    socket.emit("bingo", myRoom.id);
  });

  // 나가기 버튼 클릭 시 발생하는 이벤트
  // 준비 완료 상태를 해제하고, 게임룸 화면을 초기화
  exitBtn.addEventListener("click", () => {
    const check = confirm("정말 나가시겠습니까?");
    if (check) {
      if (myReady) {
        cancelReady(inputs, inputs.length);
      }

      socket.emit("leaveRoom", [myRoom.id, myTurnNum]);
      initiailize(inputs, inputs.length);
      for (let i = 0; i < inputs.length; i++) {
        inputs[i].setAttribute("contenteditable", true);
      }

      // 빙고판 다시 숨기기
      frameDoc.getElementById(myRoom.size).style.display = "none";
    }
  });
};

window.onresize = function () {
  const width = this.innerWidth;
  resize(width);
};

window.onload = function () {
  // 소켓 생성
  socket = io();

  // 서버에 방 목록을 요청함
  socket.emit("getList");

  // 접속 시 자신의 별명을 별도로 저장
  socket.on("yourNickname", (data) => {
    myNickname = data;
  });

  // 방 생성에 필요한(방 구별용) idNum 업데이트
  socket.on("updateIdNum", (data) => {
    idNum = data;
  });

  // 방 목록을 받아와 화면에 출력
  socket.on("updateList", function (data) {
    while (document.querySelector(".list").hasChildNodes()) {
      document
        .querySelector(".list")
        .removeChild(document.querySelector(".list").firstChild);
    }

    const li = document.createElement("li");
    const div = document.createElement("div");

    for (let room in data) {
      if (!data[room].playing) {
        const id = div.cloneNode();
        id.classList.add("hidden");
        id.appendChild(document.createTextNode(room));
        const r = div.cloneNode();
        r.classList.add("room");
        r.appendChild(
          document.createTextNode(
            data[room].name + "(" + data[room].theme + ")"
          )
        );
        const s = li.cloneNode();
        s.appendChild(id);
        s.appendChild(r);
        s.addEventListener("click", enterRoom);
        document.querySelector(".list").appendChild(s);
      }
    }
  });

  // 방에 입장 시 방 설정 정보를 화면에 출력
  socket.on("enter", (data) => {
    myRoom = data;
    checker = parseInt(myRoom.size[0]);
    bingoBoardCells = frameDoc.getElementsByClassName(`${myRoom.size}cell`);
    frameDoc.getElementById(data.size).style.display = "table";
    frameDoc.getElementById("roomTitle").innerText = data.name;
    frameDoc.getElementById("theme").innerText = "주제 : " + data.theme;
    iframe.style.display = "block";
  });

  // 방 안에 있는 유저들의 목록을 업데이트 함
  socket.on("updateUser", (data) => {
    for (let i = 0; i < 6; i++) {
      if (data[i] === undefined) {
        frameDoc.querySelector(`.name${i + 1}`).innerText = "";
      } else {
        frameDoc.querySelector(`.name${i + 1}`).innerText = data[i];
      }
    }
  });

  // 방 안에 있는 유저들의 준비 상태를 업데이트 함
  socket.on("updateState", (data) => {
    for (let i = 0; i < 6; i++) {
      if (data.includes(frameDoc.querySelector(`.name${i + 1}`).textContent)) {
        frameDoc.querySelector(`.state${i + 1}`).classList.add("ready");
      } else if (
        !data.includes(frameDoc.querySelector(`.name${i + 1}`).textContent) &&
        frameDoc.querySelector(`.state${i + 1}`).classList.contains("ready")
      ) {
        frameDoc.querySelector(`.state${i + 1}`).classList.remove("ready");
      }
    }
  });

  // 정원 초과된 방에 입장 시 이벤트 처리
  socket.on("exit", () => {
    alert("인원이 가득 차서 입장할 수 없습니다.");
  });

  // leaveRoom 이후 대기실 화면 출력
  socket.on("backToWait", (data) => {
    iframe.style.display = "none";
  });

  // 방 안의 모든 유저가 ready 상태가 되어 게임이 사작되었을 때 받은 이벤트
  socket.on("startGame", () => {
    for (let i = 0; i < 6; i++) {
      if (
        frameDoc.querySelector(`.state${i + 1}`).classList.contains("ready")
      ) {
        frameDoc.querySelector(`.state${i + 1}`).classList.remove("ready");
      }
    }

    myReady = false;
    cancelReadyBtn.style.display = "none";
    bingoBtn.style.display = "inline";

    for (cell of bingoBoardCells) {
      cell.addEventListener("click", checkBoard);
    }
  });

  // 자신의 차례인 다른 유저가 선택한 값을 서버로부터 전달 받음
  socket.on("throwToAll", (data) => {
    const selects = notice.innerText;

    selectHistory.push(data.split(" ").join(""));
    notice.innerText = selects + data + " / ";
  });

  // 서버가 나의 턴임을 알려왔을 때 이벤트 처리
  socket.on("yourTurn", (data) => {
    myTurnNum = data;
    myTurn = true;
  });

  // 현재 누구의 턴인지 그 유저의 테두리 스타일을 통해 표시함
  socket.on("markTurn", (data) => {
    for (let i = 0; i < 6; i++) {
      if (frameDoc.querySelector(`.name${i + 1}`).textContent === data) {
        frameDoc
          .querySelector(`.name${i + 1}`)
          .parentNode.classList.add("mark");
      } else {
        frameDoc
          .querySelector(`.name${i + 1}`)
          .parentNode.classList.remove("mark");
      }
    }
  });

  // "bingo" 이벤트 후 게임 종료 이벤틏 처리
  // 승자를 팝업으로 알리고 팝업 닫으면 화면 초기화
  socket.on("finish", (data) => {
    myTurn = false;
    document.getElementById("winner").innerText = data;
    noticeWinner();
  });

  // 게임 진행 중 임의로 방을 나갔을 때 발생하는 이벤트 처리
  socket.on("endGame", () => {
    myTurn = false;
    initiailize(inputs, inputs.length);
    for (cell of bingoBoardCells) {
      cell.removeEventListener("click", checkBoard);
    }
  });
};

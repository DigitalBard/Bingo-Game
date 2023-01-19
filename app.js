const express = require("express");
const session = require("express-session")({
  secret: "my key",
  resave: false,
  saveUninitialized: true,
});
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const app = express();
const http = require("http").createServer(app);
//socket.io 모듈 사용 선언
const io = require("socket.io")(http);

const rooms = {}; // 생성된 방을 저장하는 리스트
const roomInfo = []; // 각 방 인원의 별명을 저장하는 리스트
const userIdInfo = []; // 각 방 인원의 아이디를 저장하는 리스트
const readyList = []; // 각 방의 준비된 인원들을 저장하는 리스트

// 클라이언트가 html, style, js 파일에 접근 할 수 있도록 설정
app.use(express.static("public"));

// 세션 활용을 위한 미들웨어 등록
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(session);

// 소켓에서 세션 데이터에 접근 가능하도록 미들웨어 등록
let ios = require("express-socket.io-session");
io.use(ios(session, { autoSave: true }));

/* 
생성된 세션이 없으면 로그인 화면으로,
이미 생성된 세션이 있으면 안내 메시지 화면 출력 
*/
app.get("/", (req, res) => {
  if (req.session.user) {
    res.sendFile(__dirname + "/alertPage.html");
  } else {
    res.sendFile(__dirname + "/login.html");
  }
});

// 로그인 후 대기실 화면으로 이동시켜주기 위한 라우터
app.get("/bingoGame", (req, res) => {
  if (req.session.user) {
    fs.readFile("watingRoom.html", function (error, data) {
      res.writeHead(200, { "Content-type": "text/html; charset=utf8" });
      res.end(data);
    });
  }
});

// 로그인 처리
app.post("/login", (req, res) => {
  const name = req.body.nickname;

  // 이미 생성된 세션이 있으면 "success" 응답 전송
  if (req.session.user) {
    res.send({ result: "success" });
  } else {
    // 생성된 세션이 없으면 유저 정보가 저장된 json 파일이 있는지, 내용이 있는지 확인
    if (
      !fs.existsSync("data/person.json") ||
      fs.statSync("data/person.json").size === 0
    ) {
      // session에 닉네임 추가
      req.session.user = {
        name: name,
      };
      // json 파일에 저장(파일이 없으면 파일을 생성)
      const user = { nickname: name };
      const userJSON = JSON.stringify(user);
      fs.writeFileSync("data/person.json", userJSON);
      res.send({ result: "success" });
    } else {
      // 기존 데이터가 존재하면 이미 사용중인 닉네임인지 확인. 사용 중이면 "fail" 응답 전송
      const dataBuffer = fs.readFileSync("data/person.json");
      const dataArr = dataBuffer.toString().split("\n");
      for (data of dataArr) {
        if (JSON.parse(data).nickname === name) {
          res.send({ result: "fail" });
          return;
        }
      }
      // 사용중인 닉네임이 아니면 세션에 추가하고 json 파일에도 추가 후 "success" 응답 전송
      req.session.user = {
        name: name,
      };
      const user = { nickname: name };
      const userJSON = JSON.stringify(user);
      fs.appendFileSync("data/person.json", "\n");
      fs.appendFileSync("data/person.json", userJSON);
      res.send({ result: "success" });
    }
  }
});

// socket 통신 부분
io.on("connection", (socket) => {
  console.log("user connected");

  // 각 클라이언트는 접속 시 자신의 별명을 별도로 저장하도록 함
  socket.emit("yourNickname", socket.handshake.session.user.name);

  // 클라이언트 화면의 대기실의 방 목록을 업데이트시킴
  socket.on("getList", () => {
    socket.emit("updateList", rooms);
  });

  // 클라이언트가 방을 만들었을 때 이벤트 처리
  // 방의 정보와, 그 방에 입장한 클라이언트의 별명과 소켓 아이디를 서버에 저장하게 되며
  // 게임에 접속한 모든 클라이언트가 방 목록을 업데이트 하도록 만든다.
  socket.on("makeRoom", (data) => {
    const userId = socket.id;
    const userNickname = socket.handshake.session.user.name;
    rooms[data.id] = data;
    socket.join(data.id);
    roomInfo[data.id] = [userNickname];
    userIdInfo[data.id] = [userId];
    io.emit("updateList", rooms);
    io.emit("updateIdNum", data.idNum + 1);
    socket.emit("enter", data);
    socket.emit("updateUser", roomInfo[data.id]);
  });

  // 클라이언트가 방 목록에 있는 특정 방에 입장했을 때 이벤트 처리
  // 마찬가지로 클라이언트의 별명과 소켓 아이디를 서버에 저장한다.
  socket.on("enterRoom", (data) => {
    // 해당 방의 인원 수가 최대 인원인 6명이 안될 경우 입장
    if (roomInfo[data].length < 6) {
      socket.join(data);
      roomInfo[data].push(socket.handshake.session.user.name);
      userIdInfo[data].push(socket.id);

      socket.emit("enter", rooms[data]);
      io.in(data).emit("updateUser", roomInfo[data]);
    } else {
      socket.emit("exit");
    }
  });

  // 클라이언트가 방을 나갔을 때 이벤트 처리
  socket.on("leaveRoom", (data) => {
    socket.leave(data[0]);

    // 방의 유저 정보에서 해당 유저의 별명과 소켓 아이디 삭제
    for (let i = 0; i < roomInfo[data[0]].length; i++) {
      if (roomInfo[data[0]][i] === socket.handshake.session.user.name) {
        roomInfo[data[0]].splice(i, 1);
        userIdInfo[data[0]].splice(i, 1);
        break;
      }
    }

    // 방 안에 있는 유저들은 유저 목록 업데이트
    io.in(data[0]).emit("updateUser", roomInfo[data[0]]);

    // 누군가 나갔을 때 게임이 진행중이었다면 남은 인원에 따라 게임 진행여부 결정
    // 만약 1명만 남게 되면 게임 진행이 불가하므로 게임 중단
    if (rooms[data[0]].playing === true && roomInfo[data[0]].length === 1) {
      rooms[data[0]].playing = false;
      socket.emit("endGame");
      io.to(data[0]).emit("endGame");
      io.emit("updateList", rooms);
    } else if (
      rooms[data[0]].playing === true &&
      roomInfo[data[0]].length > 1
    ) {
      if (data[1] !== undefined) {
        socket.emit("endGame");

        // 2명 이상이 남아있고 자신의 차례일 때 나왔을 경우, 다음 사람의 차례로 넘김
        io.to(userIdInfo[data[0]][data[1]]).emit("yourTurn", data[1]);
        io.to(data[0]).emit("markTurn", roomInfo[data[0]][data[1]]);
      }
    }

    // 나간 이후 방에 아무도 안 남게 되면 그 방은 자동으로 닫힘.
    if (roomInfo[data[0]].length === 0) {
      delete rooms[data[0]];
      delete roomInfo[data[0]];
      delete userIdInfo[data[0]];
      delete readyList[data[0]];

      // 대기실 방 목록 업데이트
      io.emit("updateList", rooms);
    }

    // 나온 클라이언트 본인은 대기실 화면으로 돌아감
    socket.emit("backToWait");
  });

  // 클라이언트가 준비 상태일 때 이벤트 처리
  // 레디 상태 유저를 readyList 에 저장
  socket.on("ready", (data) => {
    if (readyList[data] === undefined) {
      readyList[data] = [socket.handshake.session.user.name];
      io.to(data).emit("updateState", readyList[data]);
    } else {
      readyList[data].push(socket.handshake.session.user.name);
      io.to(data).emit("updateState", readyList[data]);

      // 방 인원 전부가 준비 완료 상태이고, 방 전체 인원이 2명 이상일 때
      // 자동으로 게임 시작
      if (
        readyList[data].length >= 2 &&
        readyList[data].length === roomInfo[data].length
      ) {
        // 게임 진행중에 다른 유저가 못 들어오도록 방 목록에서 해당 방 숨김
        rooms[data].playing = true;
        io.emit("updateList", rooms);
        delete readyList[data];
        io.to(data).emit("startGame");

        // 방에 입장한 순서대로(유저 정보 저장된 순서대로) 게임 진행
        io.to(userIdInfo[data][0]).emit("yourTurn", 0);
        io.to(data).emit("markTurn", roomInfo[data][0]);
      }
    }
  });

  // 클라이언트가 준비 취소 했을 때 이벤트 처리
  socket.on("cancelReady", (data) => {
    for (let i = 0; i < readyList[data].length; i++) {
      if (readyList[data][i] === socket.handshake.session.user.name) {
        readyList[data].splice(i, 1);
        break;
      }
    }
    socket.emit("updateState", readyList[data]);
    io.in(data).emit("updateState", readyList[data]);
  });

  // 클라이언트가 자신의 차례에 빙고판의 어떤 항목을 선택했을 때 이벤트 처리
  socket.on("sendChoice", (data) => {
    // 유저 별명을 담은 리스트(roomInfo)의 다음 인덱스를 계산하여 다음 차례 결정
    const next =
      parseInt(data[2]) + 1 === roomInfo[data[0]].length
        ? 0
        : parseInt(data[2]) + 1;

    // 방 안의 모든 유저에게 선택값 알림
    io.to(data[0]).emit("throwToAll", data[1]);

    // 앞서 결정된 다음 유저에게 할 차례임을 알림.
    io.to(userIdInfo[data[0]][next]).emit("yourTurn", next);
    io.to(data).emit("markTurn", roomInfo[data[0]][next]);
  });

  // 클라이언트가 빙고를 완성하여 승리조건을 달성했을 때 이벤트 처리
  socket.on("bingo", (data) => {
    rooms[data].playing = false;
    io.to(data).emit("finish", socket.handshake.session.user.name);
    io.emit("updateList", rooms);
  });

  // 접속 종료 이벤트 발생 시
  socket.on("disconnect", () => {
    console.log("user disconnected");
    const nickname = socket.handshake.session.user.name;

    // 해당 클라이언트가 있던 방 검색
    for (let data in roomInfo) {
      if (roomInfo[data].includes(nickname)) {
        // 방의 유저 정보에서 해당 유저 삭제
        for (let i = 0; i < roomInfo[data].length; i++) {
          if (roomInfo[data][i] === nickname) {
            roomInfo[data].splice(i, 1);
            userIdInfo[data].splice(i, 1);
            break;
          }
        }

        // 방 안에 남아있는 유저들은 유저 정보 업데이트
        io.in(data).emit("updateUser", roomInfo[data]);

        // 진행중이던 게임을 멈추고 방 목록에 다시 등장시킴
        if (rooms[data].playing) {
          rooms[data].playing = false;
          io.to(data).emit("endGame");
          io.emit("updateList", rooms);
        }

        // 해당 방에 있는 유저가 0명이면 저장소에서 삭제함으로써 방을 닫음.
        if (roomInfo[data].length === 0) {
          delete rooms[data];
          delete roomInfo[data];
          delete userIdInfo[data];
          delete readyList[data];

          io.emit("updateList", rooms);
        }
        break;
      }
    }

    // 접속 종료한 소켓의 닉네임을 데이터베이스에서 삭제
    const dataBuffer = fs.readFileSync("data/person.json");
    const dataArr = dataBuffer.toString().split("\n");

    if (dataArr.length === 1) {
      fs.writeFileSync("data/person.json", "");
    } else {
      for (let i = 0; i < dataArr.length; i++) {
        if (JSON.parse(dataArr[i]).nickname === nickname) {
          dataArr.splice(i, 1);
          break;
        }
      }

      for (let i = 0; i < dataArr.length; i++) {
        if (i === 0) {
          fs.writeFileSync("data/person.json", dataArr[i]);
        } else {
          fs.appendFileSync("data/person.json", "\n");
          fs.appendFileSync("data/person.json", dataArr[i]);
        }
      }
    }

    // 해당 소켓의 세션 삭제
    socket.handshake.session.destroy(() => {
      socket.handshake.session;
    });
  });
});

http.listen(3000, () => {
  console.log("Connected at 3000");
});

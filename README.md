# Bingo-Game
실시간 멀티 빙고 게임

### 기반
html, css, js(jquery, node.js), json

### 특징
1. socket.io 를 이용하여 실시간 통신
2. session, json 을 이용하여 사용자 구분 및 중복 접속 방지
3. room 단위로 최대 6인이 실시간 게임 진행

### 데모
1. 게임 접속(닉네임 입력)
![1](https://github.com/DigitalBard/Bingo-Game/assets/103251717/be322fe4-a024-42b5-b5e4-04c78c205c8f)<br><br>

2. 방 만들기
![2](https://github.com/DigitalBard/Bingo-Game/assets/103251717/268d459a-eb34-437c-b6c5-a542925102ef)<br><br>

3. 대기실 화면과 방에 입장한 화면
![3](https://github.com/DigitalBard/Bingo-Game/assets/103251717/5cb77c2c-427d-47ed-a7b0-664312eb63f3)<br><br>

4. 플레이어 두 명이 방에 입장한 상태(좌측 화면이 p2, 우측 화면이 p1)
![4](https://github.com/DigitalBard/Bingo-Game/assets/103251717/b4443171-6bfe-41df-8ef9-2018c2b535ed)<br><br>

5. 빙고판 작성을 마치고 레디 상태일 때
![5](https://github.com/DigitalBard/Bingo-Game/assets/103251717/26e03715-4ec0-4e2d-b77a-d4730a2e3b7e)<br><br>

6. 방 내 모든 플레이어가 준비 상태이면 게임 시작(p2의 차례)
![6](https://github.com/DigitalBard/Bingo-Game/assets/103251717/a0c9ab6c-cd96-4bef-b9bb-3713c48aeab8)<br><br>

7. p2가 숫자를 선택한 후 p1에게 차례가 넘어감(좌측 화면이 p1, 우측 화면이 p2)
![7](https://github.com/DigitalBard/Bingo-Game/assets/103251717/936e1b99-e813-4477-a974-9273efac388a)<br><br>

8. p2가 고른 숫자 4가 p1에게도 있으므로 p1은 4를 체크하고 자신의 차례이므로 5를 추가로 체크
![8](https://github.com/DigitalBard/Bingo-Game/assets/103251717/0387d32e-b8f0-4609-b754-f0ddd09c160e)<br><br>

9. p2에게도 5가 있으므로 5를 체크한 후, 자신의 차례이므로 6을 추가로 체크하여 빙고 완성 -> bingo 버튼 활성화 됨
![9](https://github.com/DigitalBard/Bingo-Game/assets/103251717/e6f8abd4-13ab-4d3a-88f2-89a34e0164ce)<br><br>

10. p2가 bingo 버튼을 눌러 승리 -> 결과를 공지하고 게임 종료
![10](https://github.com/DigitalBard/Bingo-Game/assets/103251717/08fa5cb3-9a4a-4ee6-8b61-7ea6725f1b29)




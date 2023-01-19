const submit = document.getElementById("submit");

function connect() {
  const name = $("#nickname").val();

  if (name === "") {
    alert("닉네임을 입력하세요.");
    return;
  }
  $.post(
    "/login",
    {
      nickname: name,
    },
    function (data) {
      if (data.result === "fail") {
        alert("이미 사용중인 닉네임입니다.");
      } else if (data.result === "success") {
        window.location = "/bingoGame";
        $("#nickname").val("");
      }
    }
  );
}

submit.addEventListener("click", connect);

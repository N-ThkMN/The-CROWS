# The CROWS — 현장 단말기

대화와 현장 상황판을 보여주는 브라우저용 로컬 데모입니다. 실제 통신이나 서버 연동은 하지 않습니다.

## 실행 방법

1. `index.html`을 브라우저에서 엽니다.
2. 시작 화면에서 사용자 이름을 입력하고 Enter를 누르거나 **시스템 시작** 버튼을 클릭합니다.
3. 시스템 부팅이 끝나면 하단 메뉴에서 **상황판**과 **메신저**를 전환할 수 있습니다.

브라우저에서 로컬 파일 실행이 제한되면 프로젝트 폴더에서 정적 웹 서버를 실행하세요.

```powershell
py -m http.server 8000
```

그다음 `http://localhost:8000`에 접속합니다.

## 이름 저장

- 이름은 브라우저 `localStorage`의 `crow-player-name` 키에 저장되며, 다음 방문 때 입력란에 불러옵니다.
- 스크립트에서는 `window.playerName`으로 사용할 수 있습니다.
- 저장은 현재 브라우저에만 적용됩니다. 다른 브라우저나 기기와 공유되지 않습니다.

## 채팅 설정

채널 및 자동 응답 데이터는 `app.js`의 `rooms` 객체에서 설정합니다.

| 채널 ID | 채널 |
| --- | --- |
| `squad` | 분대 공용망 |
| `crow02` | 김영후 중사 |
| `crow03` | 강석찬 하사 |

### 직접 입력 메시지의 무작위 답변

각 채널의 `randomReplies`에 직접 입력 메시지에 사용할 답변 후보를 지정합니다. 메시지를 보낼 때 후보 중 하나가 무작위로 선택됩니다.

공용망처럼 답변자도 지정하려면 항목을 `{ sender, text }` 형식으로 작성합니다.

```js
randomReplies: [
  { sender: "민서진 중사", text: "얼씨구?" },
  { sender: "강석찬 하사", text: "알겠습니다-." },
  { sender: "김영후 중사", text: "위치 보고 해." },
  { sender: "방진호 하사", text: "확인했습니다." }
]
```

개인 채널에서는 문자열 배열을 사용할 수 있습니다. 해당 채널 인물이 답변자로 표시됩니다.

```js
randomReplies: [
  "확인.",
  "상황실로 와.",
  "알겠다. 확인 후 보고해."
]
```

### 빠른 답장 버튼

각 채널의 `quickReplies` 항목이 빠른 답장 버튼 하나에 대응합니다.

- `label`: 버튼에 표시되는 글자
- `message`: 버튼을 눌렀을 때 보내는 메시지
- `replyIndex`: 해당 채널의 기본 `replies` 중 사용할 답변 번호(0부터 시작)
- `replies`: 여러 답변을 순서대로 보낼 때 사용하는 선택 항목. `{ sender, text }`로 답변자와 내용을 각각 지정할 수 있습니다.

```js
quickReplies: [
  {
    label: "확인",
    message: "제가 가보겠습니다!",
    replies: [
      { sender: "민서진 중사", text: "이야, 이럴 때만 빠릅니다?" },
      { sender: "강석찬 하사", text: "아이... 저 괜찮습니다." }
    ]
  }
]
```

빠른 답장에 여러 `replies`를 지정하면 약 2.2초 간격으로 순서대로 도착합니다. `replies`가 없으면 `replyIndex`에 해당하는 기본 응답 하나가 표시됩니다. 직접 입력 메시지는 빠른 답장 응답이 아니라 `randomReplies`를 사용합니다.

### 대화 기록과 시작 메시지

- 과거 대화는 `index.html`의 `<template data-room-history="채널 ID">` 요소에 작성합니다.
- 시작 후 자동으로 오는 메시지는 `app.js`의 `sendStartupMessages`에서 수정할 수 있습니다. 각 메시지의 `sender`, `text`, `receiveRoomMessage`에 전달하는 채널 ID를 설정합니다.

## 상황판 및 표시 설정

- 경계 알림이 발생했을 때 분대 공용망에 추가되는 메시지는 `app.js`의 `sendAlertMessages`에서 설정합니다.
- 상단 알림 표시 시간은 `createAlertNotification` 안의 `setTimeout(..., 3500)`에서 조정합니다. 시간 단위는 밀리초입니다.
- 화면 구조와 초기 대화 내역은 `index.html`, 스타일은 `styles.css`, 동작 및 응답 로직은 `app.js`에 있습니다.


    (() => {
      const bootScreen = document.getElementById("boot-screen");
      const bootNameForm = document.getElementById("boot-name-form");
      const playerNameInput = document.getElementById("player-name");
      const bootNameStatus = document.getElementById("boot-name-status");
      const bootMessage = document.getElementById("boot-message");
      const playerNameStorageKey = "crow-player-name";
      let playerName = "";
      let bootStarted = false;
      try {
        playerName = window.localStorage.getItem(playerNameStorageKey) || "";
        playerNameInput.value = playerName;
        window.playerName = playerName;
      } catch {
        bootNameStatus.textContent = "저장된 이름을 불러올 수 없습니다. 이름을 입력하고 Enter를 눌러 보세요.";
      }

      bootNameForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (bootStarted) return;
        const enteredName = playerNameInput.value.trim();
        if (!enteredName) {
          bootNameStatus.textContent = "이름을 입력해 주세요.";
          playerNameInput.focus();
          return;
        }

        try {
          window.localStorage.setItem(playerNameStorageKey, enteredName);
        } catch {
          bootNameStatus.textContent = "이름을 저장할 수 없습니다. 브라우저 저장 공간을 확인해 주세요.";
          return;
        }

        playerName = enteredName;
        window.playerName = playerName;
        bootStarted = true;
        bootScreen.classList.add("booting");
        bootNameForm.hidden = true;
        const label = document.createElement("span");
        label.className = "boot-label";
        label.textContent = "시스템 작동 중";
        const progress = document.createElement("span");
        progress.className = "boot-progress";
        progress.textContent = "0%";
        bootMessage.replaceChildren(label, progress);
        bootMessage.hidden = false;
        const startedAt = performance.now();
        const bootTimer = window.setInterval(() => {
          const percent = Math.min(100, Math.floor((performance.now() - startedAt) / 3000 * 100));
          progress.textContent = `${percent}%`;
          if (percent < 100) return;
          window.clearInterval(bootTimer);
          bootScreen.hidden = true;
          document.body.classList.add("system-ready");
          window.setTimeout(sendStartupMessages, 1000);
          window.setTimeout(scheduleMonsterAlert, 3000);
        }, 30);
      });

      const clock = document.getElementById("clock");
      const dateLabel = document.getElementById("date-label");
      const lastCheck = document.getElementById("last-check");
      const zoneButtons = [...document.querySelectorAll(".zone[data-zone]")];
      const logList = document.getElementById("log-list");
      const toast = document.getElementById("toast");
      const chatMessages = document.getElementById("chat-messages");
      let selectedZone = zoneButtons[0];
      let toastTimer;
      let alertLevel = 1;
      let activeRoom = "squad";
      let groupReplyIndex = 0;
      const rooms = {
        squad: {
          title: "분대 공용망",
          avatar: "CR",
          status: "● 연결 중 · 4명",
          pending: 0,
          unread: 0,
          replyIndex: 0,
          replies: [
            "이야, 이럴 때만 빠릅니다?",
            "수신했습니다. 공용망 계속 확인하겠습니다.",
            "모두 확인했습니다. 추가 지시 기다리겠습니다."
          ],
          randomReplies: [
            { sender: "민서진 중사", text: "얼씨구?" },
            { sender: "강석찬 하사", text: "알겠습니다-." },
            { sender: "김영후 중사", text: "위치 보고 해." },
            { sender: "방진호 하사", text: "확인했습니다." }
          ],
          quickReplies: [
            {
              label: "확인",
              message: "제가 가보겠습니다!",
              replies: [
                { sender: "민서진 중사", text: "이야, 이럴 때만 빠릅니다?" },
                { sender: "민서진 중사", text: "내가 심부름 시킬때는 쳐다도 안 보던데?" },
                { sender: "강석찬 하사", text: "아이... 저 괜찮습니다-," },
                { sender: "민서진 중사", text: "막내 오지 말라고는 또 안 하는 것 봐라 저거," },
                { sender: "김영후 중사", text: "민 중사 생존자 점호 안 가냐. 둘은 상황실로 같이 복귀해." },
                { sender: "방진호 하사", text: "민 중사님만 안 오셨습니다." },
                { sender: "민서진 중사", text: "또 나만 잘못했지." }
              ]
            },
            {
              label: "위치",
              message: "현재 B-03 공용구역 앞입니다.",
              replies: [
                { sender: "김영후 중사", text: "상황실 잠깐 들어와." },
                { sender: "민서진 중사", text: "왜 막내만 부르시나? 야 너네끼리 뭐 먹지마라." },
                { sender: "강석찬 하사", text: "김 중사님이 민 중사님처럼은 안 하십니다..." },
                { sender: "민서진 중사", text: "야 강 하사 지금 어디냐?" },
                { sender: "김영후 중사", text: "같이 상황보고서 작성하고 싶음 와." },
                { sender: "강석찬 하사", text: "화이팅하십쇼." },
                { sender: "민서진 중사", text: "강 하사 어디냐니까?" }
              ]
            }
          ],
          messages: []
        },
        crow02: {
          title: "김영후 중사",
          avatar: "김",
          status: "● 응답 대기 · 메시지 가능",
          pending: 0,
          unread: 0,
          replyIndex: 0,
          replies: [
            "상황실. 무슨 일 있나?",
            "알아서 막아. 수량 비면 단체로 각오해라.",
            "복도 왼쪽 기둥 옆. 하나 뒀다."
          ],
          randomReplies: [
            "또 민 중사랑 까불지말고 빨리 들어가라.",
            "확인.",
            "상황실로"
          ],
          quickReplies: [
            { label: "1", message: "중사님, 어디 계십니까?", replyIndex: 0 },
            { label: "2", message: "중사님! 민 중사님이 또 캔커피 빼먹겠다고 난리치십니다!", replyIndex: 1 },
            { label: "3", message: "중사님... 어디십니까?ㅜㅜ", replyIndex: 2 },
          ],
          messages: []
        },
        crow03: {
          title: "강석찬 하사",
          avatar: "강",
          status: "● 연결 가능",
          pending: 0,
          unread: 0,
          replyIndex: 0,
          replies: [
            "창고 앞입니다. 무슨 일 있습니까?",
            "바로 갈게, 대기해.",
            "확인. 바쁩니까-"
          ],
          randomReplies: [
            "확인했습니다-.",
            "알겠습니다. ",
            "예-. 혹시 어딥니까?"
          ],
          quickReplies: [
            { label: "1", message: "강 하사님, 어디십니까? ", replyIndex: 0 },
            { label: "2", message: "하사님, 생존자 이상 반응 확인되어 임시 거점으로 이동 중입니다.", replyIndex: 1 },
            { label: "3", message: "현재 B-02 구역입니다.", replyIndex: 2 }
          ],
          messages: []
        }
      };
      document.querySelectorAll("template[data-room-history]").forEach((template) => {
        const room = rooms[template.dataset.roomHistory];
        room.messages = Array.from(template.content.querySelectorAll("[data-sender]")).map((message) => ({
          sender: message.dataset.sender,
          text: message.dataset.text,
          time: message.dataset.time,
          dayOffset: Number(template.dataset.dayOffset || 0)
        }));
      });

      const timeNow = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
      const updateClock = () => {
        const now = new Date();
        clock.textContent = timeNow();
        dateLabel.textContent = now.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
      };

      const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2300);
      };

      const createAlertNotification = ({ sender, text }) => {
        const container = document.getElementById("alert-notifications");
        const notification = document.createElement("article");
        notification.className = "alert-notification";

        const avatar = document.createElement("span");
        avatar.className = "alert-notification-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = sender.slice(0, 1);

        const content = document.createElement("div");
        content.className = "alert-notification-content";
        const heading = document.createElement("div");
        heading.className = "alert-notification-heading";
        const senderLabel = document.createElement("strong");
        senderLabel.textContent = sender;
        const time = document.createElement("time");
        time.textContent = timeNow().slice(0, 5);
        heading.append(senderLabel, time);

        const message = document.createElement("p");
        message.textContent = text;
        content.append(heading, message);
        notification.append(avatar, content);
        window.setTimeout(() => notification.remove(), 3500);
        return notification;
      };

      const pendingAlertNotifications = [];
      let isPresentingAlertNotification = false;
      const showNextAlertNotification = () => {
        if (isPresentingAlertNotification || pendingAlertNotifications.length === 0) return;
        isPresentingAlertNotification = true;

        const container = document.getElementById("alert-notifications");
        const presentNotification = () => {
          container.prepend(createAlertNotification(pendingAlertNotifications.shift()));
          isPresentingAlertNotification = false;
          showNextAlertNotification();
        };

        if (container.children.length >= 3) {
          const oldest = container.lastElementChild;
          oldest.classList.add("is-leaving");
          window.setTimeout(() => {
            oldest.remove();
            presentNotification();
          }, 300);
          return;
        }

        presentNotification();
      };

      const showAlertNotification = (message) => {
        pendingAlertNotifications.push(message);
        showNextAlertNotification();
      };

      const receiveRoomMessage = (roomId, message) => {
        const room = rooms[roomId];
        const receivedMessage = { ...message, time: timeNow().slice(0, 5), dayOffset: 0 };
        room.messages.push(receivedMessage);
        if (activeRoom === roomId) {
          renderMessages();
        } else {
          room.unread += 1;
          updateUnreadBadges();
        }
        showAlertNotification(receivedMessage);
      };

      const sendStartupMessages = () => {
        const messages = [
          { sender: "김영후 중사", text: "강석찬 19시 이후로 본 사람 보고해." },
          { sender: "민서진 중사", text: "상황실에 없냐?" },
          { sender: "방진호 하사", text: "19시 20분경 의무실로 방향으로 가는 거 봤습니다." },
          { sender: "김영후 중사", text: "부상이거나 아픈 거면 제때 보고해." }
        ];
        messages.forEach((message, index) => {
          window.setTimeout(() => receiveRoomMessage("squad", message), 500 + index * 1500);
        });
      };

      const sendAlertMessages = (zoneName) => {
        const messages = [
          { sender: "김영후 중사", text: `${zoneName} 구역 주의 알림 확인. 전 대원 위치 확인 바람.` },
          { sender: "민서진 중사", text: `${zoneName} 구역 경고 확인했습니다. 주변 확인 후 보고하겠습니다.` },
          { sender: "강석찬 하사", text: "확인했습니다. 거점에서 장비 챙겨 지원 대기하겠습니다." },
          { sender: "방진호 하사", text: "수신했습니다. 제 위치와 장비 상태 보고드립니다." }
        ];

        messages.forEach((message, index) => {
          window.setTimeout(() => {
            receiveRoomMessage("squad", message);
          }, 500 + index * 1100);
        });
      };

      const renderMessages = () => {
        const room = rooms[activeRoom];
        chatMessages.replaceChildren();

        let previousDayOffset = null;

        room.messages.forEach((message) => {
          const dayOffset = message.dayOffset || 0;
          if (dayOffset !== previousDayOffset) {
            const date = document.createElement("div");
            date.className = "chat-date";
            if (dayOffset === 0) {
              date.textContent = "오늘";
            } else {
              const dateValue = new Date();
              dateValue.setDate(dateValue.getDate() - dayOffset);
              date.textContent = `${dateValue.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}`;
            }
            chatMessages.append(date);
            previousDayOffset = dayOffset;
          }

          const outgoing = message.sender === "부대원";
          const item = document.createElement("article");
          item.className = `message${outgoing ? " outgoing" : ""}`;

          if (!outgoing) {
            const avatar = document.createElement("span");
            avatar.className = "message-avatar";
            avatar.setAttribute("aria-hidden", "true");
            avatar.textContent = message.sender === "SYSTEM" ? "SYS" : message.sender.slice(-2);
            item.append(avatar);
          }

          const content = document.createElement("div");
          content.className = "message-content";
          const sender = document.createElement("div");
          sender.className = "message-sender";
          sender.textContent = message.sender === "SYSTEM" ? "SYSTEM" : message.sender;
          content.append(sender);

          const bubble = document.createElement("div");
          bubble.className = "message-bubble";
          bubble.textContent = message.text;
          const meta = document.createElement("div");
          meta.className = "message-meta";
          meta.textContent = message.time;
          content.append(bubble, meta);
          item.append(content);
          chatMessages.append(item);
        });

        if (room.pending > 0) {
          const typing = document.createElement("div");
          typing.className = "typing-indicator";
          typing.textContent = `${room.title} 입력 중`;
          typing.setAttribute("aria-label", `${room.title} 메시지 작성 중`);
          chatMessages.append(typing);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
      };

      const updateUnreadBadges = () => {
        document.querySelectorAll(".channel-button").forEach((button) => {
          const unread = rooms[button.dataset.room].unread;
          const badge = button.querySelector(".channel-unread");
          badge.textContent = unread ? String(unread) : "";
          button.setAttribute("aria-label", `${rooms[button.dataset.room].title}${unread ? `, 읽지 않은 메시지 ${unread}개` : ""}`);
        });
      };

      const selectRoom = (roomId) => {
        activeRoom = roomId;
        const room = rooms[roomId];
        room.unread = 0;
        document.getElementById("room-title").textContent = room.title;
        document.getElementById("room-avatar").textContent = room.avatar;
        document.getElementById("room-status").textContent = room.status;
        document.querySelectorAll(".channel-button").forEach((button) => {
          button.setAttribute("aria-selected", String(button.dataset.room === roomId));
        });
        document.querySelectorAll(".quick-reply").forEach((button, index) => {
          const quickReply = room.quickReplies[index];
          button.hidden = !quickReply;
          if (!quickReply) return;
          button.textContent = quickReply.label;
          button.dataset.message = quickReply.message;
          button.dataset.replyIndex = String(quickReply.replyIndex ?? index);
        });
        updateUnreadBadges();
        renderMessages();
      };

      const sendMessage = (text, quickReplyIndex = null) => {
        const message = text.trim();
        if (!message) return;

        const roomId = activeRoom;
        const room = rooms[roomId];
        const time = timeNow().slice(0, 5);
        room.messages.push({ sender: "부대원", text: message, time, dayOffset: 0 });
        document.getElementById("chat-input").value = "";
        renderMessages();

        const quickReply = Number.isInteger(quickReplyIndex) ? room.quickReplies[quickReplyIndex] : null;
        const quickReplyTexts = Array.isArray(quickReply?.replies) && quickReply.replies.length > 0
          ? quickReply.replies
          : null;
        room.pending += quickReplyTexts?.length || 1;
        renderMessages();
        const replies = room.replies;
        let replyItems = quickReplyTexts;
        if (!replyItems && !Number.isInteger(quickReplyIndex)) {
          const candidates = room.randomReplies.length > 0 ? room.randomReplies : replies;
          replyItems = [candidates[Math.floor(Math.random() * candidates.length)]];
        } else if (!replyItems) {
          const requestedReplyIndex = Number.isInteger(quickReply?.replyIndex) ? quickReply.replyIndex : quickReplyIndex;
          const responseIndex = requestedReplyIndex < replies.length
            ? requestedReplyIndex
            : room.replyIndex % replies.length;
          replyItems = [replies[responseIndex]];
        }

        replyItems.forEach((replyItem, index) => {
          window.setTimeout(() => {
            room.pending = Math.max(0, room.pending - 1);
            const reply = typeof replyItem === "string" ? { text: replyItem } : replyItem;
            const sender = reply.sender || (roomId === "squad"
              ? ["민서진 중사", "강석찬 하사", "김영후 중사", "방진호 하사"][groupReplyIndex++ % 4]
              : room.title);
            room.replyIndex += 1;
            room.messages.push({ sender, text: reply.text, time: timeNow().slice(0, 5), dayOffset: 0 });
            if (activeRoom === roomId) {
              renderMessages();
            } else {
              room.unread += 1;
              updateUnreadBadges();
            }
          }, 950 + index * 2200);
        });
      };

      const addLog = (tag, message, kind = "note") => {
        const entry = document.createElement("div");
        entry.className = "log-entry";
        const time = document.createElement("time");
        time.className = "log-time";
        time.textContent = timeNow().slice(0, 5);
        const copy = document.createElement("div");
        copy.className = "log-copy";
        const label = document.createElement("span");
        label.className = `log-tag ${kind}`;
        label.textContent = tag;
        copy.append(label, document.createTextNode(message));
        entry.append(time, copy);
        logList.prepend(entry);
        document.getElementById("log-count").textContent = `${logList.children.length.toString().padStart(2, "0")} ENTRIES`;
      };

      const monsterAlert = document.getElementById("monster-alert");
      const dismissMonsterAlert = document.getElementById("dismiss-monster-alert");
      let monsterAlertTimer = null;
      let nextMonsterAlertAt = 0;
      let previousFocus;
      let activeAlertZone = null;
      const scheduleMonsterAlert = () => {
        if (activeAlertZone || monsterAlertTimer !== null) return;
        const delay = 1800000 + Math.random() * 1800000;
        nextMonsterAlertAt = Date.now() + delay;

        const triggerWhenDue = () => {
          monsterAlertTimer = null;
          const remaining = nextMonsterAlertAt - Date.now();
          if (remaining > 0) {
            monsterAlertTimer = window.setTimeout(triggerWhenDue, remaining);
            return;
          }
          nextMonsterAlertAt = 0;
          showMonsterAlert();
        };

        monsterAlertTimer = window.setTimeout(triggerWhenDue, delay);
      };

      const showMonsterAlert = () => {
        if (!monsterAlert.hidden) return;
        previousFocus = document.activeElement;
        monsterAlert.hidden = false;
        const zone = markRandomZoneAlert();
        addLog("WARN", `${zone.dataset.zone} 구역 주의 보고`, "alert");
        sendAlertMessages(zone.dataset.zone);
        dismissMonsterAlert.focus();
      };

      const closeMonsterAlert = () => {
        if (monsterAlert.hidden) return;
        monsterAlert.hidden = true;
        window.clearTimeout(monsterAlertTimer);
        monsterAlertTimer = null;
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
      };

      dismissMonsterAlert.addEventListener("click", closeMonsterAlert);
      document.getElementById("open-board-alert").addEventListener("click", () => {
        closeMonsterAlert();
        document.querySelector('.nav-button[data-view="board"]').click();
      });
      monsterAlert.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMonsterAlert();
        if (event.key === "Tab") {
          event.preventDefault();
          dismissMonsterAlert.focus();
        }
      });

      const selectZone = (zone) => {
        selectedZone = zone;
        zoneButtons.forEach((button) => {
          const active = button === zone;
          button.classList.toggle("selected", active);
          button.setAttribute("aria-pressed", String(active));
        });
        const name = zone.dataset.zone;
        const state = zone.dataset.state;
        document.getElementById("selected-zone-label").textContent = name;
        document.getElementById("zone-detail-title").textContent = `${name} · ${state}`;
        document.getElementById("zone-detail-desc").textContent = zone.dataset.desc;
        document.getElementById("confirm-zone").disabled = state !== "미확인" && state !== "주의 보고";
      };

      const markRandomZoneAlert = () => {
        if (activeAlertZone) return activeAlertZone;

        const candidates = zoneButtons.filter((zone) => zone.dataset.zone !== "B-07");
        const zone = candidates[Math.floor(Math.random() * candidates.length)];
        activeAlertZone = zone;
        zone.dataset.state = "주의 보고";
        zone.dataset.desc = "경고 알림 확인 필요";
        zone.classList.remove("unknown");
        zone.classList.add("alert");
        zone.querySelector(".zone-state").textContent = "주의 보고";
        if (selectedZone === zone) selectZone(zone);
        return zone;
      };

      zoneButtons.forEach((zone) => {
        zone.addEventListener("click", () => selectZone(zone));
      });

      document.querySelectorAll(".channel-button").forEach((button) => {
        button.addEventListener("click", () => selectRoom(button.dataset.room));
      });

      document.querySelectorAll(".quick-reply").forEach((button) => {
        button.addEventListener("click", () => {
          const replyIndex = Number(button.dataset.replyIndex);
          sendMessage(button.dataset.message || button.textContent, Number.isInteger(replyIndex) ? replyIndex : null);
        });
      });

      document.getElementById("chat-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const input = document.getElementById("chat-input");
        if (!input.value.trim()) {
          input.focus();
          return;
        }
        sendMessage(input.value);
        input.focus();
      });

      document.querySelectorAll(".nav-button").forEach((button) => {
        button.addEventListener("click", () => {
          const view = button.dataset.view;
          document.querySelectorAll(".nav-button").forEach((item) => {
            if (item === button) item.setAttribute("aria-current", "page");
            else item.removeAttribute("aria-current");
          });
          document.querySelectorAll(".view-panel").forEach((panel) => {
            panel.classList.toggle("active", panel.id === `view-${view}`);
          });
        });
      });

      document.getElementById("confirm-zone").addEventListener("click", () => {
        if (selectedZone.dataset.state !== "미확인" && selectedZone.dataset.state !== "주의 보고") return;
        const confirmedZone = selectedZone;
        const alertConfirmed = confirmedZone === activeAlertZone;
        if (alertConfirmed) activeAlertZone = null;
        selectedZone.dataset.state = "확인됨";
        selectedZone.dataset.desc = "확인 기록이 추가되었습니다";
        selectedZone.classList.remove("unknown");
        selectedZone.classList.remove("alert");
        selectedZone.querySelector(".zone-state").textContent = "확인됨";
        selectZone(selectedZone);
        lastCheck.textContent = timeNow().slice(0, 5);
        addLog("부대원", `${selectedZone.dataset.zone} 구역 확인 기록 추가`);
        showToast(`${selectedZone.dataset.zone} 확인 기록을 추가했습니다`);
        if (alertConfirmed) scheduleMonsterAlert();
      });

      document.getElementById("report-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const input = document.getElementById("report-input");
        const type = document.getElementById("report-type").value;
        const message = input.value.trim();
        if (!message) {
          input.focus();
          return;
        }
        addLog("부대원", message, type);
        input.value = "";
        input.focus();
        showToast("보고를 기록했습니다");
      });

      document.getElementById("alert-button").addEventListener("click", () => {
        alertLevel = alertLevel === 3 ? 1 : alertLevel + 1;
        const badge = document.getElementById("alert-badge");
        badge.dataset.level = String(alertLevel);
        badge.textContent = `경계 단계 ${alertLevel}`;
        addLog("SYSTEM", `경계 단계를 ${alertLevel}단계로 변경`);
        showToast(`경계 단계 ${alertLevel}`);
      });

      selectZone(selectedZone);
      selectRoom(activeRoom);
      updateClock();
      lastCheck.textContent = timeNow().slice(0, 5);
      window.setInterval(updateClock, 1000);
    })();
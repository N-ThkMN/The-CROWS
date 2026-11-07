    (() => {
      const bootScreen = document.getElementById("boot-screen");
      const bootPasscodeForm = document.getElementById("boot-passcode-form");
      const bootPasscodeInput = document.getElementById("boot-passcode");
      const bootPasscodeStatus = document.getElementById("boot-passcode-status");
      const bootNameForm = document.getElementById("boot-name-form");
      const playerNameInput = document.getElementById("player-name");
      const bootNameStatus = document.getElementById("boot-name-status");
      const dutyDialogTitle = document.getElementById("duty-dialog-title");
      const playerTerminalTitle = document.getElementById("player-terminal-title");
      const bootMessage = document.getElementById("boot-message");
      const playerNameStorageKey = "crow-player-name";
      const bootPasscodeSha256 = "68be80b7e15c2191caaa3e6639d68bf595c03314ba7223f7b69b46efe87dc400";
      const hashPasscode = async (passcode) => {
        if (!window.crypto?.subtle) throw new Error("Web Crypto is unavailable");
        const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(passcode));
        return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      };
      const attachPasscodeKeypad = (form, input, status) => {
        const keypad = form.querySelector("[data-passcode-keypad]");
        keypad.addEventListener("click", (event) => {
          const button = event.target.closest("button[data-key], button[data-action]");
          if (!button || !keypad.contains(button) || button.disabled) return;

          if (button.dataset.action === "clear") input.value = "";
          else if (button.dataset.action === "backspace") input.value = input.value.slice(0, -1);
          else if (input.value.length < input.maxLength) input.value += button.dataset.key;

          status.textContent = "";
        });
      };
      attachPasscodeKeypad(bootPasscodeForm, bootPasscodeInput, bootPasscodeStatus);
      let playerName = "";
      let bootStarted = false;
      let bootPasscodeChecking = false;
      const updatePlayerTitles = () => {
        dutyDialogTitle.textContent = `${playerName || "대원"} 상태`;
        playerTerminalTitle.textContent = playerName ? `${playerName} 단말기` : "현장 단말기";
      };
      try {
        playerName = window.localStorage.getItem(playerNameStorageKey) || "";
        playerNameInput.value = playerName;
        window.playerName = playerName;
        updatePlayerTitles();
      } catch {
        bootNameStatus.textContent = "저장된 이름을 불러올 수 없습니다. 이름을 입력하고 Enter를 눌러 보세요.";
      }

      bootPasscodeForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (bootPasscodeChecking) return;
        const enteredPasscode = bootPasscodeInput.value.trim();
        if (!/^\d{6}$/.test(enteredPasscode)) {
          bootPasscodeStatus.textContent = "6자리 숫자 암호를 입력해 주세요.";
          bootPasscodeInput.focus();
          return;
        }

        bootPasscodeChecking = true;
        bootPasscodeForm.querySelector("button[type='submit']").disabled = true;
        try {
          if (await hashPasscode(enteredPasscode) !== bootPasscodeSha256) {
            bootPasscodeStatus.textContent = "암호가 일치하지 않습니다.";
            bootPasscodeInput.select();
            return;
          }
          bootPasscodeForm.hidden = true;
          bootNameForm.hidden = false;
          playerNameInput.focus();
        } catch {
          bootPasscodeStatus.textContent = "암호 확인 기능을 사용할 수 없습니다. 보안 컨텍스트(HTTPS 또는 localhost)에서 열어 주세요.";
        } finally {
          bootPasscodeChecking = false;
          bootPasscodeForm.querySelector("button[type='submit']").disabled = false;
        }
      });

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
        updatePlayerTitles();
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
      const bulletinLockForm = document.getElementById("bulletin-lock-form");
      const bulletinPasscodeInput = document.getElementById("bulletin-passcode");
      const bulletinLockStatus = document.getElementById("bulletin-lock-status");
      const bulletinPasscodeHint = document.getElementById("bulletin-passcode-hint");
      const bulletinContent = document.getElementById("bulletin-content");
      const bulletinDate = document.getElementById("bulletin-date");
      const taskCheckboxes = [...document.querySelectorAll(".task-item input[type='checkbox']")];
      const taskStatus = document.getElementById("task-status");
      const taskCount = document.getElementById("task-count");
      const taskProgress = document.getElementById("task-progress");
      const dashboardTaskCount = document.getElementById("dashboard-task-count");
      const dashboardTaskProgress = document.getElementById("dashboard-task-progress");
      const supplyRows = [...document.querySelectorAll("#supply-resources .resource-row[data-supply-category]")];
      supplyRows.forEach((row) => {
        row.dataset.base = String(Math.floor(Math.random() * 51));
      });
      const supplyReadiness = document.getElementById("supply-readiness");
      const supplyNote = document.getElementById("supply-note");
      const supplyRequestButtons = [...document.querySelectorAll(".supply-request-button")];
      const taskStorageKey = "crow-daily-supply-checklist";
      const supplyRequestStorageKey = "crow-daily-supply-requests";
      const heartRate = document.getElementById("heart-rate");
      const heartState = document.getElementById("heart-state");
      const panelHeartRate = document.getElementById("panel-heart-rate");
      const panelHeartState = document.getElementById("panel-heart-state");
      const dutyStatusTrigger = document.getElementById("duty-status-trigger");
      const dutyDialog = document.getElementById("duty-dialog");
      const vitalsCard = document.getElementById("vitals-card");
      const oxygenValue = document.getElementById("oxygen-value");
      const oxygenMeter = document.getElementById("oxygen-meter");
      const oxygenMeterFill = document.getElementById("oxygen-meter-fill");
      let bulletinFailedAttempts = 0;
      let taskStorageAvailable = true;
      let supplyRequestStorageAvailable = true;
      const supplyRequests = new Map();
      const supplyDeliveredCounts = new Map();
      const supplyRequestCounts = new Map();
      let supplyRequestDate = null;
      const supplyApprovalDelayMs = 30 * 1000;
      const supplyConvoyDelayMs = 2 * 60 * 1000;
      const supplyApprovers = ["강석찬 하사", "방진호 하사"];
      const chooseSupplyApprover = () => supplyApprovers[Math.floor(Math.random() * supplyApprovers.length)];
      attachPasscodeKeypad(bulletinLockForm, bulletinPasscodeInput, bulletinLockStatus);
      const getTodayBoardPasscode = (now = new Date()) => {
        const today = Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`);
        return String(today - 20231206).padStart(6, "0");
      };
      const updateBulletinDate = (now = new Date()) => {
        bulletinDate.textContent = now.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
      };
      const lockBulletinBoard = () => {
        bulletinContent.hidden = true;
        bulletinLockForm.hidden = false;
        bulletinLockForm.reset();
        bulletinLockStatus.textContent = "";
      };
      updateBulletinDate();

      bulletinLockForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const enteredPasscode = bulletinPasscodeInput.value.trim();
        if (!/^\d{6}$/.test(enteredPasscode)) {
          bulletinLockStatus.textContent = "6자리 숫자 암호를 입력해 주세요.";
          bulletinPasscodeInput.focus();
          return;
        }

        const submitButton = bulletinLockForm.querySelector("button[type='submit']");
        submitButton.disabled = true;
        try {
          const today = new Date();
          updateBulletinDate(today);
          const expectedHash = await hashPasscode(getTodayBoardPasscode(today));
          if (await hashPasscode(enteredPasscode) !== expectedHash) {
            bulletinFailedAttempts += 1;
            if (bulletinFailedAttempts >= 3) bulletinPasscodeHint.hidden = false;
            bulletinLockStatus.textContent = "오늘의 암호와 일치하지 않습니다.";
            bulletinPasscodeInput.select();
            return;
          }
          bulletinLockForm.hidden = true;
          bulletinContent.hidden = false;
          bulletinPasscodeInput.value = "";
          document.getElementById("bulletin-relock").focus();
        } catch {
          bulletinLockStatus.textContent = "암호 확인 기능을 사용할 수 없습니다. 보안 컨텍스트(HTTPS 또는 localhost)에서 열어 주세요.";
        } finally {
          submitButton.disabled = false;
        }
      });
      document.getElementById("bulletin-relock").addEventListener("click", () => {
        lockBulletinBoard();
        bulletinPasscodeInput.focus();
      });
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
              label: "답변",
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
              label: "위치보고",
              message: "현재 B-03 공용구역 앞입니다.",
              replies: [
                { sender: "김영후 중사", text: "상황실로 잠깐 들어와." },
                { sender: "김영후 중사", text: "같이 상황보고서 작성하고 싶음 와." },
                { sender: "강석찬 하사", text: "화이팅하십쇼." },
                { sender: "민서진 중사", text: "강 하사 어디냐니까?" },
                { sender: "강석찬 하사", text: "외벽 점검 나갑니다- 같이 가주시는 겁니까?" },
                { sender: "민서진 중사", text: "그래 다들 힘내라."}
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
            "창고 앞입니다. 무슨 일 있습니까.",
            "바로 갈게, 대기해.",
            "확인. 바쁩니까-"
          ],
          randomReplies: [
            "확인했습니다-.",
            "알겠습니다. ",
            "예-. 혹시 어딥니까?"
          ],
          quickReplies: [
            { label: "1", message: "강 하사님, 어디십니까?", replyIndex: 0 },
            { label: "2", message: "하사님, 생존자 이상 반응 확인되어 임시 거점으로 이동 중입니다.", replyIndex: 1 },
            { label: "3", message: "위치 보고합니다. 현재 B-02 구역입니다.", replyIndex: 2 }
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

      const getTaskDateKey = (now = new Date()) => (
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
      );
      supplyRequestDate = getTaskDateKey();
      const getCompletedTaskCount = () => taskCheckboxes.filter((checkbox) => checkbox.checked).length;
      const saveSupplyRequests = () => {
        if (!supplyRequestStorageAvailable) return;
        try {
          window.localStorage.setItem(supplyRequestStorageKey, JSON.stringify({
            date: getTaskDateKey(),
            requests: Object.fromEntries(supplyRequests),
            requestCounts: Object.fromEntries(supplyRequestCounts),
            deliveredCounts: Object.fromEntries(supplyDeliveredCounts)
          }));
        } catch {
          supplyRequestStorageAvailable = false;
        }
      };
      const formatRemaining = (milliseconds) => {
        const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
        return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
      };
      const updateSupplyRequests = (now = Date.now()) => {
        const today = getTaskDateKey();
        if (today !== supplyRequestDate) {
          supplyRequestDate = today;
          supplyRequests.clear();
          supplyDeliveredCounts.clear();
          supplyRequestCounts.clear();
          saveSupplyRequests();
        }
        supplyRows.forEach((row) => {
          const category = row.dataset.supplyCategory;
          const request = supplyRequests.get(category);
          const details = row.querySelector(".supply-request-details");
          const status = row.querySelector(".supply-request-state");
          const requestButton = row.querySelector(".supply-request-button");
          const approveButton = row.querySelector(".supply-approve-button");
          const receiveButton = row.querySelector(".supply-receive-button");
          const requestCount = supplyRequestCounts.get(category) || 0;
          const activeRequest = Boolean(request && request.status !== "received");
          details.hidden = !request;
          requestButton.hidden = activeRequest;
          requestButton.disabled = requestCount >= 2;
          requestButton.textContent = requestCount >= 2
            ? "오늘 마감"
            : `${request?.status === "received" ? "재요청" : "요청"} ${requestCount}/2`;
          row.classList.toggle("is-requested", activeRequest);
          if (!request) return;

          const approvalReady = request.status === "requested" && now >= request.approvalReadyAt;
          const convoyReady = request.status === "acknowledged" && now >= request.convoyReadyAt;
          approveButton.hidden = request.status !== "requested" || !approvalReady;
          approveButton.disabled = false;
          receiveButton.hidden = request.status !== "acknowledged" || !convoyReady;

          if (request.status === "received") {
            status.textContent = `인수 완료 · 창고 +1 · ${request.receivedItem}`;
          } else if (request.status === "acknowledged") {
            status.textContent = convoyReady
              ? "수색팀 복귀 완료 · 인수 스캔 대기"
              : `승인 확인 완료 · 수색팀 복귀 대기 (남은 시간: ${formatRemaining(request.convoyReadyAt - now)})`;
          } else {
            const approvalText = approvalReady
              ? `${request.approver} 승인 완료 · 승인 확인 대기`
              : `승인 대기 (${formatRemaining(request.approvalReadyAt - now)})`;
            status.textContent = approvalText;
          }
        });
        const activeCount = [...supplyRequests.values()].filter((request) => request.status !== "received").length;
        const receivedCount = [...supplyDeliveredCounts.values()].reduce((sum, count) => sum + count, 0);
        const totalRequestCount = [...supplyRequestCounts.values()].reduce((sum, count) => sum + count, 0);
        supplyNote.textContent = supplyRequestStorageAvailable
          ? `항목별 하루 2회 요청 · 오늘 접수 ${totalRequestCount}건 · 진행 ${activeCount}건 · 창고 인수 ${receivedCount}건`
          : "요청 상태를 저장할 수 없습니다. 브라우저 저장 공간을 확인해 주세요.";
      };
      try {
        const savedRequestsText = window.localStorage.getItem(supplyRequestStorageKey);
        if (savedRequestsText) {
          const savedRequests = JSON.parse(savedRequestsText);
          if (savedRequests?.date === getTaskDateKey() && savedRequests.requests && typeof savedRequests.requests === "object") {
            const validCategories = supplyRows.map((row) => row.dataset.supplyCategory);
            Object.entries(savedRequests.requests).forEach(([category, request]) => {
              if (!validCategories.includes(category)
                || !["requested", "approved", "acknowledged", "received"].includes(request?.status)
                || !Number.isFinite(request?.approvalReadyAt)
                || (["approved", "acknowledged", "received"].includes(request.status)
                  && !Number.isFinite(request?.convoyReadyAt))) {
                throw new Error("Saved supply requests are invalid");
              }
              if (request.status === "approved") request.status = "acknowledged";
              if (request.status === "requested") delete request.convoyReadyAt;
              request.approver ||= chooseSupplyApprover();
              supplyRequests.set(category, request);
            });
            if (savedRequests.requestCounts && typeof savedRequests.requestCounts === "object") {
              Object.entries(savedRequests.requestCounts).forEach(([category, count]) => {
                if (!validCategories.includes(category) || !Number.isInteger(count) || count < 0 || count > 2) {
                  throw new Error("Saved supply request counts are invalid");
                }
                supplyRequestCounts.set(category, count);
              });
            } else {
              supplyRequests.forEach((request, category) => {
                supplyRequestCounts.set(category, 1);
              });
            }
            if (savedRequests.deliveredCounts && typeof savedRequests.deliveredCounts === "object") {
              Object.entries(savedRequests.deliveredCounts).forEach(([category, count]) => {
                if (!validCategories.includes(category) || !Number.isInteger(count) || count < 0) {
                  throw new Error("Saved supply inventory is invalid");
                }
                supplyDeliveredCounts.set(category, count);
              });
            } else {
              supplyRequests.forEach((request, category) => {
                if (request.status === "received") supplyDeliveredCounts.set(category, 1);
              });
            }
          }
        }
      } catch {
        supplyRequestStorageAvailable = false;
      }
      const updateSupplyStatus = () => {
        const values = supplyRows.map((row) => {
          const category = row.dataset.supplyCategory;
          const base = Number(row.dataset.base) || 0;
          const relatedTasks = taskCheckboxes.filter((checkbox) => checkbox.dataset.category === category);
          const recovered = relatedTasks.length > 0 && relatedTasks.every((checkbox) => checkbox.checked);
          const deliveredCount = supplyDeliveredCounts.get(category) || 0;
          const value = Math.min(base + (recovered ? 10 : 0) + deliveredCount * 10, 100);
          const fill = row.querySelector(".meter i");
          const meter = row.querySelector(".meter");
          const output = row.querySelector("output");
          const level = value < 30 ? "critical" : value < 60 ? "low" : value < 80 ? "medium" : "high";
          fill.style.width = `${value}%`;
          output.textContent = `${value}%`;
          meter.dataset.level = level;
          row.classList.toggle("is-recovered", recovered || deliveredCount > 0);
          return value;
        });
        const readiness = values.length
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : 0;
        supplyReadiness.textContent = `전투 준비 ${readiness}%`;
      };
      const updateTaskProgress = () => {
        const completed = getCompletedTaskCount();
        const total = taskCheckboxes.length;
        const percentage = total ? Math.round(completed / total * 100) : 0;
        taskCount.textContent = `${completed}/${total} 완료`;
        dashboardTaskCount.textContent = `${completed}/${total}`;
        for (const progress of [taskProgress, dashboardTaskProgress]) {
          progress.setAttribute("aria-valuenow", String(completed));
          progress.setAttribute("aria-valuetext", `${completed}/${total} 완료, ${percentage}%`);
          progress.querySelector("span").style.width = `${percentage}%`;
        }
        if (taskStorageAvailable) {
          taskStatus.textContent = completed === total
            ? "오늘의 업무를 모두 완료했습니다."
            : "체크한 업무는 오늘 날짜 기준으로 이 브라우저에 저장됩니다.";
        }
      };
      const updateVitals = () => {
        const pendingTasks = taskCheckboxes.length - getCompletedTaskCount();
        const isInDanger = alertLevel >= 2 || pendingTasks >= 3;
        const bpm = isInDanger ? 128 : 82;
        const oxygen = isInDanger ? 72 : 98;
        vitalsCard.dataset.state = isInDanger ? "danger" : "stable";
        heartRate.textContent = String(bpm);
        heartState.textContent = isInDanger ? "(위험)" : "(안정)";
        panelHeartRate.textContent = String(bpm);
        panelHeartState.textContent = isInDanger ? "(위험)" : "(안정)";
        dutyStatusTrigger.dataset.state = isInDanger ? "danger" : "stable";
        dutyStatusTrigger.setAttribute("aria-label", `심박수 ${bpm} BPM, ${isInDanger ? "위험" : "안정"}. 상태 상세 보기`);
        oxygenValue.textContent = `${oxygen}%`;
        oxygenMeter.setAttribute("aria-valuenow", String(oxygen));
        oxygenMeterFill.style.width = `${oxygen}%`;
      };
      try {
        const savedTasksText = window.localStorage.getItem(taskStorageKey);
        if (savedTasksText) {
          const savedTasks = JSON.parse(savedTasksText);
          if (savedTasks?.date === getTaskDateKey()) {
            if (!Array.isArray(savedTasks.completed)
              || (savedTasks.completed.length !== taskCheckboxes.length
                && savedTasks.completed.length !== taskCheckboxes.length - 1)
              || !savedTasks.completed.every((completed) => typeof completed === "boolean")) {
              throw new Error("Saved checklist data is invalid");
            }
            taskCheckboxes.forEach((checkbox, index) => {
              checkbox.checked = savedTasks.completed[index] ?? false;
            });
          }
        }
      } catch {
        taskStorageAvailable = false;
        taskStatus.textContent = "오늘 업무 진행 상황을 불러오지 못했습니다. 이 브라우저에서 저장 기능을 사용할 수 없습니다.";
      }
      taskCheckboxes.forEach((checkbox) => {
        checkbox.closest(".task-item").classList.toggle("is-complete", checkbox.checked);
        checkbox.addEventListener("change", () => {
          const completed = getCompletedTaskCount();
          if (taskStorageAvailable) {
            try {
              window.localStorage.setItem(taskStorageKey, JSON.stringify({
                date: getTaskDateKey(),
                completed: taskCheckboxes.map((item) => item.checked)
              }));
            } catch {
              taskStorageAvailable = false;
              taskStatus.textContent = "업무 진행 상황을 저장할 수 없습니다. 브라우저 저장 공간을 확인해 주세요.";
            }
          }
          checkbox.closest(".task-item").classList.toggle("is-complete", checkbox.checked);
          updateTaskProgress();
          updateSupplyRequests();
          updateSupplyStatus();
          updateVitals();
          if (checkbox.checked && completed === taskCheckboxes.length) {
            showToast("오늘 할 일 끝!");
          }
        });
      });
      supplyRequestButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const category = button.closest(".resource-row").dataset.supplyCategory;
          const requestCount = supplyRequestCounts.get(category) || 0;
          if (requestCount >= 2) {
            showToast(`${category} 오늘 요청 횟수(2회)를 모두 사용했습니다.`);
            return;
          }
          const now = Date.now();
          supplyRequestCounts.set(category, requestCount + 1);
          supplyRequests.set(category, {
            status: "requested",
            approver: chooseSupplyApprover(),
            requestedAt: now,
            approvalReadyAt: now + supplyApprovalDelayMs
          });
          saveSupplyRequests();
          updateSupplyRequests();
          showToast(`${category} 보급 요청 등록 · 승인 대기 중`);
          addLog("보급 요청", `${category} 요청 접수 · 승인 대기`, "note");
        });
      });
      supplyRows.forEach((row) => {
        const category = row.dataset.supplyCategory;
        row.querySelector(".supply-approve-button").addEventListener("click", (event) => {
          const request = supplyRequests.get(category);
          const approvalReady = request && request.status === "requested"
            && Date.now() >= request.approvalReadyAt;
          if (!approvalReady) return;
          request.status = "acknowledged";
          request.approvalConfirmedAt = Date.now();
          request.convoyReadyAt = request.approvalConfirmedAt + supplyConvoyDelayMs;
          saveSupplyRequests();
          updateSupplyRequests();
          showToast(`${category} 불출 승인 확인 · 수색팀 복귀 시작`);
          addLog("보급 승인 확인", `${category} 승인 확인 · 수색팀 복귀 시작`, "note");
        });
        row.querySelector(".supply-receive-button").addEventListener("click", (event) => {
          const request = supplyRequests.get(category);
          const convoyReady = request && request.status === "acknowledged"
            && Date.now() >= request.convoyReadyAt;
          if (!convoyReady) return;
          const receiveButton = event.currentTarget;
          receiveButton.disabled = true;
          row.classList.add("is-scanning");
          row.querySelector(".supply-request-state").textContent = "전술 단말기 인증 중 · 화물 바코드 스캔";
          window.setTimeout(() => {
            request.status = "received";
            request.receivedAt = Date.now();
            request.receivedItem = row.dataset.delivery;
            supplyDeliveredCounts.set(category, (supplyDeliveredCounts.get(category) || 0) + 1);
            saveSupplyRequests();
            row.classList.remove("is-scanning");
            updateSupplyRequests();
            updateSupplyStatus();
            showToast(`[보급 완료] ${request.receivedItem} 거점 창고 적재 완료`);
            addLog("보급 완료", `${request.receivedItem} 거점 창고 적재 완료`, "note");
          }, 1400);
        });
      });
      updateTaskProgress();
      updateSupplyRequests();
      updateSupplyStatus();
      updateVitals();
      window.setInterval(() => updateSupplyRequests(), 1000);
      dutyStatusTrigger.addEventListener("click", () => dutyDialog.showModal());
      document.getElementById("duty-dialog-close").addEventListener("click", () => dutyDialog.close());
      dutyDialog.addEventListener("click", (event) => {
        if (event.target === dutyDialog) dutyDialog.close();
      });
      dutyDialog.addEventListener("close", () => dutyStatusTrigger.focus());
      dutyDialog.querySelector(".duty-link").addEventListener("click", () => dutyDialog.close());

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
        const now = new Date();
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const threeHoursTwentyMinutesAgo = new Date(now.getTime() - (3 * 60 + 20) * 60 * 1000);
        const hourText = (date) => `${date.getHours()}시`;
        const timeText = (date) => `${date.getHours()}시 ${date.getMinutes()}분`;
        const startupMessageSets = [
          [
            { sender: "김영후 중사", text: `${hourText(threeHoursAgo)} 이후로 강석찬 본 사람 보고해.` },
            { sender: "민서진 중사", text: "상황실에 없냐?" },
            { sender: "방진호 하사", text: `${timeText(threeHoursTwentyMinutesAgo)}경 의무실로 방향으로 가는 거 봤습니다.` },
            { sender: "김영후 중사", text: "부상이거나 아픈 거면 제때 보고해." }
          ],
          [
            { sender: "김영후 중사", text: `${window.playerName || "막내"} 위치 보고 해` },
            { sender: "민서진 중사", text: "왜 막내만 부르시나? 너네끼리 몰래 뭐 먹지마라." },
            { sender: "강석찬 하사", text: "김 중사님이 민 중사님처럼은 안 하십니다..." },
            { sender: "민서진 중사", text: "야 강 하사 지금 어디냐?" }
          ]
        ];
        const messages = startupMessageSets[Math.floor(Math.random() * startupMessageSets.length)];
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
            avatar.textContent = message.sender === "SYSTEM" ? "SYS" : message.sender.slice(0,1);
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
        const delay = 180000 + Math.random() * 100000;
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

      document.querySelectorAll("[data-view]").forEach((button) => {
        button.addEventListener("click", () => {
          const view = button.dataset.view;
          const currentView = document.querySelector(".view-panel.active");
          if (currentView?.id === "view-bulletin" && view !== "bulletin") lockBulletinBoard();
          document.querySelectorAll(".nav-button").forEach((item) => {
            if (item.dataset.view === view) item.setAttribute("aria-current", "page");
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
        updateVitals();
        addLog("SYSTEM", `경계 단계를 ${alertLevel}단계로 변경`);
        showToast(`경계 단계 ${alertLevel}`);
      });

      selectZone(selectedZone);
      selectRoom(activeRoom);
      updateClock();
      lastCheck.textContent = timeNow().slice(0, 5);
      window.setInterval(updateClock, 1000);
    })();

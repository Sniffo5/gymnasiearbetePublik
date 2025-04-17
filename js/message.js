const { v4: uuidv4 } = require("uuid");
const escape = require("escape-html");
const { query } = require("./database.js");
const { render } = require("../utils.js");
const fs = require("fs");

async function message(req, res) {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }

  const id = req.params.id; 
  const userId = req.session.userId;
  const username = escape(req.session.username);

  try {
   
    let [conversation] = await query(
      `
            SELECT c.id, c.name, c.type
            FROM conversations c
            WHERE c.id = ?
        `,
      [id]
    );

    if (conversation) {
      members = await query(
        `
            SELECT cm.user_id 
            FROM conversation_members cm
            WHERE cm.conversation_id = ?
        `,
        [conversation.id]
      );

      let memberOfConversation = false;

      console.log("members: ", JSON.stringify(members) + " userId: " + userId);

      for (let i = 0; i < members.length; i++) {
        console.log(
          JSON.stringify(members[i]) +
            " userId: " +
            JSON.stringify(members[i].user_id)
        );

        if (members[i].user_id == userId) {
          memberOfConversation = true;
          console.log(" User found");
        }
      }

      if (memberOfConversation !== true) {
        return res.redirect("/");
      }
    }

    if (!conversation) {

      const otherUserId = id;

      [conversation] = await query(
        `
                SELECT c.id, c.name, c.type
                FROM conversations c
                JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
                JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
                WHERE c.type = 'private'
            `,
        [userId, otherUserId]
      );

      if (!conversation) {
       
        const [otherUser] = await query(
          `
                    SELECT username
                    FROM users
                    WHERE id = ?
                `,
          [otherUserId]
        );

        if (!otherUser) {
          return res.send(render("Användaren finns inte."));
        }

        const conversationId = uuidv4();
        const conversationName = escape(otherUser.username);

        await query(
          `
                    INSERT INTO conversations (id, name, type)
                    VALUES (?, ?, 'private')
                `,
          [conversationId, conversationName]
        );

        await query(
          `
                    INSERT INTO conversation_members (id, conversation_id, user_id, role)
                    VALUES (?, ?, ?, 'member'), (?, ?, ?, 'member')
                `,
          [
            uuidv4(),
            conversationId,
            userId,
            uuidv4(),
            conversationId,
            otherUserId,
          ]
        );

        conversation = {
          id: conversationId,
          name: conversationName,
          type: "private",
        };
      }
    }

    if (conversation) {
        return res.send(
          render(
            await renderChat(conversation, userId, username, req.session.profilePicture)
          )
        );
      }
   
  } catch (error) {
    console.error("Error handling conversation:", error);
    res.send(render("Ett fel uppstod vid hantering av konversation."));
  }
}

async function renderChat(conversation, userId, username, profilePicture) {
    const messages = await query(
      `
        SELECT m.id, m.message, m.sent_at, u.username, u.profile_picture
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.sent_at ASC
      `,
      [conversation.id]
    );
  
    const reactions = await query(
      `
        SELECT r.message_id, r.reaction, GROUP_CONCAT(u.username) AS users, COUNT(*) AS count
        FROM message_reactions r
        JOIN users u ON r.user_id = u.id
        WHERE r.message_id IN (SELECT id FROM messages WHERE conversation_id = ?)
        GROUP BY r.message_id, r.reaction
      `,
      [conversation.id]
    );
  
    let displayName = conversation.name;
    let otherUserProfilePicture = "/images/default_pfp.jpg";
  
    if (conversation.type === "private") {
      const [otherUser] = await query(
        `
          SELECT u.username, u.profile_picture
          FROM conversation_members cm
          JOIN users u ON cm.user_id = u.id
          WHERE cm.conversation_id = ? AND u.id != ?
        `,
        [conversation.id, userId]
      );
  
      if (otherUser) {
        displayName = otherUser.username;
        otherUserProfilePicture = otherUser.profile_picture || "/images/default_pfp.jpg";
      }
    }
  
   
    let chatHtml = fs.readFileSync("html/chat.html").toString();
  

    chatHtml = chatHtml.replace(
      '<div id="chat">',
      `<h2 class="name">${escape(displayName)}</h2><div id="chat">`
    );
  
    let messagesHtml = "";
  
    for (let msg of messages) {
      const messageClass = msg.username === username ? "message-self" : "message-other";
      const messageId = msg.id;
  
      let menuItems =
        '<button class="message-menu-item" data-action="react">' +
        '<span class="message-menu-icon icon-reaction"></span>' +
        "React" +
        "</button>";
  
      if (msg.username === username) {
        menuItems +=
          '<button class="message-menu-item" data-action="edit">' +
          '<span class="message-menu-icon icon-edit"></span>' +
          "Edit" +
          "</button>" +
          '<button class="message-menu-item delete" data-action="delete">' +
          '<span class="message-menu-icon icon-delete"></span>' +
          "Delete" +
          "</button>";
      }
  
      const messageReactions = reactions.filter((r) => r.message_id === msg.id);
      const reactionsHtml = messageReactions
        .map((r) => {
          const userNames = r.users
            ? r.users
                .split(",")
                .map((user) => escape(user))
                .join(", ")
            : "";
          return `
            <button class="reaction-container" data-emoji="${r.reaction}" title="${userNames}">
              <span class="reaction">${r.reaction}</span>
              <span class="reaction-count">${r.count}</span>
            </button>
          `;
        })
        .join("");
  
      messagesHtml += `
        <div class="message-container ${messageClass}" data-id="${messageId}">
          <div class="message-content-wrapper">
            <img src="${msg.profile_picture}" alt="${escape(msg.username)}" class="message-avatar">
            <div class="message-bubble">${msg.message}</div>
            <button class="message-menu-button" aria-label="Message options">
              <span class="icon-dots"></span>
            </button>
          </div>
          <div class="reactions">${reactionsHtml}</div>
          <div class="message-info">
            <span class="message-sender">${escape(msg.username)}</span>
            <span class="message-time">${new Date(msg.sent_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
          <div class="message-menu">${menuItems}</div>
        </div>
      `;
    }
  

    chatHtml = chatHtml.replace(
      '<div id="messages" class="hidden">',
      '<div id="messages" class="hidden">' + messagesHtml
    );
  
    const [membership] = await query(
      `
        SELECT pending
        FROM conversation_members
        WHERE conversation_id = ? AND user_id = ?
      `,
      [conversation.id, userId]
    );
  
    if (membership && membership.pending === 1) {
      chatHtml += `
        <script>
          document.getElementById("input").disabled = true;
          document.getElementById("send-button").disabled = true;
        </script>
        <div class="pending-conversation">
          <form action="/accept-conversation" method="POST">
            <input type="hidden" name="conversationId" value="${conversation.id}">
            <button type="submit">Accept</button>
          </form>
          <form action="/decline-conversation" method="POST">
            <input type="hidden" name="conversationId" value="${conversation.id}">
            <button type="submit">Decline</button>
          </form>
        </div>
      `;
    }
  
  
    chatHtml += `
      <script>
        const loggedInUsername = "${escape(username)}";
        const conversationId = "${conversation.id}";
        const loggedInPfp = "${profilePicture}";
        const otherUserPfp = "${otherUserProfilePicture}";
      </script>
    `;
  
    return chatHtml;
  }

module.exports = { message };

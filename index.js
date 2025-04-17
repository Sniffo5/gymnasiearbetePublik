const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const escape = require("escape-html");
const socketIo = require("socket.io");
const validator = require("validator");
require("dotenv").config();

const { render, funnyGenerate } = require("./utils.js");
const { showLogin, login, showRegister, register } = require("./js/auth.js");
const { query, closePool } = require("./js/database.js");
const { createServer } = require("http");
const { message } = require("./js/message.js");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("client"));
app.use(express.static("public"));
app.use(express.static("images"));

const server = createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const sessionMiddleware = session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
  },
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

app.get("/", getConversations);
app.get("/login", showLogin);
app.post("/login", login);
app.post("/register", register);
app.get("/register", showRegister);
app.get("/message/:id", message);
app.get("/funny", funny);
app.get("/test", test);

io.on("connection", handleConnection);

function handleConnection(socket) {
  const session = socket.request.session;

  socket.on("join", (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${session.userId} joined conversation ${conversationId}`);
  });

  socket.on("chat", async (data) => {
    if (!data.msg || !validator.isLength(data.msg, { min: 1, max: 500 }))
      return;
    const sanitizedMessage = escape(data.msg);
    try {
      let messageId = uuidv4();
      await query(
        `
                    INSERT INTO messages (id, conversation_id, sender_id, message, message_type)
                    VALUES (?, ?, ?, ?, 'text')
                `,
        [messageId, data.conversationId, session.userId, sanitizedMessage]
      );
      io.to(data.conversationId).emit("chat", {
        senderId: session.userId,
        message: sanitizedMessage,
        messageId: messageId,
        username: session.username,
        profilePicture: session.profilePicture,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("deleteMessage", async (data) => {
    try {
      const { messageId } = data;

      const [message] = await query(
        `
                    SELECT m.sender_id, m.conversation_id 
                    FROM messages m
                    WHERE id = ?
                `,
        [messageId]
      );

      if (!message || session.userId !== message.sender_id) {
        return;
      }

      await query(`DELETE FROM messages WHERE id = ?`, [messageId]);

      io.to(message.conversation_id).emit("deleteMessage", { messageId });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });

  const approvedReactions = ["👍", "❤️", "😂", "😮", "😢", "👏"];

  socket.on("react", async (data) => {
    const { emoji, messageId, conversationId } = data;

    if (!emoji || !messageId || !session.userId || !session.username) {
      console.error("Missing parameters for react:", {
        emoji,
        messageId,
        userId: session.userId,
        username: session.username,
      });
      return;
    }

    const reactionId = uuidv4();

    try {
      const [existingReaction] = await query(
        `
                    SELECT id FROM message_reactions
                    WHERE message_id = ? AND user_id = ? AND reaction = ?
                `,
        [messageId, session.userId, emoji]
      );

      if (existingReaction) {
        console.error("Reaction already exists:", {
          emoji,
          messageId,
          userId: session.userId,
        });
        return;
      }

      await query(
        `
                    INSERT INTO message_reactions (id, message_id, user_id, reaction)
                    VALUES (?, ?, ?, ?)
                `,
        [reactionId, messageId, session.userId, emoji]
      );

      io.to(conversationId).emit("react", {
        reactionId,
        messageId,
        userId: session.userId,
        username: session.username,
        emoji,
      });
    } catch (error) {
      console.error("Error saving reaction:", error);
    }
  });

  socket.on("deleteReaction", async (data) => {
    const { emoji, messageId, conversationId } = data;

    if (!emoji || !messageId || !session.userId) {
      console.error("Missing parameters for deleteReaction:", {
        emoji,
        messageId,
        userId: session.userId,
      });
      return;
    }

    try {
      const [reaction] = await query(
        `
                    SELECT id, user_id, message_id, reaction
                    FROM message_reactions
                    WHERE message_id = ? AND user_id = ? AND reaction = ?
                `,
        [messageId, session.userId, emoji]
      );

      if (!reaction) {
        console.error("Reaction not found for deletion:", {
          emoji,
          messageId,
          userId: session.userId,
        });
        return;
      }

      await query(`DELETE FROM message_reactions WHERE id = ?`, [reaction.id]);

      io.to(conversationId).emit("deleteReaction", {
        reactionId: reaction.id,
        messageId: reaction.message_id,
        emoji: emoji,
        username: session.username, // Include username for client-side updates
      });
    } catch (error) {
      console.error("Error deleting reaction:", error);
    }
  });

  socket.on("editMessage", async (data) => {
    const { messageId, newMessage, conversationId } = data;

    if (!messageId || !newMessage || !session.userId) {
      console.error("Missing parameters for editMessage:", {
        messageId,
        newMessage,
        userId: session.userId,
      });
      return;
    }

    try {
      const [message] = await query(
        `
                    SELECT sender_id, conversation_id 
                    FROM messages 
                    WHERE id = ?
                `,
        [messageId]
      );

      if (!message || session.userId !== message.sender_id) {
        return;
      }

      await query(
        `
                    UPDATE messages 
                    SET message = ? 
                    WHERE id = ?
                `,
        [newMessage, messageId]
      );

      io.to(conversationId).emit("editMessage", {
        messageId,
        newMessage,
        username: session.username,
      });
    } catch (error) {
      console.error("Error editing message:", error);
    }
  });

  socket.on("createConversation", async (data) => {
    if (!session.loggedIn) {
      res.redirect("/login");
      return;
    }

    const { users, conversationName } = data;

    if (!Array.isArray(users) || users.length === 0) {
      socket.emit("createConversation", { error: "Invalid user selection." });
      return;
    }

    try {
      const creatorId = session.userId;

      if (!users.includes(creatorId)) {
        users.push(creatorId);
      }

      let conversationId;

      if (users.length === 2) {
        const [existingConversation] = await query(
          `
          SELECT c.id
          FROM conversations c
          JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
          JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
          WHERE c.type = 'private'
          `,
          [creatorId, users.find((userId) => userId !== creatorId)]
        );

        if (existingConversation) {
          conversationId = existingConversation.id;
        } else {
          conversationId = uuidv4();
          await query(
            `
            INSERT INTO conversations (id, name, type)
            VALUES (?, 'private', 'private')
            `,
            [conversationId]
          );

          await query(
            `
            INSERT INTO conversation_members (id, conversation_id, user_id, role, pending)
            VALUES (?, ?, ?, 'member', 0), (?, ?, ?, 'member', 1)
            `,
            [
              uuidv4(),
              conversationId,
              creatorId,
              uuidv4(),
              conversationId,
              users.find((userId) => userId !== creatorId),
            ]
          );
        }
      } else {
        conversationId = uuidv4();
        await query(
          `
          INSERT INTO conversations (id, name, type)
          VALUES (?, ?, 'group')
          `,
          [conversationId, escape(conversationName)]
        );

        const memberValues = users
          .map((userId) =>
            userId === creatorId
              ? `('${uuidv4()}', '${conversationId}', '${userId}', 'member', 0)`
              : `('${uuidv4()}', '${conversationId}', '${userId}', 'member', 1)`
          )
          .join(", ");

        await query(
          `
          INSERT INTO conversation_members (id, conversation_id, user_id, role, pending)
          VALUES ${memberValues}
          `
        );
      }

      users.forEach((userId) => {
        socket.to(userId).emit("join", conversationId);
      });

      socket.emit("createConversation", { conversationId });
    } catch (error) {
      console.error("Error creating conversation:", error);
      socket.emit("createConversation", {
        error: "An error occurred while creating the conversation.",
      });
    }
  });
}

function funny(req, res) {
  res.send(render(funnyGenerate()));
}

async function test(req, res) {
  try {
    const results = await query(
      "SELECT * FROM `users` where id = '13b2735a-1f36-419b-90fd-ea98b5c31443';"
    );

    if (results) {
      res.send(render(JSON.stringify(results[1])));
    }
  } catch (error) {
    res.send(render("Error: " + error.message));
  }
}

async function getConversations(req, res) {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.userId;

    const conversations = await query(
      `
          SELECT c.id, c.name, c.type
          FROM conversations c
          JOIN conversation_members cm ON c.id = cm.conversation_id
          WHERE cm.user_id = ? AND cm.pending = 0
        `,
      [userId]
    );

    const pendingConversations = await query(
      `
          SELECT c.id, c.name, c.type
          FROM conversations c
          JOIN conversation_members cm ON c.id = cm.conversation_id
          WHERE cm.user_id = ? AND cm.pending = 1
        `,
      [userId]
    );

    let html = `<div class="users">`;

    html += `<h3>Konversationer</h3>`;
    for (let convo of conversations) {
      let displayName = "Unknown Conversation";
      let profilePicture = "/images/default_pfp.jpg";
      let latestMessage = "No messages yet";

      if (convo.type === "private") {
        const [otherUser] = await query(
          `
              SELECT u.username, u.profile_picture
              FROM conversation_members cm
              JOIN users u ON cm.user_id = u.id
              WHERE cm.conversation_id = ? AND u.id != ?
            `,
          [convo.id, userId]
        );

        if (otherUser) {
          displayName = otherUser.username;
          profilePicture =
            otherUser.profile_picture || "/images/default_pfp.jpg";
        }
      } else if (convo.type === "group") {
        displayName = convo.name;
        profilePicture = "/images/group_pfp.jpg";
      }

      const [message] = await query(
        `
            SELECT message
            FROM messages
            WHERE conversation_id = ?
            ORDER BY sent_at DESC
            LIMIT 1
          `,
        [convo.id]
      );

      if (message) {
        latestMessage = message.message;
      }

      html += `
          <a href="/message/${convo.id}" class="user">
            <img src="${profilePicture}" alt="PFP" width="50" height="50">
            <span>${displayName}</span>
            <p>${latestMessage}</p>
          </a>
        `;
    }

    html += `</div>`;

    html += `<h3>Väntande konversationer</h3><div class="users">`;
    for (let convo of pendingConversations) {
      let displayName = "Unknown Conversation";
      let profilePicture = "/images/default_pfp.jpg";
      let latestMessage = "No messages yet";

      if (convo.type === "private") {
        const [otherUser] = await query(
          `
              SELECT u.username, u.profile_picture
              FROM conversation_members cm
              JOIN users u ON cm.user_id = u.id
              WHERE cm.conversation_id = ? AND u.id != ?
            `,
          [convo.id, userId]
        );

        if (otherUser) {
          displayName = otherUser.username;
          profilePicture =
            otherUser.profile_picture || "/images/default_pfp.jpg";
        }
      } else if (convo.type === "group") {
        displayName = convo.name;
        profilePicture = "/images/group_pfp.jpg";
      }

      const [message] = await query(
        `
            SELECT message
            FROM messages
            WHERE conversation_id = ?
            ORDER BY sent_at DESC
            LIMIT 1
          `,
        [convo.id]
      );

      if (message) {
        latestMessage = message.message;
      }

      html += `
  <div class="user pending">
    <img src="${profilePicture}" alt="PFP" width="50" height="50">
    <span>${displayName}</span>
    <p>${latestMessage}</p>
    <div class="actions">
      <a href="/message/${convo.id}">View</a>
      <form action="/decline-conversation" method="POST" style="display:inline;">
        <input type="hidden" name="conversationId" value="${convo.id}">
        <button type="submit">Decline</button>
      </form>
      <form action="/accept-conversation" method="POST" style="display:inline;">
        <input type="hidden" name="conversationId" value="${convo.id}">
        <button type="submit">Accept</button>
      </form>
    </div>
  </div>
`;
    }

    html += `</div>`;

    html += await getConversationForm();
    res.send(render(html));
  } catch (error) {
    console.error("Error fetching conversations or users:", error);
    res.send(
      render("Ett fel uppstod vid hämtning av konversationer eller användare.")
    );
  }
}

async function getConversationForm() {
  try {
    const users = await query("SELECT id, username FROM users");

    const userCheckboxes = users
      .map(
        (user) => `
      <div class="user-item">
        <label>
          <input type="checkbox" name="users" value="${user.id}" />
          ${user.username}
        </label>
      </div>
    `
      )
      .join("");

    return `
    <div class="form-container">
      <h2>Create Conversation</h2>
      <form id="conversationForm">
        <input type="text" id="searchInput" placeholder="Search users..." class="search-input" />
  
        <div id="userList" class="user-list">
          ${userCheckboxes}
        </div>
  
        <div id="conversationNameGroup" class="form-group hidden">
          <input type="text" id="conversationName" name="conversationName" class="search-input" />
          <label for="conversationName">Conversation Name:</label>
        </div>
  
        <button type="submit" id="conversationCreatorButton">Create</button>
      </form>
    </div>
  
    `;
  } catch (error) {
    console.error("Error fetching users: ", error);
  }
}

app.post("/decline-conversation", async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }

  const { conversationId } = req.body;
  const userId = req.session.userId;

  try {
    await query(
      `
          DELETE FROM conversation_members
          WHERE conversation_id = ? AND user_id = ?
        `,
      [conversationId, userId]
    );

    res.redirect("/");
  } catch (error) {
    console.error("Error declining conversation:", error);
    res.send(render("Ett fel uppstod vid att avböja konversationen."));
  }
});

app.post("/accept-conversation", async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }

  const { conversationId } = req.body;
  const userId = req.session.userId;

  try {
    await query(
      `
          UPDATE conversation_members
          SET pending = 0
          WHERE conversation_id = ? AND user_id = ?
        `,
      [conversationId, userId]
    );

    res.redirect("/");
  } catch (error) {
    console.error("Error accepting conversation:", error);
    res.send(render("Ett fel uppstod vid att acceptera konversationen."));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
  console.log(Date());
});

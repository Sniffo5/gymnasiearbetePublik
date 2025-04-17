const fs = require("fs");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../js/database.js");
const { render } = require("../utils.js");

function showLogin(req, res) {
  const html = fs.readFileSync("html/loginForm.html").toString();
  res.send(render(html));
}

async function login(req, res) {
  const data = req.body;

  try {
    const [user] = await query("SELECT * FROM users WHERE username = ?", [
      data.username,
    ]);

    if (!user) {
      return res.redirect("/login");
    }

    const check = await bcrypt.compare(data.password, user.password);

    if (!check) {
      return res.redirect("/login");
    }

    req.session.email = user.email;
    req.session.loggedIn = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.profilePicture = user.profile_picture;

    console.log("Inloggad, username: " + req.session.username);

    console.log("Session after login:", req.session);

    res.redirect("/");
  } catch (error) {
    console.error("Error logging in:", error);
    res.send(render("Ett fel uppstod vid inloggning. Försök igen senare."));
  }
}

function showRegister(req, res) {
  const html = fs.readFileSync("html/registerForm.html").toString();
  res.send(render(html));
}

async function register(req, res) {
  let data = req.body;

  if (!validator.isEmail(data.email) || data.password.trim() === "") {
    return res.redirect("/register");
  }
  if (
    data.username.trim() === "" ||
    data.username.length < 3 ||
    data.username.length > 20
  ) {
    return res.redirect("/register");
  }

  try {
    data.password = await bcrypt.hash(data.password, 12);
    data.id = uuidv4();

    await query(
      "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)",
      [data.id, data.username.trim(), data.email, data.password]
    );

    req.session.email = data.email;
    req.session.loggedIn = false;
    req.session.userId = data.id;
    req.session.username = data.username;

    res.redirect("/login");
  } catch (error) {
    console.error("Error registering user:", error);
    res.send(render("Ett fel uppstod vid registrering. Försök igen senare."));
  }
}

module.exports = { showLogin, login, showRegister, register };

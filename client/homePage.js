var socketClient = io("https://tjatta.xyz");
const searchInput = document.getElementById("searchInput");
const userList = document.getElementById("userList");
const conversationNameGroup = document.getElementById("conversationNameGroup");

function filterUsers() {
  const filter = searchInput.value.toLowerCase();
  const items = userList.querySelectorAll(".user-item");
  items.forEach((item) => {
    const name = item.textContent.toLowerCase();
    item.style.display = name.includes(filter) ? "" : "none";
  });
}

function updateConversationNameVisibility() {
  const selected = userList.querySelectorAll("input[type='checkbox']:checked");
  conversationNameGroup.classList.toggle("hidden", selected.length <= 1);
}

searchInput.addEventListener("input", filterUsers);
userList.addEventListener("change", updateConversationNameVisibility);

const conversationForm = document.getElementById("conversationForm");
const conversationCreatorButton = document.getElementById(
  "conversationCreatorButton"
);

conversationForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const selectedUsers = Array.from(
    document.querySelectorAll("input[name='users']:checked")
  ).map((checkbox) => checkbox.value);

  const conversationName = document
    .getElementById("conversationName")
    .value.trim();

  if (selectedUsers.length === 0) {
    alert("Välj minst en användare.");
    return;
  }

  socketClient.emit("createConversation", {
    users: selectedUsers,
    conversationName: selectedUsers.length > 1 ? conversationName : null,
  });
});

socketClient.on("createConversation", (data) => {
  if (data.error) {
    alert(data.error);
    return;
  }

  window.location.href = `/message/${data.conversationId}`;
});

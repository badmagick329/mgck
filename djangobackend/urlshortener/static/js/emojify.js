function main() {
  const defaultEmojis = [
    "😫",
    "😃",
    "😭",
    "🥰",
    "😍",
    "🤓",
    "🤯",
    "😯",
    "🫣",
    "😤",
    "😳",
    "😬",
    "🙄",
    "💃",
    "💅",
    "👀",
    "🔥",
    "🤪",
    "😑",
  ];
  const msgInput = document.querySelector("#message-input");
  const emojisInput = document.querySelector("#emojis-input");
  const msgOutput = document.querySelector("#message-output");
  const refreshBtn = document.querySelector("#refresh-emojis");
  const resetBtn = document.querySelector("#reset-emojis");
  const copyBtn = document.querySelector("#copy-message");
  // Look for stored emojis
  let storedEmojis = localStorage.getItem("emojis");
  if (storedEmojis) {
    emojisInput.value = storedEmojis;
  } else {
    emojisInput.value = defaultEmojis.join(" ");
  }
  // Listeners
  msgInput.addEventListener("input", () => {
    updateOutput(msgInput, emojisInput, msgOutput);
  });
  emojisInput.addEventListener("input", () => {
    localStorage.setItem("emojis", emojisInput.value);
    updateOutput(msgInput, emojisInput, msgOutput);
    updateSize(emojisInput, 100);
  });
  refreshBtn.addEventListener("click", () => {
    updateOutput(msgInput, emojisInput, msgOutput);
  });
  resetBtn.addEventListener("click", () => {
    emojisInput.value = defaultEmojis.join(" ");
    localStorage.setItem("emojis", emojisInput.value);
    updateOutput(msgInput, emojisInput, msgOutput);
  });
  // Handle Copying
  let copyListening = true;
  copyBtn.addEventListener("click", () => {
    if (!copyListening) {
      return;
    }
    copyToClipboard(msgOutput.textContent);
    copyListening = false;
    setTimeout(() => {
      copyBtn.textContent = "Copied ✅";
    }, 100);
    setTimeout(() => {
      copyBtn.textContent = "Copy 📋";
      copyListening = true;
    }, 1000);
  });
  updateOutput(msgInput, emojisInput, msgOutput);
  updateSize(emojisInput, 100);
}

function choose(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

function emojify(msg, emojis) {
  let words = msg.split(" ");
  let emojisList = [];
  let wordsList = [];
  let splitEmojis = emojis.split(" ");
  for (let i = 0; i < splitEmojis.length; i++) {
    if (splitEmojis[i].trim() === "") {
      continue;
    }
    emojisList.push(splitEmojis[i]);
  }
  for (let i = 0; i < words.length; i++) {
    if (words[i].trim() === "") {
      continue;
    }
    wordsList.push(words[i]);
  }
  let newMsg = "";
  for (let i = 0; i < wordsList.length; i++) {
    newMsg += wordsList[i] + " " + choose(emojisList) + " ";
  }
  return newMsg;
}

function updateOutput(msgInput, emojisInput, msgOutput) {
  if (msgInput.value.trim() === "") {
    msgOutput.textContent = "Your Emojified Message Will Appear Here";
    return;
  }
  msgOutput.textContent = emojify(msgInput.value, emojisInput.value);
}

function updateSize(element, maxHeight) {
  element.style.height = "";
  element.style.height = `${Math.min(element.scrollHeight + 5, maxHeight)}px`;
}

async function copyToClipboard(textToCopy) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(textToCopy);
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "absolute";
    textArea.style.left = "-999999px";
    document.body.prepend(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (error) {
      console.error(error);
    } finally {
      textArea.remove();
    }
  }
}

document.addEventListener("DOMContentLoaded", main);

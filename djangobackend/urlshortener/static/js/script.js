let modal = document.querySelector("#video-modal");
let overlay = document.querySelector(".overlay");

function main() {
  overlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
  let openModalBtns = document.querySelectorAll(".btn-open");
  for (let i = 0; i < openModalBtns.length; i++) {
    openModalBtns[i].addEventListener("click", openModal);
  }
  const modalObs = new MutationObserver(modalObserver);
  modalObs.observe(modal, { childList: true });

  window.addEventListener("beforeunload", function (e) {
    window.scrollTo(0, 0);
  });
}

const closeModal = function () {
  modal.innerHTML = "";
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
};

const openModal = function () {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
};

const resizeVideo = function () {
  const video = document.querySelector("#video-player");
  if (!video) return false;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  video.addEventListener("loadedmetadata", function () {
    const naturalWidth = video.videoWidth || video.width;
    const naturalHeight = video.videoHeight || video.height;
    const widthScaleFactor = windowWidth / naturalWidth;
    let heightScaleFactor = windowHeight / naturalHeight;
    if (naturalHeight > naturalWidth * 1.3) {
      heightScaleFactor = heightScaleFactor * 0.4;
    }
    const scaleFactor = Math.min(widthScaleFactor, heightScaleFactor);
    const newWidth = naturalWidth * scaleFactor * 0.85;
    const newHeight = naturalHeight * scaleFactor * 0.85;
    video.style.width = `${newWidth}px`;
    video.style.height = `${newHeight}px`;
  });
  return true;
};

const modalObserver = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      const result = resizeVideo();
      if (result === true) {
        openModal();
      } else {
      }
      break;
    }
  }
};

document.addEventListener("DOMContentLoaded", main);

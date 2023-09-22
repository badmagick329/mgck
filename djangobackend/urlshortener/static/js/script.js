let modal = document.querySelector("#video-modal");
let overlay = document.querySelector(".overlay");

function main() {
  if (overlay === null || modal === null) {
    return;
  }
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
  let clearImgurFields = document.querySelector("#clear-imgur-fields");
  if (clearImgurFields) {
    clearImgurFields.addEventListener("click", function () {
      let imgurFields = document.querySelectorAll(".imgur-form input");
      for (let i = 0; i < imgurFields.length; i++) {
        imgurFields[i].value = "";
      }
    });
  }
}

const closeModal = function () {
  modal.innerHTML = "";
  modal.classList.add("hidden");
  modal.classList.add("opacity-0");
  overlay.classList.add("hidden");
};

const openModal = function () {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  const video = document.querySelector("#video-player");
  if (video) {
    video.play();
  }
};

const resizeVideo = function () {
  const video = document.querySelector("#video-player");
  if (!video) return false;
  video.addEventListener("loadedmetadata", function () {
    const videoText = document.querySelector("#video-text");
    const videoTextHeight = videoText.clientHeight;
    const videoTags = document.querySelector("#video-tags");
    const videoTagsHeight = videoTags.clientHeight;
    const videoLinks = document.querySelector("#video-link");
    const videoLinksHeight = videoLinks.clientHeight;
    const containerWidth = modal.clientWidth;
    const marginPaddingBorder = 40;
    const containerHeight =
      (modal.clientHeight -
        videoTextHeight -
        videoTagsHeight -
        videoLinksHeight -
        marginPaddingBorder) *
      0.9;
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    let newWidth, newHeight;
    if (containerHeight < containerWidth) {
      newWidth = containerHeight * videoAspectRatio;
      newHeight = containerHeight;
      if (newWidth > containerWidth) {
        newWidth = containerWidth;
        newHeight = containerWidth / videoAspectRatio;
      }
    } else {
      newWidth = containerWidth;
      newHeight = containerWidth / videoAspectRatio;
      if (newHeight > containerHeight) {
        newWidth = containerHeight * videoAspectRatio;
        newHeight = containerHeight;
      }
    }
    video.style.width = `${newWidth}px`;
    video.style.height = `${newHeight}px`;
    modal.classList.remove("opacity-0");
  });
  return true;
};

const modalObserver = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      const result = resizeVideo();
      if (result === true) {
        openModal();
      }
      break;
    }
  }
};

document.addEventListener("DOMContentLoaded", main);

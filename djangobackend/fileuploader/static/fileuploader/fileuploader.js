(function () {
  const uploadForm = document.getElementById('fu-upload-form');
  if (!uploadForm) {
    return;
  }

  const submitButton = document.getElementById('fu-upload-submit');
  const cancelButton = document.getElementById('fu-upload-cancel');
  const fileInput = uploadForm.querySelector('input[type="file"]');
  const progressRoot = document.getElementById('fu-upload-progress');
  const progressBar = document.getElementById('fu-upload-bar');
  const progressPercent = document.getElementById('fu-upload-percent');
  const progressStatus = document.getElementById('fu-upload-status');

  if (!submitButton || !cancelButton || !fileInput || !progressRoot || !progressBar || !progressPercent || !progressStatus) {
    return;
  }

  const defaultButtonText = submitButton.textContent.trim();
  let activeRequest = null;

  function setUploadingState(isUploading) {
    submitButton.disabled = isUploading;
    submitButton.textContent = isUploading ? 'Uploading...' : defaultButtonText;
    submitButton.classList.toggle('opacity-70', isUploading);
    submitButton.classList.toggle('cursor-not-allowed', isUploading);
    cancelButton.classList.toggle('hidden', !isUploading);
  }

  function setProgress(percent, statusText) {
    const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
    progressRoot.classList.remove('hidden');
    progressBar.style.width = safePercent + '%';
    progressPercent.textContent = safePercent + '%';
    progressStatus.textContent = statusText;
  }

  function getErrorMessage(payload, fallback) {
    if (!payload) {
      return fallback;
    }
    if (payload.error_message) {
      return payload.error_message;
    }
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return payload.errors.join(' ');
    }
    return fallback;
  }

  uploadForm.addEventListener('submit', function (event) {
    event.preventDefault();

    if (activeRequest) {
      return;
    }

    if (!fileInput.files || fileInput.files.length === 0) {
      setProgress(0, 'Choose a file before uploading.');
      return;
    }

    const request = new XMLHttpRequest();
    const formData = new FormData(uploadForm);

    setUploadingState(true);
    setProgress(0, 'Starting upload...');
    activeRequest = request;

    request.open('POST', uploadForm.action, true);
    request.responseType = 'json';
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    request.upload.addEventListener('progress', function (progressEvent) {
      if (!progressEvent.lengthComputable) {
        setProgress(0, 'Uploading...');
        return;
      }

      const percent = (progressEvent.loaded / progressEvent.total) * 100;
      setProgress(percent, 'Uploading file...');
    });

    request.addEventListener('load', function () {
      const payload = request.response;
      activeRequest = null;

      if (request.status >= 200 && request.status < 300) {
        setProgress(100, payload?.message || 'Upload complete. Refreshing...');
        window.location.assign(payload?.redirect_url || window.location.href);
        return;
      }

      setUploadingState(false);
      setProgress(0, getErrorMessage(payload, 'Upload failed. Please try again.'));
    });

    request.addEventListener('error', function () {
      activeRequest = null;
      setUploadingState(false);
      setProgress(0, 'Upload failed because the network request did not complete.');
    });

    request.addEventListener('abort', function () {
      activeRequest = null;
      setUploadingState(false);
      fileInput.value = '';
      setProgress(0, 'Upload was cancelled.');
    });

    request.send(formData);
  });

  cancelButton.addEventListener('click', function () {
    if (!activeRequest) {
      return;
    }
    activeRequest.abort();
  });
})();

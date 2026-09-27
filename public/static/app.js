// MT Prompts - small client-side helpers (no framework, vanilla JS)

function copyPromptText(btn) {
  const box = document.getElementById('prompt-text-content')
  if (!box) return
  const text = box.innerText
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const original = btn.innerText
      btn.innerText = '✅ Copied!'
      btn.disabled = true
      setTimeout(() => {
        btn.innerText = original
        btn.disabled = false
      }, 1500)
    })
    .catch(() => {
      alert('Copy nahi ho paaya, text manually select karke copy karo.')
    })
}

function previewImage(inputEl, imgId) {
  const file = inputEl.files && inputEl.files[0]
  const img = document.getElementById(imgId)
  if (!file || !img) return
  const isVideo = file.type.startsWith('video/')
  const url = URL.createObjectURL(file)
  if (isVideo) {
    img.outerHTML = `<video id="${imgId}" src="${url}" controls style="max-height:220px;margin:10px auto 0;border-radius:10px;display:block;"></video>`
  } else {
    img.src = url
    img.style.display = 'block'
  }
  const label = document.getElementById(imgId + '-label')
  if (label) label.innerText = file.name
}

function bindUploadBox(boxId, inputId, previewId) {
  const box = document.getElementById(boxId)
  const input = document.getElementById(inputId)
  if (!box || !input) return
  box.addEventListener('click', () => input.click())
  input.addEventListener('change', () => previewImage(input, previewId))
}

document.addEventListener('DOMContentLoaded', () => {
  bindUploadBox('media-upload-box', 'media-input', 'preview-img')
  bindUploadBox('avatar-upload-box', 'avatar-input', 'avatar-preview-img')

  // simple client-side form submit disable to prevent double submit
  document.querySelectorAll('form[data-once]').forEach((form) => {
    form.addEventListener('submit', () => {
      const btn = form.querySelector('button[type=submit]')
      if (btn) {
        btn.disabled = true
        btn.dataset.original = btn.innerText
        btn.innerText = 'Please wait...'
      }
    })
  })
})

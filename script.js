let currentContent = '';
let currentFont = '';
let currentPadding = '';
let savedSelection = null;

const configMode = document.getElementById('configMode');
const displayMode = document.getElementById('displayMode');

const emojis = ['😀','😃','😄','😁','😊','😍','🥰','😘','😂','🤣','😉','😎','🤔','😐','😑','😶'];

function execCmd(command, value=null) {
  document.getElementById('editor').focus();
  document.execCommand(command, false, value);
}

function applyFont(font) {
  if(!font) return;
  document.getElementById('editor').style.fontFamily = font;
  document.getElementById('displayContent').style.fontFamily = font;
  currentFont = font;
}

function saveContent() {
  const content = document.getElementById('editor').innerHTML;
  document.getElementById('displayContent').innerHTML = content;
  configMode.style.display = 'none';
  displayMode.style.display = 'block';
}

function cancelEdit() {
  document.getElementById('editor').innerHTML = currentContent;
  configMode.style.display = 'none';
  displayMode.style.display = 'block';
}

// Emoji Picker
function initializeEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  picker.innerHTML = '';
  emojis.forEach(e=>{
    const btn = document.createElement('button');
    btn.className='emoji-btn';
    btn.textContent=e;
    btn.onclick=()=>insertEmoji(e);
    picker.appendChild(btn);
  });
}

function toggleEmojiPicker(event) {
  const picker = document.getElementById('emojiPicker');
  if(picker.classList.contains('active')) picker.classList.remove('active');
  else {
    const btn = event.target.closest('.toolbar-btn');
    const rect = btn.getBoundingClientRect();
    picker.style.top = (rect.bottom+4)+'px';
    picker.style.left = rect.left+'px';
    picker.classList.add('active');
  }
}

function insertEmoji(e) {
  document.execCommand('insertText', false, e);
  document.getElementById('emojiPicker').classList.remove('active');
  document.getElementById('editor').focus();
}

// Lien
function showLinkModal() {
  savedSelection = saveSelection();
  document.getElementById('linkModal').classList.add('active');
  document.getElementById('linkText').value='';
  document.getElementById('linkUrl').value='';
  const selection = window.getSelection();
  if(selection.toString()) document.getElementById('linkText').value = selection.toString();
}

function closeLinkModal() { document.getElementById('linkModal').classList.remove('active'); savedSelection=null; }

function saveSelection() {
  const sel = window.getSelection();
  if(sel.rangeCount) return sel.getRangeAt(0);
  return null;
}

function restoreSelection(range) {
  if(range) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function insertLink() {
  const text = document.getElementById('linkText').value.trim();
  let url = document.getElementById('linkUrl').value.trim();
  if(!text||!url) return;
  if(!/^https?:\/\//i.test(url)) url = 'https://'+url;
  const editor = document.getElementById('editor');
  editor.focus();
  if(savedSelection) restoreSelection(savedSelection);
  const link = `<a href="${url}" target="_blank">${text}</a>`;
  document.execCommand('insertHTML', false, link);
  closeLinkModal();
}

// Shortcuts
document.addEventListener('keydown', e=>{
  if(e.ctrlKey||e.metaKey){
    switch(e.key.toLowerCase()){
      case 'b': e.preventDefault(); execCmd('bold'); break;
      case 'i': e.preventDefault(); execCmd('italic'); break;
      case 'u': e.preventDefault(); execCmd('underline'); break;
    }
  }
});

window.addEventListener('load', initializeEmojiPicker);

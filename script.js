let currentContent = '';
const configMode = document.getElementById('configMode');
const displayMode = document.getElementById('displayMode');

// Emojis professionnels
let collapsibleDelegationAdded = false;

const emojis = [
  '😀', '😃', '😄', '😁', '😊', '😍', '🥰', '😘',
  '😂', '🤣', '😉', '😎', '🤔', '😐', '😑', '😶',
  '🙄', '😮', '😯', '😲', '😳', '🥺', '😢', '😭',
  '😤', '😠', '😡', '🤬', '😱', '😨', '😰', '😥',
  '🤝', '👍', '👎', '👏', '🙏', '💪', '✊', '👊',
  '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '💔',
  '📊', '📈', '📉', '💼', '🏢', '🏭', '🏗️', '⚙️',
  '🔧', '🔨', '🛠️', '📋', '📌', '📍', '📎', '✂️',
  '📁', '📂', '🗂️', '📅', '📆', '🗓️', '⏰', '⏱️',
  '✅', '❌', '⚠️', '⛔', '🚫', '💡', '🔔', '📢',
  '🎯', '🎓', '🏆', '🥇', '🥈', '🥉', '⭐', '✨',
  '🔍', '🔎', '📝', '✏️', '📧', '📨', '💬', '💭'
]

// Initialisation de Grist
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGrist);
} else {
  initGrist();
}

function initGrist() {

  grist.ready({
    requiredAccess: 'read table',
    onEditOptions: async () => {
      // Mode configuration
      configMode.style.display = 'block';
      displayMode.style.display = 'none';

      // Charger le contenu existant
      const options = await grist.getOptions();
      const savedContent = options?.content || '';
      const savedFont = options?.font || '';
      const savedPadding = options?.padding || '';

      document.getElementById('editor').innerHTML = savedContent;
      currentContent = savedContent;

      // Restaurer police et marges
      if (savedFont) {
        currentFont = savedFont;
        applyFont(savedFont);
      }

      if (savedPadding) {
        currentPadding = savedPadding;
        applyPadding(savedPadding);
      }

      initializeEmojiPicker();
    }
  });

  grist.onRecords(async (records) => {
    // Mode affichage
    if (configMode.style.display === 'none') {
      const options = await grist.getOptions();
      const content = options?.content || '<p>Cliquez sur "Ouvrir la configuration" pour éditer le texte.</p>';
      const savedFont = options?.font || '';
      const savedPadding = options?.padding || '';

      document.getElementById('displayContent').innerHTML = content;

      // Appliquer police et marges en mode affichage
      if (savedFont) {
        document.getElementById('displayContent').style.fontFamily = savedFont;
      }

      if (savedPadding) {
        let padding;
        switch (savedPadding) {
          case 'small': padding = '10px'; break;
          case 'medium': padding = '20px'; break;
          case 'large': padding = '40px'; break;
        }
        if (padding) {
          document.getElementById('displayContent').style.padding = padding;
        }
      }

    }
  });
}

// Commandes d'édition
function execCmd(command, value = null) {
  document.getElementById('editor').focus();
  document.execCommand(command, false, value);
}

// Gestion des liens
let savedSelection = null;

function showLinkModal() {
  savedSelection = saveSelection();

  const selection = window.getSelection();
  const range = selection.rangeCount ? selection.getRangeAt(0) : null;

  let existingLink = null;

  // Vérifier si la sélection est dans un <a>
  if (range) {
    let node = range.startContainer;
    while (node && node !== document) {
      if (node.tagName === 'A') {
        existingLink = node;
        break;
      }
      node = node.parentNode;
    }
  }

  // Ouvrir la modale
  document.getElementById('linkModal').classList.add('active');

  if (existingLink) {
    document.getElementById('linkText').value = existingLink.textContent;
    document.getElementById('linkUrl').value = existingLink.getAttribute('href');
    document.getElementById('linkModal').setAttribute('data-edit-mode', 'true');
    document.getElementById('linkModal').setAttribute('data-existing-id', existingLink);
  } else {
    // Nouveau lien
    document.getElementById('linkText').value = selection.toString();
    document.getElementById('linkUrl').value = '';
    document.getElementById('linkModal').setAttribute('data-edit-mode', 'false');
  }

  document.getElementById('linkText').focus();
}

function closeLinkModal() {
  document.getElementById('linkModal').classList.remove('active');
  document.getElementById('linkModal').removeAttribute('data-edit-mode');
  savedSelection = null;
}

function saveSelection() {
  if (window.getSelection) {
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      return sel.getRangeAt(0);
    }
  }
  return null;
}

function restoreSelection(range) {
  if (range) {
    if (window.getSelection) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
}

function insertLink() {
  const text = document.getElementById('linkText').value.trim();
  let url = document.getElementById('linkUrl').value.trim();

  if (!text || !url) return;

  if (!url.match(/^https?:\/\//)) {
    url = 'https://' + url;
  }

  const modal = document.getElementById('linkModal');
  const isEdit = modal.getAttribute('data-edit-mode') === 'true';

  const editor = document.getElementById('editor');
  editor.focus();

  if (isEdit) {
    // Mode modification
    restoreSelection(savedSelection);

    let existingLink = null;
    let node = savedSelection.startContainer;
    while (node && node !== document) {
      if (node.tagName === 'A') {
        existingLink = node;
        break;
      }
      node = node.parentNode;
    }

    if (existingLink) {
      existingLink.textContent = text;
      existingLink.href = url;
    }
  } else {
    // Nouveau lien
    restoreSelection(savedSelection);
    document.execCommand(
      'insertHTML',
      false,
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
    );
  }

  closeLinkModal();
}

// Gestion du color dropdown
function toggleColorDropdown() {
  const dropdown = document.getElementById('colorDropdown');
  const bgDropdown = document.getElementById('bgColorDropdown');
  bgDropdown.classList.remove('active');
  dropdown.classList.toggle('active');
}

function applyColor(color) {
  document.getElementById('editor').focus();
  document.execCommand('foreColor', false, color);
  document.getElementById('currentColorIcon').style.color = color;
  document.getElementById('colorDropdown').classList.remove('active');
}

function applyCustomColor() {
  const input = document.getElementById('customColorInput');
  const color = input.value.trim();

  if (color) {
    applyColor(color);
    input.value = '';
  }
}

// Gestion du background color dropdown
function toggleBgColorDropdown() {
  const dropdown = document.getElementById('bgColorDropdown');
  const colorDropdown = document.getElementById('colorDropdown');
  colorDropdown.classList.remove('active');
  dropdown.classList.toggle('active');
}

function applyBgColor(color) {
  document.getElementById('editor').focus();
  document.execCommand('backColor', false, color);
  document.getElementById('currentBgColorIcon').style.background = color;
  document.getElementById('bgColorDropdown').classList.remove('active');
}

function applyCustomBgColor() {
  const input = document.getElementById('customBgColorInput');
  let color = input.value.trim();

  if (color) {
    // Convertir hex en rgba si nécessaire
    if (color.match(/^#[0-9A-F]{6}$/i)) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      color = `rgba(${r}, ${g}, ${b}, 0.2)`;
    }
    applyBgColor(color);
    input.value = '';
  }
}

// Fermer les dropdowns si on clique ailleurs
document.addEventListener('click', function (e) {
  const colorDropdown = document.getElementById('colorDropdown');
  const bgColorDropdown = document.getElementById('bgColorDropdown');
  const sectionColorDropdown = document.getElementById('sectionColorDropdown');
  const colorBtn = e.target.closest('[onclick*="toggleColorDropdown"]');
  const bgColorBtn = e.target.closest('[onclick*="toggleBgColorDropdown"]');
  const sectionBtn = e.target.closest('[onclick*="showSectionColorPicker"]');

  if (colorDropdown && !colorDropdown.contains(e.target) && !colorBtn) {
    colorDropdown.classList.remove('active');
  }

  if (bgColorDropdown && !bgColorDropdown.contains(e.target) && !bgColorBtn) {
    bgColorDropdown.classList.remove('active');
  }

  if (sectionColorDropdown && !sectionColorDropdown.contains(e.target) && !sectionBtn) {
    sectionColorDropdown.classList.remove('active');
  }
});

// Gestion de la police (applique à tout le texte)
let currentFont = '';

function applyFont(font) {
  if (!font) return;

  const editor = document.getElementById('editor');
  const displayContent = document.getElementById('displayContent');

  // Appliquer la police directement au conteneur
  editor.style.fontFamily = font;
  displayContent.style.fontFamily = font;

  // Pour appliquer aussi au contenu existant, on wrapp tout dans un span
  // mais seulement si c'est lors de l'édition
  if (editor.innerHTML && editor.style.display !== 'none') {
    // Nettoyer les anciens spans de police
    const content = editor.innerHTML;
    editor.innerHTML = content;
  }

  currentFont = font;

  // Mettre à jour le select
  const fontSelect = document.getElementById('fontSelect');
  if (fontSelect) {
    fontSelect.value = font;
  }
}

// Gestion des marges
let currentPadding = '';

function applyPadding(size) {
  if (!size) return;

  const editor = document.getElementById('editor');
  const displayContent = document.getElementById('displayContent');

  let padding;
  switch (size) {
    case 'small':
      padding = '10px';
      break;
    case 'medium':
      padding = '20px';
      break;
    case 'large':
      padding = '40px';
      break;
    default:
      return;
  }

  editor.style.padding = padding;
  displayContent.style.padding = padding;

  currentPadding = size;
  document.getElementById('paddingSelect').value = size;
}

// Gestion des emojis
function initializeEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  picker.innerHTML = '';

  emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.onclick = () => insertEmoji(emoji);
    picker.appendChild(btn);
  });
}

function toggleEmojiPicker(event) {
  const picker = document.getElementById('emojiPicker');

  if (picker.classList.contains('active')) {
    picker.classList.remove('active');
  } else {
    const btn = event.target.closest('.toolbar-btn');
    const rect = btn.getBoundingClientRect();

    picker.style.top = (rect.bottom + 4) + 'px';
    picker.style.right = '12px';
    picker.style.left = 'auto';

    picker.classList.add('active');
  }
}

function insertEmoji(emoji) {
  document.execCommand('insertText', false, emoji);
  document.getElementById('emojiPicker').classList.remove('active');
  document.getElementById('editor').focus();
}

// Fermer l'emoji picker si on clique ailleurs
document.addEventListener('click', function (e) {
  const picker = document.getElementById('emojiPicker');
  const emojiBtn = event.target.closest('[onclick*="toggleEmojiPicker"]');

  if (!picker.contains(e.target) && !emojiBtn) {
    picker.classList.remove('active');
  }
});

// Sauvegarde
async function saveContent() {
  const content = document.getElementById('editor').innerHTML;

  await grist.setOptions({
    content: content,
    font: currentFont,
    padding: currentPadding
  });

  // Retour au mode affichage
  document.getElementById('configMode').style.display = 'none';
  document.getElementById('displayMode').style.display = 'block';
  document.getElementById('displayContent').innerHTML = content;

  // Appliquer police et marges en mode affichage
  if (currentFont) {
    document.getElementById('displayContent').style.fontFamily = currentFont;
  }

  if (currentPadding) {
    let padding;
    switch (currentPadding) {
      case 'small': padding = '10px'; break;
      case 'medium': padding = '20px'; break;
      case 'large': padding = '40px'; break;
    }
    if (padding) {
      document.getElementById('displayContent').style.padding = padding;
    }
  }

}

function cancelEdit() {
  // Restaurer le contenu original
  document.getElementById('editor').innerHTML = currentContent;

  // Retour au mode affichage
  document.getElementById('configMode').style.display = 'none';
  document.getElementById('displayMode').style.display = 'block';
}


// Raccourcis clavier
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'b':
        e.preventDefault();
        execCmd('bold');
        break;
      case 'i':
        e.preventDefault();
        execCmd('italic');
        break;
      case 'u':
        e.preventDefault();
        execCmd('underline');
        break;
    }
  }
});

// Initialisation au chargement
window.addEventListener('load', function () {
  initializeEmojiPicker();
});
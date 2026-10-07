document.addEventListener('DOMContentLoaded', async () => {
  let currentUser = null;
  try {
    currentUser = await loadCurrentUser();
  } catch (e) {
    window.location.replace('/login.html');
    return;
  }

  // DOM Elements
  const sidebar = document.getElementById('conversations-sidebar');
  const chatPane = document.getElementById('chat-pane');
  const conversationsList = document.getElementById('conversations-list');
  const conversationSearch = document.getElementById('conversation-search');
  const chatPlaceholder = document.getElementById('chat-placeholder');
  const chatActive = document.getElementById('chat-active');
  const partnerSummary = document.getElementById('partner-summary');
  const viewProfileBtn = document.getElementById('view-profile-btn');
  const chatMessages = document.getElementById('chat-messages');
  const chatComposer = document.getElementById('chat-composer');
  const messageInput = document.getElementById('message-text-input');
  const mediaFileInput = document.getElementById('media-file-input');
  const attachMediaBtn = document.getElementById('attach-media-btn');
  const attachmentPreviewBar = document.getElementById('attachment-preview-bar');
  const previewMediaWrapper = document.getElementById('preview-media-wrapper');
  const previewFileName = document.getElementById('preview-file-name');
  const previewFileSize = document.getElementById('preview-file-size');
  const removeAttachmentBtn = document.getElementById('remove-attachment-btn');
  const emojiToggleBtn = document.getElementById('emoji-toggle-btn');
  const emojiPicker = document.getElementById('emoji-picker');
  const closeEmojiPicker = document.getElementById('close-emoji-picker');
  const emojiGrid = document.getElementById('emoji-grid');
  const emojiTabs = document.getElementById('emoji-tabs');
  const backToConversationsBtn = document.getElementById('back-to-conversations');
  const newMessageBtn = document.getElementById('new-message-btn');
  const startChatPromptBtn = document.getElementById('start-chat-prompt-btn');
  const newConvDialog = document.getElementById('new-conversation-dialog');
  const closeNewConvDialog = document.getElementById('close-new-conv-dialog');
  const newConvSearch = document.getElementById('new-conv-search');
  const suggestedUsersList = document.getElementById('suggested-users-list');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxClose = document.getElementById('lightbox-close');

  let activePartner = null; // { id, username, display_name, avatar_path }
  let activeMessages = [];
  let pollTimer = null;
  let conversationsCache = [];
  let pendingFile = null;

  // Emojis catalog
  const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😎', '🥳', '🤩', '🤔', '🤫', '🤗', '😴', '🥺', '😭', '🤯', '🥵', '🥶', '🤠'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐', '🌟', '💫', '🔥', '💥', '💯'],
    gestures: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '✋', '💪', '🙏', '✍️'],
    fun: ['🎉', '🎊', '🎈', '🎂', '🎁', '🏆', '🥇', '☕', '🍵', '🧋', '🍕', '🍔', '🍟', '🍦', '🍰', '🍪', '🍩', '🚀', '🎸', '🎧', '📸', '🎨', '🎬', '🎮'],
    nature: ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌿', '🍀', '🍁', '🍂', '🍃', '🌲', '🌳', '🏔️', '⛰️', '🌊', '☀️', '🌤️', '🌙', '🌈', '🕊️', '🐶', '🐱', '🐼', '🦊'],
  };

  function renderEmojiGrid(category = 'smileys') {
    const list = emojiCategories[category] || emojiCategories.smileys;
    emojiGrid.innerHTML = list.map(em => `<button type="button" class="emoji-cell" data-emoji="${em}">${em}</button>`).join('');
  }

  renderEmojiGrid('smileys');

  emojiTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.emoji-tab');
    if (!tab) return;
    emojiTabs.querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    renderEmojiGrid(tab.dataset.cat);
  });

  function toggleEmojiPicker(force) {
    const isVisible = !emojiPicker.classList.contains('hidden');
    const show = force !== undefined ? force : !isVisible;
    emojiPicker.classList.toggle('hidden', !show);
    emojiToggleBtn.setAttribute('aria-expanded', String(show));
  }

  emojiToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleEmojiPicker();
  });

  closeEmojiPicker.addEventListener('click', () => toggleEmojiPicker(false));

  document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && !emojiToggleBtn.contains(e.target)) {
      toggleEmojiPicker(false);
    }
  });

  emojiGrid.addEventListener('click', (e) => {
    const cell = e.target.closest('.emoji-cell');
    if (!cell) return;
    const emoji = cell.dataset.emoji;
    insertTextAtCursor(messageInput, emoji);
  });

  function insertTextAtCursor(textarea, text) {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const val = textarea.value;
    textarea.value = val.substring(0, start) + text + val.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
    autoResizeTextarea(textarea);
  }

  function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  messageInput.addEventListener('input', () => autoResizeTextarea(messageInput));

  // Attachment Handling
  attachMediaBtn.addEventListener('click', () => mediaFileInput.click());

  mediaFileInput.addEventListener('change', () => {
    const file = mediaFileInput.files?.[0];
    if (!file) return;
    setPendingFile(file);
  });

  function setPendingFile(file) {
    pendingFile = file;
    if (!file) {
      attachmentPreviewBar.classList.add('hidden');
      previewMediaWrapper.innerHTML = '';
      mediaFileInput.value = '';
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    previewFileName.textContent = file.name;
    previewFileSize.textContent = formatBytes(file.size);

    if (isImage) {
      const url = URL.createObjectURL(file);
      previewMediaWrapper.innerHTML = `<img src="${url}" alt="Preview" class="attachment-preview-thumb">`;
    } else if (isVideo) {
      previewMediaWrapper.innerHTML = `<div class="attachment-video-badge">🎥 Video</div>`;
    } else {
      previewMediaWrapper.innerHTML = `<div class="attachment-file-badge">📎 File</div>`;
    }

    attachmentPreviewBar.classList.remove('hidden');
  }

  removeAttachmentBtn.addEventListener('click', () => {
    setPendingFile(null);
  });

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Format timestamp helper
  function formatMessageTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString.replace(' ', 'T') + (dateString.includes('Z') ? '' : 'Z'));
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timeStr;
    const isThisYear = date.getFullYear() === now.getFullYear();
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', ...(isThisYear ? {} : { year: 'numeric' }) });
    return `${dateStr}, ${timeStr}`;
  }

  // Load and render conversations
  async function loadConversations() {
    try {
      const res = await api('/api/messages/conversations');
      conversationsCache = res.conversations || [];
      renderConversationsList(conversationsCache);
    } catch (err) {
      conversationsList.innerHTML = `<div class="error-state">Unable to load conversations.</div>`;
    }
  }

  function renderConversationsList(list) {
    const query = conversationSearch.value.trim().toLowerCase();
    const filtered = query
      ? list.filter(c => (c.partner_display_name || '').toLowerCase().includes(query) || (c.partner_username || '').toLowerCase().includes(query))
      : list;

    if (!filtered.length) {
      conversationsList.innerHTML = `<div class="empty-state">${query ? 'No matching conversations.' : 'No conversations yet.'}</div>`;
      return;
    }

    conversationsList.innerHTML = filtered.map(c => {
      const isActive = activePartner && activePartner.id === c.partner_id;
      const avatar = c.partner_avatar
        ? `<img class="avatar small" src="${escapeHtml(c.partner_avatar)}" alt="">`
        : `<span class="avatar small">${escapeHtml((c.partner_display_name || c.partner_username || '?').slice(0, 1).toUpperCase())}</span>`;

      let snippet = escapeHtml(c.last_content || '');
      if (c.last_media_type === 'image') {
        snippet = snippet ? `📷 ${snippet}` : '📷 Photo';
      } else if (c.last_media_type === 'video') {
        snippet = snippet ? `🎥 ${snippet}` : '🎥 Video';
      }
      if (c.last_sender_id === currentUser.id && snippet) {
        snippet = `<span class="you-prefix">You:</span> ${snippet}`;
      }

      const unreadBadge = c.unread_count > 0
        ? `<span class="unread-pill">${c.unread_count}</span>`
        : '';

      const time = formatMessageTime(c.last_created_at);

      return `
        <div class="conversation-item${isActive ? ' is-active' : ''}${c.unread_count > 0 ? ' has-unread' : ''}" data-user-id="${c.partner_id}" data-username="${escapeHtml(c.partner_username)}" role="listitem">
          <div class="conv-avatar-col">${avatar}</div>
          <div class="conv-details-col">
            <div class="conv-name-row">
              <strong class="conv-name">${escapeHtml(c.partner_display_name || c.partner_username)}</strong>
              <span class="conv-time">${escapeHtml(time)}</span>
            </div>
            <div class="conv-snippet-row">
              <span class="conv-snippet">${snippet}</span>
              ${unreadBadge}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  conversationSearch.addEventListener('input', () => {
    renderConversationsList(conversationsCache);
  });

  // Handle clicking on conversation in list
  conversationsList.addEventListener('click', (e) => {
    const item = e.target.closest('.conversation-item');
    if (!item) return;
    const userId = Number(item.dataset.userId);
    const username = item.dataset.username;
    openConversation({ id: userId, username });
  });

  // Open Conversation
  async function openConversation(partnerInfo) {
    try {
      let partner = partnerInfo;
      // If we only have username, resolve partner data
      if (!partner.id && partner.username) {
        const uRes = await api(`/api/messages/user/${encodeURIComponent(partner.username)}`);
        partner = uRes.user;
      }

      activePartner = partner;

      // Update URL query param without reload
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('u', partner.username);
      window.history.replaceState({}, '', newUrl);

      // Mobile pane switch
      sidebar.classList.add('mobile-hidden');
      chatPane.classList.remove('mobile-hidden');

      // Update Header
      const avatar = partner.avatar_path
        ? `<img class="avatar small" src="${escapeHtml(partner.avatar_path)}" alt="">`
        : `<span class="avatar small">${escapeHtml((partner.display_name || partner.username).slice(0, 1).toUpperCase())}</span>`;

      partnerSummary.innerHTML = `
        <a href="/profile.html?u=${encodeURIComponent(partner.username)}" class="partner-link">
          ${avatar}
          <div class="partner-text">
            <strong class="partner-name">${escapeHtml(partner.display_name || partner.username)}</strong>
            <span class="partner-handle">@${escapeHtml(partner.username)}</span>
          </div>
        </a>
      `;

      viewProfileBtn.href = `/profile.html?u=${encodeURIComponent(partner.username)}`;

      chatPlaceholder.classList.add('hidden');
      chatActive.classList.remove('hidden');

      // Update active highlight in conversation list
      document.querySelectorAll('.conversation-item').forEach(el => {
        el.classList.toggle('is-active', Number(el.dataset.userId) === partner.id);
      });

      // Load messages
      await fetchMessages(partner.id, true);

      // Refresh badges
      if (window.refreshMessageBadge) window.refreshMessageBadge();
    } catch (err) {
      alert(err.message || 'Could not open conversation.');
    }
  }

  // Fetch messages with a specific partner
  async function fetchMessages(partnerId, scrollToBottom = false) {
    if (!partnerId) return;
    try {
      const res = await api(`/api/messages/${partnerId}`);
      activePartner = res.partner;
      activeMessages = res.messages || [];
      renderMessages(activeMessages, scrollToBottom);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  }

  function renderMessages(messages, scrollToBottom = false) {
    if (!messages.length) {
      chatMessages.innerHTML = `
        <div class="chat-empty-thread">
          <div class="thread-intro-avatar">
            ${activePartner.avatar_path
              ? `<img class="avatar large" src="${escapeHtml(activePartner.avatar_path)}" alt="">`
              : `<span class="avatar large">${escapeHtml((activePartner.display_name || activePartner.username).slice(0, 1).toUpperCase())}</span>`
            }
          </div>
          <h3>${escapeHtml(activePartner.display_name || activePartner.username)}</h3>
          <p class="thread-intro-bio">${escapeHtml(activePartner.bio || 'Say hello!')}</p>
          <div class="wave-prompt">Say hi with a wave or a photo! 👋</div>
        </div>
      `;
      return;
    }

    const wasNearBottom = (chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight) < 120;

    chatMessages.innerHTML = messages.map(msg => {
      const isMine = msg.sender_id === currentUser.id;
      const formattedTime = formatMessageTime(msg.created_at);

      let mediaHtml = '';
      if (msg.media_path) {
        if (msg.media_type === 'video') {
          mediaHtml = `
            <div class="bubble-media-wrap">
              <video class="bubble-video" controls playsinline preload="metadata">
                <source src="${escapeHtml(msg.media_path)}">
                Your browser does not support video playback.
              </video>
            </div>
          `;
        } else {
          mediaHtml = `
            <div class="bubble-media-wrap">
              <img class="bubble-image" src="${escapeHtml(msg.media_path)}" alt="Photo message" data-lightbox="${escapeHtml(msg.media_path)}">
            </div>
          `;
        }
      }

      const textHtml = msg.content
        ? `<div class="bubble-text">${escapeHtml(msg.content)}</div>`
        : '';

      const avatar = !isMine
        ? (msg.sender_avatar
            ? `<img class="avatar small bubble-avatar" src="${escapeHtml(msg.sender_avatar)}" alt="">`
            : `<span class="avatar small bubble-avatar">${escapeHtml((msg.sender_display_name || msg.sender_username || '?').slice(0, 1).toUpperCase())}</span>`)
        : '';

      return `
        <div class="chat-row ${isMine ? 'mine' : 'theirs'}" data-msg-id="${msg.id}">
          ${avatar}
          <div class="chat-bubble">
            ${mediaHtml}
            ${textHtml}
            <div class="bubble-meta">
              <span class="bubble-time">${escapeHtml(formattedTime)}</span>
              ${isMine ? `<span class="bubble-status">${msg.is_read ? 'Seen' : 'Sent'}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (scrollToBottom || wasNearBottom) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Handle Lightbox click
  chatMessages.addEventListener('click', (e) => {
    const img = e.target.closest('[data-lightbox]');
    if (!img) return;
    lightboxImage.src = img.dataset.lightbox;
    lightboxBackdrop.classList.remove('hidden');
  });

  lightboxClose.addEventListener('click', () => lightboxBackdrop.classList.add('hidden'));
  lightboxBackdrop.addEventListener('click', (e) => {
    if (e.target === lightboxBackdrop) lightboxBackdrop.classList.add('hidden');
  });

  // Sending a message
  chatComposer.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activePartner) return;

    const content = messageInput.value.trim();
    if (!content && !pendingFile) return;

    const sendBtn = document.getElementById('send-message-btn');
    sendBtn.disabled = true;

    try {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (pendingFile) formData.append('media', pendingFile);

      const res = await api(`/api/messages/${activePartner.id}`, {
        method: 'POST',
        body: formData,
      });

      // Clear input and attachments
      messageInput.value = '';
      autoResizeTextarea(messageInput);
      setPendingFile(null);
      toggleEmojiPicker(false);

      // Append message locally and scroll to bottom
      if (res.message) {
        activeMessages.push(res.message);
        renderMessages(activeMessages, true);
      }

      // Refresh conversations sidebar list
      await loadConversations();
    } catch (err) {
      alert(err.message || 'Failed to send message.');
    } finally {
      sendBtn.disabled = false;
      messageInput.focus();
    }
  });

  // Enter to send (Shift+Enter for newline)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatComposer.requestSubmit();
    }
  });

  // Mobile Back Button
  backToConversationsBtn.addEventListener('click', () => {
    sidebar.classList.remove('mobile-hidden');
    chatPane.classList.add('mobile-hidden');
  });

  // Start chat dialog
  async function openNewConvDialog() {
    newConvDialog.classList.remove('hidden');
    newConvSearch.value = '';
    newConvSearch.focus();
    loadSuggestedUsers();
  }

  async function loadSuggestedUsers(query = '') {
    try {
      let users = [];
      if (query.trim()) {
        const res = await api(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        users = res.users || [];
      } else {
        // Show all recent / discoverable users (e.g. friends, dummy accounts)
        const res = await api('/api/users/search?q=a');
        users = res.users || [];
      }

      // Filter out self
      users = users.filter(u => u.id !== currentUser.id);

      if (!users.length) {
        suggestedUsersList.innerHTML = `<div class="empty-state">No users found.</div>`;
        return;
      }

      suggestedUsersList.innerHTML = users.map(u => {
        const avatar = u.avatar_path
          ? `<img class="avatar small" src="${escapeHtml(u.avatar_path)}" alt="">`
          : `<span class="avatar small">${escapeHtml((u.display_name || u.username).slice(0, 1).toUpperCase())}</span>`;

        return `
          <div class="suggested-user-item" data-user-id="${u.id}" data-username="${escapeHtml(u.username)}">
            ${avatar}
            <div class="suggested-user-info">
              <strong>${escapeHtml(u.display_name || u.username)}</strong>
              <small>@${escapeHtml(u.username)}</small>
            </div>
            <button type="button" class="button secondary small-btn">Chat</button>
          </div>
        `;
      }).join('');
    } catch (e) {
      suggestedUsersList.innerHTML = `<div class="empty-state">Error loading users.</div>`;
    }
  }

  newConvSearch.addEventListener('input', () => {
    loadSuggestedUsers(newConvSearch.value);
  });

  suggestedUsersList.addEventListener('click', (e) => {
    const item = e.target.closest('.suggested-user-item');
    if (!item) return;
    const userId = Number(item.dataset.userId);
    const username = item.dataset.username;
    newConvDialog.classList.add('hidden');
    openConversation({ id: userId, username });
  });

  newMessageBtn.addEventListener('click', openNewConvDialog);
  startChatPromptBtn.addEventListener('click', openNewConvDialog);
  closeNewConvDialog.addEventListener('click', () => newConvDialog.classList.add('hidden'));
  newConvDialog.addEventListener('click', (e) => {
    if (e.target === newConvDialog) newConvDialog.classList.add('hidden');
  });

  // Initial Load
  await loadConversations();

  // If ?u=username is in query params, open that conversation directly
  const urlParams = new URLSearchParams(window.location.search);
  const targetUsername = urlParams.get('u');
  if (targetUsername) {
    await openConversation({ username: targetUsername });
  } else if (conversationsCache.length && window.innerWidth > 768) {
    // On desktop, auto-open the first conversation
    openConversation({
      id: conversationsCache[0].partner_id,
      username: conversationsCache[0].partner_username,
      display_name: conversationsCache[0].partner_display_name,
      avatar_path: conversationsCache[0].partner_avatar,
    });
  }

  // Periodic polling for live chat experience
  pollTimer = setInterval(async () => {
    if (document.hidden) return;
    if (activePartner) {
      await fetchMessages(activePartner.id, false);
    }
    await loadConversations();
  }, 2500);

  window.addEventListener('beforeunload', () => {
    if (pollTimer) clearInterval(pollTimer);
  });
});

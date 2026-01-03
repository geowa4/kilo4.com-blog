// PocketBase client initialization
const pb = new PocketBase('http://127.0.0.1:8090');

// Auth state
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  updateAuthUI();

  // Initialize bookmark button if on post page
  const bookmarkBtn = document.getElementById('bookmark-button');
  if (bookmarkBtn) {
    await initBookmarkButton();
  }

  // Initialize bookmarks page if present
  const bookmarksPage = document.getElementById('bookmarks-page');
  if (bookmarksPage) {
    await loadBookmarks();
  }
});

// ============ Auth Functions ============

async function initAuth() {
  // Restore auth from localStorage
  pb.authStore.loadFromCookie(document.cookie);

  // Refresh auth if token exists
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh();
      currentUser = pb.authStore.model;
    } catch (err) {
      pb.authStore.clear();
      currentUser = null;
    }
  }

  // Listen for auth store changes
  pb.authStore.onChange(() => {
    currentUser = pb.authStore.model;
    updateAuthUI();

    // Update bookmark button if present
    const bookmarkBtn = document.getElementById('bookmark-button');
    if (bookmarkBtn) {
      initBookmarkButton();
    }
  });
}

async function login() {
  try {
    const authData = await pb.collection('users').authWithOAuth2({ provider: 'github' });
    currentUser = authData.record;

    // Save to cookie for persistence
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false });

    updateAuthUI();
    return true;
  } catch (err) {
    console.error('Login failed:', err);
    alert('Login failed. Please try again.');
    return false;
  }
}

function logout() {
  pb.authStore.clear();
  currentUser = null;

  // Clear cookie
  document.cookie = 'pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

  updateAuthUI();

  // Redirect if on bookmarks page
  if (document.getElementById('bookmarks-page')) {
    window.location.href = '/';
  }
}

function updateAuthUI() {
  const authUI = document.getElementById('auth-ui');
  if (!authUI) return;

  if (currentUser) {
    authUI.innerHTML = `
      <a href="#" id="auth-link" class="auth-link" title="Logout">
        <span class="auth-username">Logout</span>
      </a>
    `;
    document.getElementById('auth-link').onclick = (e) => {
      e.preventDefault();
      logout();
    };
  } else {
    authUI.innerHTML = `
      <a href="#" id="auth-link" class="auth-link" title="Login with GitHub">
        <span class="auth-username">Login</span>
      </a>
    `;
    document.getElementById('auth-link').onclick = (e) => {
      e.preventDefault();
      login();
    };
  }
}

// ============ Bookmark Functions ============

async function initBookmarkButton() {
  const bookmarkBtn = document.getElementById('bookmark-button');
  if (!bookmarkBtn) return;

  if (!currentUser) {
    bookmarkBtn.style.display = 'inline-block';
    bookmarkBtn.innerHTML = '🔖 Bookmark';
    bookmarkBtn.onclick = login;
    return;
  }

  const postUrl = window.location.href;
  const postTitle = document.querySelector('h1.post-title')?.textContent || document.title;

  // Check if already bookmarked
  try {
    const bookmarks = await pb.collection('bookmarks').getList(1, 1, {
      filter: `user = "${currentUser.id}" && post_url = "${postUrl}"`
    });

    if (bookmarks.items.length > 0) {
      bookmarkBtn.innerHTML = '✅ Bookmarked';
      bookmarkBtn.classList.add('bookmarked');
      bookmarkBtn.onclick = () => removeBookmark(bookmarks.items[0].id);
    } else {
      bookmarkBtn.innerHTML = '🔖 Bookmark';
      bookmarkBtn.classList.remove('bookmarked');
      bookmarkBtn.onclick = () => addBookmark(postUrl, postTitle);
    }

    bookmarkBtn.style.display = 'inline-block';
  } catch (err) {
    console.error('Error checking bookmark:', err);
  }
}

async function addBookmark(postUrl, postTitle) {
  if (!currentUser) {
    await login();
    return;
  }

  try {
    await pb.collection('bookmarks').create({
      user: currentUser.id,
      post_url: postUrl,
      post_title: postTitle,
      notes: ''
    });

    await initBookmarkButton();
  } catch (err) {
    console.error('Error adding bookmark:', err);
    alert('Failed to add bookmark. Please try again.');
  }
}

async function removeBookmark(bookmarkId) {
  if (!confirm('Remove this bookmark?')) return;

  try {
    await pb.collection('bookmarks').delete(bookmarkId);
    await initBookmarkButton();
  } catch (err) {
    console.error('Error removing bookmark:', err);
    alert('Failed to remove bookmark. Please try again.');
  }
}

// ============ Bookmarks Page ============

async function loadBookmarks() {
  const container = document.getElementById('bookmarks-list');
  if (!container) return;

  if (!currentUser) {
    container.innerHTML = '<p>Please login to view your bookmarks.</p>';
    return;
  }

  try {
    const bookmarks = await pb.collection('bookmarks').getFullList({
      filter: `user = "${currentUser.id}"`,
      sort: '-created'
    });

    if (bookmarks.length === 0) {
      container.innerHTML = '<p class="no-bookmarks">No bookmarks yet. Visit a post and click the bookmark button!</p>';
      return;
    }

    container.innerHTML = bookmarks.map(bookmark => `
      <div class="bookmark-item" data-id="${bookmark.id}">
        <div class="bookmark-header">
          <h3><a href="${bookmark.post_url}">${bookmark.post_title}</a></h3>
          <button onclick="deleteBookmark('${bookmark.id}')" class="delete-btn" title="Delete bookmark">×</button>
        </div>
        <div class="bookmark-meta">
          <span class="bookmark-date">${new Date(bookmark.created).toLocaleDateString()}</span>
        </div>
        <div class="bookmark-notes">
          <textarea
            id="notes-${bookmark.id}"
            placeholder="Add notes..."
            onchange="updateNotes('${bookmark.id}')"
          >${bookmark.notes || ''}</textarea>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading bookmarks:', err);
    container.innerHTML = '<p class="error">Failed to load bookmarks. Please try again.</p>';
  }
}

async function updateNotes(bookmarkId) {
  const textarea = document.getElementById(`notes-${bookmarkId}`);
  if (!textarea) return;

  try {
    await pb.collection('bookmarks').update(bookmarkId, {
      notes: textarea.value
    });

    // Visual feedback
    textarea.style.borderColor = '#90EE90';
    setTimeout(() => {
      textarea.style.borderColor = '';
    }, 1000);
  } catch (err) {
    console.error('Error updating notes:', err);
    alert('Failed to save notes. Please try again.');
  }
}

async function deleteBookmark(bookmarkId) {
  if (!confirm('Delete this bookmark?')) return;

  try {
    await pb.collection('bookmarks').delete(bookmarkId);
    await loadBookmarks();
  } catch (err) {
    console.error('Error deleting bookmark:', err);
    alert('Failed to delete bookmark. Please try again.');
  }
}

// Make functions globally available
window.login = login;
window.logout = logout;
window.addBookmark = addBookmark;
window.removeBookmark = removeBookmark;
window.updateNotes = updateNotes;
window.deleteBookmark = deleteBookmark;

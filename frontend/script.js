/**
 * ConnectHub - Mini Social Media Platform
 * Frontend & Backend Integration (Vanilla JavaScript)
 * Author: ConnectHub Full Stack Internship Project
 */

// ==============================================================================
// Configuration & Constants
// ==============================================================================
// Dynamic API base: uses window.CONNECTHUB_API_BASE if defined, relative '/api' on production
// (Render single-service deployment or Vercel rewrites proxy), and falls back to localhost:5000
const API_BASE = window.CONNECTHUB_API_BASE ||
  ((window.location.origin.includes(':5500') || window.location.origin.includes(':8080'))
    ? 'http://localhost:5000/api'
    : '/api');
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

// ==============================================================================
// Authentication & Session Helpers
// ==============================================================================
function getToken() {
  return localStorage.getItem('connecthub_token') || null;
}

function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('connecthub_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

function setAuthSession(token, user) {
  if (token) localStorage.setItem('connecthub_token', token);
  if (user) localStorage.setItem('connecthub_user', JSON.stringify(user));
}

function clearAuthSession() {
  localStorage.removeItem('connecthub_token');
  localStorage.removeItem('connecthub_user');
}

function logout() {
  clearAuthSession();
  showToast('You have been logged out.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 800);
}

/**
 * Wrapper around window.fetch with automatic JWT Authorization header
 */
async function authFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    // Handle token expiry or invalidation
    if (res.status === 401 && token) {
      clearAuthSession();
      showToast('Session expired. Please log in again.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    }

    return res;
  } catch (err) {
    console.error(`API Call failed on ${endpoint}:`, err);
    showToast('Cannot connect to backend server. Ensure it is running on port 5000.', 'warning');
    throw err;
  }
}

// ==============================================================================
// Main Initialization on DOM Ready
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initPasswordToggles();
  updateNavAuth();

  // Page-specific initializations
  if (document.getElementById('loginForm') || document.getElementById('registerForm')) {
    initAuthForms();
  }

  if (document.getElementById('postsFeedContainer')) {
    initCreatePost();
    initLikeButtons();
    initDoubleTapLike();
    initCommentForms();
    initFeedPosts();
    initSuggestedUsers();
    initSearchFilter();
  }

  if (document.getElementById('profilePostsGrid') || document.getElementById('profileDisplayName')) {
    initProfilePage();
    initProfileTabs();
  }
});

/* ==========================================================================
   1. Toast Notification Utility
   ========================================================================== */
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' 
    ? '<i class="fa-solid fa-circle-check" style="color: #31a24c;"></i>' 
    : type === 'warning'
    ? '<i class="fa-solid fa-triangle-exclamation" style="color: #f59e0b;"></i>'
    : '<i class="fa-solid fa-circle-info" style="color: #1877f2;"></i>';

  toast.innerHTML = `${icon} <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================================
   2. Mobile Navigation Toggle
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
      const isOpen = navMenu.classList.contains('mobile-open');
      toggleBtn.innerHTML = isOpen 
        ? '<i class="fa-solid fa-xmark"></i>' 
        : '<i class="fa-solid fa-bars"></i>';
    });

    document.addEventListener('click', (e) => {
      if (!toggleBtn.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('mobile-open');
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
      }
    });
  }
}

/* ==========================================================================
   3. Password Visibility Toggle
   ========================================================================== */
function initPasswordToggles() {
  const toggles = document.querySelectorAll('.toggle-password');

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
      }
    });
  });
}

/* ==========================================================================
   4. Update Navigation Bar & Sidebar Auth State
   ========================================================================== */
function updateNavAuth() {
  const user = getCurrentUser();
  const token = getToken();

  // Find navbar elements
  const navActions = document.querySelector('.navbar .nav-actions');
  if (navActions) {
    if (token && user) {
      // User is logged in: show profile avatar & Sign Out button
      navActions.innerHTML = `
        <button type="button" class="btn btn-secondary" id="globalSignOutBtn" title="Sign Out">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Sign Out</span>
        </button>
        <a href="profile.html" class="nav-profile-link" title="${escapeHtml(user.fullName || user.username)}">
          <img src="${user.avatar || DEFAULT_AVATAR}" alt="${escapeHtml(user.username)}" class="avatar avatar-sm">
        </a>
        <button class="mobile-nav-toggle" id="mobileMenuBtn" aria-label="Toggle Navigation">
          <i class="fa-solid fa-bars"></i>
        </button>
      `;

      // Attach Sign Out listener
      const signOutBtn = document.getElementById('globalSignOutBtn');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', logout);
      }
    } else {
      // User is logged out: show Login button
      navActions.innerHTML = `
        <a href="login.html" class="btn btn-primary" title="Account Access">
          <i class="fa-solid fa-arrow-right-to-bracket"></i>
          <span>Login</span>
        </a>
        <a href="register.html" class="btn btn-light" title="Join ConnectHub">
          <span>Register</span>
        </a>
        <button class="mobile-nav-toggle" id="mobileMenuBtn" aria-label="Toggle Navigation">
          <i class="fa-solid fa-bars"></i>
        </button>
      `;
    }

    // Re-attach mobile nav listener
    initMobileNav();
  }

  // Update Left Sidebar Profile card on index.html
  const sideCard = document.querySelector('.sidebar-profile-card');
  if (sideCard) {
    if (token && user) {
      sideCard.innerHTML = `
        <a href="profile.html">
          <img src="${user.avatar || DEFAULT_AVATAR}" alt="${escapeHtml(user.username)}" class="avatar avatar-lg">
        </a>
        <h3><a href="profile.html" style="color: inherit;">${escapeHtml(user.fullName || user.username)}</a></h3>
        <p>@${escapeHtml(user.username)}</p>
        <div class="sidebar-stats">
          <div class="sidebar-stat-item">
            <span class="stat-num" id="sidebarPostsNum">-</span>
            <span class="stat-label">Posts</span>
          </div>
          <div class="sidebar-stat-item">
            <span class="stat-num" id="sidebarFollowersNum">${user.followersCount || (user.followers ? user.followers.length : 0)}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="sidebar-stat-item">
            <span class="stat-num" id="sidebarFollowingNum">${user.followingCount || (user.following ? user.following.length : 0)}</span>
            <span class="stat-label">Following</span>
          </div>
        </div>
      `;
    } else {
      sideCard.innerHTML = `
        <img src="${DEFAULT_AVATAR}" alt="Guest" class="avatar avatar-lg">
        <h3>Welcome Guest!</h3>
        <p>Join ConnectHub today</p>
        <div style="margin-top: 10px;">
          <a href="login.html" class="btn btn-primary btn-block">Log In</a>
        </div>
      `;
    }
  }

  // Update profile avatar on create-post box
  const createPostAvatar = document.querySelector('.create-post-top .avatar');
  if (createPostAvatar && user) {
    createPostAvatar.src = user.avatar || DEFAULT_AVATAR;
  }
}

/* ==========================================================================
   5. Authentication Forms (Login & Register Integration)
   ========================================================================== */
function initAuthForms() {
  // --- LOGIN FORM ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Please enter both email and password', 'warning');
        return;
      }

      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Logging in...</span>';

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setAuthSession(data.token, data.user);
          showToast(`Welcome back, ${data.user.fullName || data.user.username}!`, 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        } else {
          showToast(data.message || 'Invalid email or password', 'warning');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      } catch (err) {
        console.error('Login error:', err);
        showToast('Unable to reach server. Make sure the backend is running.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    });
  }

  // --- REGISTER FORM ---
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    const passwordInput = document.getElementById('regPassword');
    const confirmInput = document.getElementById('regConfirmPassword');
    const matchMsg = document.getElementById('passwordMatchMessage');
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('regFullName').value.trim();
      const username = document.getElementById('regUsername').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmInput.value;

      // Validate passwords match
      if (password !== confirmPassword) {
        if (matchMsg) {
          matchMsg.style.display = 'block';
          matchMsg.textContent = 'Passwords do not match. Please re-enter.';
        }
        showToast('Passwords do not match!', 'warning');
        return;
      } else if (matchMsg) {
        matchMsg.style.display = 'none';
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters long', 'warning');
        return;
      }

      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Creating account...</span>';

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, username, email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setAuthSession(data.token, data.user);
          showToast('Account created successfully! Welcome to ConnectHub.', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        } else {
          showToast(data.message || 'Registration failed', 'warning');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      } catch (err) {
        console.error('Registration error:', err);
        showToast('Unable to reach server. Make sure the backend is running.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    });
  }
}

/* ==========================================================================
   6. Load and Render Posts Feed from MongoDB Atlas
   ========================================================================== */
async function initFeedPosts() {
  const container = document.getElementById('postsFeedContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 40px 0; color: var(--text-secondary);">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 28px; color: var(--primary);"></i>
      <p style="margin-top: 12px; font-weight: 500;">Loading fresh feed from MongoDB Atlas...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/posts`);
    const data = await res.json();

    if (res.ok && data.success) {
      const posts = data.posts || [];
      renderFeedPosts(posts);

      // Update sidebar post count if available
      const currentUser = getCurrentUser();
      const sidebarPostsNum = document.getElementById('sidebarPostsNum');
      if (sidebarPostsNum && currentUser) {
        const userPostsCount = posts.filter(p => p.user && (p.user._id === currentUser._id || p.user === currentUser._id)).length;
        sidebarPostsNum.textContent = userPostsCount;
      }
    } else {
      container.innerHTML = `<div class="card" style="padding: 24px; text-align: center;">Failed to load posts: ${escapeHtml(data.message || 'Unknown error')}</div>`;
    }
  } catch (err) {
    console.error('Failed to fetch posts:', err);
    container.innerHTML = `
      <div class="card" style="padding: 32px; text-align: center;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; color: var(--warning); margin-bottom: 12px;"></i>
        <h3>Unable to load posts feed</h3>
        <p style="color: var(--text-secondary); margin-top: 6px;">Ensure the ConnectHub backend server is running at <code>http://localhost:5000</code>.</p>
      </div>
    `;
  }
}

function renderFeedPosts(posts) {
  const container = document.getElementById('postsFeedContainer');
  if (!container) return;

  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding: 40px 20px; text-align: center;">
        <i class="fa-regular fa-newspaper" style="font-size: 42px; color: var(--primary); margin-bottom: 14px;"></i>
        <h3>No posts yet on ConnectHub!</h3>
        <p style="color: var(--text-secondary); margin: 8px 0 16px;">Be the first developer to share an update, milestone, or photo.</p>
      </div>
    `;
    return;
  }

  const currentUser = getCurrentUser();
  container.innerHTML = '';

  posts.forEach((post) => {
    const postEl = createPostElement(post, currentUser);
    container.appendChild(postEl);
  });
}

function createPostElement(post, currentUser) {
  const author = post.user || {};
  const authorName = author.fullName || author.username || 'ConnectHub User';
  const authorUsername = author.username || 'user';
  const authorAvatar = author.avatar || DEFAULT_AVATAR;
  const timeFormatted = formatTimeAgo(post.createdAt);

  const isOwner = currentUser && (author._id === currentUser._id || author === currentUser._id);
  const isLiked = currentUser && Array.isArray(post.likes) && post.likes.some(
    id => (typeof id === 'object' ? id._id === currentUser._id : id === currentUser._id)
  );

  const likesCount = post.likesCount !== undefined ? post.likesCount : (post.likes ? post.likes.length : 0);
  const commentsCount = post.comments ? post.comments.length : 0;

  const card = document.createElement('article');
  card.className = 'post-card';
  card.setAttribute('data-post-id', post._id);

  card.innerHTML = `
    <!-- Post Header -->
    <div class="post-header">
      <div class="post-author">
        <a href="profile.html?id=${author._id || ''}">
          <img src="${authorAvatar}" alt="${escapeHtml(authorName)}" class="avatar avatar-md">
        </a>
        <div class="author-info">
          <h4><a href="profile.html?id=${author._id || ''}">${escapeHtml(authorName)}</a></h4>
          <div class="author-meta">
            <span>@${escapeHtml(authorUsername)}</span>
            <span class="separator">•</span>
            <span>${timeFormatted}</span>
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 4px;">
        ${
          isOwner
            ? `<button class="btn-icon btn-delete-post" data-post-id="${post._id}" title="Delete Post" style="color: var(--like-color);">
                <i class="fa-regular fa-trash-can"></i>
               </button>`
            : ''
        }
      </div>
    </div>

    <!-- Post Caption -->
    <div class="post-caption">
      ${escapeHtml(post.caption)}
    </div>

    <!-- Post Media Image (if present) -->
    ${
      post.image
        ? `<div class="post-image-container">
            <img src="${post.image}" alt="Post media" onerror="this.onerror=null; this.parentElement.style.display='none';">
            <i class="fa-solid fa-heart post-heart-animation"></i>
           </div>`
        : ''
    }

    <!-- Post Stats -->
    <div class="post-stats">
      <div class="post-stats-left">
        <span class="stat-icon-like"><i class="fa-solid fa-heart"></i></span>
        <span class="like-counter" data-count="${likesCount}">${likesCount} ${likesCount === 1 ? 'like' : 'likes'}</span>
      </div>
      <div class="post-stats-right">
        <span class="comment-counter">${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}</span>
      </div>
    </div>

    <!-- Post Actions -->
    <div class="post-actions">
      <button type="button" class="post-action-btn btn-like ${isLiked ? 'liked' : ''}">
        <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" ${isLiked ? 'style="color: var(--like-color);"' : ''}></i>
        <span>${isLiked ? 'Liked' : 'Like'}</span>
      </button>
      <button type="button" class="post-action-btn btn-comment-focus">
        <i class="fa-regular fa-comment"></i>
        <span>Comment</span>
      </button>
      <button type="button" class="post-action-btn btn-share" data-post-id="${post._id}">
        <i class="fa-regular fa-paper-plane"></i>
        <span>Share</span>
      </button>
    </div>

    <!-- Comments Section -->
    <div class="post-comments-section">
      <div class="comments-list" id="commentsList-${post._id}">
        <!-- Comments will load dynamically -->
      </div>

      <!-- Add Comment Input -->
      <form class="add-comment-form" data-post-id="${post._id}">
        <img src="${(currentUser && currentUser.avatar) || DEFAULT_AVATAR}" alt="You" class="avatar avatar-sm">
        <div class="comment-input-wrapper">
          <input type="text" class="comment-input" placeholder="Write a comment..." required>
          <button type="submit" class="btn-post-comment">Post</button>
        </div>
      </form>
    </div>
  `;

  // Asynchronously load comments for this post
  loadCommentsForPost(post._id);

  return card;
}

/* ==========================================================================
   7. Create Post Interaction (POST /api/posts)
   ========================================================================== */
function initCreatePost() {
  const btnToggleImage = document.getElementById('btnToggleImageInput');
  const imageContainer = document.getElementById('imageUrlContainer');
  const imageUrlInput = document.getElementById('createPostImageUrl');
  const btnPreview = document.getElementById('btnPreviewImage');
  const previewBox = document.getElementById('postImagePreviewBox');
  const previewImg = document.getElementById('postPreviewImg');
  const btnRemovePreview = document.getElementById('btnRemovePreview');
  const captionInput = document.getElementById('createPostCaption');
  const btnSubmit = document.getElementById('btnSubmitPost');
  const feedContainer = document.getElementById('postsFeedContainer');

  if (!btnSubmit || !feedContainer) return;

  // Toggle Image URL input
  if (btnToggleImage && imageContainer) {
    btnToggleImage.addEventListener('click', () => {
      imageContainer.classList.toggle('active');
      if (imageContainer.classList.contains('active') && imageUrlInput) {
        imageUrlInput.focus();
      }
    });
  }

  // Preview Image
  if (btnPreview && imageUrlInput && previewBox && previewImg) {
    btnPreview.addEventListener('click', () => {
      const url = imageUrlInput.value.trim();
      if (url) {
        previewImg.src = url;
        previewBox.style.display = 'block';
      }
    });
  }

  // Remove Image Preview
  if (btnRemovePreview && previewBox && imageUrlInput) {
    btnRemovePreview.addEventListener('click', () => {
      previewBox.style.display = 'none';
      if (previewImg) previewImg.src = '';
      imageUrlInput.value = '';
    });
  }

  // Submit Post to Backend API
  btnSubmit.addEventListener('click', async () => {
    const token = getToken();
    if (!token) {
      showToast('Please log in to create a post!', 'warning');
      setTimeout(() => { window.location.href = 'login.html'; }, 1000);
      return;
    }

    const caption = captionInput ? captionInput.value.trim() : '';
    const imgUrl = previewImg && previewBox && previewBox.style.display !== 'none' 
      ? previewImg.src 
      : (imageUrlInput ? imageUrlInput.value.trim() : '');

    if (!caption && !imgUrl) {
      showToast('Please enter a caption or attach an image URL!', 'warning');
      return;
    }

    const originalBtnHtml = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Posting...</span>';

    try {
      const res = await authFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
          caption: caption || 'Shared a photo',
          image: imgUrl
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Your post has been published!', 'success');

        // Reset fields
        if (captionInput) captionInput.value = '';
        if (imageUrlInput) imageUrlInput.value = '';
        if (previewBox) previewBox.style.display = 'none';
        if (imageContainer) imageContainer.classList.remove('active');

        // Prepend new post to feed
        const currentUser = getCurrentUser();
        const newPostEl = createPostElement(data.post, currentUser);
        feedContainer.prepend(newPostEl);
      } else {
        showToast(data.message || 'Failed to publish post', 'warning');
      }
    } catch (err) {
      console.error('Create post error:', err);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnHtml;
    }
  });

  // Global Delete Post Handler
  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.btn-delete-post');
    if (!deleteBtn) return;

    const postId = deleteBtn.getAttribute('data-post-id');
    if (!postId) return;

    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await authFetch(`/posts/${postId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Post deleted successfully', 'info');
        const postCard = deleteBtn.closest('.post-card');
        if (postCard) {
          postCard.style.opacity = '0';
          postCard.style.transform = 'scale(0.95)';
          postCard.style.transition = 'all 0.3s ease';
          setTimeout(() => postCard.remove(), 300);
        }
      } else {
        showToast(data.message || 'Could not delete post', 'warning');
      }
    } catch (err) {
      console.error('Delete post error:', err);
    }
  });
}

/* ==========================================================================
   8. Like / Unlike Interaction (POST /api/posts/:id/like)
   ========================================================================== */
function initLikeButtons() {
  document.addEventListener('click', async (e) => {
    const likeBtn = e.target.closest('.btn-like');
    if (!likeBtn) return;

    const token = getToken();
    if (!token) {
      showToast('Please log in to like posts!', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 1000);
      return;
    }

    const postCard = likeBtn.closest('.post-card');
    if (!postCard) return;

    const postId = postCard.getAttribute('data-post-id');
    const counterSpan = postCard.querySelector('.like-counter');

    try {
      const res = await authFetch(`/posts/${postId}/like`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.liked) {
          likeBtn.classList.add('liked');
          likeBtn.innerHTML = '<i class="fa-solid fa-heart" style="color: var(--like-color);"></i><span>Liked</span>';
        } else {
          likeBtn.classList.remove('liked');
          likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i><span>Like</span>';
        }

        if (counterSpan) {
          counterSpan.setAttribute('data-count', data.likesCount);
          counterSpan.textContent = `${data.likesCount} ${data.likesCount === 1 ? 'like' : 'likes'}`;
        }
      } else {
        showToast(data.message || 'Like failed', 'warning');
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  });
}

/* ==========================================================================
   9. Double Tap to Like Post
   ========================================================================== */
function initDoubleTapLike() {
  let lastTap = 0;

  document.addEventListener('click', (e) => {
    const imgContainer = e.target.closest('.post-image-container');
    if (!imgContainer) return;

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;

    if (tapLength < 300 && tapLength > 0) {
      const heartIcon = imgContainer.querySelector('.post-heart-animation');
      const postCard = imgContainer.closest('.post-card');
      const likeBtn = postCard ? postCard.querySelector('.btn-like') : null;

      if (heartIcon) {
        heartIcon.classList.add('animate');
        setTimeout(() => heartIcon.classList.remove('animate'), 600);
      }

      if (likeBtn && !likeBtn.classList.contains('liked')) {
        likeBtn.click();
      }
    }
    lastTap = currentTime;
  });
}

/* ==========================================================================
   10. Comments Integration (GET, POST, DELETE)
   ========================================================================== */
async function loadCommentsForPost(postId) {
  const listEl = document.getElementById(`commentsList-${postId}`);
  if (!listEl) return;

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
    const data = await res.json();

    if (res.ok && data.success) {
      const comments = data.comments || [];
      const currentUser = getCurrentUser();

      listEl.innerHTML = '';
      comments.forEach(comment => {
        const item = createCommentElement(comment, currentUser);
        listEl.appendChild(item);
      });
    }
  } catch (err) {
    console.error(`Error loading comments for post ${postId}:`, err);
  }
}

function createCommentElement(comment, currentUser) {
  const author = comment.user || {};
  const authorName = author.fullName || author.username || 'User';
  const authorAvatar = author.avatar || DEFAULT_AVATAR;
  const isCommentOwner = currentUser && (author._id === currentUser._id || author === currentUser._id);
  const timeFormatted = formatTimeAgo(comment.createdAt);

  const item = document.createElement('div');
  item.className = 'comment-item';
  item.setAttribute('data-comment-id', comment._id);

  item.innerHTML = `
    <img src="${authorAvatar}" alt="${escapeHtml(authorName)}" class="avatar avatar-sm">
    <div class="comment-bubble">
      <span class="comment-user">${escapeHtml(authorName)}</span>
      <span class="comment-text">${escapeHtml(comment.text)}</span>
      <div class="comment-meta">
        <span>${timeFormatted}</span>
        ${
          isCommentOwner
            ? `<a href="#" class="btn-delete-comment" data-comment-id="${comment._id}" style="color: var(--like-color); margin-left: 8px;">Delete</a>`
            : ''
        }
      </div>
    </div>
  `;

  return item;
}

function initCommentForms() {
  // Focus comment input
  document.addEventListener('click', (e) => {
    const commentBtn = e.target.closest('.btn-comment-focus');
    if (!commentBtn) return;

    const postCard = commentBtn.closest('.post-card');
    if (!postCard) return;

    const input = postCard.querySelector('.comment-input');
    if (input) input.focus();
  });

  // Handle Comment Submission (POST /api/posts/:postId/comments)
  document.addEventListener('submit', async (e) => {
    const commentForm = e.target.closest('.add-comment-form');
    if (!commentForm) return;

    e.preventDefault();
    const token = getToken();

    if (!token) {
      showToast('Please log in to add a comment!', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 1000);
      return;
    }

    const postId = commentForm.getAttribute('data-post-id');
    const input = commentForm.querySelector('.comment-input');
    const commentText = input ? input.value.trim() : '';

    if (!commentText || !postId) return;

    const postCard = commentForm.closest('.post-card');
    const commentsList = document.getElementById(`commentsList-${postId}`);
    const commentCounter = postCard ? postCard.querySelector('.comment-counter') : null;
    const submitBtn = commentForm.querySelector('.btn-post-comment');

    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await authFetch(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentText })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        input.value = '';
        showToast('Comment posted successfully!', 'success');

        const currentUser = getCurrentUser();
        const commentEl = createCommentElement(data.comment, currentUser);
        if (commentsList) commentsList.appendChild(commentEl);

        if (commentCounter) {
          const currentCount = parseInt(commentCounter.textContent) || 0;
          const newCount = currentCount + 1;
          commentCounter.textContent = `${newCount} ${newCount === 1 ? 'comment' : 'comments'}`;
        }
      } else {
        showToast(data.message || 'Failed to post comment', 'warning');
      }
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Handle Delete Comment (DELETE /api/comments/:id)
  document.addEventListener('click', async (e) => {
    const delLink = e.target.closest('.btn-delete-comment');
    if (!delLink) return;

    e.preventDefault();
    const commentId = delLink.getAttribute('data-comment-id');
    if (!commentId) return;

    try {
      const res = await authFetch(`/comments/${commentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Comment deleted', 'info');
        const commentItem = delLink.closest('.comment-item');
        const postCard = delLink.closest('.post-card');
        const commentCounter = postCard ? postCard.querySelector('.comment-counter') : null;

        if (commentItem) commentItem.remove();

        if (commentCounter) {
          const currentCount = parseInt(commentCounter.textContent) || 1;
          const newCount = Math.max(0, currentCount - 1);
          commentCounter.textContent = `${newCount} ${newCount === 1 ? 'comment' : 'comments'}`;
        }
      } else {
        showToast(data.message || 'Could not delete comment', 'warning');
      }
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  });
}

/* ==========================================================================
   11. Suggested Users & Follow / Unfollow Integration
   ========================================================================== */
async function initSuggestedUsers() {
  const container = document.querySelector('.suggested-users-list');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/users`);
    const data = await res.json();

    if (res.ok && data.success && Array.isArray(data.users)) {
      const currentUser = getCurrentUser();
      // Filter out logged-in user
      const users = data.users.filter(u => !currentUser || u._id !== currentUser._id);

      if (users.length === 0) {
        container.innerHTML = '<p style="font-size: 13px; color: var(--text-muted); padding: 8px 0;">No other users found yet.</p>';
        return;
      }

      container.innerHTML = '';
      users.slice(0, 5).forEach(user => {
        const isFollowing = currentUser && Array.isArray(user.followers) && user.followers.includes(currentUser._id);

        const item = document.createElement('div');
        item.className = 'suggested-user-item';
        item.innerHTML = `
          <div class="suggested-user-info">
            <a href="profile.html?id=${user._id}">
              <img src="${user.avatar || DEFAULT_AVATAR}" alt="${escapeHtml(user.username)}" class="avatar avatar-md">
            </a>
            <div class="suggested-user-details">
              <a href="profile.html?id=${user._id}" class="suggested-name">${escapeHtml(user.fullName || user.username)}</a>
              <span class="suggested-subtext">@${escapeHtml(user.username)}</span>
            </div>
          </div>
          <button class="btn ${isFollowing ? 'btn-secondary following' : 'btn-light'} btn-follow" data-user-id="${user._id}">
            ${isFollowing ? 'Following' : 'Follow'}
          </button>
        `;
        container.appendChild(item);
      });
    }
  } catch (err) {
    console.error('Failed to load suggested users:', err);
  }

  // Follow / Unfollow click listener
  document.addEventListener('click', async (e) => {
    const followBtn = e.target.closest('.btn-follow');
    if (!followBtn) return;

    const token = getToken();
    if (!token) {
      showToast('Please log in to follow creators!', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 1000);
      return;
    }

    const targetUserId = followBtn.getAttribute('data-user-id');
    if (!targetUserId) return;

    const isFollowing = followBtn.classList.contains('following');
    followBtn.disabled = true;

    try {
      const endpoint = `/users/${targetUserId}/follow`;
      const method = isFollowing ? 'DELETE' : 'POST';

      const res = await authFetch(endpoint, { method });
      const data = await res.json();

      if (res.ok && data.success) {
        if (isFollowing) {
          followBtn.classList.remove('following', 'btn-secondary');
          followBtn.classList.add('btn-light');
          followBtn.textContent = 'Follow';
          showToast(data.message || 'Unfollowed user', 'info');
        } else {
          followBtn.classList.add('following', 'btn-secondary');
          followBtn.classList.remove('btn-light');
          followBtn.textContent = 'Following';
          showToast(data.message || 'You are now following this user!', 'success');
        }

        // Update local user stats if available
        const currentUser = getCurrentUser();
        if (currentUser && data.currentUser) {
          currentUser.followingCount = data.currentUser.followingCount;
          localStorage.setItem('connecthub_user', JSON.stringify(currentUser));
          const sideFollowing = document.getElementById('sidebarFollowingNum');
          if (sideFollowing) sideFollowing.textContent = currentUser.followingCount;
        }
      } else {
        showToast(data.message || 'Action failed', 'warning');
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      followBtn.disabled = false;
    }
  });
}

/* ==========================================================================
   12. Profile Page (profile.html) Integration
   ========================================================================== */
async function initProfilePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('id');
  const currentUser = getCurrentUser();
  const token = getToken();

  // If no user specified and not logged in, redirect to login
  if (!targetId && !token) {
    showToast('Please log in to view your profile', 'info');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }

  const profileUserId = targetId || (currentUser ? currentUser._id : null);
  if (!profileUserId) return;

  try {
    const res = await fetch(`${API_BASE}/users/${profileUserId}`);
    const data = await res.json();

    if (res.ok && data.success && data.user) {
      const user = data.user;

      // Update Header Info
      const nameEl = document.getElementById('profileDisplayName');
      const usernameEl = document.getElementById('profileDisplayUsername');
      const bioEl = document.getElementById('profileDisplayBio');
      const avatarEl = document.getElementById('profileAvatarImg');
      const statFollowers = document.getElementById('statFollowersCount');
      const statFollowing = document.getElementById('statFollowingCount');

      if (nameEl) nameEl.textContent = user.fullName || user.username;
      if (usernameEl) usernameEl.textContent = `@${user.username}`;
      if (bioEl) bioEl.textContent = user.bio || 'ConnectHub developer exploring code and connections 🚀';
      if (avatarEl) avatarEl.src = user.avatar || DEFAULT_AVATAR;
      if (statFollowers) statFollowers.textContent = user.followersCount || 0;
      if (statFollowing) statFollowing.textContent = user.followingCount || 0;

      // Setup Edit Profile vs Follow button
      const actionsBar = document.querySelector('.profile-actions-bar');
      if (actionsBar) {
        const isMyProfile = currentUser && (currentUser._id === user._id);
        if (isMyProfile) {
          actionsBar.innerHTML = `
            <button class="btn btn-secondary" id="btnOpenEditProfile">
              <i class="fa-solid fa-pen-to-square"></i>
              <span>Edit Profile</span>
            </button>
            <button class="btn btn-light" id="btnShareProfile" title="Share Profile">
              <i class="fa-solid fa-arrow-up-from-bracket"></i>
            </button>
          `;
          initEditProfileModal(user);
        } else {
          // Viewing someone else's profile
          actionsBar.innerHTML = `
            <button class="btn btn-primary btn-follow" data-user-id="${user._id}">
              <i class="fa-solid fa-user-plus"></i>
              <span>Follow</span>
            </button>
            <button class="btn btn-light" id="btnShareProfile" title="Share Profile">
              <i class="fa-solid fa-arrow-up-from-bracket"></i>
            </button>
          `;
        }
      }

      // Load user posts into the 3-column grid
      loadUserPostsGrid(user._id);
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }

  // Share profile button
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btnShareProfile')) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
      }
      showToast('Profile URL copied to clipboard!', 'info');
    }
  });
}

async function loadUserPostsGrid(userId) {
  const grid = document.getElementById('profilePostsGrid');
  const statPosts = document.getElementById('statPostsCount');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/posts`);
    const data = await res.json();

    if (res.ok && data.success && Array.isArray(data.posts)) {
      const userPosts = data.posts.filter(p => p.user && (p.user._id === userId || p.user === userId));

      if (statPosts) statPosts.textContent = userPosts.length;

      if (userPosts.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px 10px; text-align: center; color: var(--text-secondary);">
            <i class="fa-regular fa-images" style="font-size: 38px; color: var(--border-color); margin-bottom: 10px; display: block;"></i>
            <p>No posts published yet.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = '';
      userPosts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'grid-post-item';
        item.setAttribute('data-caption', post.caption);

        const imgUrl = post.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80';
        const likesCount = post.likesCount !== undefined ? post.likesCount : (post.likes ? post.likes.length : 0);
        const commentsCount = post.comments ? post.comments.length : 0;

        item.innerHTML = `
          <img src="${imgUrl}" alt="User post">
          <div class="grid-post-overlay">
            <span><i class="fa-solid fa-heart"></i> ${likesCount}</span>
            <span><i class="fa-solid fa-comment"></i> ${commentsCount}</span>
          </div>
        `;
        grid.appendChild(item);
      });
    }
  } catch (err) {
    console.error('Failed to load user posts grid:', err);
  }
}

/* ==========================================================================
   13. Edit Profile Modal (PUT /api/users/profile)
   ========================================================================== */
function initEditProfileModal(initialUser) {
  const openBtn = document.getElementById('btnOpenEditProfile');
  const closeBtn = document.getElementById('btnCloseEditModal');
  const cancelBtn = document.getElementById('btnCancelEditModal');
  const modal = document.getElementById('editProfileModal');
  const form = document.getElementById('editProfileForm');

  if (!modal || !form) return;

  const openModal = () => {
    const user = getCurrentUser() || initialUser || {};
    const nameInput = document.getElementById('editFullName');
    const usernameInput = document.getElementById('editUsername');
    const avatarInput = document.getElementById('editAvatarUrl');
    const bioInput = document.getElementById('editBio');

    if (nameInput) nameInput.value = user.fullName || '';
    if (usernameInput) {
      usernameInput.value = user.username || '';
      usernameInput.disabled = true; // Username is immutable
    }
    if (avatarInput) avatarInput.value = user.avatar || '';
    if (bioInput) bioInput.value = user.bio || '';

    modal.classList.add('active');
  };

  const closeModal = () => modal.classList.remove('active');

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('editFullName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const avatar = document.getElementById('editAvatarUrl').value.trim();

    try {
      const res = await authFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, bio, avatar })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Profile updated successfully!', 'success');
        localStorage.setItem('connecthub_user', JSON.stringify(data.user));

        // Update UI
        const nameEl = document.getElementById('profileDisplayName');
        const bioEl = document.getElementById('profileDisplayBio');
        const avatarEl = document.getElementById('profileAvatarImg');

        if (nameEl && data.user.fullName) nameEl.textContent = data.user.fullName;
        if (bioEl && data.user.bio) bioEl.textContent = data.user.bio;
        if (avatarEl && data.user.avatar) avatarEl.src = data.user.avatar;

        closeModal();
      } else {
        showToast(data.message || 'Failed to update profile', 'warning');
      }
    } catch (err) {
      console.error('Update profile error:', err);
    }
  });
}

/* ==========================================================================
   14. Profile Tabs
   ========================================================================== */
function initProfileTabs() {
  const tabButtons = document.querySelectorAll('.profile-tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tabName = btn.getAttribute('data-tab');
      showToast(`Viewing ${tabName.toUpperCase()} tab`, 'info');
    });
  });
}

/* ==========================================================================
   15. Search Filter
   ========================================================================== */
function initSearchFilter() {
  const searchInput = document.getElementById('feedSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const posts = document.querySelectorAll('#postsFeedContainer .post-card');

    posts.forEach((post) => {
      const caption = post.querySelector('.post-caption')?.textContent.toLowerCase() || '';
      const author = post.querySelector('.author-info')?.textContent.toLowerCase() || '';

      if (!query || caption.includes(query) || author.includes(query)) {
        post.style.display = 'block';
      } else {
        post.style.display = 'none';
      }
    });
  });
}

/* ==========================================================================
   Helpers: Time formatting & HTML escaping
   ========================================================================== */
function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return past.toLocaleDateString();
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

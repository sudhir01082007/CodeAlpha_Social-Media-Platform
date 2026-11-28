/**
 * ConnectHub Social Media Platform - Full Stack Automated Test Suite
 * Tests authentication, profiles, posts, likes, comments, follow/unfollow,
 * security headers, health monitoring, and data persistence.
 */

const http = require('http');
const mongoose = require('mongoose');
const { app } = require('./server');

const PORT = 5099; // Dedicated test port to avoid conflict with running servers
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

let serverInstance;
let passCount = 0;
let failCount = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
};

const runTestSuite = async () => {
  console.log('=====================================================');
  console.log('🧪 CONNECTHUB SOCIAL MEDIA PLATFORM VERIFICATION');
  console.log('=====================================================\n');

  // Connect to local MongoDB connecthub database for testing
  const testMongoUri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/connecthub';
  await mongoose.connect(testMongoUri, { dbName: 'connecthub' });
  console.log('Connected to test MongoDB database.');

  // Start HTTP listener
  await new Promise((resolve) => {
    serverInstance = app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}\n`);
      resolve();
    });
  });

  const timestamp = Date.now();
  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';
  let createdPostId = '';
  let createdCommentId = '';

  // -----------------------------------------------------------------
  // 1. Health Monitoring & Security Headers
  // -----------------------------------------------------------------
  console.log('--- 1. Health Monitoring & Security Headers ---');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    assert(res.status === 200, 'GET /api/health returns HTTP 200');
    const health = await res.json();
    assert(health.status === 'healthy', 'Health check reports status: "healthy"');
    assert(health.database.status === 'connected', 'Health check confirms database is connected');
    assert(res.headers.get('x-content-type-options') === 'nosniff', 'Security header X-Content-Type-Options: nosniff present');
    assert(res.headers.get('x-frame-options') === 'SAMEORIGIN', 'Security header X-Frame-Options: SAMEORIGIN present');
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 2. User Registration (POST /api/auth/register)
  // -----------------------------------------------------------------
  console.log('\n--- 2. User Registration & Security ---');
  try {
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Sarah Connor',
        username: `sarah_${timestamp}`,
        email: `sarah_${timestamp}@connecthub.io`,
        password: 'Password123!',
        bio: 'Protecting the future 🤖',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      }),
    });
    const regDataA = await regResA.json();
    assert(regResA.status === 201, 'User A registered successfully with HTTP 201');
    assert(Boolean(regDataA.token), 'Registration returns signed JWT token');
    assert(regDataA.user?.password === undefined, 'Password hash is excluded from response');
    userAToken = regDataA.token;
    userAId = regDataA.user?._id;

    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'John Connor',
        username: `john_${timestamp}`,
        email: `john_${timestamp}@connecthub.io`,
        password: 'Password123!',
        bio: 'Leading the resistance 🚀',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      }),
    });
    const regDataB = await regResB.json();
    assert(regResB.status === 201, 'User B registered successfully with HTTP 201');
    userBToken = regDataB.token;
    userBId = regDataB.user?._id;

    // Test duplicate registration rejection
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate Sarah',
        username: `sarah_${timestamp}`,
        email: `sarah_${timestamp}@connecthub.io`,
        password: 'Password123!',
      }),
    });
    assert(dupRes.status === 400, 'Duplicate username/email registration rejected with HTTP 400');
  } catch (err) {
    assert(false, `Registration tests failed: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 3. User Login & JWT Authentication
  // -----------------------------------------------------------------
  console.log('\n--- 3. User Login & Session Authentication ---');
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `sarah_${timestamp}@connecthub.io`,
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'User A logged in successfully with HTTP 200');
    assert(Boolean(loginData.token), 'Login returns valid authentication token');

    // Test wrong password rejection
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `sarah_${timestamp}@connecthub.io`,
        password: 'WrongPassword999!',
      }),
    });
    assert(badLoginRes.status === 401, 'Invalid credentials rejected with HTTP 401');

    // Test GET /api/auth/me
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me returns HTTP 200');
    assert(meData.user?._id === userAId, 'Authenticated user ID matches User A');
  } catch (err) {
    assert(false, `Login tests failed: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 4. Create Post (POST /api/posts)
  // -----------------------------------------------------------------
  console.log('\n--- 4. Creating Social Media Posts ---');
  try {
    const postRes = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        caption: 'Excited to announce our new open source project! 💻✨',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
      }),
    });
    const postData = await postRes.json();
    assert(postRes.status === 201, 'Post created successfully with HTTP 201');
    assert(postData.post?.caption.includes('Excited to announce'), 'Post caption persisted accurately');
    assert(postData.post?.user?.username === `sarah_${timestamp}`, 'Post author populated with username');
    createdPostId = postData.post?._id;

    // Test empty post rejection
    const emptyPostRes = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ caption: '' }),
    });
    assert(emptyPostRes.status === 400, 'Empty caption post rejected with HTTP 400');
  } catch (err) {
    assert(false, `Post creation failed: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 5. Retrieve Posts (GET /api/posts & GET /api/posts/:id)
  // -----------------------------------------------------------------
  console.log('\n--- 5. Retrieving Posts & Feed ---');
  try {
    const allPostsRes = await fetch(`${BASE_URL}/posts`);
    const allPostsData = await allPostsRes.json();
    assert(allPostsRes.status === 200, 'GET /api/posts returns HTTP 200');
    assert(Array.isArray(allPostsData.posts), 'Posts feed returned as an array');
    assert(allPostsData.posts.some((p) => p._id === createdPostId), 'Created post exists in public feed');

    const singlePostRes = await fetch(`${BASE_URL}/posts/${createdPostId}`);
    const singlePostData = await singlePostRes.json();
    assert(singlePostRes.status === 200, 'GET /api/posts/:id returns HTTP 200');
    assert(singlePostData.post?._id === createdPostId, 'Single post details match requested ID');
  } catch (err) {
    assert(false, `Post retrieval failed: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 6. Like & Unlike Post (Toggle: POST /api/posts/:id/like)
  // -----------------------------------------------------------------
  console.log('\n--- 6. Liking and Unliking Posts ---');
  try {
    // User B likes User A's post
    const likeRes = await fetch(`${BASE_URL}/posts/${createdPostId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const likeData = await likeRes.json();
    assert(likeRes.status === 200, 'Liking post returns HTTP 200');
    assert(likeData.liked === true, 'Response confirms post is liked (liked: true)');
    assert(likeData.likesCount === 1, 'Likes count incremented to 1');

    // User B unlikes (toggle)
    const unlikeRes = await fetch(`${BASE_URL}/posts/${createdPostId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const unlikeData = await unlikeRes.json();
    assert(unlikeRes.status === 200, 'Unliking post returns HTTP 200');
    assert(unlikeData.liked === false, 'Response confirms post is unliked (liked: false)');
    assert(unlikeData.likesCount === 0, 'Likes count decremented to 0');
  } catch (err) {
    assert(false, `Like tests failed: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 7. Comments Management (POST, GET, DELETE)
  // -----------------------------------------------------------------
  console.log('\n--- 7. Comments System & Permissions ---');
  try {
    // User B comments on User A's post
    const commentRes = await fetch(`${BASE_URL}/posts/${createdPostId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({ text: 'Looks amazing, congratulations!' }),
    });
    const commentData = await commentRes.json();
    assert(commentRes.status === 201, 'Comment added with HTTP 201');
    assert(commentData.comment?.text === 'Looks amazing, congratulations!', 'Comment text persisted');
    createdCommentId = commentData.comment?._id;

    // Fetch comments for post
    const getCommentsRes = await fetch(`${BASE_URL}/posts/${createdPostId}/comments`);
    const getCommentsData = await getCommentsRes.json();
    assert(getCommentsRes.status === 200, 'GET /api/posts/:postId/comments returns HTTP 200');
    assert(getCommentsData.comments.some((c) => c._id === createdCommentId), 'Comment present in comments list');

    // Unauthorized delete attempt (User A attempts to delete User B's comment)
    const unauthDelRes = await fetch(`${BASE_URL}/comments/${createdCommentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert(unauthDelRes.status === 403, 'Non-author cannot delete comment (HTTP 403 Forbidden)');

    // Authorized delete by author (User B)
    const authDelRes = await fetch(`${BASE_URL}/comments/${createdCommentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(authDelRes.status === 200, 'Author deleted comment with HTTP 200');
  } catch (err) {
    assert(false, `Comment tests failed: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 8. User Profiles & Follow/Unfollow System
  // -----------------------------------------------------------------
  console.log('\n--- 8. User Profiles & Follow / Unfollow System ---');
  try {
    // User A follows User B
    const followRes = await fetch(`${BASE_URL}/users/${userBId}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const followData = await followRes.json();
    assert(followRes.status === 200, 'User A followed User B (HTTP 200)');
    assert(followData.targetUser?.followersCount === 1, 'Target user followers count updated to 1');

    // Self-follow rejection
    const selfFollowRes = await fetch(`${BASE_URL}/users/${userAId}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert(selfFollowRes.status === 400, 'User cannot follow themselves (HTTP 400 Bad Request)');

    // Check followers list
    const followersRes = await fetch(`${BASE_URL}/users/${userBId}/followers`);
    const followersData = await followersRes.json();
    assert(followersRes.status === 200, 'GET /api/users/:id/followers returns HTTP 200');
    assert(followersData.followers.some((f) => f._id === userAId), 'User A is listed in User B followers');

    // User A unfollows User B
    const unfollowRes = await fetch(`${BASE_URL}/users/${userBId}/unfollow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert(unfollowRes.status === 200, 'User A unfollowed User B (HTTP 200)');

    // Update Profile
    const updateProfileRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        fullName: 'Sarah Connor Updated',
        bio: 'Updated bio for production deployment testing',
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(updateProfileRes.status === 200, 'Profile updated successfully with HTTP 200');
    assert(updateProfileData.user?.fullName === 'Sarah Connor Updated', 'Updated profile name persisted');
  } catch (err) {
    assert(false, `Follow/profile tests failed: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 9. Post Deletion & Ownership Protection
  // -----------------------------------------------------------------
  console.log('\n--- 9. Post Deletion & Ownership Security ---');
  try {
    // User B attempts to delete User A's post
    const unauthPostDel = await fetch(`${BASE_URL}/posts/${createdPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(unauthPostDel.status === 403, 'Non-author cannot delete another user post (HTTP 403)');

    // User A deletes own post
    const authPostDel = await fetch(`${BASE_URL}/posts/${createdPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert(authPostDel.status === 200, 'Author deleted post with HTTP 200');

    // Check post is gone
    const postGoneRes = await fetch(`${BASE_URL}/posts/${createdPostId}`);
    assert(postGoneRes.status === 404, 'Deleted post returns HTTP 404 Not Found');
  } catch (err) {
    assert(false, `Post deletion failed: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // Clean Up & Summary
  // -----------------------------------------------------------------
  console.log('\n=====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passCount} PASSED | ${failCount} FAILED`);
  console.log('=====================================================');

  serverInstance.close();
  await mongoose.disconnect();

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

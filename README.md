# Minibook

Minibook is a small, self-hosted social-network starter built with Express, SQLite, and plain browser JavaScript. Social pages and data APIs require an account; visitors are redirected to sign in or create one first.

## Features

- **Accounts & Profiles**: Create accounts, customize display name, bio, avatar, and cover image.
- **Social Graph**: Follow other users or send friend requests. 
- **Posts**: Create posts with optional text and media. Post visibility can be set to `public`, `friends`, or `private`.
- **Media Uploads**: Image and video uploads (up to 25 MB).
- **Interactions**: Share posts, leave comments (and replies), and react (like, love, laugh, wow, sad, angry).
- **Notifications**: Persistent activity notifications for likes, comments, and shares on your posts. Unread navigation badge refreshes automatically.
- **Responsive UI**: Centered header with bottom navigation (Profile, Feed, Notifications, Find people).
- **Dark Mode**: Peach-and-brown theme with persistent saved dark mode (follows device setting initially).

## Project Structure

```text
minibook/
├── database/        # SQLite setup, SQL schema, and seeding script
├── middleware/      # Express middlewares (authentication, multer for uploads)
├── public/          # Frontend assets (HTML pages, CSS, client-side JS)
├── routes/          # Express API route handlers (auth, posts, users, etc.)
├── uploads/         # Storage directory for user-uploaded media
├── utils/           # Helper and utility functions
├── server.js        # Main application entry point
├── package.json     # NPM scripts and dependencies
└── README.md        # Project documentation
```

## How to Use

1. **Install Dependencies**: Run `npm install` in the project root.
2. **Database Setup**: Run `npm run seed` to initialize the SQLite database (`database/social.db`) and insert dummy data (users `alice`, `ben`, `chloe` with password `minibook123`).
3. **Start the Server**: Run `npm start` (or `npm run dev` for watch mode).
4. **Access the App**: Open <http://localhost:3000> in your browser.
5. **Usage**:
   - **Authentication**: You will be greeted by the login screen. You can either create a new account or log in with one of the seeded accounts (e.g., username `alice`, password `minibook123`).
   - **Navigation**: Once signed in, use the bottom navigation bar to switch between the Home Feed, your Profile, Notifications, and the Search page.
   - **Create Post**: From your profile, you can create new posts and choose who can see them (Public, Friends, Private).
   - **Interact**: Find other seeded users on the Search page, send them friend requests or follow them, and interact with their posts on your feed.

## Configuration

- `PORT`: HTTP port (default `3000`)
- `SESSION_SECRET`: set a long, random value outside local development
- `NODE_ENV=production`: enables the session cookie's `Secure` flag; serve behind HTTPS

The default Express memory session store is only suitable for local development. Use a persistent session store and configure proxy/HTTPS settings before production deployment. Also configure upload storage, backups, rate limiting, and operational monitoring for a public deployment.

## Main Routes

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/users/search?q=...`, `GET /api/users/:username`, `PATCH /api/users/me/profile`
- `POST|DELETE /api/follows/:userId`
- `GET /api/friends`, friend request/accept/reject endpoints under `/api/friends`
- `POST /api/posts`, `GET /api/posts/feed`, `GET /api/posts/:postId`, `GET /api/posts/user/:username`
- `GET|POST /api/posts/:postId/comments`
- `GET|POST /api/reactions/:targetType/:targetId`
- `GET /api/notifications`, `POST /api/notifications/read-all`, `POST /api/notifications/:notificationId/read`

# Minibook 📖✨

Minibook is a lightweight, self-hosted, full-stack social networking platform built with **Node.js**, **Express**, **SQLite** (using the native `node:sqlite` engine), and modern **Vanilla JavaScript**. It delivers an intuitive social experience featuring customizable user profiles, an interactive feed with granular privacy controls, threaded comments, emoji reactions, friend requests, user following, persistent activity notifications, real-time direct messaging with photo/video attachments, and a warm peach-and-brown aesthetic with persistent dark mode.

---

## 🌟 Key Features

### 👤 User Accounts & Profiles
- **Authentication**: Secure registration and login powered by `bcryptjs` password hashing and `express-session` cookies.
- **Profile Customization**: Update display name, bio, profile avatar, and header cover banner.
- **Profile Hub**: View user post timelines, follow status, friendship state, and instant direct message buttons.

### 👥 Social Graph & Relationships
- **Friend System**: Send, accept, and decline friend requests, plus manage your friends circle.
- **Follow System**: Follow any user to populate your home feed with their public updates.
- **Search & Discovery**: Find people by searching usernames or display names, and explore recommended connections.

### 📝 Dynamic Feed & Media Posts
- **Rich Posts**: Publish text posts with optional image or video attachments (supports up to 25 MB per upload).
- **Granular Privacy**: Set post visibility to:
  - 🌐 `public` — visible to all registered users.
  - 👥 `friends` — exclusive to confirmed friends.
  - 🔒 `private` — visible only to the author.
- **Post Sharing & Deletion**: Repost and share posts with author attribution or delete your own posts.

### 💬 Direct Messaging & Chat
- **1-on-1 Conversations**: Chat directly with other users with immediate conversation sorting and message histories.
- **Media Attachments**: Send photos and videos inside chat messages.
- **Read Receipts & Badges**: Automatic unread message tracking, read receipt status, and a live navbar unread badge.
- **Instant Shortcuts**: One-click "Message" action directly from user profile cards and navigation shortcuts.

### ❤️ Reactions & Threaded Comments
- **6 Expressive Reactions**: React with Like (👍), Love (❤️), Laugh (😂), Wow (😮), Sad (😢), or Angry (😡) on posts and comments.
- **Threaded Discussions**: Nested comment replies with live reaction counts and comment counters.

### 🔔 Activity Notifications
- **Persistent Notifications**: Get alerted when people like, comment on, or share your posts.
- **Live Notification Badge**: Unread indicator on the bottom navigation bar that updates periodically and on tab focus.
- **Notification Center**: Review activity history, jump to source posts, or mark notifications as read.

### 🎨 Modern UI & Dark Mode
- **Peach & Brown Aesthetic**: Warm, clean visual design with subtle micro-interactions and smooth transitions.
- **Persistent Dark Mode**: Toggle between light and dark themes; automatically defaults to the system preference and persists via `localStorage`.
- **Responsive Navigation**: Ergonomic bottom navigation bar (Feed, Find people, Messages, Notifications, Profile) optimized for both desktop and mobile screens.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Runtime** | Node.js | `>= 22.5.0` (utilizes the built-in `node:sqlite` driver) |
| **Backend Framework** | Express.js | `v4.21.2` with RESTful API architecture |
| **Authentication** | express-session & bcryptjs | Cookie session store & salted password hashing |
| **Database** | SQLite 3 | WAL mode with foreign key cascade constraints |
| **File Uploads** | Multer | Segregated disk storage for avatars, covers, posts, and messages |
| **Frontend** | HTML5, CSS3 & ES6+ JS | Vanilla web standards, CSS variables, dark mode tokens, Fetch API |

---

## 📁 Project Structure

```text
Minibook/
├── database/
│   ├── db.js                     # SQLite database connection & pragmas (WAL mode, FKs)
│   ├── schema.sql                # Complete relational database DDL & indexes
│   ├── seed.js                   # Database seed script for dummy users & sample data
│   ├── update_dummy_accounts.js  # Script to attach media assets & sample chats
│   └── verify_all.js             # Automated database & relationship integrity test
├── middleware/
│   ├── auth.js                   # Authentication & route authorization middleware
│   └── upload.js                 # Multer storage configuration for avatars, covers, posts & messages
├── public/
│   ├── css/
│   │   └── theme.css             # Main styling, responsive layouts, color tokens & dark mode
│   ├── js/
│   │   ├── api.js                # Reusable JSON Fetch wrapper
│   │   ├── auth.js               # Auth form handling & validation
│   │   ├── comments.js           # Comment rendering, replies & deletion
│   │   ├── feed.js               # Post feed loader & pagination
│   │   ├── friends.js            # Friend request management & friends lists
│   │   ├── messages.js           # Direct chat UI, conversation threads & attachments
│   │   ├── notifications.js      # Notifications rendering & read status
│   │   ├── post.js               # Single post detail view & actions
│   │   ├── profile.js            # Profile editing, cover/avatar uploads & timeline
│   │   ├── reactions.js          # Emoji reaction buttons & modal counts
│   │   ├── search.js             # User search & discover filters
│   │   ├── theme.js              # Theme switcher & dark mode persistence
│   │   └── ui.js                 # Global navigation bar & badge polling
│   ├── index.html                # Home feed & sidebar shortcuts
│   ├── friends.html              # Friends & connection requests
│   ├── login.html                # Account login page
│   ├── messages.html             # Direct messaging & conversation view
│   ├── notifications.html        # Notification activity center
│   ├── post.html                 # Dedicated post view
│   ├── profile.html              # User profile & posts view
│   ├── register.html             # New user registration page
│   └── search.html               # User search & discover page
├── routes/
│   ├── auth.routes.js            # Register, login, logout, me
│   ├── comments.routes.js        # Post comments & replies
│   ├── follow.routes.js          # Follow & unfollow users
│   ├── friends.routes.js         # Friend requests & status endpoints
│   ├── messages.routes.js        # Direct chat threads, message sending & read receipts
│   ├── notifications.routes.js   # Notification listing & marking as read
│   ├── posts.routes.js           # Post CRUD, feeds, visibility & sharing
│   ├── reactions.routes.js       # Reactions on posts & comments
│   └── users.routes.js           # User profiles, search & profile updates
├── uploads/
│   ├── avatars/                  # Profile avatar images
│   ├── covers/                   # Profile cover banner images
│   ├── messages/                 # Media attachments sent via direct messages
│   └── posts/                    # Images & videos attached to posts
├── server.js                     # Express app configuration & server entry point
├── package.json                  # Project metadata, dependencies & scripts
├── .gitignore                    # Git ignore rules for node_modules, DB & media
└── README.md                     # Comprehensive project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version `22.5.0` or higher (Node 22 comes with built-in SQLite support via `node:sqlite`).
- **npm**: Node package manager.

### 1. Clone the Repository
```sh
git clone https://github.com/nafilridin18/CodeAlpha_Social-Media-Platform-minibook-.git
cd CodeAlpha_Social-Media-Platform-minibook-
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Initialize & Seed Database
Initialize SQLite tables and create sample demo accounts:
```sh
npm run seed
```
> **Seed Accounts**:
> | Username | Password | Bio |
> |---|---|---|
> | `alice` | `minibook123` | Coffee, books, and small adventures. |
> | `ben` | `minibook123` | Photographer and weekend hiker. |
> | `chloe` | `minibook123` | Always finding a new playlist. |

### 4. Start the Application
- **Production mode**:
  ```sh
  npm start
  ```
- **Development mode** (with auto-reload):
  ```sh
  npm run dev
  ```

### 5. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** in your web browser.

---

## ⚙️ Configuration & Environment

You can configure runtime options using environment variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port the server listens on |
| `SESSION_SECRET` | `minibook-secret-key-change-me` | Secret key used to sign session cookies |
| `NODE_ENV` | `development` | Set to `production` to enforce HTTPS session security |

> [!NOTE]
> For production deployments, ensure `SESSION_SECRET` is set to a strong random string, configure persistent session storage, and run the app behind a reverse proxy (e.g., Nginx, Caddy) with SSL/TLS enabled.

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`username`, `password`, `display_name`) |
| `POST` | `/api/auth/login` | Log in with credentials and establish session |
| `POST` | `/api/auth/logout` | Terminate session |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile |

### 👤 Users & Profiles (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/search?q=...` | Search users by username or display name |
| `GET` | `/api/users/:username` | Retrieve full profile details and relationship state |
| `PATCH` | `/api/users/me/profile` | Update profile info, avatar, and cover banner |

### 📝 Posts (`/api/posts`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/posts` | Create a new post (`content`, `media`, `visibility`) |
| `GET` | `/api/posts/feed` | Retrieve feed of followed users, friends & public posts |
| `GET` | `/api/posts/:postId` | Get single post details with media and reactions |
| `GET` | `/api/posts/user/:username` | Retrieve all posts authored by a specific user |
| `POST` | `/api/posts/:postId/share` | Share/repost an existing post |
| `DELETE` | `/api/posts/:postId` | Delete post (author only) |

### 💬 Direct Messaging (`/api/messages`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/messages/conversations` | Get list of recent chat conversations and latest message previews |
| `GET` | `/api/messages/unread-count` | Get total count of unread incoming messages |
| `GET` | `/api/messages/:otherUserId` | Fetch full message history with user and mark as read |
| `POST` | `/api/messages/:otherUserId` | Send message (text with optional photo/video attachment) |
| `GET` | `/api/messages/user/:username` | Resolve user ID and details by username for quick chat lookup |

### 💬 Comments (`/api`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/posts/:postId/comments` | Retrieve comments and nested replies on a post |
| `POST` | `/api/posts/:postId/comments` | Add a comment or reply (`body`, optional `parent_comment_id`) |
| `DELETE` | `/api/comments/:commentId` | Delete a comment (author only) |

### ❤️ Reactions (`/api/reactions`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reactions/:targetType/:targetId` | Get breakdown and active user reaction (`targetType`: `post` \| `comment`) |
| `POST` | `/api/reactions/:targetType/:targetId` | Toggle or set reaction (`like`, `love`, `laugh`, `wow`, `sad`, `angry`) |

### 🤝 Friends & Follows (`/api/friends` & `/api/follows`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/friends` | Get accepted friends list |
| `GET` | `/api/friends/requests` | List incoming and outgoing pending requests |
| `POST` | `/api/friends/request/:userId` | Send friend request |
| `POST` | `/api/friends/accept/:requestId` | Accept incoming friend request |
| `POST` | `/api/friends/reject/:requestId` | Reject incoming friend request |
| `DELETE` | `/api/friends/:friendId` | Remove user from friends |
| `POST` | `/api/follows/:userId` | Follow a user |
| `DELETE` | `/api/follows/:userId` | Unfollow a user |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Fetch recent notifications with unread counter |
| `POST` | `/api/notifications/read-all` | Mark all notifications as read |
| `POST` | `/api/notifications/:notificationId/read` | Mark single notification as read |

### 🩺 System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint returning `{ ok: true }` |

---

## 🛡️ License

This project is open-source and available under the [MIT License](LICENSE).

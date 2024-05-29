const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { log } = require('handlebars');

// SQLite database
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

// google oauth
const passport = require('passport');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 3000;
require('dotenv').config();

// Use environment variables for emoji API Key, client ID, and secret
const accessToken = process.env.EMOJI_API_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Create Google OAuth 2.0 client and redirect URI
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Establish a connection to the SQLite database when the server starts
// Create an asynchronous function at the start of the server to connect to the SQLite database
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const dbFileName = 'database.db';
let db;

async function initializeDB() {
    db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    console.log('Database initialized.');
}

async function getDB() {
    if (!db) {
        await initializeDB();
    }
    return db;
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Handlebars Helpers

    Handlebars helpers are custom functions that can be used within the templates 
    to perform specific tasks. They enhance the functionality of templates and 
    help simplify data manipulation directly within the view files.

    In this project, two helpers are provided:
    
    1. toLowerCase:
       - Converts a given string to lowercase.
       - Usage example: {{toLowerCase 'SAMPLE STRING'}} -> 'sample string'

    2. ifCond:
       - Compares two values for equality and returns a block of content based on 
         the comparison result.
       - Usage example: 
            {{#ifCond value1 value2}}
                <!-- Content if value1 equals value2 -->
            {{else}}
                <!-- Content if value1 does not equal value2 -->
            {{/ifCond}}

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// Set up Handlebars view engine with custom helpers
//
app.engine(
    'handlebars',
    expressHandlebars.engine({
        helpers: {
            toLowerCase: function (str) {
                return str.toLowerCase();
            },
            ifCond: function (v1, v2, options) {
                if (v1 === v2) {
                    return options.fn(this);
                }
                return options.inverse(this);
            },
        },
    })
);

app.set('view engine', 'handlebars');
app.set('views', './views');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(
    session({
        secret: 'oneringtorulethemall',     // Secret key to sign the session ID cookie
        resave: false,                      // Don't save session if unmodified
        saveUninitialized: false,           // Don't create session until something stored
        cookie: { secure: false },          // True if using https. Set to false for development without https
    })
);

// Replace any of these variables below with constants for your application. These variables
// should be used in your template files. 
// 
app.use((req, res, next) => {
    res.locals.appName = 'iBlog';
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = 'Post';
    res.locals.loggedIn = req.session.loggedIn || false;
    res.locals.userId = req.session.userId || '';
    next();
});

app.use(express.static('public'));                  // Serve static files
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());                            // Parse JSON bodies (as sent by API clients)

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Routes for Google OAuth
// Redirect to Google's OAuth 2.0 server
app.get('/auth/google', (req, res) => {
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    });
    res.redirect(url);
});

// Handle OAuth 2.0 server response
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({
        auth: client,
        version: 'v2',
    });

    const userinfo = await oauth2.userinfo.get();
    const googleId = userinfo.data.id;
    const hashedGoogleId = await bcrypt.hash(googleId, 10);
    const db = await getDB();

    // check if user exists in the database
    let user = await db.get('SELECT * FROM users WHERE hashedGoogleId = ?', [hashedGoogleId]);

    if (user) {
        // User exists: set session and redirect to home
        req.session.userId = user.id;
        req.session.loggedIn = true;
        res.redirect('/');
    } else {
        // user does not exist: store hashed Google ID in session and redirect to username registration
        req.session.hashedGoogleId = hashedGoogleId;
        req.session.tokens = tokens;
        res.redirect('/registerUsername');
    }
});

// route to handle the logout callback
app.get('/logoutCallback', (req, res) => {
    res.render('googleLogoutConfirmation');
});

// Logout Confirmation Route
app.get('/googleLogout', (req, res) => {
    res.render('googleLogout');
});

// Home route: render home view with posts and user
// We pass the posts and user variables into the home
// template

app.get('/', async (req, res) => {
    const db = await getDB();
    const user = await getCurrentUser(req) || {};
    // default: render posts ordered by timestamp
    let posts = await db.all('SELECT * FROM posts ORDER BY timestamp DESC')
    const sortOption = req.query.sort;

    // sort posts by likes if the sort query parameter is set to 'likes'
    if (sortOption === 'likes') {
        posts = await db.all('SELECT * FROM posts ORDER BY likes DESC');
    } else {
        posts = await db.all('SELECT * FROM posts ORDER BY timestamp DESC');
    }
    res.render('home', { posts, user, accessToken, sortRecent: sortOption === 'recent', sortLikes: sortOption === 'likes' });
});

// Username Registration Route
app.get('/registerUsername', (req, res) => {
    res.render('registerUsername', { error: req.query.error });
});

// Login route GET route is used for error response from login
app.get('/login', (req, res) => {
    res.render('loginRegister', { loginError: req.query.error });
});

// Error route: render error page
//
app.get('/error', (req, res) => {
    res.render('error');
});

// Additional routes that you must implement
// POST routes

app.post('/posts', async (req, res) => {
    // Add a new post and redirect to home
    const title = req.body.title;
    const content = req.body.content;
    const user = await getCurrentUser(req);
    
    if (user) {
        await addPost(title, content, user);
        res.redirect('/');
    } else {
        res.redirect('/login');
    }

});
app.post('/like/:id', async (req, res) => {
    // Update post likes
    await updatePostLikes(req, res);
});
app.get('/profile', isAuthenticated, async (req, res) => {
    // Render profile page
    await renderProfile(req, res);
});
app.get('/avatar/:username', (req, res) => {
    // Serve the avatar image for the user
    handleAvatar(req, res);
});

// Register and login routes with Google OAuth
app.post('/registerUsername', async (req, res) => {
    await registerUsername(req, res);
});

app.get('/logout', (req, res) => {
    // Logout the user
    logoutUser(req, res);
});

app.post('/delete/:id', isAuthenticated, async (req, res) => {
    // Delete a post if the current user is the owner
    const postId = req.params.id;
    const user = await getCurrentUser(req);
    const db = await getDB();
    const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId]);
    // const postIndex = posts.findIndex(post => post.id === parseInt(postId));

    if (post && post.username === user.username) {
        await db.run('DELETE FROM posts WHERE id = ?', [postId]);
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Post not found.' });
    }
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
// call the database initialization function before starting to listen for incoming requests
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

(async () => {
    try {
        await initializeDB();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
})();

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    console.log(req.session.userId);
    if (req.session.userId) {
        next();
    } else {
        res.json({ success: false, message: 'Not logged in' });
        res.redirect('/login');
    }
}

async function registerUsername(req, res) {
    const db = await getDB();
    const username = req.body.username;
    const hashedGoogleId = req.session.hashedGoogleId;

    try {
        // check if the username already exists
        const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.render('registerUsername', { error: 'Username already exists' });
        }
        const avatar_path = saveAvatar(username);
        await db.run(
            'INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)',
            [username, hashedGoogleId, avatar_path, new Date().toLocaleString()]
        );
        const user = await db.get('SELECT * FROM users WHERE hashedGoogleId = ?', [hashedGoogleId]);
        req.session.userId = user.id;
        req.session.loggedIn = true;
        res.redirect('/');
    } catch (error) {
        res.render('registerUsername', { error: 'An error occurred during registration' });
    }
}

// Function to logout a user
function logoutUser(req, res) {
    // Destroy session and redirect appropriately
    req.session.destroy(err => {
        if (err) {
            console.log("Error destroying session");
            res.redirect('/error');
        } else {
            // Redirect to the Google logout page
            res.redirect('/googleLogout');
        }
    });
}

// Function to render the profile page
async function renderProfile(req, res) {
    // Fetch user posts and render the profile page
    const db = await getDB();
    const user = await getCurrentUser(req);
    if (user) {
        const usr_posts = await db.all("SELECT * FROM posts WHERE username = ?", [user.username]);
        console.log("user posts", usr_posts);
        res.render('profile', { user, usr_posts });
    } else {
        // If user is not authenticated, redirect to login
        res.redirect('/login');
    }
}

// Function to update post likes
async function updatePostLikes(req, res) {
    // Increment post likes if conditions are met
    // current user
    const userId = req.session.userId;
    // the post that is being liked
    const postId = req.params.id;
    const db = await getDB();

    if (!userId) {
        return res.json({ success: false, message: 'Not logged in' });
    }

    try {
        // check if the user has already liked the post
        const likeExists = await db.get('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
        if (likeExists) {
            // The user has already liked the post - unlike the post
            await db.run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
            await db.run('UPDATE posts SET likes = likes - 1 WHERE id = ?', [postId]);
        } else {
            // The user has not liked the post - like the post
            await db.run('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
            await db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId]);
        }

        const updatedPost = await db.get('SELECT likes FROM posts WHERE id = ?', [postId]);
        res.json({ success: true, likes: updatedPost.likes, liked: !likeExists });
    } catch (error) {
        console.error('Error updating post likes:', error);
        res.json({ success: false });
    }
}

// Function to handle avatar generation and serving
function handleAvatar(req, res) {
    // Generate and serve the user's avatar image
    const username = req.params.username;
    const letter = username.charAt(0).toUpperCase();
    const avatarBuffer = generateAvatar(letter);
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(avatarBuffer, 'binary');
}

// Function to get the current user from session
async function getCurrentUser(req) {
    // Return the user object if the session user ID matches
    const db = await getDB();
    userID = req.session.userId;
    if (userID !== undefined) {
        return await db.get('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    }
    else {
        return undefined;
    }
}

// Function to add a new post to the database
async function addPost(title, content, user) {
    // Create a new post and insert it into the database
    const db = await getDB();
    const timestamp = new Date().toLocaleString();
    const avatar_url = user.avatar_url;
    await db.run(
        'INSERT INTO posts (title, content, username, timestamp, avatar_url, likes) VALUES (?, ?, ?, ?, ?, ?)',
        [title, content, user.username, timestamp, avatar_url, 0]
    );
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// functions to generate an avatar image
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function generateAvatar(letter, width = 100, height = 100) {
    // Steps to generate an avatar image with a letter:
    // 1. Choose a color scheme based on the letter
    const backgroundColor = getRandomColor();
    // 2. Create a canvas with the specified width and height
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 3. Draw the background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // 4. Draw the letter in the center
    ctx.fillStyle = '#000';
    ctx.font = `${width / 2}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, width / 2, height / 2);

    // 5. Return the avatar as a PNG buffer
    return canvas.toBuffer();
}

// generate a random color for the background of the avatar
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to save the avatar to a file and return the URL
function saveAvatar(username) {
    const letter = username.charAt(0).toUpperCase();
    const avatarBuffer = generateAvatar(letter);
    const avatarPath = path.join(__dirname, 'public', 'avatars', `${username}.png`);
    fs.mkdirSync(path.dirname(avatarPath), { recursive: true });
    fs.writeFileSync(avatarPath, avatarBuffer);

    // Return the URL for the avatar
    return `/avatars/${username}.png`;
}

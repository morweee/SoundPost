const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { log } = require('handlebars');
require('dotenv').config();

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 3000;

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
    res.locals.appName = 'MicroBlog';
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = 'Post';
    res.locals.loggedIn = req.session.loggedIn || false;
    res.locals.userId = req.session.userId || '';
    next();
});

app.use(express.static('public'));                  // Serve static files
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());                            // Parse JSON bodies (as sent by API clients)

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Home route: render home view with posts and user
// We pass the posts and user variables into the home
// template
const accessToken = process.env.EMOJI_API_KEY;

app.get('/', (req, res) => {
    const posts = getPosts();
    const user = getCurrentUser(req) || {};
    res.render('home', { posts, user, accessToken });
});

// Register GET route is used for error response from registration
//
app.get('/register', (req, res) => {
    res.render('loginRegister', { regError: req.query.error });
});

// Login route GET route is used for error response from login
//
app.get('/login', (req, res) => {
    res.render('loginRegister', { loginError: req.query.error });
});

// Error route: render error page
//
app.get('/error', (req, res) => {
    res.render('error');
});

// Additional routes that you must implement

app.post('/posts', (req, res) => {
    // TODO: Add a new post and redirect to home
    const title = req.body.title;
    const content = req.body.content;
    addPost(title, content, getCurrentUser(req));
    console.log("all current posts", posts);
    res.redirect('/');

});
app.post('/like/:id', (req, res) => {
    // TODO: Update post likes
    updatePostLikes(req, res);
});
app.get('/profile', isAuthenticated, (req, res) => {
    // TODO: Render profile page
    renderProfile(req, res);
});
app.get('/avatar/:username', (req, res) => {
    // TODO: Serve the avatar image for the user
    handleAvatar(req, res);
});
app.post('/register', (req, res) => {
    // TODO: Register a new user
    registerUser(req, res);
});
app.post('/login', (req, res) => {
    // TODO: Login a user
    loginUser(req, res);

});
app.get('/logout', (req, res) => {
    // TODO: Logout the user
    logoutUser(req, res);
});

app.post('/delete/:id', isAuthenticated, (req, res) => {
    // TODO: Delete a post if the current user is the owner
    const postId = req.params.id;
    const postIndex = posts.findIndex(post => post.id === parseInt(postId));
    if (postIndex !== -1) {
        const post = posts[postIndex];
        if (post.username === getCurrentUser(req).username) {
            posts.splice(postIndex, 1);
            res.json({ success: true });
        }
    } else {
        res.json({ success: false, message: 'Post not found.' });
    }
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Example data for posts and users
// Users object array
let users = [
    {
        id: 1,
        username: 'WanderlustJane',
        avatar_url: '/avatars/w.png',
        password: 'password123',
        memberSince: '5/20/2024, 09:00:00 AM'
    },
    {
        id: 2,
        username: 'GlobetrotterTom',
        avatar_url: '/avatars/g.png',
        password: 'password456',
        memberSince: '5/21/2024, 10:30:00 AM'
    }
];

// Posts object array
let posts = [
    {
        id: 1,
        title: 'Discovering the Charm of Kyoto',
        content: 'Kyoto is a city of timeless beauty. From its stunning temples to serene gardens, every corner is a visual delight. Don’t miss the enchanting Gion District!',
        username: 'WanderlustJane',
        timestamp: '5/22/2024, 11:00:00 AM',
        avatar_url: '/avatars/w.png',
        likes: 0,
        likedBy: []
    },
    {
        id: 2,
        title: 'A Journey Through the Swiss Alps',
        content: 'The Swiss Alps are a hiker’s paradise. The breathtaking vistas, picturesque villages, and pristine lakes make it an unforgettable experience. Remember to try the local fondue!',
        username: 'GlobetrotterTom',
        timestamp: '5/22/2024, 12:45:00 PM',
        avatar_url: '/avatars/g.png',
        likes: 0,
        likedBy: []
    }
];

// Function to find a user by username
function findUserByUsername(username) {
    // TODO: Return user object if found, otherwise return undefined
    if(users.find(user => user.username === username)){
        return users.find(user => user.username === username);
    }
    else{
        return undefined;
    }
}

// Function to find a user by user ID
function findUserById(userId) {
    // TODO: Return user object if found, otherwise return undefined
    if(users.find(user => user.id === userId)){
        return users.find(user => user.id === userId);
    }
    else{ 
        return undefined;
    }
}

// Function to add a new user
function addUser(username, password, avatar_url) {
    // TODO: Create a new user object and add to users array
    const newUser = {
        id: users.length + 1,
        username: username,
        avatar_url: avatar_url,
        password: password,
        memberSince: new Date().toLocaleString()
    }
    users.push(newUser);
    console.log("User added successfully");
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    console.log(req.session.userId);
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Function to register a user
function registerUser(req, res) {
    // TODO: Register a new user and redirect appropriately
    const username = req.body.username;
    const password = req.body.password;
    console.log("attempting to register a user: ", username);
    
    if (findUserByUsername(username)) {
        res.redirect('/register?error=Username already exists');
    }
    else {
        // add the new user
        const avatar_url = saveAvatar(username);
        addUser(username, password, avatar_url);
        console.log("all current users", users);
        res.redirect('/login');
    }
}

// Function to login a user
function loginUser(req, res) {
    // TODO: Login a user and redirect appropriately
    const username = req.body.username;
    const password = req.body.password;
    const user = findUserByUsername(username);

    if (user && user.password === password) {
        req.session.userId = user.id;
        req.session.loggedIn = true;
        res.redirect('/');
    }
    else {
        res.redirect('/login?error=Invalid username or password. Try again');
    }
}

// Function to logout a user
function logoutUser(req, res) {
    // TODO: Destroy session and redirect appropriately
    req.session.destroy(err => {
        if (err) {
            console.log("Error destroying session");
            res.redirect('/error');
        } else {
            res.redirect('/');
        }
    });
}

// Function to render the profile page
function renderProfile(req, res) {
    // TODO: Fetch user posts and render the profile page
    const user = getCurrentUser(req);
    const userPosts = posts.filter(post => post.username === user.username);
    console.log("user posts", userPosts);
    res.render('profile', { user, userPosts });
}

// Function to update post likes
function updatePostLikes(req, res) {
    // TODO: Increment post likes if conditions are met
    const userId = req.session.userId;
    const postId = req.params.id;
    const post = posts.find(p => p.id === parseInt(postId));
    if (post) {
        post.likes += 1;
        res.json({ success: true, likes: post.likes });
    } else {
        res.json({ success: false });
    }
}

// Function to handle avatar generation and serving
function handleAvatar(req, res) {
    // TODO: Generate and serve the user's avatar image
    const username = req.params.username;
    const letter = username.charAt(0).toUpperCase();
    const avatarBuffer = generateAvatar(letter);
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(avatarBuffer, 'binary');
}

// Function to get the current user from session
function getCurrentUser(req) {
    // TODO: Return the user object if the session user ID matches
    userID = req.session.userId;
    if (userID !== undefined) {
        return findUserById(userID);
    }
    else {
        return undefined;
    }
}

// Function to get all posts, sorted by latest first
function getPosts() {
    return posts.slice().reverse();
}

// Function to add a new post
function addPost(title, content, user) {
    // TODO: Create a new post object and add to posts array
    const newPost = {
        id: posts.length + 1,
        title: title,
        content: content,
        username: user.username,
        avatar_url: user.avatar_url,
        timestamp: new Date().toLocaleString(),
        likes: 0
    }
    posts.push(newPost);
}

// Function to generate an image avatar
function generateAvatar(letter, width = 100, height = 100) {
    // TODO: Generate an avatar image with a letter
    // Steps:
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

// Function to generate a random color
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
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

const dbFileName = 'database.db';

async function initializeDB() {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            hashedGoogleId TEXT NOT NULL UNIQUE,
            avatar_url TEXT,
            memberSince DATETIME NOT NULL,
            description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            username TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            likes INTEGER NOT NULL,
            avatar_url TEXT NOT NULL,
            album TEXT
        );

        CREATE TABLE IF NOT EXISTS post_likes (
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            PRIMARY KEY (post_id, user_id),
            FOREIGN KEY (post_id) REFERENCES posts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    // Sample data - Replace these arrays with your own data
    const users = [
        { username: 'WanderlustJane', hashedGoogleId: 'hashedGoogleId1', avatar_url: '/avatars/w.png', memberSince: '5/20/2024, 09:00:00 AM', description: 'Travel enthusiast and food lover'},
        { username: 'GlobetrotterTom', hashedGoogleId: 'hashedGoogleId2', avatar_url: '/avatars/g.png', memberSince: '5/21/2024, 10:30:00 AM', description: 'Adventure seeker and nature lover'}
    ];

    const posts = [
        { title: 'Discovering the Charm of Kyoto', 
        content: 'Kyoto is a city of timeless beauty. From its stunning temples to serene gardens, every corner is a visual delight. Don’t miss the enchanting Gion District!', 
        username: 'WanderlustJane', 
        timestamp: '5/22/2024, 11:00:00 AM', 
        avatar_url: '/avatars/w.png',
        likes: 0 },

        { title: 'A Journey Through the Swiss Alps', 
        content: 'The Swiss Alps are a hiker’s paradise. The breathtaking vistas, picturesque villages, and pristine lakes make it an unforgettable experience. Remember to try the local fondue!', 
        username: 'GlobetrotterTom', 
        timestamp: '5/23/2024, 12:30:00 PM',
        avatar_url: '/avatars/g.png',
        likes: 0 }
    ];

    // Insert sample data into the database
    await Promise.all(users.map(user => {
        return db.run(
            'INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince, description) VALUES (?, ?, ?, ?, ?)',
            [user.username, user.hashedGoogleId, user.avatar_url, user.memberSince, user.description]
        );
    }));

    await Promise.all(posts.map(post => {
        return db.run(
            'INSERT INTO posts (title, content, username, timestamp, likes, avatar_url, album) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [post.title, post.content, post.username, post.timestamp, post.likes, post.avatar_url, post.album]
        );
    }));

    console.log('Database populated with initial data.');
    await db.close();
}

initializeDB().catch(err => {
    console.error('Error initializing database:', err);
});

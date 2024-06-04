const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

const dbFileName = 'database.db';

async function initializeDB() {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            googleId TEXT NOT NULL UNIQUE,
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
        { username: 'WanderlustJane', googleId: 'googleId1', avatar_url: '/avatars/w.png', memberSince: '5/20/2024, 09:00:00 AM', description: "Modern pop music lover"},
        { username: 'GlobetrotterTom', googleId: 'googleId2', avatar_url: '/avatars/g.png', memberSince: '5/21/2024, 10:30:00 AM', description: 'Fan of classic rock and indie music'}
    ];

    const posts = [
        { title: 'Discovering the nostalgic and contemporary tone of Harry Styles!', 
        content: 'The debut solo album of Harry Styles is a refreshing departure from his One Direction days, showcasing his versatility and depth as an artist. The self-titled album blends classic rock influences with modern pop sensibilities, resulting in a sound that is both nostalgic and contemporary', 
        username: 'WanderlustJane', 
        timestamp: '5/22/2024, 11:00:00 AM', 
        avatar_url: '/avatars/w.png',
        album: '{"album_group":"album","album_type":"album","artists":[{"external_urls":{"spotify":"https://open.spotify.com/artist/6KImCVD70vtIoJWnq6nGn3"},"href":"https://api.spotify.com/v1/artists/6KImCVD70vtIoJWnq6nGn3","id":"6KImCVD70vtIoJWnq6nGn3","name":"Harry Styles","type":"artist","uri":"spotify:artist:6KImCVD70vtIoJWnq6nGn3"}],"external_urls":{"spotify":"https://open.spotify.com/album/1FZKIm3JVDCxTchXDo5jOV"},"href":"https://api.spotify.com/v1/albums/1FZKIm3JVDCxTchXDo5jOV","id":"1FZKIm3JVDCxTchXDo5jOV","images":[{"height":640,"url":"https://i.scdn.co/image/ab67616d0000b2736c619c39c853f8b1d67b7859","width":640},{"height":300,"url":"https://i.scdn.co/image/ab67616d00001e026c619c39c853f8b1d67b7859","width":300},{"height":64,"url":"https://i.scdn.co/image/ab67616d000048516c619c39c853f8b1d67b7859","width":64}],"is_playable":true,"name":"Harry Styles","release_date":"2017-05-12","release_date_precision":"day","total_tracks":10,"type":"album","uri":"spotify:album:1FZKIm3JVDCxTchXDo5jOV"}',
        likes: 0 },

        { title: 'A Journey with "Abbey Road" by The Beatles...', 
        content: 'To me, "Abbey Road" is a timeless album that remains influential and beloved by fans around the world. It’s a fitting swan song for their incredible career, showcasing their creativity, unity, and sheer talent.', 
        username: 'GlobetrotterTom', 
        timestamp: '5/23/2024, 12:30:00 PM',
        avatar_url: '/avatars/g.png',
        album: '{"album_group":"album","album_type":"album","artists":[{"external_urls":{"spotify":"https://open.spotify.com/artist/3WrFJ7ztbogyGnTHbHJFl2"},"href":"https://api.spotify.com/v1/artists/3WrFJ7ztbogyGnTHbHJFl2","id":"3WrFJ7ztbogyGnTHbHJFl2","name":"The Beatles","type":"artist","uri":"spotify:artist:3WrFJ7ztbogyGnTHbHJFl2"}],"external_urls":{"spotify":"https://open.spotify.com/album/0ETFjACtuP2ADo6LFhL6HN"},"href":"https://api.spotify.com/v1/albums/0ETFjACtuP2ADo6LFhL6HN","id":"0ETFjACtuP2ADo6LFhL6HN","images":[{"height":640,"url":"https://i.scdn.co/image/ab67616d0000b273dc30583ba717007b00cceb25","width":640},{"height":300,"url":"https://i.scdn.co/image/ab67616d00001e02dc30583ba717007b00cceb25","width":300},{"height":64,"url":"https://i.scdn.co/image/ab67616d00004851dc30583ba717007b00cceb25","width":64}],"is_playable":true,"name":"Abbey Road (Remastered)","release_date":"1969-09-26","release_date_precision":"day","total_tracks":17,"type":"album","uri":"spotify:album:0ETFjACtuP2ADo6LFhL6HN"}',
        likes: 0 }
    ];

    // Insert sample data into the database
    await Promise.all(users.map(user => {
        return db.run(
            'INSERT INTO users (username, googleId, avatar_url, memberSince, description) VALUES (?, ?, ?, ?, ?)',
            [user.username, user.googleId, user.avatar_url, user.memberSince, user.description]
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

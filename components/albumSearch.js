import React, {useState} from "react";

function AlbumSearch({onAlbumSelect}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [albums, setAlbums] = useState([]);

    useEffect(() => {
        // API access token
        fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials&client_id=" + process.env.SPOTIFY_CLIENT_ID + "&client_secret=" + process.env.SPOTIFY_CLIENT_SECRET,
        })
        .then(response => response.json())
        .then(data => setAccessToken(data.access_token));
    }, [])

// search for albums
async function searchAlbums() {
    console.log("searching for:" + searchTerm);
    // API call flow:
    // 1. GET request using search to get the artist ID
    const artistId = await fetch("https://api.spotify.com/v1/search?q=" + searchTerm + "&type=artist", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken,
        }
    })
    .then(response => response.json())
    .then(data => {return data.artists.items[0].id }) // get the first artist shown (most relevant) and its unique ID
    .catch(error => console.error(error));
    
    // 2. GET request using the artist ID to get all the albums
    const albums = await fetch("https://api.spotify.com/v1/artists/" + artistId + "/albums" + "?include_groups=&albums&market=US&limit=30", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken,
        }
    })
    .then(response => response.json())
    .then(data => setAlbums(data.items)); 
}

return (
    <div className="album-search">
        <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search for an artist" 
        />
        <button onClick={searchAlbums}>Search</button>
        <div className="album-results">
            {albums.map((album) => (
                <div key={album.id} className="album-item" onClick={() => onAlbumSelect(album)}>
                    <img src={album.images[0].url} alt={album.name} />
                    <div>
                        <h3>{album.name}</h3>
                        <p>{album.artists[0].name}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
    
}

export default AlbumSearch;

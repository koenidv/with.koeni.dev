var express = require('express');
var router = express.Router();

const CORS_ALLOW_DOMAIN_PATTERN = /^https:\/\/([a-z0-9-]+\.)*koeni\.dev$/;

// In-memory token storage
let spotifyToken = null;
let tokenExpiresAt = null;

// In-memory cache for playlist tracks (48 hours TTL)
const tracksCache = new Map(); // playlistId -> { data, expiresAt }

/**
 * Get a valid Spotify access token using client credentials flow
 */
async function getSpotifyToken() {
    // Return cached token if still valid
    if (spotifyToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
        return spotifyToken;
    }

    // Get new token
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Spotify client credentials are not configured');
    }

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error getting Spotify token:', errorData);
            throw new Error('Failed to authenticate with Spotify');
        }

        const data = await response.json();
        spotifyToken = data.access_token;
        // Set expiration with a 60-second buffer
        tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

        return spotifyToken;
    } catch (error) {
        console.error('Error getting Spotify token:', error.message);
        throw new Error('Failed to authenticate with Spotify');
    }
}

/**
 * Set CORS headers allowing koeni.dev and all subdomains
 */
function setCorsHeaders(req, res) {
    const origin = req.get('origin');
    
    // Check if origin matches koeni.dev or any subdomain
    if (origin && CORS_ALLOW_DOMAIN_PATTERN.test(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // Default to the main domain
        res.setHeader('Access-Control-Allow-Origin', 'https://koeni.dev');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * GET /spotify/tracks?playlistId=<playlist_id>
 * Fetch tracks from a Spotify playlist
 */
router.get('/tracks', async (req, res) => {
    // Set CORS headers for all responses
    setCorsHeaders(req, res);
    
    const playlistId = req.query.playlistId;

    if (!playlistId) {
        return res.status(400).json({ error: 'playlistId parameter is required' });
    }

    // Validate playlist ID format (alphanumeric characters only)
    if (!/^[a-zA-Z0-9]+$/.test(playlistId)) {
        return res.status(400).json({ error: 'Invalid playlistId format' });
    }

    try {
        // Check cache first
        const cached = tracksCache.get(playlistId);
        if (cached && Date.now() < cached.expiresAt) {
            return res.json(cached.data);
        }

        const token = await getSpotifyToken();

        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return res.status(404).json({ error: 'Playlist not found' });
            } else if (response.status === 401) {
                return res.status(401).json({ error: 'Authentication failed' });
            } else {
                console.error('Error fetching playlist tracks:', response.status, response.statusText);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }

        const data = await response.json();
        
        // Cache the response for 48 hours
        const CACHE_TTL = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
        tracksCache.set(playlistId, {
            data: data,
            expiresAt: Date.now() + CACHE_TTL
        });
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching playlist tracks:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handle OPTIONS requests for CORS preflight
router.options('/tracks', (req, res) => {
    setCorsHeaders(req, res);
    res.status(200).end();
});

module.exports = router;

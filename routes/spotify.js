var express = require('express');
var router = express.Router();
const axios = require('axios');

const CORS_ALLOW_DOMAIN_PATTERN = /^https:\/\/([a-z0-9-]+\.)*koeni\.dev$/;

// In-memory token storage
let spotifyToken = null;
let tokenExpiresAt = null;

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
        const response = await axios.post('https://accounts.spotify.com/api/token', 
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
                }
            }
        );

        spotifyToken = response.data.access_token;
        // Set expiration with a 60-second buffer
        tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

        return spotifyToken;
    } catch (error) {
        console.error('Error getting Spotify token:', error.response?.data || error.message);
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

    try {
        const token = await getSpotifyToken();

        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching playlist tracks:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            res.status(404).json({ error: 'Playlist not found' });
        } else if (error.response?.status === 401) {
            res.status(401).json({ error: 'Authentication failed' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Handle OPTIONS requests for CORS preflight
router.options('/tracks', (req, res) => {
    setCorsHeaders(req, res);
    res.status(200).end();
});

module.exports = router;

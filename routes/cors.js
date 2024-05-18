
const CORS_ALLOW_DOMAIN = "https://koeni.dev";

router.get('/:url', async (req, res) => {
    try {
        const response = await fetch(decodeURIComponent(req.params.url), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
            },
        });
        const data = await response.text();

        res.setHeader('Access-Control-Allow-Origin', CORS_ALLOW_DOMAIN);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        res.status(response.status).send(data);
    } catch (error) {
        console.error('Error fetching the URL:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;

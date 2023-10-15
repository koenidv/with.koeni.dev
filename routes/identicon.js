var express = require('express');
const jdenticon = require("jdenticon");
var router = express.Router();

router.get('/:value', function(req, res) {
    let size = req.query.size || 200;
    const value = req.params.value || req.query.value || "koenidv";
    
    if (req.format === "svg") {
        size = Math.max(size, 10240)
        res.set("Content-Type", "image/svg+xml");
        res.send(jdenticon.toSvg(value, size));
    } else {
        size = Math.max(size, 1024)
        res.set("Content-Type", "image/png");
        res.send(jdenticon.toPng(value, size));
    }
});

module.exports = router;

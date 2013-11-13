var fs = require('fs');
var PeerServer = require('peer').PeerServer;
var server = new PeerServer({
    port: 3216,
    ssl: {
        key: fs.readFileSync('/etc/ssl/private/privatekey.pem'),
        certificate: fs.readFileSync('/etc/ssl/certs/server.crt')
    }
});
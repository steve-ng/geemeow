/*
* GET home page. */
//solution from http://stackoverflow.com/questions/9443840/basic-webserver-with-node-js-and-express-for-serving-html-file-and-assets
module.exports = function(app) { 
	app.get('/', function(req, res){
		//res.render('index', { title: 'Express' }) 
		res.sendfile('public/index.html');
	});
};
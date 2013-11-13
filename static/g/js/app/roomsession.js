var RoomSession = function(){
	this.username = "User "+(new Date().getTime()%999);
	this.title = "Introduction to Software Engineering";

}
var roomSession = new RoomSession();
function dobiPiskot(ime){
	var i,x,y,piskoti = document.cookie.split(";");
	for (i = 0; i < piskoti.length; i++){ // dobim vse dodane piškote
		x = piskoti[i].substr(0,piskoti[i].indexOf("="));
		y = piskoti[i].substr(piskoti[i].indexOf("=")+1);
		x = x.replace(/^\s+|\s+$/g,"");
		if (x == ime){
			return unescape(y);
		}
	}
}
function opozoriloPiskot(){
	var opozorilo = '<div id="piskotOpozorilo" class="piskotiOpozorilo"><div class="obvestilodiv"><div class="obvestilo">This website uses cookies for the purpose of improving the functioning of the site. More information in our <a href="http://1ainternet.net/cookies/o-rabi-spletnih-piskotkov.html" target="_blank">cookie policy</a>.</div>';
	opozorilo = opozorilo + "<input type='button' onClick='JavaScript:nastaviPiskot(\"" + ime + "\",null);' value='Accept and close'></div></div>";
	document.writeln(opozorilo);
}
function nastaviPiskot(ime, vrednost){
	var dolzinaDni = 365; // shrani za leto dni
	var trenutniDatum = new Date();
	trenutniDatum.setDate(trenutniDatum.getDate() + dolzinaDni);
	var vrednost = escape(vrednost) + ((dolzinaDni == null) ? "" : "; expires="+trenutniDatum.toUTCString());
	document.cookie = ime + "=" + vrednost;
	var opozoriloIzpis = document.getElementById("piskotOpozorilo"); 
	opozoriloIzpis.innerHTML = ""; // odstrani opozorila
    opozoriloIzpis.className = ""; // odstrani opozorila
}
function preveriPiskot(){
	var preveri = dobiPiskot(ime);
	if (preveri != null && preveri !=""){
		nastaviPiskot(ime,preveri,365);
	}
	else {
		opozoriloPiskot();	
	}
}
preveriPiskot();
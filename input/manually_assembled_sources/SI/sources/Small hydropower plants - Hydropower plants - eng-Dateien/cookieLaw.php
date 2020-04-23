var bgColor = "009fb0"  
var bgButtonColor = "009fb0"  
var color = "FFFFFF"  
var lng = "eng"
var t = ""
var fb = "true"
var yt = "true"
var vimeo = "true"
var issuu = ""
var gm = "true"
var skype = ""
var gplus = ""
var refuse = "true"
var najdi = ""
var sthis = ""
var dblclk = ""
var blockAll = ""
var buttonPos = ""
var isAlternative = ""
var fbpixel = ""
var refuseBtn = ""


if (buttonPos != '') {
	var showButton = true;
} else {
	var showButton = false;
}

if (bgColor == '' || (bgColor.length != 3 && bgColor.length != 6)) {
	bgColor = "A90000";
}
if (bgButtonColor == '' || (bgColor.length != 3 && bgColor.length != 6)) {
	bgButtonColor = "A90000";
}
if (color == '') {
	color = "FFFFFF";
}
if (lng == '') {
	lng = 'slo';
}

var divButton = document.createElement("div");
divButton.id = 'cookie-button';
divButton.style.color = '#'+color;
divButton.style.background = '#'+bgColor;
divButton.style.padding = "6px 17px";
divButton.style.position = "fixed";
divButton.style.fontSize = '12px';
divButton.style.zIndex = "100000";
if (lng == 'slo') {
	divButton.innerHTML = '<a href="javascript:show();" style="color: #'+color+';text-decoration: none;">piškotki</a>';
} else {
	divButton.innerHTML = '<a href="javascript:show();" style="color: #'+color+';text-decoration: none;">cookies</a>';
}
if (buttonPos == 'bottom') {
	divButton.style.left = '50%';
	divButton.style.bottom = '0px';
	divButton.style.borderTopLeftRadius = '3px';
	divButton.style.borderTopRightRadius = '3px';
} else if (buttonPos == 'bottom-right') {
	divButton.style.right = '0px';
	divButton.style.bottom = '0px';
	divButton.style.borderTopLeftRadius = '3px';
} else if (buttonPos == 'bottom-left') {
	divButton.style.left = '0px';
	divButton.style.bottom = '0px';
	divButton.style.borderTopRightRadius = '3px';
} else if (buttonPos == 'middle-right') {
	divButton.style.left = '0px';
	divButton.style.bottom = '0px';
	divButton.style.borderTopRightRadius = '3px';

}

/*
d=document;

while((el=d.getElementsByTagName('div')).length) {
//alert(el[0].innerText);
el[0].innerHTML = 'hello';
alert(el[0].innerHtml);
el[0].parentNode.removeChild(el[0]);
};
onerror=function() {};
d.close();
*/

var textFontSize = "12px";
var textLineHeight = "1.3";
var divText = '';

if (lng == 'slo') {
	var txtAltIntro = "S piškotki si pomagamo pri zagotavljanju storitev. Z uporabo naših storitev se strinjate, da lahko uporabljamo piškotke.";
	if (blockAll == 'true'){
		var txtIntro = "Piškotke uporabljamo za zagotavljanje boljše uporabniške izkušnje.";
	} else {
		var txtIntro = "Piškotke uporabljamo za zagotavljanje boljše uporabniške izkušnje. Z nadaljevanjem se strinjate z njihovo uporabo.";
	}
	
	var txtAltAllow = "V redu";
	var txtAllow = "Sprejmi in nadaljuj";
	var txtRefuse = "Zavrni";
	var txtMore = "Več o tem";
	var txtHideDetails = "Skrij podrobnosti";	
	var txtDetails = '<br />Naša spletna stran uporablja tehnologijo “piškotkov” (cookies), da lahko razločujemo med obiskovalci in izvajamo statistiko uporabe spletne strani. To nam omogoča sprotno izboljševanje delovanja strani. Uporabniki, ki ne dovolijo zapisa "piškotka" naše strani v svoj računalnik, bodo ob pregledu spletne strani prikrajšani za nekatere od njenih funkcionalnosti (ogled videa, komentiranje preko Facebooka, ipd).';
	txtDetails += 'Piškotki so majhne datoteke, ki jih sistem obiskane spletne strani zapiše na vaš računalnik. Tako vas sistem ob naslednjem obisku strani lahko prepozna. <br /><br />Na naših spletnih straneh uporabljamo naslednje vrste piškotkov:<br />';
	txtDetails += '<ul style="list-style:disc;padding-left:15px; margin-left:30px;">';
	txtDetails += '<li><strong>SERVERID:</strong> uporablja se za identifikacijo strežnika, ki je aktiven na vašo zahtevo. Namen je izboljšanje delovanja spletne strani. Piškotek ne shranjuje nobenih osebnih podatkov. Trajanje do konca seje.</li>';
	txtDetails += '<li><strong>Sejni piškotki:</strong> služijo za shranjevanje začasnih informacij. Trajanje do konca seje.<br /><br /></li>';
	txtDetails += '<li><strong>Google Analytics</strong> (__utma - trajanje 2 leti, __utmb - trajanje 30 minut, __utmc - trajanje do konca seje, __utmz - trajanje 6 mesecev, __utmv - trajanje 2 leti, _ga - trajanje 2 leti, _gat - trajanje 10 minut): služijo za anonimno zbiranje podatkov in poročanje o gibanju na spletnih mestih brez prepoznavanja posameznih obiskovalcev.</li>';
	if (fb == 'true') {
		txtDetails += '<li><strong>Facebook</strong> (reg_fb_gate - trajanje do konca seje, reg_fb_ref - trajanje do konca seje, datr - trajanje 2 leti): služijo za slednje učinkovitosti registracije, ugotavljanju kako je uporabnik prišel na Facebook prvotno, ko si je ustvaril račun.</li>';
	}
	if (t == 'true') {
		txtDetails += '<li><strong>Twitter</strong> (_twitter_sess - trajanje do konca seje, guest_id - trajanje 2 leti, k, pid, external_referer - trajanje 7 dana, js, original_referer):  služi za prikaz Twitter vsebine na spletni strani ter za deljenje strani na omrežju Twitter.</li>';
	}
	if (gplus == 'true') {
		txtDetails += '<li><strong>Google+</strong> (GMAIL_RTT - trajanje do konca seje, NID  - trajanje 6 mesecev, S - trajanje do konca seje, S - trajanje 2 leti, SSID - trajanje 2 leti, OZT - trajanje 1 mesec): omogočijo uporabnikom, da delijo naše vsebine na Google Plus družbenem omrežju.</li>';
	}
	if (yt == 'true') {
		txtDetails += '<li><strong>YouTube</strong> (PREF - trajanje 8 mesecev, VISITOR_INFO1_LIVE - trajanje 8 mesecev, YSC  - trajanje do konca seje,..): služjo za beleženje stastisike ogledov, za sledenje preferenc uporabnikov in za razvrščanje povezanih reklam znotraj posnetka na omrežju YouTube.</li>';
	}
	if (vimeo == 'true') {
		txtDetails += '<li><strong>Vimeo</strong> (__utma - trajanje 2 leti, __utmb - trajanje 30 minut, __utmc - trajanje do konca seje, __utmz - trajanje 6 mesecev, __utmv - trajanje 2 leti, vuid - trajanje 2 leti, _utmt_player - trajanje 10 minut): služijo za anonimno zbiranje podatkov in poročanje o ogledu posnetkov na omrežju Vimeo.</li>';
	}
	if (gm == 'true') {
		txtDetails += '<li><strong>Google Map</strong> (SID - trajanje 2 leti, SAPISID - trajanje 2 leti, APISID - trajanje 2 leti, SSID - trajanje 2 leti, HSID - trajanje 2 leti, NID  - trajanje 6 mesecev, PREF - trajanje 8 mesecev): služijo za merjenje števila in za sledenje obnašanja uporabnikov Google Maps.</li>';
	}
	if (skype == 'true') {
		txtDetails += '<li><strong>Skype</strong> (gpv_p23, s_nr, s_cc, s_ria, s_sq): služi za sledenje, ali ima spletni obiskovalec na voljo Skype, da mu lahko omogočimo dostop do naših storitev preko Skype komunikacije.</li>';
	}
	if (najdi == 'true') {
		txtDetails += '<li><strong>Najdi.si</strong> (__utma - trajanje 2 leti, __utmb - trajanje 30 minut, __utmc - trajanje do konca seje, __utmz - trajanje 6 mesecev, __utmv - trajanje 2 leti, MAdUTCID - trajanje 7 dni, slidefacet, JSESSIONID): služijo za sledenje, ali ima spletno mesto na voljo najdi.si zemljevid.</li>';
	}
	if (sthis == 'true') {
		txtDetails += '<li><strong>sharethis.com</strong> (__stid - trajanje 1 leto, __uset - trajanje 1 dan): te piškotke nastavi vtičnik iz sharethis.com, ki doda možnost uporabe družbenih omrežij.</li>';
	}
	if (issuu == 'true') {
		txtDetails += '<li><strong>issuu.com</strong> (iutk - trajanje 10 let, itrack, mc): te piškotke nastavi vtičnik iz issuu.com, ki doda prikaz digitalnih publikacij.Piškotki se uporabljajo za štetje ogledov in za zbiranje podatkov o vašem sistemu.</li>';
	}
	if (dblclk == 'true') {
		txtDetails += '<li><strong>doubleclick.net</strong> (test_cookie, DSID - trajanje 14 dni, IDE - trajanje 2 leti, id - trajanje 2 leti): ta piškotek se uporablja za zbiranje informacij o prikazanih oglasih in klikih na oglase.</li>';
	}
	if (fbpixel == 'true') {
		txtDetails += '<li><strong>Facebook Pixel</strong> (fr - trajanje 90 dni, _fbp - trajanje 90 dni): te piškotke uporablja Facebook za dostavo in merjenje oglasov, za dostavo oglasov tretjih oglaševalcev.</li>';
	}
	//txtDetails += '<li>ostali piškotki - služi za shranjevanje nastavitev, ki jih je uporabnik določil</li>';
	
} else if (lng == 'hr') {	
	var txtIntro = "Naša web stranica koristi tehnologiju “kolačića” (cookies). Dopustite kolačiće kako bismo mogli poboljšati vaše iskustvo korištenja naše stranice.";
	var txtAllow = "Prihvati i nastavi";
	var txtRefuse = "Zavrni";
	var txtMore = "Više o tome";
	var txtHideDetails = "Sakrij detalje";	
	var txtDetails = '<br />Naša web stranica koristi tehnologiju "kolačića" (cookies), kako bi lako razlučili posjetioce te izdvojili statistiku uporabe web stranice. To nam omogućuje poboljšanje naše stranice. Ukoliko ne želite zapis "kolačića" u svoje računalo, bit ćete uskraćeni za neke od funkcionalnosti stranice pri pregledu (gledanje videa, komentiranje preko Facebooka itd.) Kolačići su male datoteke koje web stranica zapisuje u vaše računalo kako bi vas ista prepoznala idući put kada ju posjetite.';
	
	txtDetails += 'Na našoj stranici koristimo iduće vrste "kolačića":<br />';
	txtDetails += '<ul style="list-style:disc;padding-left:15px; margin-left:30px;">';
	txtDetails += '<li><strong>BALANCEID:</strong> koristi se za identifikaciju korisnika, te je aktivan na vaš zahtjev. Cilj je poboljšanje web stranice. Kolačić ne pohranjuje vaše osobne podatke.</li>';
	txtDetails += '<li><strong>Sejni piškotki:</strong> se koristi za privremeno skladištenje podataka.<br /><br /></li>';
	txtDetails += '<li><strong>Google Analytics</strong> (__utma - trajanje 2 godina, __utmb - trajanje 30 minuta, __utmc - trajanje do kraja sesije, __utmz - trajanje 6 mjesecev, __utmv - trajanje 2 godina, _ga - trajanje 2 godina, _gat - trajanje 10 minuta): Služe za anonimno skupljanje podataka o kretanju na web stranicama bez prepoznavanja individualnih posjetioca.</li>';
	if (fb == 'true') {
		txtDetails += '<li><strong>Facebook</strong> (reg_fb_gate - trajanje do kraja sesije, reg_fb_ref - trajanje do kraja sesije, datr - trajanje 2 godina): služijo za slednje učinkovitosti registracije, ugotavljanju kako je uporabnik prišel na Facebook prvotno, ko si je ustvaril račun.</li>';
	}
	if (t == 'true') {
		txtDetails += '<li><strong>Twitter</strong> (_twitter_sess - trajanje do kraja sesije, guest_id - trajanje 2 godina, k, pid, external_referer - trajanje 7 dana, js, original_referer):  služi za prikaz Twitter vsebine na spletni strani ter za deljenje strani na omrežju Twitter.</li>';
	}
	if (gplus == 'true') {
		txtDetails += '<li><strong>Google+</strong> (GMAIL_RTT - trajanje do kraja sesije, NID  - trajanje 6 mjesecev, S - trajanje do kraja sesije, S - trajanje 2 godina, SSID - trajanje 2 godina, OZT - trajanje 1 mjesec): omogočijo uporabnikom, da delijo naše vsebine na Google Plus družbenem omrežju.</li>';
	}
	if (yt == 'true') {
		txtDetails += '<li><strong>YouTube</strong> (PREF - trajanje 8 mjesecev, VISITOR_INFO1_LIVE - trajanje 8 mjesecev, YSC  - trajanje do kraja sesije,..): služjo za beleženje stastisike ogledov, za sledenje preferenc uporabnikov in za razvrščanje povezanih reklam znotraj posnetka na omrežju YouTube.</li>';
	}
	if (vimeo == 'true') {
		txtDetails += '<li><strong>Vimeo</strong> (__utma - trajanje 2 godina, __utmb - trajanje 30 minuta, __utmc - trajanje do kraja sesije, __utmz - trajanje 6 mjesecev, __utmv - trajanje 2 godina, vuid - trajanje 2 godina, _utmt_player - trajanje 10 minuta): služijo za anonimno zbiranje podatkov in poročanje o ogledu posnetkov na omrežju Vimeo.</li>';
	}
	if (gm == 'true') {
		txtDetails += '<li><strong>Google Map</strong> (SID - trajanje 2 godina, SAPISID - trajanje 2 godina, APISID - trajanje 2 godina, SSID - trajanje 2 godina, HSID - trajanje 2 godina, NID  - trajanje 6 mjesecev, PREF - trajanje 8 mjesecev): služijo za merjenje števila in za sledenje obnašanja uporabnikov Google Maps.</li>';
	}
	if (skype == 'true') {
		txtDetails += '<li><strong>Skype</strong> (gpv_p23, s_nr, s_cc, s_ria, s_sq): služi za sledenje, ali ima spletni obiskovalec na voljo Skype, da mu lahko omogočimo dostop do naših storitev preko Skype komunikacije.</li>';
	}
	if (najdi == 'true') {
		txtDetails += '<li><strong>Najdi.si</strong> (__utma - trajanje 2 godina, __utmb - trajanje 30 minuta, __utmc - trajanje do kraja sesije, __utmz - trajanje 6 mjesecev, __utmv - trajanje 2 godina, MAdUTCID - trajanje 7 dana, slidefacet, JSESSIONID): služijo za sledenje, ali ima spletno mesto na voljo najdi.si zemljevid.</li>';
	}
	if (sthis == 'true') {
		txtDetails += '<li><strong>sharethis.com</strong> (__stid - trajanje 1 godina, __uset - trajanje 1 godina): These cookies are set by sharethis.com plug-in that adds the possibility to use social networks.</li>';
	}
	if (issuu == 'issuu') {
		txtDetails += '<li><strong>issuu.com</strong> (iutk - trajanje 10 godina, itrack, mc): Te piškotke nastavi vtičnik iz issuu.com, ki doda prikaz digitalnih publikacij.Piškotki se uporabljajo za štetje ogledov in za zbiranje podatkov o vašem sistemu.</li>';
	}
	if (dblclk == 'true') {
		txtDetails += '<li><strong>doubleclick.net</strong> (test_cookie, DSID - trajanje 14 dana, IDE - trajanje 2 godina, id - trajanje 2 godina): ta piškotek se uporablja za zbiranje informacij o prikazanih oglasih in klikih na oglase.</li>';
	}
	if (fbpixel == 'true') {
		txtDetails += '<li><strong>Facebook Pixel</strong> (fr - trajanje 90 dni, _fbp - trajanje 90 dni): te piškotke uporablja Facebook za dostavo in merjenje oglasov, za dostavo oglasov tretjih oglaševalcev.</li>';
	}
	//txtDetails += '<li>ostali piškotki - služi za shranjevanje nastavitev, ki jih je uporabnik določil</li>';
	
} else if (lng != 'slo') {
	var txtIntro = "Our website uses “cookies”. Your experience on this site will be improved by allowing cookies.";
	var txtAllow = "Accept and Continue";
	var txtRefuse = "Disallow";
	var txtMore = "More Information";
	var txtHideDetails = "Hide Details";	
	var txtDetails = '<br />Our website uses “cookies” to distinguish between visitors and to perform website use statistics. This allows us to improve the page constantly. Users who do not allow our website "cookies" to be recorded on their computer, will not be able to use all the functionalities of the website (video, comment on Facebook, etc.).';
	txtDetails += 'Cookies are small files that a website that you visited records on your computer. The next time you are visiting the same site, the system can recognise you. <br /><br />Our website uses the following types of cookies:<br />';
	txtDetails += '<ul style="list-style:disc;padding-left:15px; margin-left:30px;">';
	txtDetails += '<li><strong>BALANCEID:</strong> it is used to identify the server that is active on your request. The aim is to improve the functioning of the website. The cookie does not store any personal information.</li>';
	txtDetails += '<li><strong>Session cookies:</strong> are used for temporary storage of information.<br /><br /></li>';
	txtDetails += '<li><strong>Google Analytics</strong> (__utma - expires in 2 years, __utmb - expires in 30 minutes, __utmc - expires at the end of session, __utmz - expires after 6 months, __utmv - expires aflter 2 years, _ga - expires aflter 2 years, _gat - expires after 10 minutes): are used for anonymous data collection and reporting of the navigation trough the site without identifying individual visitors.</li>';
	if (fb == 'true') {
		txtDetails += '<li><strong>Facebook</strong> (reg_fb_gate - expires at the of session, reg_fb_ref - expires at the of session, datr - expires aflter 2 years): are used for tracking the effectiveness of the registration, and to determine how the user originally came on Facebook to create the account.</li>';
	}
	if (t == 'true') {
		txtDetails += '<li><strong>Twitter</strong> (_twitter_sess - expires at the end of session, guest_id - expires after 2 years, k, pid, external_referer - expires after 7 days, js, original_referer):  is used to display Twitter content on the website and to share the site on the Twitter.</li>';
	}
	if (gplus == 'true') {
		txtDetails += '<li><strong>Google+</strong> (GMAIL_RTT - expires at the end of session, NID  - expires after 6 months, S - expires at the end of session, S - expires after 2 years, SSID - expires after 2 years, OZT - expires after 1 month): allow visitors to share our contents on Google Plus social network.</li>';
	}
	if (yt == 'true') {
		txtDetails += '<li><strong>YouTube</strong> (PREF - expires after 8 mmonths, VISITOR_INFO1_LIVE - expires after 8 mmonths, YSC  - expires at the end of session,..): are used to record the statistics of views, to track the preferences of users, and for the distribution of commercials on YouTube.</li>';
	}
	if (vimeo == 'true') {
		txtDetails += '<li><strong>Vimeo</strong> (__utma - expires after 2 years, __utmb - expires after 30 minutes, __utmc - expires at the end of session, __utmz - expires after 6 months, __utmv - expires after 2 years, vuid - expires after 2 years, _utmt_player - expires after 10 minutes): are used for anonymous data collection and reporting on viewing videos on Vimeo network</li>';
	}
	if (gm == 'true') {
		txtDetails += '<li><strong>Google Map</strong> (SID - expires after 2 years, SAPISID - expires after 2 years, APISID - expires after 2 years, SSID - expires after 2 years, HSID - expires after 2 years, NID  - expires after 6 months, PREF - expires after 8 months): are used to follow the number of users and to track their behavior on Google Maps.</li>';
	}
	if (skype == 'true') {
		txtDetails += '<li><strong>Skype</strong> (gpv_p23, s_nr, s_cc, s_ria, s_sq): we use Skype’s services to detect if a website visitor has Skype available so we can provide access to our client services via Skype communications.</li>';
	}
	if (najdi == 'true') {
		txtDetails += '<li><strong>Najdi.si</strong> (__utma - expires after 2 years, __utmb - expires after 30 minutes, __utmc - exppires at the end of session, __utmz - expires after 6 months, __utmv - expires after 2 years, MAdUTCID - expires after 7 days, slidefacet, JSESSIONID): are used to display the Slovenian service najdi.si map.</li>';
	}
	if (dblclk == 'true') {
		txtDetails += '<li><strong>doubleclick.net</strong> (test_cookie, DSID - expires after 14 days, IDE - expires 2 years, id - expires after 2 years): cookie serves relevant ads to potential customers and gathers information about how or if you are interacting with these ads..</li>';
	}
	if (sthis == 'issuu') {
		txtDetails += '<li><strong>issuu.com</strong> (__stid - expires after 1 year, __uset - expires after 1 day): These cookies are set by sharethis.com plug-in, that embed digital publications. Cookies are used to count the visits, to collect information about your system.</li>';
	}
	if (issuu == 'true') {
		txtDetails += '<li><strong>issuu.com</strong> (iutk - expires after 10 years,itrack, mc): These cookies are set by issuu.com plug-in, that embed digital publications. Cookies are used to count the visits, to collect information about your system.</li>';
	}
	if (fbpixel == 'true') {
		txtDetails += '<li><strong>Facebook Pixel</strong> (fr - expires after 3 months, _fbp - expires after 3 months): <strong>fr</strong> cookie is a basic advertising cookie by Facebook, used for delivery, measuring and improving the relevance of ads. <strong>_fbp</strong> cookie is used by Facebook to delivery a series of advertising products, such as real-time offers by third-party advertisers.</li>';
	}
	//txtDetails += '<li>ostali piškotki - služi za shranjevanje nastavitev, ki jih je uporabnik določil</li>';
}


if (isAlternative == 'true' && lng == 'slo') {
	divText =  '<span style="line-height: '+textLineHeight+'; font-size: '+textFontSize+'; margin-right: 40px;display:block;width:100%;padding-bottom:10px;">'+txtAltIntro+'</span>';
	divText += '<div id="buttons-container" style="margin-top:23px; text-align:left">';
	//divText += '	<a id="allow-cookies-button" href="javascript:ok()" style="line-height:2.3; background-color: #'+bgButtonColor+';color: #'+color+';border: 1px solid #'+color+';padding: 6px 16px; margin-right: 8px; text-decoration: none; border-radius: 4px; font-size: '+textFontSize+'; white-space: nowrap;">'+txtAltAllow+'</a>';
} else {
	divText =  '<span style="line-height: '+textLineHeight+'; font-size: '+textFontSize+'; margin-right: 40px;display:block;width:100%;padding-bottom:10px;">'+txtIntro+'</span>';
	//divText += '<div id="buttons-container" style="margin-top:23px; text-align:left">';
	divText += '	<a id="allow-cookies-button" href="javascript:ok()" style="line-height:2.3; background-color: #'+bgButtonColor+';color: #'+color+';border: 1px solid #'+color+';padding: 6px 16px; margin-right: 8px; text-decoration: none; border-radius: 4px; font-size: '+textFontSize+'; white-space: nowrap;">'+txtAllow+'</a>';
}
if (refuse == 'true') {
	//divText += '	<a id="disallow-cookies-button" href="javascript:not()" style="line-height:2.3; background-color: #'+bgButtonColor+';color: #'+color+';border: 1px solid #'+color+';padding: 6px 16px; margin-right: 8px; text-decoration: none; border-radius: 4px; font-size: '+textFontSize+'; white-space: nowrap;">'+txtRefuse+'</a>';
}
if (refuseBtn == 'true') {
	divText += '	<a id="disallow-cookies-button" href="javascript:not()" style="line-height:2.3; background-color: #'+bgButtonColor+';color: #'+color+';border: 1px solid #'+color+';padding: 6px 16px; margin-right: 8px; text-decoration: none; border-radius: 4px; font-size: '+textFontSize+'; white-space: nowrap;">'+txtRefuse+'</a>';
}
divText += '	<a href="#" onclick="return false" id="showCookieDetail" style="line-height:2.3; float:right; color: #'+color+'; text-decoration: none; border-radius: 4px; font-size: '+textFontSize+';">'+txtMore+'</a>';
divText += '</div>';
divText += '<div id="cookieDetail" style="display:none; width:100%; margin-top:15px; border-top:1px dotted white; border-top:1px dotted rgba(255, 255, 255, .5); text-align:left; height:300px; overflow-y:scroll; overflow-x:none">';
divText += txtDetails;
divText += '</ul>';
divText += '</div>';
	

jQuery(document).ready(function() {
	var readCookie = getCookie('readCookie');
	//if (readCookie != 1) {
		//deleteSpecificCookies();
		var div = document.createElement("div");
		div.style.width = "330px";
		div.style.minHeight = "30px";
		div.style.background = '#'+bgColor;
		div.style.position = "fixed";
		div.style.bottom = "0px";
		div.style.right = "0px";
		div.style.color = '#'+color;
		div.style.fontSize = '12px';
		div.style.padding = '15px';
		div.style.zIndex = "100000";
		div.style.borderRadius = "5px";
		div.style.opacity = ".95";
	//}
	
	
	if (readCookie == 1) {
		div.style.display = "none";
		showButton = true;
	} else if (readCookie == 0) {
		div.style.display = "none";
		showButton = true;
	}else {
		showButton = false;
	}
	
	if (showButton == true) {
		document.body.appendChild(divButton);
	}
	div.setAttribute("id", "cookieDiv");
	div.innerHTML = divText;
	document.body.appendChild(div);
	jQuery('#showCookieDetail').click(function() {
		if ($(this).text() == txtMore) {
			jQuery('#cookieDetail').show();
			$(this).text(txtHideDetails);
		} else {
			jQuery('#cookieDetail').hide();
			$(this).text(txtMore);
		}
	})
	
	$(window).load(function() {
	   //setCookie('readCookie',1,7300);
	});
	
});

function ok() {
	setCookie('readCookie',1,7300);
	jQuery('#cookieDiv').remove();
	jQuery('#cookie-button').show();
	window.location.href=window.location.href;
}

function not() {
	setCookie('readCookie',0,null);
	jQuery('#cookieDiv').remove();
	jQuery('#cookie-button').show();
	window.location.href=window.location.href;
}

function show() {
	jQuery('#cookieDiv').show();
	jQuery('#cookie-button').hide();
}

function setCookie(c_name,value,exdays) {
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value + ";path=/";
	
	
}
function getCookie(c_name) { 
	var i,x,y,ARRcookies = document.cookie.split(";");
	for (i=0;i < ARRcookies.length;i++) {
		x = ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y = ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
		x = x.replace(/^\s+|\s+$/g,"");
		if (x==c_name) {
			return unescape(y);
		}
	}
}

function deleteSpecificCookies() {

	/*
	document.__defineGetter__("cookie", function() { return '';} );
	document.__defineSetter__("cookie", function() {} );
	
	var cookies = document.cookie.split(";");
	
	var all_cookies = '';
	
	    for (var i = 0; i < cookies.length; i++) {
	
	        var cookie_name  = cookies[i].split("=")[0];
	        
	        var cookie_value = cookies[i].split("=")[1];
	        //alert(cookie_name);
	        if ( cookie_name.trim() == 'arctur' ) { 
	        	all_cookies = all_cookies + cookies[i] + ";"; 
	        }
	

	    }
	if (!document.__defineGetter__) {
	
	    Object.defineProperty(document, 'cookie', {
	        get: function() {return all_cookies; },
	        set: function() {return true},
	    });
	
	} else {
	
	    document.__defineGetter__("cookie", function() { return all_cookies; } );
	    document.__defineSetter__("cookie", function() { return true; } );
	
	}
	*/
}


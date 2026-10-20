(()=>{if(document.querySelector('[data-luteo-nav]'))return;
const here=location.pathname;
const links=[['Accueil SPORT','/sport/'],['Dashboard','/sport/dashboard/'],['Performance','/sport/dashboard/?tab=performance'],['Mon plan','/sport/dashboard/?tab=training'],['Simulateur','/sport/allure/'],['Marathon','/sport/marathon/'],['Photos','/sport/photos/'],['Strava','/sport/dashboard/?tab=strava']];
const nav=document.createElement('nav');nav.className='luteo-nav';nav.setAttribute('data-luteo-nav','');nav.setAttribute('aria-label','Navigation SPORT');
nav.innerHTML='<a class="luteo-brand" href="/sport/">LUTEO14 <b>// SPORT</b></a><div class="luteo-links">'+links.map(([t,u])=>'<a href="'+u+'"'+((here===u.split('?')[0])?' aria-current="page"':'')+'>'+t+'</a>').join('')+'</div>';
document.body.prepend(nav);
const css=document.createElement('link');css.rel='stylesheet';css.href='/sport/assets/v30.css';document.head.append(css);
})();
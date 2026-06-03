/*!
* Start Bootstrap - Grayscale v7.0.6 (https://startbootstrap.com/theme/grayscale)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-grayscale/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }

    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

});
function closeNavbarIfOpen(){
  const nav = document.getElementById('navbarResponsive');
  if(!nav) return;

  // kalau lagi terbuka (punya class show), tutup
  if(nav.classList.contains('show')){
    const bsCollapse = bootstrap.Collapse.getOrCreateInstance(nav);
    bsCollapse.hide();
  }
}

function zoomToWilayah(wilayahKey) {
  const cfg = wilayahConfig[wilayahKey];
  if (!cfg || !map) return;

  map.setView(cfg.center, cfg.zoom, {
    animate: true,
    duration: 1.2
  });
}

document.getElementById("wilayahSelect")?.addEventListener("change", function () {
  zoomToWilayah(this.value);
});

function setupWilayahControls() {
  const wilayahInput = document.getElementById('wilayahInput');
  const wilayahList = document.getElementById('wilayahList');
  const wilayahDropdown = document.getElementById('wilayahDropdown');

  if (!wilayahInput || !wilayahList || !wilayahDropdown) return;

  const allOptions = Array.from(wilayahList.querySelectorAll('.wilayah-option'));

  function showList() {
    wilayahList.classList.remove('hidden');
  }

  function hideList() {
    wilayahList.classList.add('hidden');
  }

  function filterOptions(keyword) {
    const lower = keyword.toLowerCase();

    allOptions.forEach(option => {
      const match = option.textContent.toLowerCase().includes(lower);
      option.style.display = match ? 'block' : 'none';
    });
  }

  wilayahInput.addEventListener('focus', () => {
    filterOptions(wilayahInput.value);
    showList();
  });

  wilayahInput.addEventListener('input', function () {
    filterOptions(this.value);
    showList();
  });

  allOptions.forEach(option => {
    option.addEventListener('click', function () {
      const wilayahKey = this.dataset.value;
      const wilayahLabel = this.textContent.trim();

      wilayahInput.value = wilayahLabel;
      zoomToWilayah(wilayahKey);
      hideList();
    });
  });

  document.addEventListener('click', function (e) {
    if (!wilayahDropdown.contains(e.target)) {
      hideList();
    }
  });
}

/* =========================================================
   HERO SLIDER
========================================================= */

const heroSlides = document.querySelectorAll('.hero-slide');

let heroIndex = 0;

function rotateHeroSlides(){

    heroSlides.forEach(slide => {
        slide.classList.remove('active');
    });

    heroIndex++;

    if(heroIndex >= heroSlides.length){
        heroIndex = 0;
    }

    heroSlides[heroIndex].classList.add('active');
}

if(heroSlides.length > 0){

    setInterval(rotateHeroSlides, 6000);
}

/* =========================================
   HERO SLIDER BAKAUHENI
========================================= */

(function(){

  const slider = document.querySelector('.bakauheni-slider');

  if(!slider) return;

  const slides = slider.querySelectorAll('.hero-slide');

  let index = 0;

  function showSlide(i){

    slides.forEach(slide => {
      slide.classList.remove('active');
    });

    slides[i].classList.add('active');
  }

  setInterval(() => {

    index++;

    if(index >= slides.length){
      index = 0;
    }

    showSlide(index);

  }, 6000);

})();

/*
function resetDownloadDetailViews() {
  const downloadView = document.getElementById('downloadDataView');
  const inundationView = document.getElementById('inundationDetailView');
  const riskView = document.getElementById('riskDetailView');

  if (downloadView) downloadView.style.display = 'block';
  if (inundationView) inundationView.style.display = 'none';
  if (riskView) riskView.style.display = 'none';
}

function openInundationData(e){
  if (e) e.preventDefault();

  homeView.classList.remove('active');
  projectsView.classList.remove('active');
  pertaminaDetailView.classList.remove('active');
  bakauheniDetailView.classList.remove('active');
  riskDetailView.classList.remove('active');

  inundationDetailView.classList.add('active');

  window.scrollTo(0, 0);
}

function openRiskData(e){
  if (e) e.preventDefault();

  homeView.classList.remove('active');
  projectsView.classList.remove('active');
  pertaminaDetailView.classList.remove('active');
  bakauheniDetailView.classList.remove('active');
  inundationDetailView.classList.remove('active');

  riskDetailView.classList.add('active');

  window.scrollTo(0, 0);
}

function backToDownloadPage() {
  resetDownloadDetailViews();

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
  */
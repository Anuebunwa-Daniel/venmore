//      $('.pro').owlCarousel({
//   loop:true,
//   margin:10,
//   autoplay: true,
//   autoplayTimeout: 3000,
//   nav:true,
//   responsive:{
//       0:{
//           items:1
//       },
//       600:{
//           items:1
//       },
//       1000:{
//           items:3
//       }
//   }
// })

$('.pro').owlCarousel({
    loop: true,
    margin: 20,
    nav: true,
    dots: false,
    autoplay: true,
    autoplayTimeout: 3000,
    responsive: {
        0: { items: 1 },
        576: { items: 2 },
        768: { items: 3 },
        992: { items: 4 }
    }
});

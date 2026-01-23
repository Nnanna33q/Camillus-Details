window.addEventListener('load', () => {
    var CSbody = document.querySelector("body");
const CSnavbarMenu = document.querySelector("#cs-navigation");
const CShamburgerMenu = document.querySelector("#cs-navigation .cs-toggle");

CShamburgerMenu && CShamburgerMenu.addEventListener('click', function () {
    CShamburgerMenu.classList.toggle("cs-active");
    CSnavbarMenu && CSnavbarMenu.classList.toggle("cs-active");
    CSbody && CSbody.classList.toggle("cs-open");
    ariaExpanded();
});

function ariaExpanded() {
    const csUL = document.querySelector('#cs-expanded');
    const csExpanded = csUL && csUL.getAttribute('aria-expanded');

    if (csExpanded === 'false') {
        csUL && csUL.setAttribute('aria-expanded', 'true');
    } else {
        csUL && csUL.setAttribute('aria-expanded', 'false');
    }
}

document.addEventListener('scroll', () => {
    const scroll = document.documentElement.scrollTop;
    if (scroll >= 100) {
        document.body.classList.add('scroll')
    } else {
        document.body.classList.remove('scroll')
    }
});

// mobile nav toggle code
const dropDowns = Array.from(document.querySelectorAll('#cs-navigation .cs-dropdown'));
for (const item of dropDowns) {
    const onClick = () => {
        item.classList.toggle('cs-active')
    }
    item.addEventListener('click', onClick)
}
})
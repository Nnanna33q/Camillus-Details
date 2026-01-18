const form = document.querySelector('form');
const name = document.querySelector('#name');
const email = document.querySelector('#email');
const phone = document.querySelector('#phone');
const service = document.querySelector('#service');
const message = document.querySelector('#message');
const hp = document.querySelector('#company');
const backendUrl = window.location.origin === 'http://127.0.0.1:5500' ? 'http://localhost:3000' : 'https://camillus-details.onrender.com';
const sendBtn = form.querySelector('.cs-button-solid');
const errorContainer = document.querySelector('.error-msg');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    sendBtn.disabled = true;
    sendBtn.children[0].classList.remove('hidden');
    sendBtn.children[1].classList.add('hidden');
    try {
        e.preventDefault();
        if(!name.value || !email.value || !phone.value || !service.value || !message.value) {
            throw new Error('Please fill all fields');
        }
        const response = await fetch(backendUrl + '/contact', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name.value,
                email: email.value,
                phone: phone.value,
                service: service.value,
                message: message.value,
                hp: hp.value
            })
        })
        const data = await response.json();
        if(!data.success) throw new Error(data.errorMessage);
        errorContainer.innerText = `Thanks for reaching out! We'll be in touch soon`;
        errorContainer.classList.add('success-color');
        errorContainer.classList.remove('error-color');
        setTimeout(() => {
            errorContainer.innerText = '';
            errorContainer.classList.remove('success-color');
        }, 5000);
    } catch(error) {
        console.error(error instanceof Error ? error.message : 'We couldn’t send your message right now. Please try again later.');
        errorContainer.innerText = error instanceof Error ? error.message : 'We couldn’t send your message at this time. Please try again shortly.';
        errorContainer.classList.add('error-color');
        errorContainer.classList.remove('success-color');
    }
    sendBtn.disabled = false;
    sendBtn.children[0].classList.add('hidden');
    sendBtn.children[1].classList.remove('hidden');
})
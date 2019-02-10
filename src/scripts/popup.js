import browser from 'webextension-polyfill';
import QRCode from 'qrcode';

let shortUrl;

document.addEventListener('DOMContentLoaded', () => {

    // 1. Initialize
    browser.tabs.query({ 'active': true, 'lastFocusedWindow': true }).then(tabs => {

        let longUrl, start, qrcode__backup = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=';  // in case package fails
        let API_key, password;

        // extract page url
        longUrl = tabs[0].url;
        // extract first 4 chars
        start = longUrl.substr(0, 4);

        // i) Get api key from storage
        browser.storage.local.get(['key', 'pwd']).then(result => {

            API_key = result.key;
            password = result.pwd;

            // update DOM function
            let updateContent = (value) => {
                document.getElementById('url__content-inner').textContent = value;
            };

            if (start === 'http' && API_key !== '' && API_key !== undefined) {

                // send start message to background.js and receive response
                browser.runtime.sendMessage({ msg: 'start', API_key: `${API_key}`, pageUrl: `${longUrl}`, password: `${password}` }).then(response => {
                    // store the shortened link
                    shortUrl = response;
                    // status codes
                    if (!isNaN(shortUrl)) {
                        if (shortUrl === 429) {
                            updateContent('Prekoračili ste ograničenje za vaš nalog!');
                        } else if (shortUrl === 401) {
                            updateContent('Neispravan API ključ!');
                            // } else if (shortUrl === 400) {
                            //     updateContent('Unknown Error!!!');
                        } else if (shortUrl === 504) {
                            updateContent('Nije ostvarena veza sa serverom!');
                        } else {
                            updateContent('Došlo je do greške!');
                        }
                    }
                    // valid response
                    else if (shortUrl !== null) {
                        // 1. update the content with shortened link
                        updateContent(shortUrl);
                        // 2. show buttons
                        toggleDisplay('.buttons__content--holder');
                        // 3. QR Code Generation
                        QRCode.toDataURL(shortUrl)
                            .then(url => {
                                document.getElementById('qr_code').src = url;
                            })
                            .catch(err => {
                                // fetch qrcode from http://goqr.me (in case package fails)
                                document.getElementById('qr_code').src = `${qrcode__backup}${shortUrl}`;
                            });
                        // 4. Add to history
                        let mix_URLs = {
                            longUrl: `${longUrl}`,
                            shortUrl: `${shortUrl}`
                        };
                        // pass the object of URLs
                        browser.storage.local.get(['count'])
                            .then(result => {
                                browser.runtime.sendMessage({ msg: 'store', mix_URLs: mix_URLs, count: result.count });
                            })
                            .catch(err => {
                                console.log('localstorage_warning : Povezivanje nije uspelo');
                            });
                    }
                    else {
                        updateContent('Nevažeći status!');
                    }
                });

            }
            else if (API_key === '' || API_key === undefined) {
                // no api key set
                updateContent('Napravite API ključ u opcijama');
                // open options page
                setTimeout(() => {
                    browser.runtime.openOptionsPage();
                }, 900);

            }
            else if (start !== 'http') {
                updateContent('Neispravna adresa!');
            }

        });

    });


    // 2. Copy Function
    document.getElementById('button__copy--holder').addEventListener('click', () => {
        try {
            let copyTextarea = `${shortUrl}`;
            let input = document.createElement('textarea');
            document.body.appendChild(input);
            input.value = copyTextarea;
            input.focus();
            input.select();
            document.execCommand('copy');
            input.remove();
            toggleDisplay('.copy__alert');
            setTimeout(() => {
                toggleDisplay('.copy__alert');
            }, 1300);
        }
        catch (error) {
            // console.log('Oops, unable to copy');
        }
    });


    // 3. QR Code
    document.getElementById('button__qrcode--holder').addEventListener('click', () => {
        toggleDisplay('.qrcode__content--holder');
    });


    // 4. elements visiblity function
    function toggleDisplay(className) {
        let element = document.querySelector(className);
        element.classList.toggle('d-none');
    }

});

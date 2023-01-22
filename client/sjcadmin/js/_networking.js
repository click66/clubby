const dataFromForm = form => new URLSearchParams(new FormData(form)).toString();

const post = (headers, data) => url => fetch(url, {
    method: 'POST',
    headers: headers,
    body: data,
}).then(function (r) {
    return r.json().then(function (d) {
        if (d.hasOwnProperty('error')) {
            return Promise.reject(new Error(d.error));
        }
        return d;
    })
});

const postJson = (csrfToken, data) => post({ 'X-CSRFToken': csrfToken, 'Content-Type': 'application/json' }, JSON.stringify(data))
const postNone = csrfToken => postJson(csrfToken, null);

export { postJson, postNone }

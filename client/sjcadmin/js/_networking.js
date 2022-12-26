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

const postForm = form => post({ 'Content-Type': 'application/x-www-form-urlencoded' }, dataFromForm(form));
const postJson = (csrfToken, data) => post({ 'X-CSRFToken': csrfToken, 'Content-Type': 'application/json' }, JSON.stringify(data))
const postNone = csrfToken => postJson(csrfToken, null);

export { postForm, postJson, postNone }
